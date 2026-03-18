export const logInfo = (message: string, ...args: unknown[]) => {
  console.log(`[INFO] ${new Date().toISOString()}: ${message}`, ...args);
};

export const logError = (message: string, ...args: unknown[]) => {
  console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, ...args);
};

const logger = {
  logInfo,
  logError,
};

export default logger;
