import joblib
import pandas as pd
import numpy as np
import os
import json

def apply_feature_engineering(df):
    """Mirror the feature engineering from training."""
    # NPK derived
    df['npk_total'] = df['nitrogen'] + df['phosphorus'] + df['potassium']
    df['npk_ratio_np'] = df['nitrogen'] / (df['phosphorus'] + 0.001)
    df['npk_ratio_nk'] = df['nitrogen'] / (df['potassium'] + 0.001)

    # Water/Climate derived
    df['water_stress'] = df['evapotranspiration'] / (df['rainfall'] + 1)
    df['solar_temp'] = df['solar_radiation'] / (df['temperature'] + 1)
    df['temp_humidity'] = df['temperature'] * df['humidity'] / 100
    df['rainfall_total'] = df['Rainfall_mm'] + df['rainfall']

    # Interaction/Condition derived
    df['irr_water'] = df['irrigation'].astype(float) * df['water_availability']
    df['ph_deviation'] = abs(df['soil_ph'] - 7.0)
    df['fertilizer_irr'] = df['Fertilizer_Used'].astype(int) * df['Irrigation_Used'].astype(int)
    
    return df

def predict_crop(region, soil_type, temperature, humidity, rainfall, wind_speed, solar_radiation, evapotranspiration, soil_ph, nitrogen, phosphorus, potassium, water_availability):
    """
    Predicts the Yield Tier (Low/Medium/High) for the given conditions.
    Maintains the exact interface requested.
    """
    try:
        # Load artifacts
        MODELS_DIR = "models"
        classifier   = joblib.load(f"{MODELS_DIR}/tier_classifier.joblib")
        preprocessor = joblib.load(f"{MODELS_DIR}/preprocessor.joblib")
        
        with open(f"{MODELS_DIR}/tier_labels.json", "r") as f:
            tier_info = json.load(f)
            class_names = tier_info["classes"] # e.g. ["High", "Low", "Medium"]

        # 1. Map inputs to the full 22-feature raw set
        # Using specific mapping and sensible defaults for missing columns
        data = {
            "Region": [region],
            "Soil_Type": [soil_type],
            "Weather_Condition": ["Sunny"], # Default
            "soil_type": [soil_type],      # Re-use soil_type
            "Fertilizer_Used": [1],        # Default True
            "Irrigation_Used": [1],        # Default True
            "irrigation": [1],             # Default True
            "greenhouse_possible": [0],    # Default False
            "Rainfall_mm": [rainfall],     # Map from rainfall
            "Temperature_Celsius": [temperature], # Map from temperature
            "Days_to_Harvest": [100],      # Default
            "temperature": [temperature],
            "humidity": [humidity],
            "rainfall": [rainfall],
            "wind_speed": [wind_speed],
            "solar_radiation": [solar_radiation],
            "evapotranspiration": [evapotranspiration],
            "soil_ph": [soil_ph],
            "nitrogen": [nitrogen],
            "phosphorus": [phosphorus],
            "potassium": [potassium],
            "water_availability": [water_availability]
        }
        
        df = pd.DataFrame(data)
        
        # 2. Apply Feature Engineering
        df = apply_feature_engineering(df)
        
        # 3. Transform
        X_processed = preprocessor.transform(df)
        
        # 4. Predict
        probs = classifier.predict_proba(X_processed)[0]
        pred_idx = np.argmax(probs)
        
        tier_name = class_names[pred_idx]
        confidence = probs[pred_idx]
        
        return tier_name, confidence

    except Exception as e:
        print(f"Prediction error: {e}")
        return "Unknown", 0.0

if __name__ == "__main__":
    # Test cases for Indian regions
    test_cases = [
        # North India: Sunny/Rainy, Loam soil
        {'region': 'North', 'soil_type': 'Loam', 'temperature': 30.5, 'humidity': 60.0, 'rainfall': 150.0, 'wind_speed': 5.0, 'solar_radiation': 250.0, 'evapotranspiration': 7.0, 'soil_ph': 6.5, 'nitrogen': 140.0, 'phosphorus': 70.0, 'potassium': 100.0, 'water_availability': 0.8},
        # South India: Warm/Humid, Clay soil
        {'region': 'South', 'soil_type': 'Clay', 'temperature': 28.0, 'humidity': 85.0, 'rainfall': 250.0, 'wind_speed': 8.0, 'solar_radiation': 200.0, 'evapotranspiration': 5.5, 'soil_ph': 7.2, 'nitrogen': 120.0, 'phosphorus': 60.0, 'potassium': 90.0, 'water_availability': 0.9},
        # West India: Dry/Semi-arid, Sandy soil
        {'region': 'West', 'soil_type': 'Sandy', 'temperature': 35.0, 'humidity': 40.0, 'rainfall': 50.0, 'wind_speed': 10.0, 'solar_radiation': 300.0, 'evapotranspiration': 8.5, 'soil_ph': 6.0, 'nitrogen': 100.0, 'phosphorus': 50.0, 'potassium': 80.0, 'water_availability': 0.5},
    ]

    print("--- Optimized Agri-AI Model Prediction Verification ---")
    if not os.path.exists("models/tier_classifier.joblib"):
        print("Model not found. Please run train_model.py first.")
    else:
        for tc in test_cases:
            tier, conf = predict_crop(**tc)
            print(f"Region: {tc['region']}, Soil: {tc['soil_type']} => Predicted Yield Tier: {tier} ({conf*100:.2f}% confidence)")

