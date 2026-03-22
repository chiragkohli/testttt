/**
 * Kafka Consumer Helper
 * Used by Search Service to consume product events
 */

import { Kafka, logLevel } from 'kafkajs';

export class KafkaConsumerService {
  constructor(brokers, groupId) {
    this.consumer = null;
    this.kafka = new Kafka({
      clientId: `ecommerce-consumer-${groupId}`,
      brokers,
      logLevel: logLevel.ERROR,
      connectionTimeout: 10000,
      requestTimeout: 30000,
    });

    this.consumer = this.kafka.consumer({
      groupId,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
    });
  }

  /**
   * Connect to Kafka
   */
  async connect() {
    if (this.consumer) {
      await this.consumer.connect();
      console.log(`Kafka Consumer connected (group: ${this.consumer.groupId})`);
    }
  }

  /**
   * Subscribe and listen to topic
   * @param {string} topic - Topic to subscribe to
   * @param {Function} messageHandler - Handler for messages
   * @param {Function} onError - Error callback
   */
  async subscribe(topic, messageHandler, onError) {
    if (!this.consumer) {
      throw new Error('Consumer not connected');
    }

    await this.consumer.subscribe({ topic, fromBeginning: false });

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          if (message.value) {
            const event = JSON.parse(message.value.toString());
            await messageHandler(event);
          }
        } catch (error) {
          console.error(`Error processing message from ${topic}:`, error);
          if (onError) {
            onError(error);
          }
          // Continue processing instead of crashing
        }
      },
    });

    console.log(`Consumer listening on topic: ${topic}`);
  }

  /**
   * Disconnect from Kafka
   */
  async disconnect() {
    if (this.consumer) {
      await this.consumer.disconnect();
      console.log('Kafka Consumer disconnected');
    }
  }
}
