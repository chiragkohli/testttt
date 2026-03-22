import { v4 as uuidv4 } from 'uuid';
import { EventType, NotFoundError, ConflictError } from '@ecommerce/shared';
import { ProductRepository } from '../repositories/product.repository.js';
import { getKafkaProducer } from '../config/kafka.js';

export class ProductService {
  constructor() {
    this.productRepository = new ProductRepository();
    this.kafkaTopic = 'product-events';
  }

  /**
   * Create a new product
   * @param {Object} data - Product creation data
   * @returns {Promise<Object>}
   */
  async createProduct(data) {
    // Check if SKU already exists
    const existingSku = await this.productRepository.findBySku(data.sku);
    if (existingSku) {
      throw new ConflictError('Product with this SKU already exists');
    }

    // Calculate final price
    const discount = (data.price * (data.discountPercentage || 0)) / 100;
    const finalPrice = data.price - discount;

    // Create product
    const product = await this.productRepository.create({
      ...data,
      finalPrice,
      isActive: true,
    });

    // Publish event
    const event = {
      eventId: uuidv4(),
      eventType: EventType.PRODUCT_CREATED,
      aggregateId: product._id.toString(),
      aggregateType: 'Product',
      timestamp: new Date(),
      version: 1,
      payload: {
        id: product._id.toString(),
        sku: product.sku,
        name: product.name,
        description: product.description,
        category: product.category,
        price: product.price,
        discountPercentage: product.discountPercentage,
        finalPrice: product.finalPrice,
        stockQuantity: product.stockQuantity,
        images: product.images,
        attributes: product.attributes,
        isActive: product.isActive,
        createdAt: product.createdAt,
      },
    };

    try {
      const kafka = getKafkaProducer();
      await kafka.publishEvent(this.kafkaTopic, event);
    } catch (error) {
      console.warn('Failed to publish product.created event:', error);
      // Don't fail the request if event publishing fails
    }

    return product;
  }

  /**
   * Get product by ID
   * @param {string} id - Product ID
   * @returns {Promise<Object>}
   */
  async getProduct(id) {
    const product = await this.productRepository.findById(id);

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    return product;
  }

  /**
   * List all products with filters
   * @param {Object} filters - Filter parameters
   * @returns {Promise<{products: Array, total: number, page: number, limit: number, totalPages: number}>}
   */
  async listProducts(filters) {
    const { products, total } = await this.productRepository.findAll(filters);

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const totalPages = Math.ceil(total / limit);

    return { products, total, page, limit, totalPages };
  }

  /**
   * Update product
   * @param {string} id - Product ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>}
   */
  async updateProduct(id, data) {
    const product = await this.getProduct(id);

    // Calculate new final price if price or discount changed
    let updateData = { ...data };
    if (data.price !== undefined || data.discountPercentage !== undefined) {
      const price = data.price ?? product.price;
      const discount = (price * (data.discountPercentage ?? product.discountPercentage ?? 0)) / 100;
      updateData.finalPrice = price - discount;
    }

    const updated = await this.productRepository.update(id, updateData);

    if (!updated) {
      throw new NotFoundError('Failed to update product');
    }

    // Publish event
    const event = {
      eventId: uuidv4(),
      eventType: EventType.PRODUCT_UPDATED,
      aggregateId: id,
      aggregateType: 'Product',
      timestamp: new Date(),
      version: 2,
      payload: {
        id,
        updatedFields: updateData,
        newProduct: updated,
      },
    };

    try {
      const kafka = getKafkaProducer();
      await kafka.publishEvent(this.kafkaTopic, event);
    } catch (error) {
      console.warn('Failed to publish product.updated event:', error);
    }

    return updated;
  }

  /**
   * Delete product
   * @param {string} id - Product ID
   * @returns {Promise<void>}
   */
  async deleteProduct(id) {
    const product = await this.getProduct(id);

    await this.productRepository.delete(id);

    // Publish event
    const event = {
      eventId: uuidv4(),
      eventType: EventType.PRODUCT_DELETED,
      aggregateId: id,
      aggregateType: 'Product',
      timestamp: new Date(),
      version: 3,
      payload: { id },
    };

    try {
      const kafka = getKafkaProducer();
      await kafka.publishEvent(this.kafkaTopic, event);
    } catch (error) {
      console.warn('Failed to publish product.deleted event:', error);
    }
  }
}
