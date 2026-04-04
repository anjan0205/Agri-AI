import pandas as pd
import json

def extract():
    path = r"C:\Users\Panga Anjan\Desktop\reduced_crop_dataset_20000.csv"
    df = pd.read_csv(path)
    
    metadata = {
        "TotalRecords": len(df),
        "Categorical": {},
        "Numeric": {}
    }
    
    cat_cols = ['Region', 'Soil_Type', 'Crop', 'Weather_Condition', 'soil_type']
    num_cols = [
        'Rainfall_mm', 'Temperature_Celsius', 'Days_to_Harvest', 'Yield_tons_per_hectare',
        'temperature', 'humidity', 'rainfall', 'wind_speed', 'solar_radiation', 
        'evapotranspiration', 'soil_ph', 'nitrogen', 'phosphorus', 'potassium', 'water_availability'
    ]
    
    for col in cat_cols:
        if col in df.columns:
            metadata["Categorical"][col] = sorted(df[col].astype(str).unique().tolist())
            
    for col in num_cols:
        if col in df.columns:
            metadata["Numeric"][col] = {
                "min": float(df[col].min()),
                "max": float(df[col].max()),
                "mean": float(df[col].mean())
            }
            
    print(json.dumps(metadata, indent=2))

if __name__ == "__main__":
    extract()
