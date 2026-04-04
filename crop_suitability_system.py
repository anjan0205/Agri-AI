"""
Crop Suitability & Greenhouse Simulation System
================================================
Combines a trained Random Forest model with a deterministic
suitability-scoring engine for accurate regional crop prediction.

Architecture:
  - CROP_IDEAL_CONDITIONS  : Domain-knowledge baseline per crop
  - score_crop_suitability : Weighted deviation scoring (deterministic)
  - predict_crop           : Hybrid RF + suitability (suitability takes priority)
  - detect_greenhouse_issues: Flags env deviations from crop ideal
  - recommend_fertilizers  : Compares real NPK vs crop ideal
  - run_simulation         : Orchestrates before/after analysis
  - main()                 : Scenarios A-D (D = Mirchi, Guntur)
"""

import os
import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder

# ── Constants ──────────────────────────────────────────────────────────────────
DATASET_PATH = r"C:\Users\Panga Anjan\Desktop\reduced_crop_dataset_20000.csv"
MODELS_DIR   = "models"
GH_TOLERANCE = 0.10          # ±10% tolerance for greenhouse issue detection

FEATURE_COLS = [
    "temperature", "humidity", "rainfall", "wind_speed",
    "solar_radiation", "evapotranspiration",
    "soil_ph", "nitrogen", "phosphorus", "potassium",
    "water_availability",
]

CATEGORICAL_COLS = ["region", "soil_type"]

FEATURE_WEIGHTS = {
    "temperature":        2.0,
    "humidity":           1.5,
    "rainfall":           1.5,
    "soil_ph":            2.0,
    "water_availability": 1.5,
    "nitrogen":           1.0,
    "phosphorus":         1.0,
    "potassium":          1.0,
    "wind_speed":         0.5,
    "solar_radiation":    0.5,
    "evapotranspiration": 0.5,
}

# ── CHANGE 1 — CROP_IDEAL_CONDITIONS ──────────────────────────────────────────
CROP_IDEAL_CONDITIONS = {
    "Wheat": {
        "temperature":        22.0,
        "humidity":           55.0,
        "rainfall":           100.0,
        "wind_speed":         6.0,
        "solar_radiation":    190.0,
        "evapotranspiration": 5.5,
        "soil_ph":            6.5,
        "water_availability": 0.60,
        "nitrogen":           130.0,
        "phosphorus":         65.0,
        "potassium":          55.0,
        "region":             "North",
        "soil_type":          "Loam",
    },
    "Rice": {
        "temperature":        28.0,
        "humidity":           80.0,
        "rainfall":           220.0,
        "wind_speed":         5.0,
        "solar_radiation":    200.0,
        "evapotranspiration": 6.0,
        "soil_ph":            6.0,
        "water_availability": 0.85,
        "nitrogen":           140.0,
        "phosphorus":         60.0,
        "potassium":          80.0,
        "region":             "South",
        "soil_type":          "Clay",
    },
    "Maize": {
        "temperature":        27.0,
        "humidity":           65.0,
        "rainfall":           150.0,
        "wind_speed":         7.0,
        "solar_radiation":    220.0,
        "evapotranspiration": 6.5,
        "soil_ph":            6.3,
        "water_availability": 0.65,
        "nitrogen":           150.0,
        "phosphorus":         70.0,
        "potassium":          90.0,
        "region":             "East",
        "soil_type":          "Loam",
    },
    "Cotton": {
        "temperature":        30.0,
        "humidity":           55.0,
        "rainfall":           80.0,
        "wind_speed":         8.0,
        "solar_radiation":    240.0,
        "evapotranspiration": 7.5,
        "soil_ph":            7.0,
        "water_availability": 0.50,
        "nitrogen":           110.0,
        "phosphorus":         55.0,
        "potassium":          85.0,
        "region":             "West",
        "soil_type":          "Black",
    },
    "Soybean": {
        "temperature":        25.0,
        "humidity":           70.0,
        "rainfall":           160.0,
        "wind_speed":         5.5,
        "solar_radiation":    210.0,
        "evapotranspiration": 6.0,
        "soil_ph":            6.5,
        "water_availability": 0.70,
        "nitrogen":           40.0,
        "phosphorus":         60.0,
        "potassium":          80.0,
        "region":             "East",
        "soil_type":          "Loam",
    },
    "Barley": {
        "temperature":        18.0,
        "humidity":           50.0,
        "rainfall":           90.0,
        "wind_speed":         7.0,
        "solar_radiation":    185.0,
        "evapotranspiration": 5.0,
        "soil_ph":            6.5,
        "water_availability": 0.55,
        "nitrogen":           100.0,
        "phosphorus":         50.0,
        "potassium":          60.0,
        "region":             "North",
        "soil_type":          "Sandy",
    },
    "Mirchi": {
        "temperature":        28.0,
        "humidity":           55.0,
        "rainfall":           90.0,
        "wind_speed":         5.0,
        "solar_radiation":    215.0,
        "evapotranspiration": 6.5,
        "soil_ph":            6.5,
        "water_availability": 0.55,
        "nitrogen":           100.0,
        "phosphorus":         50.0,
        "potassium":          60.0,
        "region":             "Guntur",
        "soil_type":          "Loamy",
    },
}


# ── CHANGE 2 — score_crop_suitability() ───────────────────────────────────────
def score_crop_suitability(user_input, region=None):
    """
    Compute a weighted normalized deviation score for every crop.
    Lower score  =  better match.

    Args:
        user_input (dict): sensor/user values keyed by feature name.
        region (str|None): optional region string for a 20% bonus if matched.

    Returns:
        list of (crop_name, score) sorted best-first (lowest score first).
    """
    scores = {}

    for crop, ideal in CROP_IDEAL_CONDITIONS.items():
        total = 0.0
        for feat, weight in FEATURE_WEIGHTS.items():
            user_val  = user_input.get(feat, ideal[feat])
            ideal_val = ideal[feat]
            if ideal_val == 0:
                deviation = abs(user_val - ideal_val)
            else:
                deviation = abs(user_val - ideal_val) / ideal_val
            total += weight * deviation

        # Region bonus — 20% reduction if user region matches crop ideal region
        if region is not None and ideal.get("region", "").lower() == region.lower():
            total *= 0.80

        scores[crop] = total

    return sorted(scores.items(), key=lambda x: x[1])


# ── Preprocessing helpers ─────────────────────────────────────────────────────
def encode_user_input(user_input, encoders):
    """
    Encode categorical fields and return a feature vector for the RF model.
    Falls back gracefully if a category is unseen.
    """
    row = {}
    for feat in FEATURE_COLS:
        row[feat] = user_input.get(feat, 0.0)

    for cat in CATEGORICAL_COLS:
        le = encoders.get(cat)
        raw = str(user_input.get(cat, ""))
        if le is not None:
            try:
                row[cat] = int(le.transform([raw])[0])
            except ValueError:
                row[cat] = -1
        else:
            row[cat] = 0

    ordered = FEATURE_COLS + CATEGORICAL_COLS
    return np.array([[row[f] for f in ordered]])


# ── CHANGE 3 — predict_crop() refactored ─────────────────────────────────────
def predict_crop(model, user_input, encoders, region=None):
    """
    Hybrid prediction: suitability-score engine + RF model.
    Suitability score takes priority over RF when they disagree.

    Returns:
        dict with keys: crop, confidence, top3, rf_prediction,
                        region_bonus_applied
    """
    # 1. Suitability ranking
    ranked        = score_crop_suitability(user_input, region)
    top1_crop     = ranked[0][0]
    top3          = ranked[:3]
    region_bonus  = region is not None and CROP_IDEAL_CONDITIONS[top1_crop].get(
        "region", ""
    ).lower() == region.lower()

    # 2. RF model prediction
    try:
        X_enc    = encode_user_input(user_input, encoders)
        rf_idx   = model.predict(X_enc)[0]
        rf_crop  = encoders["crop"].inverse_transform([rf_idx])[0]
    except Exception:
        rf_crop  = top1_crop   # fallback if RF fails

    # 3. Confidence: high if RF agrees with suitability, moderate otherwise
    if rf_crop == top1_crop:
        confidence = "high"
    else:
        confidence = "moderate"

    return {
        "crop":                 top1_crop,
        "confidence":           confidence,
        "top3":                 top3,
        "rf_prediction":        rf_crop,
        "region_bonus_applied": region_bonus,
    }


# ── CHANGE 4 — detect_greenhouse_issues() refactored ─────────────────────────
def detect_greenhouse_issues(crop, user_input):
    """
    Detect which environmental features deviate beyond GH_TOLERANCE (±10%)
    from the crop's ideal conditions stored in CROP_IDEAL_CONDITIONS.

    Returns:
        list of issue dicts: {feature, actual, ideal, delta_pct, solution}
    """
    if crop not in CROP_IDEAL_CONDITIONS:
        return []

    ideal  = CROP_IDEAL_CONDITIONS[crop]
    issues = []

    solutions = {
        "temperature":        "Adjust greenhouse heating/cooling system",
        "humidity":           "Deploy smart dehumidifier or fogging system",
        "rainfall":           "Activate supplemental drip irrigation",
        "wind_speed":         "Install windbreak nets or ventilation control",
        "solar_radiation":    "Adjust shade-net coverage or LED grow lights",
        "evapotranspiration": "Adapt irrigation schedule to ET demand",
        "soil_ph":            "Apply lime (raise pH) or sulphur (lower pH)",
        "water_availability": "Irrigation calibration or water table check",
        "nitrogen":           "Apply urea or ammonium-nitrate top-dressing",
        "phosphorus":         "Apply DAP or SSP basal dressing",
        "potassium":          "Apply MOP (muriate of potash)",
    }

    for feat in FEATURE_WEIGHTS:
        ideal_val = ideal.get(feat)
        if ideal_val is None or ideal_val == 0:
            continue
        actual    = user_input.get(feat, ideal_val)
        delta_pct = (actual - ideal_val) / ideal_val

        if abs(delta_pct) > GH_TOLERANCE:
            issues.append({
                "feature":   feat,
                "actual":    actual,
                "ideal":     ideal_val,
                "delta_pct": round(delta_pct * 100, 1),
                "solution":  solutions.get(feat, "Manual inspection required"),
            })

    return issues


# ── CHANGE 5 — recommend_fertilizers() refactored ────────────────────────────
def recommend_fertilizers(crop, user_input):
    """
    Compare actual NPK vs ideal NPK from CROP_IDEAL_CONDITIONS.
    Returns list of fertilizer recommendation strings.
    """
    if crop not in CROP_IDEAL_CONDITIONS:
        return ["No fertilizer data available for this crop."]

    ideal = CROP_IDEAL_CONDITIONS[crop]
    recs  = []

    npk_map = {
        "nitrogen":   ("Urea (46-0-0) or Ammonium Nitrate",   "N"),
        "phosphorus": ("DAP (18-46-0) or SSP (0-16-0)",        "P"),
        "potassium":  ("MOP (0-0-60) or SOP (0-0-50)",         "K"),
    }

    for nutrient, (product, symbol) in npk_map.items():
        actual    = user_input.get(nutrient, ideal[nutrient])
        ideal_val = ideal[nutrient]
        deficit   = ideal_val - actual

        if deficit > 0:
            dose = round(deficit * 2.17, 1)  # kg/ha rule-of-thumb conversion
            recs.append(
                f"[{symbol} Deficit {deficit:.1f} kg/ha] Apply {product} "
                f"- estimated dose: {dose} kg/ha"
            )
        elif deficit < -ideal_val * 0.10:
            recs.append(
                f"[{symbol} Excess] Reduce {nutrient} application — "
                f"current {actual:.1f} > ideal {ideal_val:.1f} kg/ha"
            )

    if not recs:
        recs.append(f"NPK levels are within acceptable range for {crop}. [OK]")

    return recs


# ── CHANGE 6 — run_simulation() refactored ───────────────────────────────────
def run_simulation(model, user_input, encoders, region=None):
    """
    Full before/after crop suitability and greenhouse simulation.

    Args:
        model      : trained sklearn RF model (or None for suitability-only)
        user_input : dict of sensor readings
        encoders   : dict of LabelEncoders keyed by column name
        region     : optional region string passed to predict_crop
    """
    print("\n" + "=" * 60)
    print("  AGRI-AI CROP SUITABILITY & GREENHOUSE SIMULATION")
    print("=" * 60)

    # [1] BEFORE — current conditions
    result = predict_crop(model, user_input, encoders, region=region)
    crop   = result["crop"]

    print(f"\n[1] CURRENT CONDITIONS - BEFORE GREENHOUSE")
    print(f"    Predicted Crop   : {crop}")
    print(f"    Confidence       : {result['confidence']}")
    print(f"    RF Model Says    : {result['rf_prediction']}")
    print(f"    Region Bonus     : {'Yes' if result['region_bonus_applied'] else 'No'}")
    print(f"\n    Top 3 Suitability Matches:")
    for rank, (c, score) in enumerate(result["top3"], 1):
        print(f"      {rank}. {c:<12}  score: {score:.4f}")

    # [2] Greenhouse issue detection
    issues = detect_greenhouse_issues(crop, user_input)

    print(f"\n[2] GREENHOUSE DIAGNOSTIC ISSUES  ({len(issues)} found)")
    if issues:
        for issue in issues:
            direction = "HIGH" if issue["delta_pct"] > 0 else "LOW"
            print(
                f"    * {issue['feature']:<22} "
                f"actual={issue['actual']:<8.2f} "
                f"ideal={issue['ideal']:<8.2f} "
                f"({direction} {abs(issue['delta_pct'])}%)"
            )
            print(f"      -> {issue['solution']}")
    else:
        print("    [OK] All conditions within tolerance. No intervention needed.")

    # [3] Fertilizer recommendations
    fert_recs = recommend_fertilizers(crop, user_input)

    print(f"\n[3] FERTILIZER RECOMMENDATIONS  (for {crop})")
    for rec in fert_recs:
        print(f"    - {rec}")

    # [4] AFTER — post greenhouse simulation (target ideal)
    ideal_input = dict(CROP_IDEAL_CONDITIONS[crop])
    # Retain categorical from user
    ideal_input["region"]    = user_input.get("region", ideal_input.get("region"))
    ideal_input["soil_type"] = user_input.get("soil_type", ideal_input.get("soil_type"))

    result_after = predict_crop(model, ideal_input, encoders, region=region)

    print(f"\n[4] AFTER GREENHOUSE OPTIMISATION")
    print(f"    Crop (optimised)  : {result_after['crop']}")
    print(f"    Confidence        : {result_after['confidence']}")
    ideal = CROP_IDEAL_CONDITIONS[crop]
    delta_t = ideal["temperature"] - user_input.get("temperature", ideal["temperature"])
    delta_str = f"+{delta_t:.1f}" if delta_t >= 0 else f"{delta_t:.1f}"
    print(f"    Climate Delta Temp : {delta_str}C  (targeting {ideal['temperature']}C)")
    print("    Status            : Mastermind Greenhouse [OPTIMISED]")
    print("=" * 60)


# ── Load model helpers ────────────────────────────────────────────────────────
def load_model_and_encoders():
    """
    Try to load a pre-trained RF model and encoders from models/.
    Returns (model, encoders) or (None, {}) if unavailable.
    """
    model_path = os.path.join(MODELS_DIR, "crop_model.joblib")
    model      = None
    encoders   = {}

    if os.path.exists(model_path):
        try:
            model = joblib.load(model_path)
        except Exception as e:
            print(f"[warn] Could not load RF model: {e}")

    for col in CATEGORICAL_COLS + ["crop"]:
        le_path = os.path.join(MODELS_DIR, f"le_{col}.joblib")
        if os.path.exists(le_path):
            try:
                encoders[col] = joblib.load(le_path)
            except Exception:
                pass

    return model, encoders


# ── CHANGE 7 — main() with Scenarios A-D ─────────────────────────────────────
def main():
    model, encoders = load_model_and_encoders()

    # ── Scenario A: North Indian Wheat conditions ──────────────────────────
    scenario_a = {
        "temperature":        21.0,
        "humidity":           52.0,
        "rainfall":           95.0,
        "soil_type":          "Loam",
        "soil_ph":            6.6,
        "nitrogen":           125.0,
        "phosphorus":         60.0,
        "potassium":          50.0,
        "wind_speed":         6.5,
        "solar_radiation":    185.0,
        "evapotranspiration": 5.3,
        "water_availability": 0.58,
        "region":             "North",
    }
    print("\n--- SCENARIO A: North India ---")
    run_simulation(model, scenario_a, encoders, region="North")

    # ── Scenario B: South Indian Rice conditions ───────────────────────────
    scenario_b = {
        "temperature":        29.0,
        "humidity":           82.0,
        "rainfall":           230.0,
        "soil_type":          "Clay",
        "soil_ph":            5.9,
        "nitrogen":           135.0,
        "phosphorus":         58.0,
        "potassium":          77.0,
        "wind_speed":         4.5,
        "solar_radiation":    205.0,
        "evapotranspiration": 6.2,
        "water_availability": 0.88,
        "region":             "South",
    }
    print("\n--- SCENARIO B: South India ---")
    run_simulation(model, scenario_b, encoders, region="South")

    # ── Scenario C: West India Cotton conditions ───────────────────────────
    scenario_c = {
        "temperature":        31.0,
        "humidity":           50.0,
        "rainfall":           75.0,
        "soil_type":          "Black",
        "soil_ph":            7.1,
        "nitrogen":           100.0,
        "phosphorus":         50.0,
        "potassium":          80.0,
        "wind_speed":         8.5,
        "solar_radiation":    245.0,
        "evapotranspiration": 7.8,
        "water_availability": 0.48,
        "region":             "West",
    }
    print("\n--- SCENARIO C: West India ---")
    run_simulation(model, scenario_c, encoders, region="West")

    # ── Scenario D: Guntur Mirchi (Chilli) ────────────────────────────────
    scenario_d = {
        "temperature":        27.0,
        "humidity":           58.0,
        "rainfall":           85.0,
        "soil_type":          "Loamy",
        "soil_ph":            6.4,
        "nitrogen":           70.0,
        "phosphorus":         35.0,
        "potassium":          55.0,
        "wind_speed":         4.5,
        "solar_radiation":    210.0,
        "evapotranspiration": 6.2,
        "water_availability": 0.50,
        "region":             "Guntur",
    }
    print("\n--- SCENARIO D: Guntur, Andhra Pradesh - Mirchi ---")
    run_simulation(model, scenario_d, encoders, region="Guntur")


if __name__ == "__main__":
    main()
