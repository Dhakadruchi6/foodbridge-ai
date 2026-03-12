import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.tree import DecisionTreeRegressor
from sklearn.linear_model import LinearRegression
import sys
import os

# Fix path to allow local imports when running as script
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import dataset_generator as dg
import model_utils as utils

def train():
    print("Generating priority dataset...")
    df = dg.generate_dataset(8000)
    
    # Target is now urgency_score instead of match_score
    X = df.drop('urgency_score', axis=1)
    y = df['urgency_score']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    models = {
        'RandomForest': RandomForestRegressor(n_estimators=100, random_state=42),
        'GradientBoosting': GradientBoostingRegressor(random_state=42),
        'DecisionTree': DecisionTreeRegressor(random_state=42),
        'LinearRegression': LinearRegression()
    }
    
    best_rmse = float('inf')
    best_model = None
    best_model_name = ""
    
    print("\nEvaluating Prioritization Models...")
    for name, model in models.items():
        model.fit(X_train, y_train)
        rmse = utils.evaluate_model(model, X_test, y_test)
        print(f"{name} RMSE: {rmse:.4f}")
        
        if rmse < best_rmse:
            best_rmse = rmse
            best_model = model
            best_model_name = name
            
    print(f"\nBest Priority Model: {best_model_name} with RMSE: {best_rmse:.4f}")
    
    # Ensure ml directory exists (though it should)
    os.makedirs('ml', exist_ok=True)
    utils.save_model(best_model, 'ml/priority_model.pkl')
    print("Priority model saved to ml/priority_model.pkl")

if __name__ == "__main__":
    train()
