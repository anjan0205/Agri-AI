import joblib
import pandas as pd
import numpy as np

def check_importance():
    try:
        classifier = joblib.load('models/tier_classifier.joblib')
        preprocessor = joblib.load('models/preprocessor.joblib')
        
        # Get feature names from preprocessor
        # [cat, num, bool]
        cat_features = preprocessor.transformers_[0][2]
        num_features = preprocessor.transformers_[1][2]
        bool_features = preprocessor.transformers_[2][2]
        all_feature_names = list(cat_features) + list(num_features) + list(bool_features)
        
        # The classifier is a VotingClassifier, it doesn't have feature_importances_ directly
        # but the base models do.
        print("Model architecture:", type(classifier))
        
        for name, model in classifier.named_estimators_.items():
            print(f"\nFeature Importance for {name}:")
            if hasattr(model, 'feature_importances_'):
                importances = model.feature_importances_
                feat_imp = pd.Series(importances, index=all_feature_names).sort_values(ascending=False)
                print(feat_imp.head(10))
            else:
                print(f"Model {name} does not support feature_importances_")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_importance()
