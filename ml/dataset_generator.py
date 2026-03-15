import pandas as pd # type: ignore
import numpy as np # type: ignore
import os

class DatasetGenerator:
    """
    Handles generation of synthetic datasets for the FoodBridge Prioritization Engine.
    """
    
    @staticmethod
    def generate_priority_data(num_samples: int = 5000) -> pd.DataFrame:
        """
        Generates a synthetic dataset for training the urgency prioritization model.
        
        Args:
            num_samples: The number of data rows to simulate.
            
        Returns:
            A pandas DataFrame containing features and the target urgency score.
        """
        np.random.seed(42)
        
        # Feature Generation
        distance = np.random.uniform(0.5, 50, num_samples)
        quantity = np.random.randint(1, 101, num_samples)
        expiry_hours = np.random.randint(1, 73, num_samples)
        food_category = np.random.randint(0, 3, num_samples)
        biodegradability = np.random.uniform(0.1, 1.0, num_samples)
        
        # Urgency Logic Analysis
        # - Low expiry = High Urgency
        # - Cooked category (0) = Highest Urgency
        # - High biodegradability = High Urgency
        raw_score = (
            (72 - expiry_hours) * 1.5 + 
            (2 - food_category) * 20 + 
            (biodegradability * 30)
        )
        
        # Normalize to clear 0-100 scale
        urgency_score = (raw_score - np.min(raw_score)) / (np.max(raw_score) - np.min(raw_score)) * 100 # type: ignore
        
        return pd.DataFrame({
            'distance': distance,
            'quantity': quantity,
            'expiry_hours': expiry_hours,
            'food_category': food_category,
            'biodegradability_factor': biodegradability,
            'urgency_score': urgency_score
        })

if __name__ == "__main__":
    generator = DatasetGenerator()
    data = generator.generate_priority_data()
    
    # Save using robust absolute pathing
    save_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'priority_dataset.csv')
    data.to_csv(save_path, index=False)
    
    print(f"✨ Successfully generated {len(data)} samples for Prioritization Engine")
    print(f"📍 Location: {save_path}")
