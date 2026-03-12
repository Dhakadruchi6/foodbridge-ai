import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import pandas as pd
import model_utils as utils

def predict_suitability(features):
    """
    Input features: [distance, quantity, expiry_hours, ngo_capacity, food_category]
    """
    model = utils.load_model('ml/best_model.pkl')
    if model is None:
        print("Please train the model first by running train_model.py")
        return None
        
    df = pd.DataFrame([features], columns=['distance', 'quantity', 'expiry_hours', 'ngo_capacity', 'food_category'])
    score = model.predict(df)[0]
    return score

if __name__ == "__main__":
    if len(sys.argv) < 6:
        print("Usage: python predict.py <distance> <quantity> <expiry_hours> <ngo_capacity> <food_category>")
        sys.exit(1)
        
    features = [float(arg) for arg in sys.argv[1:]]
    score = predict_suitability(features)
    if score is not None:
        print(f"Suitability Score: {score:.2f}/100")
