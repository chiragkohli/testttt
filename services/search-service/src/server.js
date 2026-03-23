import { initializeElasticsearch, disconnectElasticsearch } from './config/elasticsearch.js';
import { initializeKafka, disconnectKafka } from './config/kafka.js';
import { validateEnvironment, getEnv } from './config/environment.js';
import app from './app.js';

let logger;
try {
  const { createLogger } = await import('@ecommerce/shared');
  logger = createLogger('search-service');
} catch (e) {
  logger = { info: (msg) => console.log('[INFO]', msg), error: (msg, err) => console.error('[ERR]', msg, err), warn: () => {} };
}

const env = getEnv();
validateEnvironment();

const startServer = async () => {
  try {
    setImmediate(async () => {
      try { await initializeElasticsearch(env.elasticsearchUrl); } catch (e) { logger.warn('ES failed'); }
      try { const brokers = env.kafkaBroker.split(','); await initializeKafka(brokers, env.kafkaGroupId); } catch (e) { logger.warn('Kafka failed'); }
    });

    app.listen(env.port, () => logger.info(Search Service listening on port c:\D\E-Commerce\Codebase\backend\services\product-service\src\server.js{env.port}));
  } catch (error) {
    logger.error('Failed to start Search Service:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  try { await disconnectElasticsearch(); } catch (e) {}
  try { await disconnectKafka(); } catch (e) {}
  process.exit(0);
});

startServer();
