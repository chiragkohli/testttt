import { validateEnvironment, getEnv } from './config/environment.js';
import app from './app.js';

let logger;
try {
  const { createLogger } = await import('@ecommerce/shared');
  logger = createLogger('api-gateway');
} catch (e) {
  console.log('Using fallback logger - shared module not fully initialized');
  logger = {
    info: (msg) => console.log(`[INFO] ${msg}`),
    error: (msg, err) => console.error(`[ERROR] ${msg}`, err),
    warn: (msg) => console.warn(`[WARN] ${msg}`),
  };
}

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
