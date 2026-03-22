import { KafkaProducerService } from '../../../infra/kafka/producer.js';

let kafkaProducer = null;

/**
 * Initialize Kafka producer
 * @param {string[]} brokers - Kafka broker addresses
 * @returns {Promise<KafkaProducerService>}
 */
export const initializeKafka = async (brokers) => {
  try {
    kafkaProducer = new KafkaProducerService(brokers);
    await kafkaProducer.connect();
    console.log('Kafka Producer initialized');
    return kafkaProducer;
  } catch (error) {
    console.error('Failed to initialize Kafka:', error);
    throw error;
  }
};

/**
 * Get Kafka producer instance
 * @returns {KafkaProducerService}
 */
export const getKafkaProducer = () => {
  if (!kafkaProducer) {
    throw new Error('Kafka Producer not initialized');
  }
  return kafkaProducer;
};

/**
 * Disconnect Kafka producer
 * @returns {Promise<void>}
 */
export const disconnectKafka = async () => {
  if (kafkaProducer) {
    await kafkaProducer.disconnect();
  }
};
