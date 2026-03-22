import { KafkaConsumerService } from '../../../infra/kafka/consumer.js';
import { EventType } from '@ecommerce/shared';
import { getElasticsearchClient } from './elasticsearch.js';

/**
 * Event handler for Kafka messages
 * @param {Object} event - Domain event
 * @returns {Promise<void>}
 */
const indexingHandler = async (event) => {
  const client = getElasticsearchClient();

  try {
    if (event.eventType === EventType.PRODUCT_CREATED) {
      // Index new product
      const product = event.payload;
      await client.index({
        index: 'products',
        id: event.aggregateId,
        body: {
          product_id: event.aggregateId,
          sku: product.sku,
          name: product.name,
          description: product.description,
          category: product.category,
          price: product.price,
          discount_percentage: product.discountPercentage,
          final_price: product.finalPrice,
          stock_quantity: product.stockQuantity,
          images: product.images,
          rating_average: product.ratings?.average || 0,
          is_active: product.isActive,
          created_at: product.createdAt,
          updated_at: product.createdAt,
        },
      });

      console.log(`Product indexed: ${event.aggregateId}`);
    } else if (event.eventType === EventType.PRODUCT_UPDATED) {
      // Update product in index
      const product = event.payload.newProduct;
      await client.update({
        index: 'products',
        id: event.aggregateId,
        body: {
          doc: {
            sku: product.sku,
            name: product.name,
            description: product.description,
            category: product.category,
            price: product.price,
            discount_percentage: product.discountPercentage,
            final_price: product.finalPrice,
            stock_quantity: product.stockQuantity,
            images: product.images,
            is_active: product.isActive,
            updated_at: new Date(),
          },
          doc_as_upsert: true,
        },
      });

      console.log(`Product updated in index: ${event.aggregateId}`);
    } else if (event.eventType === EventType.PRODUCT_DELETED) {
      // Delete product from index
      await client.delete({
        index: 'products',
        id: event.aggregateId,
      });

      console.log(`Product deleted from index: ${event.aggregateId}`);
    }
  } catch (error) {
    console.error(`Failed to handle event: ${event.eventType}`, error);
    throw error;
  }
};

let kafkaConsumer = null;

/**
 * Initialize Kafka consumer
 * @param {string[]} brokers - Kafka broker addresses
 * @param {string} groupId - Consumer group ID
 * @returns {Promise<void>}
 */
export const initializeKafka = async (brokers, groupId) => {
  try {
    kafkaConsumer = new KafkaConsumerService(brokers, groupId);
    await kafkaConsumer.connect();

    // Subscribe to product-events topic
    await kafkaConsumer.subscribe('product-events', indexingHandler, (error) => {
      console.error('Error processing Kafka message:', error);
    });

    console.log('Kafka Consumer initialized');
  } catch (error) {
    console.error('Failed to initialize Kafka:', error);
    throw error;
  }
};

/**
 * Disconnect Kafka consumer
 * @returns {Promise<void>}
 */
export const disconnectKafka = async () => {
  if (kafkaConsumer) {
    await kafkaConsumer.disconnect();
  }
};
