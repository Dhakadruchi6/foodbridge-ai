import sys
import os
import pandas as pd
import joblib

# Fix path for local imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import model_utils as utils

def predict_urgency(features):
    """
    Input features: [distance, quantity, expiry_hours, food_category, biodegradability_factor]
    """
    model = utils.load_model('ml/priority_model.pkl')
    if model is None:
        # Fallback if model not trained
        return 50.0
        
    df = pd.DataFrame([features], columns=['distance', 'quantity', 'expiry_hours', 'food_category', 'biodegradability_factor'])
    score = model.predict(df)[0]
    return score

if __name__ == "__main__":
    if len(sys.argv) < 6:
        print("Usage: python predict_priority.py <distance> <quantity> <expiry_hours> <food_category> <biodegradability>")
        sys.exit(1)
        
    try:
        features = [float(arg) for arg in sys.argv[1:]]
        score = predict_urgency(features)
        print(f"Urgency Score: {score:.2f}/100")
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)
