import { initializeElasticsearch, disconnectElasticsearch } from './config/elasticsearch.js';
import { initializeKafka, disconnectKafka } from './config/kafka.js';
import { validateEnvironment, getEnv } from './config/environment.js';
import { createLogger } from '@ecommerce/shared';
import app from './app.js';

const logger = createLogger('search-service');
const env = getEnv();

// Validate environment variables
validateEnvironment();

/**
 * Start the Search Service
 */
const startServer = async () => {
  try {
    // Initialize Elasticsearch
    await initializeElasticsearch(env.elasticsearchUrl);

    // Initialize Kafka consumer
    const brokers = env.kafkaBroker.split(',');
    await initializeKafka(brokers, env.kafkaGroupId);

    // Start Express server
    app.listen(env.port, () => {
      logger.info(`Search Service listening on port ${env.port}`);
    });
  } catch (error) {
    logger.error('Failed to start Search Service:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await disconnectElasticsearch();
  await disconnectKafka();
  process.exit(0);
});

startServer();
