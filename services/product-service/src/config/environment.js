/**
 * Validate required environment variables
 * @returns {void}
 */
export const validateEnvironment = () => {
  const required = ['MONGO_URI', 'KAFKA_BROKER', 'KAFKA_CLIENT_ID'];

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
  port: parseInt(process.env.PORT || '3002'),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce_products',
  kafkaBroker: process.env.KAFKA_BROKER || 'localhost:9092',
  kafkaClientId: process.env.KAFKA_CLIENT_ID || 'product-service',
  logLevel: process.env.LOG_LEVEL || 'info',
});
