import { AppDataSource } from './config/database.js';
import { validateEnvironment, getEnv } from './config/environment.js';
import { createLogger } from '@ecommerce/shared';
import app from './app.js';

const logger = createLogger('user-service');
const env = getEnv();

// Validate environment variables
validateEnvironment();

/**
 * Start the User Service
 */
const startServer = async () => {
  try {
    // Initialize database
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      logger.info('Database connected successfully');
    }

    // Start Express server
    app.listen(env.port, () => {
      logger.info(`User Service listening on port ${env.port}`);
    });
  } catch (error) {
    logger.error('Failed to start User Service:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  process.exit(0);
});

startServer();
