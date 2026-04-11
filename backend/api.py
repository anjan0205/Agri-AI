from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
import joblib
import pandas as pd
import numpy as np

# Import our powerful AI engine logic directly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from crop_advisory_system import (
    score_suitability, 
    greenhouse_engine, 
    recommend_fertilizers, 
    CROP_IDEAL_CONDITIONS
)

# Configuration for Static Assets (Absolute path for Railway)
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
static_folder = os.path.join(base_dir, 'dist')

print(f"DEBUG: Static folder is located at: {static_folder}")
print(f"DEBUG: Static folder exists: {os.path.exists(static_folder)}")

app = Flask(__name__, static_folder=static_folder, static_url_path='/')
CORS(app)  # Allow React frontend to access this API

# ── Load ML Models ──────────────────────────────────────────────────────────
MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models")
try:
    preprocessor = joblib.load(os.path.join(MODELS_DIR, "preprocessor.joblib"))
    regressor = joblib.load(os.path.join(MODELS_DIR, "yield_regressor.joblib"))
    classifier = joblib.load(os.path.join(MODELS_DIR, "tier_classifier.joblib"))
    print("ML Models loaded successfully.")
except Exception as e:
    print(f"Warning: Could not load ML models: {e}")
    preprocessor = regressor = classifier = None

def apply_feature_engineering(df):
    """Implement 10 derived features matching training logic."""
    df['npk_total'] = df['nitrogen'] + df['phosphorus'] + df['potassium']
    df['npk_ratio_np'] = df['nitrogen'] / (df['phosphorus'] + 0.001)
    df['npk_ratio_nk'] = df['nitrogen'] / (df['potassium'] + 0.001)
    df['water_stress'] = df['evapotranspiration'] / (df['rainfall'] + 1)
    df['solar_temp'] = df['solar_radiation'] / (df['temperature'] + 1)
    df['temp_humidity'] = df['temperature'] * df['humidity'] / 100
    df['rainfall_total'] = df['rainfall'] + df['rainfall'] # Simplified for inference
    df['irr_water'] = df['irrigation'].astype(float) * df['water_availability']
    df['ph_deviation'] = abs(df['soil_ph'] - 7.0)
    df['fertilizer_irr'] = df['Fertilizer_Used'].astype(int) * df['Irrigation_Used'].astype(int)
    return df

@app.route('/')
def serve_react_app():
    return app.send_static_file('index.html')

@app.route('/<path:path>')
def serve_static(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return app.send_static_file(path)
    else:
        return app.send_static_file('index.html')

@app.route('/api/advise', methods=['POST'])
def advise():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No JSON payload provided."}), 400
            
        crop = data.get('crop', '').strip().lower()
        if crop not in CROP_IDEAL_CONDITIONS:
            return jsonify({"error": f"Crop '{crop}' not supported yet."}), 400
            
        raw_features = data.get('features', {})
        humidity = float(raw_features.get('humidity', 50.0))
        
        mapped_features = {
            "temperature": float(raw_features.get('temperature', 25.0)),
            "humidity": humidity,
            "rainfall": float(raw_features.get('rainfall', 100.0)),
            "wind_speed": float(raw_features.get('windSpeed', 5.0)),
            "solar_radiation": float(raw_features.get('solarRad', 200.0)),
            "evapotranspiration": float(raw_features.get('evapo', 5.0)),
            "soil_ph": float(raw_features.get('soilPh', 6.5)),
            "water_availability": float(raw_features.get('waterAvail', humidity/100.0)),
            "nitrogen": float(raw_features.get('nitro', 50.0)),
            "phosphorus": float(raw_features.get('phospho', 30.0)),
            "potassium": float(raw_features.get('potas', 40.0)),
            "soil_type": raw_features.get('soilType', 'Loamy')
        }
        
        # --- ML Inference ---
        ml_prediction = {"yield": None, "tier": None}
        if regressor and classifier and preprocessor:
            try:
                # Prepare DataFrame with all training features (including defaults for missing UI fields)
                inf_df = pd.DataFrame([{
                    "Region": "North", # Default
                    "Soil_Type": mapped_features["soil_type"],
                    "Weather_Condition": "Sunny", # Default
                    "soil_type": mapped_features["soil_type"],
                    "Fertilizer_Used": 1, 
                    "Irrigation_Used": 1,
                    "irrigation": 1,
                    "greenhouse_possible": 1,
                    "Rainfall_mm": mapped_features["rainfall"],
                    "Temperature_Celsius": mapped_features["temperature"],
                    "Days_to_Harvest": 120, # Default
                    "temperature": mapped_features["temperature"],
                    "humidity": mapped_features["humidity"],
                    "rainfall": mapped_features["rainfall"],
                    "wind_speed": mapped_features["wind_speed"],
                    "solar_radiation": mapped_features["solar_radiation"],
                    "evapotranspiration": mapped_features["evapotranspiration"],
                    "soil_ph": mapped_features["soil_ph"],
                    "nitrogen": mapped_features["nitrogen"],
                    "phosphorus": mapped_features["phosphorus"],
                    "potassium": mapped_features["potassium"],
                    "water_availability": mapped_features["water_availability"]
                }])
                inf_df = apply_feature_engineering(inf_df)
                
                # Transform and predict
                X_proc = preprocessor.transform(inf_df)
                y_yield = regressor.predict(X_proc)[0]
                y_tier = classifier.predict(X_proc)[0]
                
                ml_prediction["yield"] = f"{round(float(y_yield), 2)} t/ha"
                ml_prediction["tier"] = str(y_tier)
            except Exception as ml_e:
                print(f"ML Error: {ml_e}")

        # Core Engines
        suitability = score_suitability(mapped_features, crop)
        fertilizers = recommend_fertilizers(mapped_features, crop)
        greenhouse = greenhouse_engine(mapped_features, crop, suitability, fertilizers)
        
        return jsonify({
            "status": "success",
            "crop": crop,
            "suitability": suitability,
            "greenhouse": greenhouse,
            "fertilizers": fertilizers,
            "ml_prediction": ml_prediction,
            "mapped_features": mapped_features
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
