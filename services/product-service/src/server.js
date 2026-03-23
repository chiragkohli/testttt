import { connectDatabase, disconnectDatabase } from './config/database.js';
import { initializeKafka, disconnectKafka } from './config/kafka.js';
import { validateEnvironment, getEnv } from './config/environment.js';
import app from './app.js';

let logger;
try {
  const { createLogger } = await import('@ecommerce/shared');
  logger = createLogger('product-service');
} catch (e) {
  logger = { info: (msg) => console.log('[INFO]', msg), error: (msg, err) => console.error('[ERR]', msg, err), warn: () => {} };
}

const env = getEnv();
validateEnvironment();

const startServer = async () => {
  try {
    setImmediate(async () => {
      try { await connectDatabase(env.mongoUri); } catch (e) { logger.warn('DB failed'); }
      try { const brokers = env.kafkaBroker.split(','); await initializeKafka(brokers); } catch (e) { logger.warn('Kafka failed'); }
    });

    app.listen(env.port, () => logger.info(Product Service listening on port -Recurse{env.port}));
  } catch (error) {
    logger.error('Failed to start Product Service:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  try { await disconnectDatabase(); } catch (e) {}
  try { await disconnectKafka(); } catch (e) {}
  process.exit(0);
});

startServer();
