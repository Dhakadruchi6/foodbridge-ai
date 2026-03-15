import sys
import os
import pandas as pd # type: ignore
import joblib # type: ignore
from typing import List, Optional

# Robust local imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
try:
    import model_utils as utils # type: ignore
except ImportError:
    pass

class UrgencyPredictor:
    """
    Predicts the urgency score of a donation batch using the trained Priority Model.
    """
    
    def __init__(self):
        base_dir = os.path.dirname(os.path.abspath(__file__))
        self.model_path = os.path.join(base_dir, 'priority_model.pkl')
        self._model = None

    @property
    def model(self):
        if self._model is None:
            self._model = utils.ModelUtils.load_model(self.model_path)
        return self._model

    def predict(self, features: List[float]) -> float:
        """
        Runs a prediction on the provided feature vector.
        
        Args:
            features: [distance, quantity, expiry_hours, food_category, biodegradability]
            
        Returns:
            The predicted urgency score (0-100).
        """
        if self.model is None:
            # Fallback for uninitialized systems
            return 50.0
            
        columns = ['distance', 'quantity', 'expiry_hours', 'food_category', 'biodegradability_factor']
        df = pd.DataFrame([features], columns=columns)
        score = self.model.predict(df)[0]
        return float(score)

if __name__ == "__main__":
    if len(sys.argv) < 6:
        print("Usage: python predict_priority.py <distance> <quantity> <expiry_hours> <food_category> <biodegradability>")
        sys.exit(1)
        
    try:
        # Perform explicit conversion with type-clear logic
        input_args = sys.argv[1:] # type: ignore
        feature_vector = [float(arg) for arg in input_args]
        
        predictor = UrgencyPredictor()
        urgency = predictor.predict(feature_vector)
        
        print(f"🚨 Urgency Score: {urgency:.2f}/100")
        
    except Exception as e:
        print(f"❌ Prediction Engine Error: {str(e)}")
        sys.exit(1)
