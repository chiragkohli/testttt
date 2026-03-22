/**
 * Validate required environment variables
 */
export const validateEnvironment = () => {
  const required = [
    'DB_HOST',
    'DB_PORT',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
    'JWT_SECRET',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.warn(`Missing environment variables: ${missing.join(', ')}`);
  }
};

/**
 * Get environment configuration
 * @returns {Object} Configuration object
 */
export const getEnv = () => ({
  port: parseInt(process.env.PORT || '3001'),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'your-very-secret-key-change-in-production',
  logLevel: process.env.LOG_LEVEL || 'info',
});
