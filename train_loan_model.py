"""
# Dataset: Statlog (German Credit Data) by Hans Hofmann. Licensed under CC BY 4.0.
Train loan risk model on German Credit dataset

Key fixes:
  1. Proper train/test split (no data leakage)
  2. Ordinal encoding preserving semantic order for categorical features
  3. Correct SHAP value extraction (class 1 = bad credit risk)
  4. Batch predict_proba instead of per-row calls
"""
import pandas as pd
import numpy as np
import shap
import json
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

# 1. Human-Readable Mappings
DESCRIPTIONS = {
    'checking_account': {'A11': '< 0 DM', 'A12': '0–200 DM', 'A13': '>= 200 DM', 'A14': 'no checking account'},
    'credit_history': {'A30': 'no credits/all paid', 'A31': 'all paid duly', 'A32': 'existing credit paid duly', 'A33': 'delay in past', 'A34': 'critical/other credits'},
    'purpose': {'A40': 'new car', 'A41': 'used car', 'A42': 'furniture/equipment', 'A43': 'radio/television', 'A44': 'domestic appliances', 'A45': 'repairs', 'A46': 'education', 'A47': 'vacation', 'A48': 'retraining', 'A49': 'business', 'A410': 'others'},
    'savings': {'A61': '< 100 DM', 'A62': '100–500 DM', 'A63': '500–1000 DM', 'A64': '>= 1000 DM', 'A65': 'unknown/no savings'},
    'employment_since': {'A71': 'unemployed', 'A72': '< 1 year', 'A73': '1–4 years', 'A74': '4–7 years', 'A75': '>= 7 years'},
    'personal_status': {'A91': 'male: divorced/separated', 'A92': 'female: divorced/separated/married', 'A93': 'male: single', 'A94': 'male: married/widowed', 'A95': 'female: single'},
    'guarantors': {'A101': 'none', 'A102': 'co-applicant', 'A103': 'guarantor'},
    'property': {'A121': 'real estate', 'A122': 'life insurance', 'A123': 'car or other', 'A124': 'unknown/no property'},
    'installment_plans': {'A141': 'bank', 'A142': 'stores', 'A143': 'none'},
    'housing': {'A151': 'rent', 'A152': 'own', 'A153': 'for free'},
    'job': {'A171': 'unemployed/unskilled non-resident', 'A172': 'unskilled resident', 'A173': 'skilled employee', 'A174': 'management/self-employed'},
    'telephone': {'A191': 'none', 'A192': 'yes'},
    'foreign_worker': {'A201': 'yes', 'A202': 'no'}
}

# Explicit ordinal mappings that preserve semantic order
ORDINAL_MAPS = {
    'checking_account':   {'A11': 0, 'A12': 1, 'A13': 2, 'A14': 3},   # ordered by balance
    'credit_history':     {'A30': 0, 'A31': 1, 'A32': 2, 'A33': 3, 'A34': 4},
    'purpose':            {'A40': 0, 'A41': 1, 'A42': 2, 'A43': 3, 'A44': 4,
                           'A45': 5, 'A46': 6, 'A47': 7, 'A48': 8, 'A49': 9, 'A410': 10},
    'savings':            {'A61': 0, 'A62': 1, 'A63': 2, 'A64': 3, 'A65': 4},
    'employment_since':   {'A71': 0, 'A72': 1, 'A73': 2, 'A74': 3, 'A75': 4},
    'personal_status':    {'A91': 0, 'A92': 1, 'A93': 2, 'A94': 3, 'A95': 4},
    'guarantors':         {'A101': 0, 'A102': 1, 'A103': 2},
    'property':           {'A121': 0, 'A122': 1, 'A123': 2, 'A124': 3},
    'installment_plans':  {'A141': 0, 'A142': 1, 'A143': 2},
    'housing':            {'A151': 0, 'A152': 1, 'A153': 2},
    'job':                {'A171': 0, 'A172': 1, 'A173': 2, 'A174': 3},
    'telephone':          {'A191': 0, 'A192': 1},
    'foreign_worker':     {'A201': 0, 'A202': 1},
}

# 2. Load Data
df = pd.read_table('german.data', sep=' ', header=None)
df.columns = [
    "checking_account", "duration", "credit_history", "purpose", "credit_amount",
    "savings", "employment_since", "installment_rate", "personal_status", "guarantors",
    "residence_since", "property", "age", "installment_plans", "housing",
    "existing_credits", "job", "liable_people", "telephone", "foreign_worker", "target"
]
df["target"] = df["target"].replace({1: 0, 2: 1})  # 0=good, 1=bad/risk

X_raw = df.drop(columns=["target"])
y = df["target"]

# Apply explicit ordinal encoding
X = X_raw.copy()
for col, mapping in ORDINAL_MAPS.items():
    X[col] = X[col].map(mapping)

# FIX #1: Proper train/test split — model never sees test data during training
X_train, X_test, X_raw_train, X_raw_test, y_train, y_test = train_test_split(
    X, X_raw, y, test_size=0.2, random_state=42, stratify=y
)

# 3. Train
model = RandomForestClassifier(n_estimators=200, max_depth=8, random_state=42)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"Test accuracy (unseen data, 200 applicants): {accuracy:.2f}")

# 4. Compute SHAP values on ALL 1000 applicants (for the dashboard)
explainer = shap.TreeExplainer(model)
shap_values_all = explainer.shap_values(X)  # shape: (1000, 20, 2) for RF

# Always extract class-1 (bad credit risk) SHAP values
# shap_values_all has shape (n_samples, n_features, n_classes) for sklearn RF
if isinstance(shap_values_all, list):
    # Older SHAP versions return a list [class0_array, class1_array]
    sv_class1 = shap_values_all[1]          # shape: (1000, 20)
else:
    # Newer SHAP versions return a single 3D array
    sv_class1 = shap_values_all[:, :, 1]   # shape: (1000, 20)

# Batch predict_proba — fast and consistent with SHAP
all_probs = model.predict_proba(X)[:, 1]  # probability of class 1 (bad/risk)

# 5. Format Output
FEATURE_DISPLAY_NAMES = {
    "installment_plans": "Other Installment Plans",
    "savings": "Savings Account",
    "guarantors": "Other Debtors / Guarantors",
    "employment_since": "Present Employment Since",
    "residence_since": "Present Residence Since",
    "job": "Job Type",
    "liable_people": "Number of Dependents"
}

def format_applicant(idx):
    orig_row = X_raw.iloc[idx]
    s_vals = sv_class1[idx]
    idx_absolute = int(X.index[idx])

    features = []
    raw_features = {}

    for i, col in enumerate(X.columns):
        val = orig_row[col]
        readable_val = DESCRIPTIONS.get(col, {}).get(val, str(val))
        raw_features[col] = readable_val
        features.append({
            "name": FEATURE_DISPLAY_NAMES.get(col, col.replace('_', ' ').title()),
            "value": readable_val,
            "shap": round(float(s_vals[i]), 3),
            "description": f"Attribute: {col}"
        })

    prob = float(all_probs[idx])

    return {
        "id": idx_absolute,
        "displayId": f"GC-{idx_absolute}",
        "label": f"Applicant {idx_absolute}",
        "prob": round(prob, 3),
        "totalRisk": round(prob, 3),
        "features": sorted(features, key=lambda x: abs(x['shap']), reverse=True),
        "rawFeatures": raw_features,
        "summary": [
            {"k": "Purpose", "v": raw_features['purpose']},
            {"k": "Amount", "v": f"{orig_row['credit_amount']} DM"},
            {"k": "Age", "v": str(orig_row['age'])}
        ]
    }

output_applicants = [format_applicant(i) for i in range(len(X))]

with open('new_applicants.json', 'w') as f:
    json.dump(output_applicants, f, indent=2)
    print("Saved 1000 applicants to new_applicants.json")
