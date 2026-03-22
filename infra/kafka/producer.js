/**
 * Kafka Producer Helper
 * Used by Product Service to publish events
 */

import { Kafka, logLevel } from 'kafkajs';

export class KafkaProducerService {
  constructor(brokers) {
    this.producer = null;
    this.kafka = new Kafka({
      clientId: 'ecommerce-producer',
      brokers,
      logLevel: logLevel.ERROR,
      connectionTimeout: 10000,
      requestTimeout: 30000,
    });
  }

  /**
   * Connect to Kafka
   */
  async connect() {
    this.producer = this.kafka.producer({
      retry: {
        initialRetryTime: 300,
        retries: 8,
      },
    });

    await this.producer.connect();
    console.log('Kafka Producer connected');
  }

  /**
   * Disconnect from Kafka
   */
  async disconnect() {
    if (this.producer) {
      await this.producer.disconnect();
      console.log('Kafka Producer disconnected');
    }
  }

  /**
   * Publish an event to Kafka
   * @param {string} topic - Kafka topic name
   * @param {Object} event - Domain event to publish
   */
  async publishEvent(topic, event) {
    if (!this.producer) {
      throw new Error('Producer not connected');
    }

    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key: event.aggregateId,
            value: JSON.stringify(event),
            timestamp: Date.now().toString(),
          },
        ],
      });

      console.log(`Event published: ${topic} - ${event.eventType}`);
    } catch (error) {
      console.error('Failed to publish event:', error);
      throw error;
    }
  }

  /**
   * Publish multiple events in batch
   * @param {string} topic - Kafka topic name
   * @param {Array} events - Array of domain events
   */
  async publishBatch(topic, events) {
    if (!this.producer) {
      throw new Error('Producer not connected');
    }

    try {
      await this.producer.send({
        topic,
        messages: events.map((event) => ({
          key: event.aggregateId,
          value: JSON.stringify(event),
          timestamp: Date.now().toString(),
        })),
      });

      console.log(`${events.length} events published to ${topic}`);
    } catch (error) {
      console.error('Failed to publish batch:', error);
      throw error;
    }
  }
}
