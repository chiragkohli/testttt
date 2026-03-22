import { connectDatabase, disconnectDatabase } from './config/database.js';
import { initializeKafka, disconnectKafka } from './config/kafka.js';
import { validateEnvironment, getEnv } from './config/environment.js';
import { createLogger } from '@ecommerce/shared';
import app from './app.js';

const logger = createLogger('product-service');
const env = getEnv();

// Validate environment variables
validateEnvironment();

/**
 * Start the Product Service
 */
const startServer = async () => {
  try {
    // Initialize database
    await connectDatabase(env.mongoUri);

    // Initialize Kafka
    const brokers = env.kafkaBroker.split(',');
    await initializeKafka(brokers);

    // Start Express server
    app.listen(env.port, () => {
      logger.info(`Product Service listening on port ${env.port}`);
    });
  } catch (error) {
    logger.error('Failed to start Product Service:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await disconnectDatabase();
  await disconnectKafka();
  process.exit(0);
});

startServer();
