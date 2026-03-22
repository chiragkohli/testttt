/**
 * Validate required environment variables
 * @returns {void}
 */
export const validateEnvironment = () => {
  const required = ['ELASTICSEARCH_URL', 'KAFKA_BROKER', 'KAFKA_GROUP_ID'];

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
  port: parseInt(process.env.PORT || '3003'),
  nodeEnv: process.env.NODE_ENV || 'development',
  elasticsearchUrl: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  kafkaBroker: process.env.KAFKA_BROKER || 'localhost:9092',
  kafkaGroupId: process.env.KAFKA_GROUP_ID || 'search-index-consumer',
  logLevel: process.env.LOG_LEVEL || 'info',
});
