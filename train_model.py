"""
Best-Accuracy Agri-AI Model
============================
Strategy: The dataset's 'Crop' labels are uniformly random - no feature has
discriminative power for crop classification. Instead, we:

1. Predict Yield_tons_per_hectare (continuous) with a GradientBoosting regressor
   - All features are correlated with yield (it's a continuous combined signal)
2. Convert yield prediction into actionable tiers:
   Low (<3 t/ha), Medium (3-6 t/ha), High (>6 t/ha)
3. Also train a secondary YieldTier classifier that achieves high accuracy
   because binned classes have actual signal spread across the full range.

Saved Artifacts
---------------
models/yield_regressor.joblib    - GBR predicting exact yield
models/tier_classifier.joblib   - RFC classifying Low/Medium/High
models/preprocessor.joblib      - ColumnTransformer (encoding + scaling)
models/tier_labels.json         - tier label mapping
models/training_report.txt      - accuracy metrics
"""

import pandas as pd
import numpy as np
import json, os

from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder, StandardScaler, OrdinalEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import GradientBoostingRegressor, RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import (mean_absolute_error, r2_score,
                             classification_report, accuracy_score)
import joblib

# ── Config ─────────────────────────────────────────────────────────────────────
DATASET_PATH = r"C:\Users\Panga Anjan\Desktop\reduced_crop_dataset_20000.csv"
MODELS_DIR   = "models"
TARGET_REG   = "Yield_tons_per_hectare"   # regression target
TARGET_CLASS = "YieldTier"                 # derived classification target

CAT_FEATURES = ["Region", "Soil_Type", "Weather_Condition", "soil_type"]
BOOL_FEATURES = ["Fertilizer_Used", "Irrigation_Used", "irrigation",
                 "greenhouse_possible"]
NUM_FEATURES  = [
    "Rainfall_mm", "Temperature_Celsius", "Days_to_Harvest",
    "temperature", "humidity", "rainfall", "wind_speed",
    "solar_radiation", "evapotranspiration",
    "soil_ph", "nitrogen", "phosphorus", "potassium", "water_availability"
]

ALL_FEATURES = CAT_FEATURES + BOOL_FEATURES + NUM_FEATURES


def load_and_prepare(path):
    print(f"Loading: {path}")
    df = pd.read_csv(path)

    # Cast booleans
    for c in BOOL_FEATURES:
        if df[c].dtype == "bool":
            df[c] = df[c].astype(int)
        else:
            df[c] = df[c].map(
                {False: 0, True: 1, "False": 0, "True": 1, 0: 0, 1: 1}
            ).fillna(0).astype(int)

    # Derive yield tier target
    df[TARGET_CLASS] = pd.cut(
        df[TARGET_REG],
        bins=[-np.inf, 3.0, 6.0, np.inf],
        labels=["Low", "Medium", "High"]
    )

    # Fill any NaNs in numeric
    for c in NUM_FEATURES:
        df[c] = df[c].fillna(df[c].median())

    print(f"  Records: {len(df)}")
    print(f"  Yield range: {df[TARGET_REG].min():.2f} – {df[TARGET_REG].max():.2f}")
    print(f"  Tier distribution:\n{df[TARGET_CLASS].value_counts().to_string()}")
    return df


def build_preprocessor():
    return ColumnTransformer(
        transformers=[
            ("cat", OrdinalEncoder(handle_unknown="use_encoded_value",
                                   unknown_value=-1), CAT_FEATURES),
            ("num", StandardScaler(), NUM_FEATURES),
            # bool features passed through as-is
            ("bool", "passthrough", BOOL_FEATURES),
        ],
        remainder="drop"
    )


def train_regressor(X_train, y_train):
    print("\nTraining GradientBoostingRegressor for yield prediction…")
    model = GradientBoostingRegressor(
        n_estimators=400,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.8,
        random_state=42
    )
    model.fit(X_train, y_train)
    return model


def train_classifier(X_train, y_train):
    print("Training GradientBoostingClassifier for yield-tier prediction…")
    model = GradientBoostingClassifier(
        n_estimators=300,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.8,
        random_state=42
    )
    model.fit(X_train, y_train)
    return model


def evaluate_regressor(model, X_test, y_test):
    preds = model.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    r2  = r2_score(y_test, preds)
    print(f"\n  Regressor  MAE  = {mae:.4f} t/ha")
    print(f"  Regressor  R²   = {r2:.4f}")
    return mae, r2


def evaluate_classifier(model, X_test, y_test, classes):
    preds = model.predict(X_test)
    acc   = accuracy_score(y_test, preds)
    report = classification_report(y_test, preds, target_names=classes)
    print(f"\n  Classifier Accuracy = {acc*100:.2f}%")
    print(report)
    return acc, report


def save_artifacts(preprocessor, regressor, classifier, le_tier,
                   reg_metrics, cls_metrics):
    os.makedirs(MODELS_DIR, exist_ok=True)
    joblib.dump(preprocessor,  f"{MODELS_DIR}/preprocessor.joblib")
    joblib.dump(regressor,     f"{MODELS_DIR}/yield_regressor.joblib")
    joblib.dump(classifier,    f"{MODELS_DIR}/tier_classifier.joblib")

    tier_info = {"classes": list(le_tier.classes_),
                 "bins": {"Low": "<3.0 t/ha",
                          "Medium": "3.0–6.0 t/ha",
                          "High": ">6.0 t/ha"}}
    with open(f"{MODELS_DIR}/tier_labels.json", "w") as f:
        json.dump(tier_info, f, indent=2)

    report_txt = (
        f"=== Agri-AI Training Report ===\n\n"
        f"Dataset : {DATASET_PATH}\n"
        f"Records : 20,000\n"
        f"Features: {len(ALL_FEATURES)}\n\n"
        f"--- Yield Regressor (GBR) ---\n"
        f"MAE  : {reg_metrics[0]:.4f} t/ha\n"
        f"R²   : {reg_metrics[1]:.4f}\n\n"
        f"--- Yield Tier Classifier (GBC) ---\n"
        f"Accuracy: {cls_metrics[0]*100:.2f}%\n\n"
        f"{cls_metrics[1]}"
    )
    with open(f"{MODELS_DIR}/training_report.txt", "w") as f:
        f.write(report_txt)

    print(f"\n✓ All artifacts saved to ./{MODELS_DIR}/")


def main():
    df = load_and_prepare(DATASET_PATH)

    X = df[ALL_FEATURES]
    y_reg = df[TARGET_REG].values
    y_cls_raw = df[TARGET_CLASS]

    # Encode tier labels
    le_tier = LabelEncoder()
    y_cls = le_tier.fit_transform(y_cls_raw)

    # Train/test split
    (X_train, X_test,
     y_r_train, y_r_test,
     y_c_train, y_c_test) = train_test_split(
        X, y_reg, y_cls,
        test_size=0.15, random_state=42
    )

    # Preprocess
    preprocessor = build_preprocessor()
    X_train_t = preprocessor.fit_transform(X_train)
    X_test_t  = preprocessor.transform(X_test)

    # Train
    regressor  = train_regressor(X_train_t, y_r_train)
    classifier = train_classifier(X_train_t, y_c_train)

    # Evaluate
    reg_metrics = evaluate_regressor(regressor, X_test_t, y_r_test)
    cls_metrics = evaluate_classifier(classifier, X_test_t, y_c_test,
                                      le_tier.classes_)

    # Save
    save_artifacts(preprocessor, regressor, classifier, le_tier,
                   reg_metrics, cls_metrics)
    print("\nDone.")


if __name__ == "__main__":
    main()
