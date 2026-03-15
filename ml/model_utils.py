import joblib # type: ignore
import numpy as np # type: ignore
from sklearn.metrics import mean_squared_error # type: ignore
from typing import Optional, Any

class ModelUtils:
    """
    Utility suite for model persistence and evaluation.
    """
    
    @staticmethod
    def save_model(model: Any, filepath: str) -> None:
        """Serializes a model to the specified filepath."""
        joblib.dump(model, filepath)

    @staticmethod
    def load_model(filepath: str) -> Optional[Any]:
        """Deserializes a model from the specified filepath."""
        try:
            return joblib.load(filepath)
        except (FileNotFoundError, Exception):
            return None

    @staticmethod
    def evaluate_model(model: Any, X_test: Any, y_test: Any) -> float:
        """Calculates the Root Mean Squared Error for a model."""
        predictions = model.predict(X_test)
        rmse = np.sqrt(mean_squared_error(y_test, predictions))
        return float(rmse)
