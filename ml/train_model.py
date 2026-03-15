import pandas as pd # type: ignore
from sklearn.model_selection import train_test_split # type: ignore
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor # type: ignore
from sklearn.tree import DecisionTreeRegressor # type: ignore
from sklearn.linear_model import LinearRegression # type: ignore
import sys
import os

# Robust local imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
try:
    import dataset_generator as dg # type: ignore
    import model_utils as utils # type: ignore
except ImportError:
    pass

class ModelTrainer:
    """
    Orchestrates the training and evaluation of ML models for the FoodBridge platform.
    """
    
    def __init__(self):
        self.models = {
            'RandomForest': RandomForestRegressor(n_estimators=100, random_state=42),
            'GradientBoosting': GradientBoostingRegressor(random_state=42),
            'DecisionTree': DecisionTreeRegressor(random_state=42),
            'LinearRegression': LinearRegression()
        }
        self.best_model = None
        self.best_model_name = ""
        self.best_rmse = float('inf')

    def execute_training_pipeline(self):
        """
        Runs the full training workflow: generation, split, training, and evaluation.
        """
        print("🚀 Initiating Prioritization Model Training...")
        
        # 1. Data Acquisition
        df = dg.DatasetGenerator.generate_priority_data(8000)
        
        X = df.drop('urgency_score', axis=1)
        y = df['urgency_score']
        
        # 2. Data Segmentation
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # 3. Model Evaluation Loop
        print("\n📊 Evaluating Candidate Architectures...")
        for name, model in self.models.items():
            model.fit(X_train, y_train)
            rmse = utils.ModelUtils.evaluate_model(model, X_test, y_test)
            print(f"  • {name:16} | RMSE: {rmse:.4f}")
            
            if rmse < self.best_rmse:
                self.best_rmse = rmse
                self.best_model = model
                self.best_model_name = name
        
        self._save_optimized_model()

    def _save_optimized_model(self):
        """Saves the highest performing model to the filesystem."""
        if not self.best_model:
            return
            
        print(f"\n🏆 Champion Model: {self.best_model_name} (RMSE: {self.best_rmse:.4f})")
        
        base_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(base_dir, 'priority_model.pkl')
        
        utils.ModelUtils.save_model(self.best_model, model_path)
        print(f"💾 Model Persisted to: {model_path}")

if __name__ == "__main__":
    trainer = ModelTrainer()
    trainer.execute_training_pipeline()
