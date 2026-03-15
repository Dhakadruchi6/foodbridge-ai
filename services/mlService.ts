import { exec } from 'child_process';
import path from 'path';

export const getPredictionScore = async (
  distance: number,
  quantity: number,
  expiryHours: number,
  ngoCapacity: number,
  foodCategory: number
): Promise<number> => {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(process.cwd(), 'ml', 'predict.py');
    const command = `python3 ${pythonScript} ${distance} ${quantity} ${expiryHours} ${ngoCapacity} ${foodCategory}`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`ML Service Error: ${error}`);
        return reject(error);
      }

      if (stderr) {
        console.warn(`ML Service Warning: ${stderr}`);
      }

      // Parse output: "✅ Suitability Score: 71.43/100"
      const match = stdout.match(/Suitability Score: ([0-9.]+)\/100/);
      if (match && match[1]) {
        resolve(parseFloat(match[1]));
      } else {
        console.error("Match result parsing failed. Output: ", stdout);
        reject(new Error("Failed to parse ML score"));
      }
    });
  });
};

export const getUrgencyScore = async (
  distance: number,
  quantity: number,
  expiryHours: number,
  foodCategory: number,
  biodegradabilityFactor: number
): Promise<number> => {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(process.cwd(), 'ml', 'predict_priority.py');
    const command = `python3 ${pythonScript} ${distance} ${quantity} ${expiryHours} ${foodCategory} ${biodegradabilityFactor}`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Urgency Service Error: ${error}`);
        return reject(error);
      }

      if (stderr && !stderr.includes('FutureWarning')) {
        console.warn(`Urgency Service Warning: ${stderr}`);
      }

      // Parse output: "🚨 Urgency Score: 71.43/100"
      const match = stdout.match(/Urgency Score: ([0-9.]+)\/100/);
      if (match && match[1]) {
        resolve(parseFloat(match[1]));
      } else {
        console.error("Urgency result parsing failed. Output: ", stdout);
        // Fallback or better error handling
        resolve(50); // Default safe value
      }
    });
  });
};
