import { validateEnvironment, getEnv } from './config/environment.js';
import app from './app.js';

let logger;
try {
  const { createLogger } = await import('@ecommerce/shared');
  logger = createLogger('user-service');
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
 * Start the User Service
 */
const startServer = async () => {
  try {
    // Initialize database (non-blocking for now)
    try {
      const { AppDataSource } = await import('./config/database.js');
      if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
        logger.info('Database connected successfully');
      }
    } catch (dbError) {
      logger.warn('Database connection failed, service will continue without DB');
      console.error('DB Error:', dbError.message);
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
  try {
    const { AppDataSource } = await import('./config/database.js');
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  } catch (e) {
    console.log('Database cleanup skipped');
  }
  process.exit(0);
});

startServer();
