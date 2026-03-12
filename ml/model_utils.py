import joblib
import numpy as np
from sklearn.metrics import mean_squared_error

def save_model(model, filepath):
    joblib.dump(model, filepath)
    print(f"Model saved to {filepath}")

def load_model(filepath):
    try:
        model = joblib.load(filepath)
        return model
    except FileNotFoundError:
        print(f"Model file {filepath} not found.")
        return None

def evaluate_model(model, X_test, y_test):
    predictions = model.predict(X_test)
    rmse = np.sqrt(mean_squared_error(y_test, predictions))
    return rmse
