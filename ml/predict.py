import sys
import os
import pandas as pd # type: ignore
from typing import List, Optional

# Robust local imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
try:
    import model_utils as utils # type: ignore
except ImportError:
    pass

class SuitabilityPredictor:
    """
    Predicts the suitability score of a donation using the trained Suitability Model.
    """
    
    def __init__(self):
        base_dir = os.path.dirname(os.path.abspath(__file__))
        self.model_path = os.path.join(base_dir, 'best_model.pkl')
        self._model = None

    @property
    def model(self):
        if self._model is None:
            self._model = utils.ModelUtils.load_model(self.model_path)
        return self._model

    def predict(self, features: List[float]) -> float:
        """
        Calculates suitability based on distance, quantity, and perishability.
        
        Args:
            features: [distance, quantity, expiry_hours, ngo_capacity, food_category]
            
        Returns:
            The suitability percentage (0-100).
        """
        if self.model is None:
            print(f"⚠️ Warning: Model not found at {self.model_path}. Using fallback.")
            return 0.0
            
        columns = ['distance', 'quantity', 'expiry_hours', 'ngo_capacity', 'food_category']
        df = pd.DataFrame([features], columns=columns)
        score = self.model.predict(df)[0]
        return float(score)

if __name__ == "__main__":
    if len(sys.argv) < 6:
        print("Usage: python predict.py <distance> <quantity> <expiry_hours> <ngo_capacity> <food_category>")
        sys.exit(1)
        
    try:
        input_args = sys.argv[1:] # type: ignore
        feature_vector = [float(arg) for arg in input_args]
        
        predictor = SuitabilityPredictor()
        score = predictor.predict(feature_vector)
        
        print(f"✅ Suitability Score: {score:.2f}/100")
        
    except Exception as e:
        print(f"❌ Suitability Engine Error: {str(e)}")
        sys.exit(1)
