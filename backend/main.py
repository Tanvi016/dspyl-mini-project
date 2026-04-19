from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn import metrics
from sklearn.preprocessing import LabelEncoder
import pathlib
from typing import List, Optional
import pickle
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#error handling 
from fastapi.exceptions import RequestValidationError
from starlette.responses import JSONResponse

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    errors = exc.errors()
    detail_messages = []
    for error in errors:
        field = error['loc'][-1] if error['loc'] else 'unknown'
        msg = error['msg']
        detail_messages.append(f"{field}: {msg}")
    
    return JSONResponse(
        status_code=400,
        content={
            "error": "Invalid input",
            "detail": " | ".join(detail_messages) if detail_messages else "Validation failed"
        }
    )

# -----------------------------------------------------------------------------
# 1. Data Loading and Initial Preprocessing
# -----------------------------------------------------------------------------
base_path = pathlib.Path(__file__).parent.parent
candidate_files = [
    base_path / 'datasets-notebook' / 'insurance_enhanced_synthetic.csv',
    base_path / 'datasets-notebook' / 'insurance_large_cleaned.csv',
    base_path / 'insurance_enhanced_synthetic.csv',
    base_path / 'insurance_large_cleaned.csv'
]

data_path = None
for candidate in candidate_files:
    if candidate.exists():
        data_path = candidate
        break

if not data_path:
    raise FileNotFoundError('No insurance dataset found. Expected one of: ' + ', '.join(str(p) for p in candidate_files))

df = pd.read_csv(data_path)

enhanced_fields = {'exercise_level', 'policy_type', 'medical_history', 'income_level', 'alcohol_consumption'}
dataset_has_enhanced_features = enhanced_fields.issubset(set(df.columns))

binary_columns = ['smoker']
if dataset_has_enhanced_features:
    binary_columns += ['medical_history', 'alcohol_consumption']

categorical_columns = ['sex', 'region']
if dataset_has_enhanced_features:
    categorical_columns += ['exercise_level', 'policy_type', 'income_level']

# -----------------------------------------------------------------------------
# 2. Preprocessing Function
# -----------------------------------------------------------------------------
def preprocess_dataset(dataframe):
    processed = dataframe.copy()
    
    # Map binary columns
    for col in binary_columns:
        if col in processed.columns:
            processed[col] = processed[col].str.lower().map({'yes': 1, 'no': 0})
    
    # Feature Interaction
    if dataset_has_enhanced_features and 'bmi' in processed.columns and 'smoker' in processed.columns:
        processed['bmi_smoker'] = processed['bmi'] * processed['smoker']
    
    # Categorical Encoding
    processed = pd.get_dummies(processed, columns=categorical_columns, drop_first=True)
    return processed

# Initial Process
processed_df = preprocess_dataset(df)
X = processed_df.drop(columns='charges')
y = processed_df['charges']
MODEL_FEATURES = X.columns.tolist()

# Classification Target
y_class = pd.qcut(df['charges'], q=3, labels=['Low', 'Medium', 'High'])
le = LabelEncoder()
y_class_encoded = le.fit_transform(y_class)
class_names = le.classes_.tolist()

# Splits
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
X_train_c, X_test_c, y_train_c, y_test_c = train_test_split(X, y_class_encoded, test_size=0.2, random_state=42)

# -----------------------------------------------------------------------------
# 3. Model Management (Load or Train)
# -----------------------------------------------------------------------------
model_dir = pathlib.Path(__file__).parent / 'models'
model_dir.mkdir(exist_ok=True)
lr_model_path = model_dir / 'linear_regression.pkl'
rf_model_path = model_dir / 'random_forest.pkl'

def train_models():
    print("🚀 Training models from scratch...")
    
    # Linear Regression
    m_lr = LinearRegression()
    m_lr.fit(X_train, y_train)
    with open(lr_model_path, 'wb') as f:
        pickle.dump(m_lr, f)
        
    # Random Forest Classifier
    m_rf = RandomForestClassifier(n_estimators=300, random_state=42)
    m_rf.fit(X_train_c, y_train_c)
    with open(rf_model_path, 'wb') as f:
        pickle.dump(m_rf, f)
        
    print("✅ Training complete. Models saved.")
    return m_lr, m_rf

# Check and Load
should_retrain = False
if not lr_model_path.exists() or not rf_model_path.exists():
    should_retrain = True
else:
    try:
        with open(lr_model_path, 'rb') as f:
            model_lr = pickle.load(f)
        with open(rf_model_path, 'rb') as f:
            model_rf = pickle.load(f)
        
        # Verify feature count compatibility
        # For sklearn models, check n_features_in_
        if getattr(model_lr, "n_features_in_", 0) != len(MODEL_FEATURES) or \
           getattr(model_rf, "n_features_in_", 0) != len(MODEL_FEATURES):
            print("⚠️ Model feature mismatch detected. Dataset has likely changed.")
            should_retrain = True
    except Exception as e:
        print(f"❌ Error loading models: {e}. Falling back to retraining.")
        should_retrain = True

if should_retrain:
    model_lr, model_rf = train_models()

# -----------------------------------------------------------------------------
# 4. Global Metrics and Importances
# -----------------------------------------------------------------------------
# Calculate metrics once
train_preds_lr = model_lr.predict(X_train)
test_preds_lr = model_lr.predict(X_test)
train_r2_lr = metrics.r2_score(y_train, train_preds_lr)
test_r2_lr = metrics.r2_score(y_test, test_preds_lr)
test_mae_lr = metrics.mean_absolute_error(y_test, test_preds_lr)
test_rmse_lr = np.sqrt(metrics.mean_squared_error(y_test, test_preds_lr))

test_preds_rf = model_rf.predict(X_test_c)
test_acc_rf = metrics.accuracy_score(y_test_c, test_preds_rf)
test_f1_rf = metrics.f1_score(y_test_c, test_preds_rf, average='weighted')

rf_importances = pd.Series(model_rf.feature_importances_, index=MODEL_FEATURES).sort_values(ascending=False).to_dict()


# ==================================================
# API ENDPOINTS
# ==================================================

class PredictionInput(BaseModel):
    age: int
    sex: str
    bmi: float
    children: int
    smoker: str
    region: str
    exercise_level: str
    policy_type: str
    medical_history: str
    income_level: str
    alcohol_consumption: str

#validation for inputs as a measure for invalid edge cases.
    @field_validator('age')
    @classmethod
    def validate_age(cls, v):
        if not isinstance(v, int):
            raise ValueError('Age must be an integer')
        if v < 18 or v > 65:
            raise ValueError('Age must be between 18 and 65')
        return v

    @field_validator('bmi')
    @classmethod
    def validate_bmi(cls, v):
        try:
            bmi_float = float(v)
        except (ValueError, TypeError):
            raise ValueError('BMI must be a number')
        if bmi_float < 15 or bmi_float > 50:
            raise ValueError('BMI must be between 15 and 50')
        return bmi_float

    @field_validator('children')
    @classmethod
    def validate_children(cls, v):
        if not isinstance(v, int):
            raise ValueError('Children must be an integer')
        if v < 0 or v > 5:
            raise ValueError('Children count must be between 0 and 5')
        return v

    @field_validator('sex')
    @classmethod
    def validate_sex(cls, v):
        if v.lower() not in ['male', 'female']:
            raise ValueError('Sex must be "male" or "female"')
        return v.lower()

    @field_validator('smoker')
    @classmethod
    def validate_smoker(cls, v):
        if v.lower() not in ['yes', 'no']:
            raise ValueError('Smoker must be "yes" or "no"')
        return v.lower()

    @field_validator('region')
    @classmethod
    def validate_region(cls, v):
        valid_regions = ['southeast', 'southwest', 'northeast', 'northwest']
        if v.lower() not in valid_regions:
            raise ValueError(f"Region must be one of: {', '.join(valid_regions)}")
        return v.lower()

    @field_validator('exercise_level')
    @classmethod
    def validate_exercise_level(cls, v):
        valid_exercise = ['low', 'medium', 'high']
        if v.lower() not in valid_exercise:
            raise ValueError(f"Exercise level must be one of: {', '.join(valid_exercise)}")
        return v.lower()

    @field_validator('policy_type')
    @classmethod
    def validate_policy_type(cls, v):
        valid_policy = ['basic', 'gold', 'premium']
        if v.lower() not in valid_policy:
            raise ValueError(f"Policy type must be one of: {', '.join(valid_policy)}")
        return v.lower()

    @field_validator('medical_history')
    @classmethod
    def validate_medical_history(cls, v):
        if v.lower() not in ['yes', 'no']:
            raise ValueError('Medical history must be "yes" or "no"')
        return v.lower()

    @field_validator('income_level')
    @classmethod
    def validate_income_level(cls, v):
        valid_income = ['low', 'medium', 'high']
        if v.lower() not in valid_income:
            raise ValueError(f"Income level must be one of: {', '.join(valid_income)}")
        return v.lower()

    @field_validator('alcohol_consumption')
    @classmethod
    def validate_alcohol_consumption(cls, v):
        if v.lower() not in ['yes', 'no']:
            raise ValueError('Alcohol consumption must be "yes" or "no"')
        return v.lower()


def build_feature_row(data: PredictionInput) -> pd.DataFrame:
    # 1. Start with a zero-filled DataFrame with fixed structure
    df_row = pd.DataFrame(0, index=[0], columns=MODEL_FEATURES)
    
    # 2. Map direct and binary inputs
    df_row.at[0, 'age'] = data.age
    df_row.at[0, 'bmi'] = data.bmi
    df_row.at[0, 'children'] = data.children
    
    smoker_val = 1 if data.smoker == 'yes' else 0
    df_row.at[0, 'smoker'] = smoker_val
    
    if dataset_has_enhanced_features:
        df_row.at[0, 'medical_history'] = 1 if data.medical_history == 'yes' else 0
        df_row.at[0, 'alcohol_consumption'] = 1 if data.alcohol_consumption == 'yes' else 0
        df_row.at[0, 'bmi_smoker'] = data.bmi * smoker_val
        
    # 3. Map categorical dummy columns
    # We look for columns like "sex_male", "region_northwest", etc.
    cat_inputs = {
        'sex': data.sex,
        'region': data.region,
        'exercise_level': data.exercise_level,
        'policy_type': data.policy_type,
        'income_level': data.income_level
    }
    
    for prefix, val in cat_inputs.items():
        column_name = f"{prefix}_{val}"
        if column_name in df_row.columns:
            df_row.at[0, column_name] = 1
            
    return df_row

#Rule-based insights generation based on user input and data.
def get_personalized_insights(data: PredictionInput, prediction=None, model_type='regression') -> dict:
    if data.age > 75 or data.bmi > 60:
        return {'valid': False, 'error': 'Profile outside standard underwriting scope'}

    insights = []
    
    if model_type == 'regression':
        # REGRESSION FOCUS: Monetary Sensitivity & Linear Drivers
        if prediction and prediction > 35000:
            insights.append({"type": "critical", "message": "Monetary Alert: Estimated payout resides in extreme outlier territory (> $35k).", "icon": "AlertCircle"})
        
        if data.smoker == 'yes':
            insights.append({"type": "danger", "message": "Primary Cost Driver: Smoking status is responsible for the largest linear shift in projected cost.", "icon": "TrendingUp"})
        
        if data.bmi > 30:
            insights.append({"type": "warning", "message": f"Linear Sensitivity: Each BMI point above 25 is scaling annual cost by a fixed actuarial margin.", "icon": "ArrowUpRight"})

        if data.age > 45:
            insights.append({"type": "info", "message": "Baseline Inflation: Consistent year-over-year cost inflation detected in this age bracket.", "icon": "User"})

        if data.children > 2:
            insights.append({"type": "info", "message": "Dependency Loading: Multiple dependents identified as a linear cost multiplier.", "icon": "History"})

    else:
        # CLASSIFICATION FOCUS: Risk Clusters & Non-Linear Patterns
        if prediction == 'High':
            insights.append({"type": "critical", "message": "High Claims Profile: Applicant matches the high-cost profile found in our database.", "icon": "ShieldAlert"})
        
        if data.smoker == 'yes' and data.bmi > 30:
            insights.append({"type": "danger", "message": "High Risk Pair: Being both a smoker and obese multiplies the risk of extremely high claims.", "icon": "Activity"})
        elif data.smoker == 'yes':
            insights.append({"type": "warning", "message": "Smoking Multiplier: Smoking is the single biggest reason for this high estimate.", "icon": "Brain"})

        if data.medical_history == 'yes':
            insights.append({"type": "warning", "message": "Medical History: Past health issues are a major factor in this classification.", "icon": "History"})

        if data.exercise_level == 'low':
            insights.append({"type": "warning", "message": "Lifestyle Factor: Low exercise frequency pushes this application into the high-cost bracket.", "icon": "TrendingUp"})
        
        if data.income_level == 'high':
            insights.append({"type": "success", "message": "Safety Factor: High income levels often correlate with better health outcomes.", "icon": "CheckCircle"})

    return {
        'valid': True,
        'insights': insights
    }


@app.post("/predict")
def predict_lr(data: PredictionInput):
    prediction = model_lr.predict(build_feature_row(data).to_numpy())[0]
    validation_result = get_personalized_insights(data, prediction=prediction, model_type='regression')
    
    if not validation_result['valid']:
        raise HTTPException(status_code=400, detail={"error": validation_result['error']})

    return {
        "predicted_cost": round(float(prediction), 2),
        "insights": validation_result['insights']
    }


@app.post("/predict-rf")
def predict_rf(data: PredictionInput):
    input_data = build_feature_row(data)
    prediction_idx = model_rf.predict(input_data)[0]
    predicted_class = class_names[prediction_idx]
    
    probs = model_rf.predict_proba(input_data)[0]
    confidence = round(float(np.max(probs)) * 100, 2)

    validation_result = get_personalized_insights(data, prediction=predicted_class, model_type='classification')
    
    if not validation_result['valid']:
        raise HTTPException(status_code=400, detail={"error": validation_result['error']})

    return {
        "predicted_risk": predicted_class,
        "confidence": confidence,
        "is_classification": True,
        "insights": validation_result['insights']
    }


@app.get("/model-metrics")
def get_model_metrics():
    return {
        "train_r2": round(train_r2_lr * 100, 2),
        "test_r2": round(test_r2_lr * 100, 2),
        "test_mae": round(test_mae_lr, 2),
        "test_rmse": round(test_rmse_lr, 2)
    }

    
@app.get("/model-metrics-rf")
def get_model_metrics_rf():
    importances = [{"feature": k, "importance": round(v * 100, 2)} for k, v in rf_importances.items()]
    return {
        "accuracy": round(test_acc_rf * 100, 2),
        "f1_score": round(test_f1_rf * 100, 2),
        "feature_importances": importances,
        "is_classification": True,
        "classes": class_names
    }


@app.get("/dashboard-data")
def get_dashboard_data():
    def get_histogram(column, bins=12):
        values = df[column].dropna().values
        counts, edges = np.histogram(values, bins=bins)
        res = []
        for i in range(len(counts)):
            res.append({
                "name": f"{edges[i]:.0f}-{edges[i+1]:.0f}",
                "count": int(counts[i]),
                "min": float(edges[i]),
                "max": float(edges[i+1])
            })
        return res

    df_local = df.copy()
    df_local['bmi_category'] = pd.cut(df_local['bmi'], bins=[0, 25, 30, np.inf], labels=['normal', 'overweight', 'obese'])

    # Calculate dynamic insights
    insights = []
    graph_insights = {}
    
    # Smoker impact
    smoker_avg = df_local.groupby('smoker')['charges'].mean()
    if 'yes' in smoker_avg and 'no' in smoker_avg:
        multiplier = smoker_avg['yes'] / smoker_avg['no']
        smoker_text = f"Smokers pay {multiplier:.1f} times more on average than non-smokers in this data."
        insights.append({"text": smoker_text, "icon": "TrendingUp", "type": "danger"})
        graph_insights["smoking"] = smoker_text

    # BMI impact
    bmi_obese_avg = df_local[df_local['bmi'] >= 30]['charges'].mean()
    bmi_normal_avg = df_local[df_local['bmi'] < 25]['charges'].mean()
    if not np.isnan(bmi_obese_avg) and not np.isnan(bmi_normal_avg):
        bmi_increase = ((bmi_obese_avg / bmi_normal_avg) - 1) * 100
        bmi_text = f"High BMI (30+) increases charges by {bmi_increase:.0f}% compared to normal weight."
        insights.append({"text": bmi_text, "icon": "Activity", "type": "warning"})
        graph_insights["bmi"] = bmi_text

    # Regional insight
    region_max = df_local.groupby('region')['charges'].mean().idxmax()
    region_max_val = df_local.groupby('region')['charges'].mean().max()
    region_text = f"{region_max.title()} is the most expensive region, costing about {region_max_val:,.0f} per year."
    insights.append({"text": region_text, "icon": "ShieldAlert", "type": "info"})
    graph_insights["region"] = region_text

    # Age insight (rough linear trend)
    age_trend = df_local.groupby('age')['charges'].mean()
    if len(age_trend) > 10:
        decade_increase = (age_trend.loc[50:60].mean() / age_trend.loc[20:30].mean() - 1) * 100
        age_text = f"Insurance costs rise by {decade_increase:.0f}% on average as policyholders age from 20 to 60."
        graph_insights["age"] = age_text

    response = {
        "average_charges": float(df_local['charges'].mean()),
        "max_charges": float(df_local['charges'].max()),
        "percent_smokers": float(df_local['smoker'].str.lower().eq('yes').mean() * 100),
        "average_bmi": float(df_local['bmi'].mean()),
        "charges_distribution": get_histogram('charges'),
        "bmi_distribution": get_histogram('bmi', bins=20),
        "sex_count": df_local['sex'].value_counts().reset_index().rename(columns={"count": "value", "index": "name"}).to_dict('records'),
        "smoker_count": df_local['smoker'].value_counts().reset_index().rename(columns={"count": "value", "index": "name"}).to_dict('records'),
        "children_count": df_local['children'].value_counts().reset_index().rename(columns={"count": "value", "children": "name", "index": "name"}).to_dict('records'),
        "smoker_charges": df_local.groupby('smoker')['charges'].mean().reset_index().rename(columns={"charges": "avg_charge"}).to_dict('records'),
        "bmi_scatter": df_local[['bmi', 'charges', 'smoker']].rename(columns={"bmi": "x", "charges": "y", "smoker": "group"}).to_dict('records'),
        "age_scatter": df_local[['age', 'charges']].rename(columns={"age": "x", "charges": "y"}).to_dict('records'),
        "policy_type_charges": [],
        "bmi_category_charges": df_local.groupby('bmi_category', observed=True)['charges'].mean().reset_index().rename(columns={"charges": "avg_charge"}).to_dict('records'),
        "combined_risk": df_local.groupby(['smoker', 'bmi_category'], observed=True)['charges'].mean().reset_index().assign(group=lambda x: x['smoker'] + ' / ' + x['bmi_category'].astype(str)).rename(columns={"charges": "avg_charge"}).to_dict('records'),
        "feature_importance": [{"feature": k, "importance": float(v * 100)} for k, v in rf_importances.items()],
        "region_charges": df_local.groupby('region')['charges'].mean().reset_index().rename(columns={"charges": "avg_charge"}).to_dict('records'),
        "total_records": len(df_local),
        "top_insights": insights,
        "graph_insights": graph_insights
    }

    if 'policy_type' in df_local.columns:
        response['policy_type_charges'] = df_local.groupby('policy_type')['charges'].mean().reset_index().rename(columns={"charges": "avg_charge"}).to_dict('records')

    return response

