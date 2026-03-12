export const logInfo = (message: string, ...args: any[]) => {
  console.log(`[INFO] ${new Date().toISOString()}: ${message}`, ...args);
};

export const logError = (message: string, ...args: any[]) => {
  console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, ...args);
};

export default {
  logInfo,
  logError,
};
