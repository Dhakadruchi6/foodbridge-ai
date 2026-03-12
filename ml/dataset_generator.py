import pandas as pd
import numpy as np

def generate_dataset(num_samples=5000):
    np.random.seed(42)
    
    # 1. distance (0 to 50 km) - used for logistics priority
    distance = np.random.uniform(0.5, 50, num_samples)
    
    # 2. quantity (1 to 100 units)
    quantity = np.random.randint(1, 101, num_samples)
    
    # 3. expiry_hours (1 to 72 hours) - CRITICAL for decay
    expiry_hours = np.random.randint(1, 73, num_samples)
    
    # 4. food_category (0: cooked, 1: raw, 2: packaged)
    # Cooked food has higher perishability
    food_category = np.random.randint(0, 3, num_samples)
    
    # 5. biodegradability_factor (0.1 to 1.0)
    # Higher means it degrades faster (e.g., fresh produce vs. processed)
    biodegradability_factor = np.random.uniform(0.1, 1.0, num_samples)
    
    # Target: urgency_score (0 to 100)
    # Logic: 
    # - Low expiry hours = High Urgency (Weight: 1.5)
    # - Cooked category = High Urgency (0: high, 1: med, 2: low) (Weight: 1.0)
    # - High biodegradability = High Urgency (Weight: 0.8)
    
    raw_score = (
        (72 - expiry_hours) * 1.5 + 
        (2 - food_category) * 20 + 
        (biodegradability_factor * 30)
    )
    
    # Normalize score to 0-100
    urgency_score = (raw_score - raw_score.min()) / (raw_score.max() - raw_score.min()) * 100
    
    df = pd.DataFrame({
        'distance': distance,
        'quantity': quantity,
        'expiry_hours': expiry_hours,
        'food_category': food_category,
        'biodegradability_factor': biodegradability_factor,
        'urgency_score': urgency_score
    })
    
    return df

if __name__ == "__main__":
    df = generate_dataset()
    df.to_csv('ml/priority_dataset.csv', index=False)
    print(f"Generated {len(df)} samples in ml/priority_dataset.csv for Prioritization Engine")
