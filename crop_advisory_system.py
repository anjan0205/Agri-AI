"""
Crop Advisory System
====================
Fetches live OpenWeather API data, takes user NPK/pH inputs, and uses a deterministic 
suitability scoring engine combined with a Random Forest model to provide comprehensive 
crop advisory, greenhouse adjustments, and fertilizer recommendations.
"""

import os
import sys
import requests
import numpy as np
import pandas as pd
from dotenv import load_dotenv
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

# ── Load Environment Variables ──────────────────────────────────────────────
load_dotenv()
API_KEY = os.getenv("OPENWEATHER_API_KEY")
BASE_URL = os.getenv("OPENWEATHER_BASE_URL", "https://api.openweathermap.org/data/2.5/weather")
DATASET_PATH = os.getenv("DATASET_PATH", "./reduced_crop_dataset_20000.csv")


# ── STEP 2 — CROP_IDEAL_CONDITIONS DICTIONARY ──────────────────────────────
CROP_IDEAL_CONDITIONS = {
    "wheat": {
        "temperature": 22.0, "humidity": 55.0, "rainfall": 100.0, "wind_speed": 6.0,
        "solar_radiation": 190.0, "evapotranspiration": 5.5, "soil_ph": 6.5,
        "water_availability": 0.60, "nitrogen": 130.0, "phosphorus": 65.0,
        "potassium": 55.0, "region": "North", "soil_type": "Loam"
    },
    "rice": {
        "temperature": 28.0, "humidity": 80.0, "rainfall": 220.0, "wind_speed": 5.0,
        "solar_radiation": 200.0, "evapotranspiration": 6.0, "soil_ph": 6.0,
        "water_availability": 0.85, "nitrogen": 140.0, "phosphorus": 60.0,
        "potassium": 80.0, "region": "South", "soil_type": "Clay"
    },
    "maize": {
        "temperature": 27.0, "humidity": 65.0, "rainfall": 150.0, "wind_speed": 7.0,
        "solar_radiation": 220.0, "evapotranspiration": 6.5, "soil_ph": 6.3,
        "water_availability": 0.65, "nitrogen": 150.0, "phosphorus": 70.0,
        "potassium": 90.0, "region": "East", "soil_type": "Loam"
    },
    "cotton": {
        "temperature": 30.0, "humidity": 55.0, "rainfall": 80.0, "wind_speed": 8.0,
        "solar_radiation": 240.0, "evapotranspiration": 7.5, "soil_ph": 7.0,
        "water_availability": 0.50, "nitrogen": 110.0, "phosphorus": 55.0,
        "potassium": 85.0, "region": "West", "soil_type": "Black"
    },
    "soybean": {
        "temperature": 25.0, "humidity": 70.0, "rainfall": 160.0, "wind_speed": 5.5,
        "solar_radiation": 210.0, "evapotranspiration": 6.0, "soil_ph": 6.5,
        "water_availability": 0.70, "nitrogen": 40.0, "phosphorus": 60.0,
        "potassium": 80.0, "region": "East", "soil_type": "Loam"
    },
    "barley": {
        "temperature": 18.0, "humidity": 50.0, "rainfall": 90.0, "wind_speed": 7.0,
        "solar_radiation": 185.0, "evapotranspiration": 5.0, "soil_ph": 6.5,
        "water_availability": 0.55, "nitrogen": 100.0, "phosphorus": 50.0,
        "potassium": 60.0, "region": "North", "soil_type": "Sandy"
    },
    "mirchi": {
        "temperature": 28.0, "humidity": 55.0, "rainfall": 90.0, "wind_speed": 5.0,
        "solar_radiation": 215.0, "evapotranspiration": 6.5, "soil_ph": 6.5,
        "water_availability": 0.55, "nitrogen": 100.0, "phosphorus": 50.0,
        "potassium": 60.0, "region": "Guntur", "soil_type": "Loamy"
    },
    "tomato": {
        "temperature": 24.0, "humidity": 60.0, "rainfall": 120.0, "wind_speed": 4.0,
        "solar_radiation": 180.0, "evapotranspiration": 5.0, "soil_ph": 6.2,
        "water_availability": 0.65, "nitrogen": 120.0, "phosphorus": 60.0,
        "potassium": 110.0, "region": "South", "soil_type": "Loam"
    },
    "potato": {
        "temperature": 18.0, "humidity": 65.0, "rainfall": 110.0, "wind_speed": 5.0,
        "solar_radiation": 170.0, "evapotranspiration": 4.5, "soil_ph": 5.5,
        "water_availability": 0.70, "nitrogen": 140.0, "phosphorus": 80.0,
        "potassium": 150.0, "region": "North", "soil_type": "Sandy Loam"
    },
    "onion": {
        "temperature": 25.0, "humidity": 60.0, "rainfall": 100.0, "wind_speed": 6.0,
        "solar_radiation": 190.0, "evapotranspiration": 5.0, "soil_ph": 6.0,
        "water_availability": 0.55, "nitrogen": 110.0, "phosphorus": 50.0,
        "potassium": 90.0, "region": "West", "soil_type": "Loam"
    },
    "sugarcane": {
        "temperature": 28.0, "humidity": 70.0, "rainfall": 200.0, "wind_speed": 4.5,
        "solar_radiation": 220.0, "evapotranspiration": 6.5, "soil_ph": 6.5,
        "water_availability": 0.80, "nitrogen": 160.0, "phosphorus": 65.0,
        "potassium": 120.0, "region": "South", "soil_type": "Clay Loam"
    },
    "sorghum": {
        "temperature": 29.0, "humidity": 45.0, "rainfall": 60.0, "wind_speed": 7.0,
        "solar_radiation": 230.0, "evapotranspiration": 7.0, "soil_ph": 6.5,
        "water_availability": 0.40, "nitrogen": 90.0, "phosphorus": 40.0,
        "potassium": 50.0, "region": "Central", "soil_type": "Sandy"
    },
    "cabbage": {
        "temperature": 16.0, "humidity": 75.0, "rainfall": 130.0, "wind_speed": 4.0,
        "solar_radiation": 150.0, "evapotranspiration": 4.0, "soil_ph": 6.5,
        "water_availability": 0.75, "nitrogen": 80.0, "phosphorus": 45.0,
        "potassium": 75.0, "region": "East", "soil_type": "Loam"
    },
    "peanut": {
        "temperature": 26.0, "humidity": 55.0, "rainfall": 90.0, "wind_speed": 6.5,
        "solar_radiation": 200.0, "evapotranspiration": 5.5, "soil_ph": 6.0,
        "water_availability": 0.50, "nitrogen": 30.0, "phosphorus": 50.0,
        "potassium": 60.0, "region": "West", "soil_type": "Sandy Loam"
    }
}


# ── STEP 3 — WEATHER FETCHER MODULE ─────────────────────────────────────────
def fetch_weather(location: str) -> dict:
    """
    Calls OpenWeatherMap Current Weather API to get live environmental data.
    Maps API response fields to the agricultural feature set needed by models.
    """
    if not API_KEY:
        print("[Error] OPENWEATHER_API_KEY is missing from .env", file=sys.stderr)
        sys.exit(1)

    location = location.strip()
    # Check if lat,lon format
    if "," in location and location.replace(",", "").replace(".", "").replace("-", "").isdigit():
        parts = location.split(",")
        lat, lon = parts[0].strip(), parts[1].strip()
        params = {"lat": lat, "lon": lon, "appid": API_KEY, "units": "metric"}
    else:
        params = {"q": location, "appid": API_KEY, "units": "metric"}

    try:
        response = requests.get(BASE_URL, params=params)
        if response.status_code == 404:
            print(f"[Error] Location '{location}' not found (API returned 404).")
            sys.exit(1)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"[Error] Network failure or API issue: {e}")
        sys.exit(1)

    data = response.json()

    # Extract mapping mappings
    temp = data.get("main", {}).get("temp", 25.0)
    humidity = data.get("main", {}).get("humidity", 50.0)
    wind_speed = data.get("wind", {}).get("speed", 0.0)
    
    # Rainfall
    rain_1h = data.get("rain", {}).get("1h", 0.0)
    rainfall_monthly = rain_1h * 30  # naive conversion mm/hr to mm/month equivalence

    # Solar radiation estimation
    clouds_pct = data.get("clouds", {}).get("all", 0)
    solar_radiation = 250 - (clouds_pct / 100) * 150

    # Evapotranspiration estimation
    t_max = data.get("main", {}).get("temp_max", temp + 3)
    t_min = data.get("main", {}).get("temp_min", temp - 3)
    et0 = 0.0023 * (temp + 17.8) * ((max(0, t_max - t_min))**0.5) * 0.408 * 30 # roughly scaled

    # Meta
    city = data.get("name", "Unknown")
    country = data.get("sys", {}).get("country", "")
    lat = data.get("coord", {}).get("lat", 0.0)
    lon = data.get("coord", {}).get("lon", 0.0)
    weather_desc = data.get("weather", [{}])[0].get("description", "clear")

    return {
        "raw_weather": data,
        "weather_meta": {
            "city": city,
            "country": country,
            "lat": lat,
            "lon": lon,
            "description": weather_desc,
        },
        "mapped_features": {
            "temperature": round(temp, 2),
            "humidity": round(humidity, 2),
            "wind_speed": round(wind_speed, 2),
            "rainfall": round(rainfall_monthly, 2),
            "solar_radiation": round(solar_radiation, 2),
            "evapotranspiration": round(et0, 2),
            "water_availability": round(humidity / 100.0, 2),
            # Placeholders for user input
            "soil_ph": None,
            "nitrogen": None,
            "phosphorus": None,
            "potassium": None,
        }
    }


# ── STEP 4 — USER INPUT COLLECTION MODULE ──────────────────────────────────
def prompt_float_default(prompt_text: str, default: float) -> float:
    user_in = input(f"{prompt_text} [{default}]: ").strip()
    if not user_in:
        return default
    try:
        return float(user_in)
    except ValueError:
        print("Invalid number. Using default.")
        return default

def collect_user_inputs() -> dict:
    """
    Gathers location, target crop, and soil features from the user.
    Merges them with live weather fetched from the OpenWeather API.
    """
    location = input("Enter location (City name or 'lat,lon'): ").strip()
    if not location:
        location = "Guntur"

    crops_avail = list(CROP_IDEAL_CONDITIONS.keys())
    crop = ""
    while True:
        c = input(f"Enter target crop name (e.g. {crops_avail[0].title()}): ").strip().lower()
        if c in crops_avail:
            crop = c
            break
        print(f"Unknown crop. Available: {', '.join(x.title() for x in crops_avail)}")

    ideal = CROP_IDEAL_CONDITIONS[crop]
    
    print("\n--- Soil & Nutrient Data ---")
    soil_ph = prompt_float_default("Enter Soil pH", ideal["soil_ph"])
    nitrogen = prompt_float_default("Enter Nitrogen (kg/ha)", ideal["nitrogen"])
    phosphorus = prompt_float_default("Enter Phosphorus (kg/ha)", ideal["phosphorus"])
    potassium = prompt_float_default("Enter Potassium (kg/ha)", ideal["potassium"])
    
    soil_type = input(f"Enter soil type [{ideal['soil_type']}]: ").strip()
    if not soil_type:
        soil_type = ideal["soil_type"]

    print("\n[System] Fetching live weather data...")
    api_data = fetch_weather(location)
    
    features = api_data["mapped_features"]
    features["soil_ph"] = soil_ph
    features["nitrogen"] = nitrogen
    features["phosphorus"] = phosphorus
    features["potassium"] = potassium
    features["soil_type"] = soil_type

    return {
        "location": location,
        "crop": crop,
        "weather_meta": api_data["weather_meta"],
        "features": features,
    }


# ── STEP 5 — SUITABILITY SCORING ENGINE ─────────────────────────────────────
def score_suitability(features: dict, crop: str) -> dict:
    """
    Evaluates real-time features against the target crop's IDEAL conditions.
    Assigns a status to each feature and calculates a 0-100 overall score.
    """
    ideal = CROP_IDEAL_CONDITIONS[crop]
    weights = {
        "temperature": 20, "humidity": 15, "rainfall": 15, "soil_ph": 15,
        "water_availability": 10, "nitrogen": 8, "phosphorus": 7, "potassium": 5,
        "wind_speed": 2, "solar_radiation": 2, "evapotranspiration": 1
    }
    
    total_allowed_weight = sum(weights.values())
    weighted_deviation_sum = 0
    feature_status = {}
    critical = []
    suboptimal = []

    for feat, wt in weights.items():
        curr_val = features.get(feat, ideal[feat])
        ideal_val = ideal[feat]
        
        if ideal_val == 0:
            dev_pct = abs(curr_val - ideal_val) * 100
        else:
            dev_pct = (abs(curr_val - ideal_val) / ideal_val) * 100
            
        if dev_pct <= 10:
            status = "IDEAL"
        elif dev_pct <= 25:
            status = "SUBOPTIMAL"
            suboptimal.append(feat)
        else:
            status = "CRITICAL"
            critical.append(feat)
            
        feature_status[feat] = {
            "current": curr_val,
            "ideal": ideal_val,
            "deviation_pct": round(dev_pct, 2),
            "status": status
        }
        
        # Cap deviation penalty at 100% per feature for the score deduction
        penalty = min(dev_pct, 100)
        weighted_deviation_sum += (penalty * wt)
        
    score = 100 - (weighted_deviation_sum / total_allowed_weight)
    score = round(max(0, score), 1)
    
    if score >= 80:
        verdict = "IDEAL - Conditions are suitable"
    elif score >= 60:
        verdict = "SUBOPTIMAL - Minor adjustments needed"
    else:
        verdict = "UNSUITABLE - Significant issues detected"

    return {
        "score": score,
        "verdict": verdict,
        "feature_status": feature_status,
        "critical_issues": critical,
        "suboptimal_issues": suboptimal
    }


# ── STEP 6 — GREENHOUSE ENGINE ──────────────────────────────────────────────
def greenhouse_engine(features: dict, crop: str, suitability: dict, fertilizers: dict = None) -> dict:
    """
    Proposes actionable greenhouse interventions to fix suboptimal/critical features.
    Injects specific fertilizer recommendations if provided.
    """
    adjusted_features = dict(features)
    issues_actions = {}
    ideal_conds = CROP_IDEAL_CONDITIONS[crop]
    
    for feat in suitability["critical_issues"] + suitability["suboptimal_issues"]:
        curr = features[feat]
        ideal = ideal_conds[feat]
        status = suitability["feature_status"][feat]["status"]
        action = ""
        
        if feat == "temperature":
            if curr < ideal:
                action = f"Install forced-air heaters, target {ideal}C" if status == "CRITICAL" else "Monitor and use passive solar heating"
            else:
                action = "Deploy evaporative cooling + shade nets (35-50%)" if status == "CRITICAL" else "Improve ventilation, add shade cloth"
        elif feat == "humidity":
            action = "Drip irrigation + mulching to raise humidity" if curr < ideal else "Improve drainage + air circulation, risk of fungal disease"
        elif feat == "rainfall" or feat == "water_availability":
            deficit = max(0, ideal - curr)
            action = f"Schedule drip/furrow irrigation, {round(deficit, 1)} mm/month needed" if curr < ideal else "Improve field drainage, raised bed cultivation"
        elif feat == "soil_ph":
            if curr < ideal:
                dose = (ideal - curr) * 1000
                action = f"Apply agricultural lime {round(dose)} kg/ha"
            else:
                dose = (curr - ideal) * 500
                action = f"Apply elemental sulfur {round(dose)} kg/ha"
        elif feat in ["nitrogen", "phosphorus", "potassium"]:
            if fertilizers:
                # Map feat name to fertilizer dict keys (case insensitive find)
                f_data = next((v for k, v in fertilizers.items() if k.lower() == feat), None)
                if f_data and f_data.get("status") == "Deficient":
                    action = f"Apply {f_data['dose_kg_ha']} of {f_data['fertilizer']} to correct {feat} deficit. Click for detail."
                else:
                    action = "Optimize nutrient levels via precision fertigation"
            else:
                action = "Optimize nutrient levels via fertigation"
        elif feat == "wind_speed":
            action = "Install windbreaks or perimeter shelter belts" if curr > ideal else "Greenhouse is protected - no action needed"
        else:
            action = "Optimize environmental controls via Mastermind Climate Panel"

        # Blend 80% toward ideal
        new_val = curr + (ideal - curr) * 0.80
        adjusted_features[feat] = round(new_val, 2)
        
        issues_actions[feat] = {
            "status": status,
            "current": curr,
            "ideal": ideal,
            "action": action,
            "adjusted_value": round(new_val, 2)
        }

    # Rescore with adjusted features
    after_suitability = score_suitability(adjusted_features, crop)
    
    return {
        "issues": issues_actions,
        "adjusted_features": adjusted_features,
        "score_before": suitability["score"],
        "score_after": after_suitability["score"],
        "verdict_before": suitability["verdict"],
        "verdict_after": after_suitability["verdict"]
    }


# ── STEP 7 — FERTILIZER RECOMMENDATION ENGINE ───────────────────────────────
def recommend_fertilizers(features: dict, crop: str) -> dict:
    """
    Compares the user's NPK input to crop needs and recommends fertilization doses
    """
    ideal = CROP_IDEAL_CONDITIONS[crop]
    recs = {"soil_notes": []}
    
    nutrients = {
        "nitrogen": {"product": "Urea (46-0-0)", "divisor": 0.46, "timing": "Split: 50% basal at sowing + 50% top dress at 30 days"},
        "phosphorus": {"product": "DAP (18-46-0)", "divisor": 0.46, "timing": "Basal: apply at sowing, incorporate into soil"},
        "potassium": {"product": "MOP (0-0-60)", "divisor": 0.60, "timing": "Basal: apply at sowing or first irrigation"}
    }
    
    for n_key, n_info in nutrients.items():
        curr = features.get(n_key, ideal.get(n_key, 0))
        idl = ideal.get(n_key, 0)
        
        deficit = idl - curr
        rec_data = {
            "current": curr,
            "ideal": idl,
            "deficit": 0.0,
            "fetilizer": "Adequate",
            "dose_kg_ha": "-",
            "timing": "-"
        }
        
        # Recommend if current < 90% of ideal
        if curr < (idl * 0.90):
            dose = deficit / n_info["divisor"]
            rec_data["status"] = "Deficient"
            rec_data["deficit"] = round(deficit, 1)
            rec_data["fertilizer"] = n_info["product"]
            rec_data["dose_kg_ha"] = f"{round(dose, 1)} kg/ha"
            rec_data["dose_raw"] = round(dose, 2)
            rec_data["timing"] = n_info["timing"]
        else:
            rec_data["status"] = "Adequate"
            rec_data["fertilizer"] = "Adequate"
            rec_data["dose_raw"] = 0
            
        recs[n_key] = rec_data

    # pH Notes
    ph = features.get("soil_ph", ideal.get("soil_ph", 7.0))
    if ph < 6.0:
        recs["soil_notes"].append("Lime application improves nutrient uptake.")
    elif ph > 7.5:
        recs["soil_notes"].append("High pH reduces P and micronutrient availability.")
        
    return recs


# ── STEP 8 — REPORT PRINTER ─────────────────────────────────────────────────
def print_report(meta: dict, crop: str, features: dict, suitability: dict, greenhouse: dict, fertilizers: dict):
    print("\n" + "="*55)
    print(" CROP ADVISORY REPORT")
    print(f" Location : {meta['city']}, {meta['country']}  |  Crop : {crop.title()}")
    print(f" Weather  : {meta['description'].title()}, {features['temperature']} C, {features['humidity']}% humidity")
    print("="*55)
    
    print("\n [LIVE CONDITIONS]")
    for feat, data in suitability["feature_status"].items():
        curr = data["current"]
        ideal = data["ideal"]
        stat = data["status"]
        icon = "OK" if stat == "IDEAL" else ("!" if stat == "SUBOPTIMAL" else "X")
        if "temperature" in feat: curr_str, idl_str = f"{curr} C", f"{ideal} C"
        elif "humidity" in feat: curr_str, idl_str = f"{curr}%", f"{ideal}%"
        elif "rainfall" in feat: curr_str, idl_str = f"{curr} mm", f"{ideal} mm"
        else: curr_str, idl_str = f"{curr}", f"{ideal}"
        print(f" {feat:<18}: {curr_str:<12} (ideal: {idl_str:<10}) [{icon}] {stat}")

    print("\n [SUITABILITY VERDICT]")
    print(f" Score  : {suitability['score']}/100   ->  {suitability['verdict']}")
    
    print("\n [GREENHOUSE FIXES]")
    if not greenhouse["issues"]:
        print(" No major interventions needed. Conditions are largely ideal.")
    else:
        for feat, info in greenhouse["issues"].items():
            print(f" * {feat}    : {info['current']} -> {info['status']}, target {info['ideal']}")
            print(f"   Action      : {info['action']}")
        print(f"   After fix   : Score improves from {greenhouse['score_before']} -> {greenhouse['score_after']} ({greenhouse['verdict_after'].split(' -')[0]})")

    print("\n [FERTILIZER PLAN]")
    print(f" {'Nutrient':<12} {'Current':<8} {'Ideal':<8} {'Deficit':<8} {'Fertilizer':<15} {'Dose':<10} {'Timing'}")
    for n in ["nitrogen", "phosphorus", "potassium"]:
        d = fertilizers[n]
        cur = f"{d['current']} kg"
        idl = f"{d['ideal']} kg"
        dfc = f"{d['deficit']} kg" if d['deficit'] > 0 else "-"
        print(f" {n.title():<12} {cur:<8} {idl:<8} {dfc:<8} {d['fertilizer']:<15} {d['dose_kg_ha']:<10} {d['timing'][:30] + '...' if len(d['timing']) > 30 else d['timing']}")
    
    if fertilizers["soil_notes"]:
        print("\n Notes:")
        for note in fertilizers["soil_notes"]:
            print(f" * {note}")
    print("="*55 + "\n")


# ── STEP 9 — MAIN ENTRY POINT ───────────────────────────────────────────────
def main():
    # 2 & 3. Legacy RF Model check (Simple accuracy metric output if possible)
    print("Initializing Agri-AI Crop Advisory System...")
    try:
        if os.path.exists(DATASET_PATH):
            df = pd.read_csv(DATASET_PATH)
            if 'Crop' in df.columns:
                print(f"Dataset loaded: {len(df)} records. Training baseline RF model...")
                # Simplified training just to print accuracy as requested
                num_features = df.select_dtypes(include=[np.number]).columns.tolist()
                X = df[num_features].fillna(0)
                y = df['Crop']
                X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.10, random_state=42)
                rf = RandomForestClassifier(n_estimators=50, random_state=42)
                rf.fit(X_train, y_train)
                acc = accuracy_score(y_test, rf.predict(X_test))
                print(f"[Model Baseline] Random Forest Accuracy (raw data): {acc*100:.2f}%")
        else:
            print(f"[Warning] Legacy dataset not found at {DATASET_PATH}")
    except Exception as e:
        print(f"[Warning] RF pipeline skipped: {e}")

    # Core Advisory Loop
    while True:
        print("-" * 50)
        user_data = collect_user_inputs()
        
        crop = user_data["crop"]
        live_features = user_data["features"]
        
        suitability = score_suitability(live_features, crop)
        greenhouse = greenhouse_engine(live_features, crop, suitability)
        fertilizers = recommend_fertilizers(live_features, crop)
        
        print_report(user_data["weather_meta"], crop, live_features, suitability, greenhouse, fertilizers)
        
        ans = input("Analyse another location? (y/n): ").strip().lower()
        if ans != 'y':
            break

if __name__ == "__main__":
    main()
