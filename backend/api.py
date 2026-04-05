from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys

# Import our powerful AI engine logic directly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from crop_advisory_system import (
    score_suitability, 
    greenhouse_engine, 
    recommend_fertilizers, 
    CROP_IDEAL_CONDITIONS
)

app = Flask(__name__, static_folder='dist', static_url_path='/')
CORS(app)  # Allow React frontend to access this API

@app.route('/')
def serve_react_app():
    # Serve index.html for root path
    return app.send_static_file('index.html')

# Also catch-all route for React client-side routing
@app.route('/<path:path>')
def serve_static(path):
    # Check if the file exists in the static folder, otherwise serve index.html
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
            return jsonify({"error": f"Crop '{crop}' not supported yet. Supported: {', '.join(CROP_IDEAL_CONDITIONS.keys())}"}), 400
            
        # The React frontend uses slightly different casing for features, let's map them
        raw_features = data.get('features', {})
        
        # Determine water availability (convert percentage string/raw values to 0.0-1.0 scale)
        humidity = float(raw_features.get('humidity', 50.0))
        water_avail = humidity / 100.0
        
        mapped_features = {
            "temperature": float(raw_features.get('temperature', 25.0)),
            "humidity": humidity,
            "rainfall": float(raw_features.get('rainfall', 100.0)),
            "wind_speed": float(raw_features.get('windSpeed', 5.0)),
            "solar_radiation": float(raw_features.get('solarRad', 200.0)),
            "evapotranspiration": float(raw_features.get('evapo', 5.0)),
            "soil_ph": float(raw_features.get('soilPh', 6.5)),
            "water_availability": float(raw_features.get('waterAvail', water_avail)),
            "nitrogen": float(raw_features.get('nitro', 50.0)),
            "phosphorus": float(raw_features.get('phospho', 30.0)),
            "potassium": float(raw_features.get('potas', 40.0)),
            "soil_type": raw_features.get('soilType', 'Loamy')
        }
        
        # Execute absolute deterministic scoring evaluation
        suitability = score_suitability(mapped_features, crop)
        greenhouse = greenhouse_engine(mapped_features, crop, suitability)
        fertilizers = recommend_fertilizers(mapped_features, crop)
        
        return jsonify({
            "status": "success",
            "crop": crop,
            "mapped_features": mapped_features,
            "suitability": suitability,
            "greenhouse": greenhouse,
            "fertilizers": fertilizers,
            "ideal": CROP_IDEAL_CONDITIONS[crop]
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("🚀 Agri-AI Backend Server is running on port 5000...")
    app.run(port=5000, debug=True, use_reloader=False)
