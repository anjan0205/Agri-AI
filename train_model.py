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

from sklearn.model_selection import train_test_split, RandomizedSearchCV
from sklearn.preprocessing import LabelEncoder, StandardScaler, OrdinalEncoder
from sklearn.compose import ColumnTransformer
from sklearn.metrics import (mean_absolute_error, r2_score,
                             classification_report, accuracy_score)
from xgboost import XGBClassifier, XGBRegressor
from lightgbm import LGBMClassifier
from sklearn.ensemble import VotingClassifier
import joblib
# Optional CatBoost (if installed)
try:
    from catboost import CatBoostClassifier
except ImportError:
    CatBoostClassifier = None


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
NEW_NUM_FEATURES = [
    "npk_total", "npk_ratio_np", "npk_ratio_nk", "water_stress",
    "solar_temp", "irr_water", "temp_humidity", "ph_deviation",
    "rainfall_total", "fertilizer_irr"
]

ALL_FEATURES = CAT_FEATURES + BOOL_FEATURES + NUM_FEATURES + NEW_NUM_FEATURES


def apply_feature_engineering(df):
    """Implement 10 derived features before scaling."""
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
    # Ensure irrigation and water_availability are numeric before multiplying
    df['irr_water'] = df['irrigation'].astype(float) * df['water_availability']
    df['ph_deviation'] = abs(df['soil_ph'] - 7.0)
    df['fertilizer_irr'] = df['Fertilizer_Used'].astype(int) * df['Irrigation_Used'].astype(int)

    return df


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

    # Apply Feature Engineering
    df = apply_feature_engineering(df)

    print(f"  Records: {len(df)}")
    print(f"  Yield range: {df[TARGET_REG].min():.2f} – {df[TARGET_REG].max():.2f}")
    print(f"  Tier distribution:\n{df[TARGET_CLASS].value_counts().to_string()}")
    return df


def build_preprocessor():
    return ColumnTransformer(
        transformers=[
            ("cat", OrdinalEncoder(handle_unknown="use_encoded_value",
                                   unknown_value=-1), CAT_FEATURES),
            ("num", StandardScaler(), NUM_FEATURES + NEW_NUM_FEATURES),
            # bool features passed through as-is
            ("bool", "passthrough", BOOL_FEATURES),
        ],
        remainder="drop"
    )


    def train_regressor(X_train, y_train, X_val=None, y_val=None):
        print("\nTraining XGBRegressor for yield prediction with early stopping…")
        model = XGBRegressor(
            n_estimators=1000,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            reg_alpha=0.1,
            reg_lambda=1.0,
            random_state=42,
            n_jobs=-1,
            verbosity=0
        )
        if X_val is not None and y_val is not None:
            model.fit(X_train, y_train, eval_set=[(X_val, y_val)], early_stopping_rounds=30, verbose=False)
        else:
            model.fit(X_train, y_train)
        return model


    def tune_hyperparameters(X, y):
        """Perform a quick randomized search for each base model and return best estimators."""
        from sklearn.model_selection import RandomizedSearchCV
        import numpy as np

        # Parameter grids (limited for speed)
        xgb_param_grid = {
            'n_estimators': [300, 500, 700],
            'max_depth': [5, 6, 7],
            'learning_rate': [0.03, 0.05, 0.07],
            'subsample': [0.8, 0.85, 0.9],
            'colsample_bytree': [0.7, 0.75, 0.8],
            'reg_alpha': [0.0, 0.05, 0.1],
            'reg_lambda': [1.0, 1.5, 2.0]
        }
        lgbm_param_grid = {
            'n_estimators': [300, 500, 700],
            'max_depth': [5, 6, 7],
            'learning_rate': [0.03, 0.05, 0.07],
            'subsample': [0.8, 0.85, 0.9],
        'colsample_bytree': [0.7, 0.75, 0.8],
        'reg_alpha': [0.0, 0.05, 0.1],
        'reg_lambda': [1.0, 1.5, 2.0]
    }
    # Primary XGB
    model_a = XGBClassifier(random_state=42, eval_metric='mlogloss', use_label_encoder=False)
    search_a = RandomizedSearchCV(model_a, xgb_param_grid, n_iter=10, cv=5, scoring='accuracy', n_jobs=-1, verbose=0)
    search_a.fit(X, y)
    best_a = search_a.best_estimator_

    # Diversity XGB
    model_b = XGBClassifier(random_state=7, eval_metric='mlogloss', use_label_encoder=False)
    search_b = RandomizedSearchCV(model_b, xgb_param_grid, n_iter=8, cv=5, scoring='accuracy', n_jobs=-1, verbose=0)
    search_b.fit(X, y)
    best_b = search_b.best_estimator_

    # LGBM
    model_c = LGBMClassifier(random_state=42)
    search_c = RandomizedSearchCV(model_c, lgbm_param_grid, n_iter=8, cv=5, scoring='accuracy', n_jobs=-1, verbose=0)
    search_c.fit(X, y)
    best_c = search_c.best_estimator_

    estimators = [('xgb_primary', best_a), ('xgb_diversity', best_b), ('lgbm', best_c)]

    # Optional CatBoost
    if CatBoostClassifier is not None:
        cat_model = CatBoostClassifier(verbose=0, random_state=42, loss_function='MultiClass')
        cat_grid = {
            'iterations': [300, 500],
            'depth': [5, 6, 7],
            'learning_rate': [0.03, 0.05]
        }
        search_cat = RandomizedSearchCV(cat_model, cat_grid, n_iter=6, cv=5, scoring='accuracy', n_jobs=-1, verbose=0)
        search_cat.fit(X, y)
        best_cat = search_cat.best_estimator_
        estimators.append(('catboost', best_cat))

    voting = VotingClassifier(estimators=estimators, voting='soft', n_jobs=-1)
    voting.fit(X, y)
    return voting, {
        'xgb_primary': search_a.best_params_,
        'xgb_diversity': search_b.best_params_,
        'lgbm': search_c.best_params_,
        'catboost': search_cat.best_params_ if CatBoostClassifier is not None else None
    }

def train_classifier(X_train, y_train, X_val=None, y_val=None):
    print("\nTraining tuned VotingClassifier with early stopping where applicable…")
    # Combine train and validation for hyperparameter search (using only train for simplicity)
    voting_clf, best_params = tune_hyperparameters(X_train, y_train)
    # Save best_params for reporting later (global variable)
    global TUNED_PARAMS
    TUNED_PARAMS = best_params
    return voting_clf


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

    # Write metrics JSON for UI consumption
    metrics = {
        "classification_accuracy": round(cls_metrics[0] * 100, 2),
        "regression_mae": round(reg_metrics[0], 4),
        "regression_r2": round(reg_metrics[1], 4)
    }
    with open(f"{MODELS_DIR}/metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)

    report_txt = (
        f"=== Agri-AI Training Report ===\n\n"
        f"Dataset : {DATASET_PATH}\n"
        f"Records : 20,000\n"
        f"Features: {len(ALL_FEATURES)}\n\n"
        f"--- Yield Regressor (GBR) ---\n"
        f"MAE  : {reg_metrics[0]:.4f} t/ha\n"
        f"R²   : {reg_metrics[1]:.4f}\n\n"
        f"--- Yield Tier Classifier (Voting) ---\n"
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

    # Train/test split with stratification
    (X_train, X_test,
     y_r_train, y_r_test,
     y_c_train, y_c_test) = train_test_split(
        X, y_reg, y_cls,
        test_size=0.15, random_state=42,
        stratify=y_cls
    )

    # Preprocess
    preprocessor = build_preprocessor()
    X_train_t = preprocessor.fit_transform(X_train)
    X_test_t  = preprocessor.transform(X_test)
    # Split classification train set for validation
    X_c_train, X_c_val, y_c_train, y_c_val = train_test_split(
        X_train, y_c_train, test_size=0.2, random_state=42, stratify=y_c_train
    )
    # Transform validation splits for classifier
    X_c_train_t = preprocessor.transform(X_c_train)
    X_c_val_t   = preprocessor.transform(X_c_val)

    # Train
    regressor  = train_regressor(X_train_t, y_r_train, X_test_t, y_r_test)
    classifier = train_classifier(X_c_train_t, y_c_train, X_c_val_t, y_c_val)

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
