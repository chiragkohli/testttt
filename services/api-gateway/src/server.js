import { validateEnvironment, getEnv } from './config/environment.js';
import { createLogger } from '@ecommerce/shared';
import app from './app.js';

const logger = createLogger('api-gateway');
const env = getEnv();

// Validate environment variables
validateEnvironment();

/**
 * Start the API Gateway
 */
const startServer = async () => {
  try {
    // Start Express server
    app.listen(env.port, () => {
      logger.info(`API Gateway listening on port ${env.port}`);
      logger.info(`User Service: ${env.userServiceUrl}`);
      logger.info(`Product Service: ${env.productServiceUrl}`);
      logger.info(`Search Service: ${env.searchServiceUrl}`);
    });
  } catch (error) {
    logger.error('Failed to start API Gateway:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

startServer();
