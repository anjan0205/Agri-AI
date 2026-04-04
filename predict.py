import joblib
import pandas as pd
import numpy as np
import os

def predict_crop(region, soil_type, temperature, humidity, rainfall, wind_speed, solar_radiation, evapotranspiration, soil_ph, nitrogen, phosphorus, potassium, water_availability):
    # Load model and preprocessors
    model = joblib.load('models/crop_model.joblib')
    le_region = joblib.load('models/le_region.joblib')
    le_soil = joblib.load('models/le_soil.joblib')
    le_crop = joblib.load('models/le_crop.joblib')
    scaler = joblib.load('models/scaler.joblib')
    
    # Feature columns order in the model
    # ['Region', 'Soil_Type', 'temperature', 'humidity', 'rainfall', 'wind_speed', 'solar_radiation', 'evapotranspiration', 'soil_ph', 'nitrogen', 'phosphorus', 'potassium', 'water_availability']
    
    # Encode inputs
    try:
        region_enc = le_region.transform([region])[0]
    except Exception:
        region_enc = le_region.transform(['North'])[0] # Default fallback

    try:
        soil_enc = le_soil.transform([soil_type])[0]
    except Exception:
        soil_enc = le_soil.transform(['Loam'])[0] # Default fallback

    # Prepare input for scaling
    numeric_inputs = np.array([[temperature, humidity, rainfall, wind_speed, solar_radiation, evapotranspiration, soil_ph, nitrogen, phosphorus, potassium, water_availability]])
    scaled_numeric = scaler.transform(numeric_inputs)
    
    # Combine all features
    X_input = np.zeros((1, 13))
    X_input[0, 0] = region_enc
    X_input[0, 1] = soil_enc
    X_input[0, 2:] = scaled_numeric
    
    # Predict
    prediction_idx = model.predict(X_input)[0]
    probabilities = model.predict_proba(X_input)[0]
    
    crop_name = le_crop.inverse_transform([prediction_idx])[0]
    confidence = probabilities[prediction_idx]
    
    return crop_name, confidence

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

    print("--- Model Prediction Verification ---")
    for tc in test_cases:
        crop, conf = predict_crop(**tc)
        print(f"Region: {tc['region']}, Soil: {tc['soil_type']} => Predicted Crop: {crop} ({conf*100:.2f}% confidence)")
