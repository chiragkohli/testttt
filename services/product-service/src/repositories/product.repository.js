import { Product } from '../models/product.model.js';

export class ProductRepository {
  /**
   * Find product by ID
   * @param {string} id - Product ID
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    return await Product.findById(id);
  }

  /**
   * Find product by SKU
   * @param {string} sku - Product SKU
   * @returns {Promise<Object|null>}
   */
  async findBySku(sku) {
    return await Product.findOne({ sku: sku.toUpperCase() });
  }

  /**
   * Find all products with filtering and pagination
   * @param {Object} filters - Filter parameters
   * @returns {Promise<{products: Array, total: number}>}
   */
  async findAll(filters) {
    const {
      page = 1,
      limit = 20,
      category,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      order = 'desc',
    } = filters;

    const skip = (page - 1) * limit;

    // Build query
    const query = { isActive: true };

    if (category) {
      query.category = category;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.finalPrice = {};
      if (minPrice !== undefined) {
        query.finalPrice.$gte = minPrice;
      }
      if (maxPrice !== undefined) {
        query.finalPrice.$lte = maxPrice;
      }
    }

    // Execute query
    const products = await Product.find(query)
      .sort({ [sortBy]: order === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(query);

    return { products, total };
  }

  /**
   * Create product
   * @param {Object} data - Product data
   * @returns {Promise<Object>}
   */
  async create(data) {
    const product = new Product(data);
    return await product.save();
  }

  /**
   * Update product
   * @param {string} id - Product ID
   * @param {Object} data - Update data
   * @returns {Promise<Object|null>}
   */
  async update(id, data) {
    return await Product.findByIdAndUpdate(id, data, { new: true });
  }

  /**
   * Delete product (soft delete - mark as inactive)
   * @param {string} id - Product ID
   * @returns {Promise<Object|null>}
   */
  async delete(id) {
    return await Product.findByIdAndUpdate(id, { isActive: false }, { new: true });
  }

  /**
   * Check if SKU exists
   * @param {string} sku - Product SKU
   * @returns {Promise<boolean>}
   */
  async skuExists(sku) {
    const count = await Product.countDocuments({ sku: sku.toUpperCase() });
    return count > 0;
  }

  /**
   * Find products by category
   * @param {string} category - Category name
   * @param {number} page - Page number
   * @param {number} limit - Results per page
   * @returns {Promise<{products: Array, total: number}>}
   */
  async findByCategory(category, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const products = await Product.find({ category, isActive: true })
      .skip(skip)
      .limit(limit);
    const total = await Product.countDocuments({ category, isActive: true });

    return { products, total };
  }
}
