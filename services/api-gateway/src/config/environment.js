/**
 * Validate required environment variables
 * @returns {void}
 */
export const validateEnvironment = () => {
  const required = [
    'USER_SERVICE_URL',
    'PRODUCT_SERVICE_URL',
    'SEARCH_SERVICE_URL',
    'JWT_SECRET',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.warn(`Missing environment variables: ${missing.join(', ')}`);
  }
};

/**
 * Get environment configuration
 * @returns {Object}
 */
export const getEnv = () => ({
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  userServiceUrl: process.env.USER_SERVICE_URL || 'http://localhost:3001',
  productServiceUrl: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002',
  searchServiceUrl: process.env.SEARCH_SERVICE_URL || 'http://localhost:3003',
  jwtSecret: process.env.JWT_SECRET || 'your-very-secret-key-change-in-production',
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  logLevel: process.env.LOG_LEVEL || 'info',
});
