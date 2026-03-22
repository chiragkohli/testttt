import { asyncHandler } from '@ecommerce/shared';
import { ProductService } from '../services/product.service.js';

export class ProductController {
  constructor() {
    this.productService = new ProductService();
  }

  /**
   * POST /products
   * Create a new product (admin only)
   */
  create = asyncHandler(async (req, res) => {
    const data = req.body;
    const product = await this.productService.createProduct(data);

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Product created successfully',
      data: product,
    });
  });

  /**
   * GET /products/:id
   * Get product by ID
   */
  getById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const product = await this.productService.getProduct(id);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Product retrieved',
      data: product,
    });
  });

  /**
   * GET /products
   * List all products with filters
   */
  list = asyncHandler(async (req, res) => {
    const filters = {
      page: req.query.page ? parseInt(req.query.page) : 1,
      limit: req.query.limit ? parseInt(req.query.limit) : 20,
      category: req.query.category,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : undefined,
      sortBy: req.query.sortBy,
      order: req.query.order,
    };

    const result = await this.productService.listProducts(filters);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Products listed',
      data: {
        products: result.products,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      },
    });
  });

  /**
   * PUT /products/:id
   * Update product (admin only)
   */
  update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = req.body;

    const product = await this.productService.updateProduct(id, data);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Product updated successfully',
      data: product,
    });
  });

  /**
   * DELETE /products/:id
   * Delete product (admin only)
   */
  delete = asyncHandler(async (req, res) => {
    const { id } = req.params;

    await this.productService.deleteProduct(id);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Product deleted successfully',
    });
  });

  /**
   * GET /health
   * Health check endpoint
   */
  health = (req, res) => {
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Product service is healthy',
      data: {
        service: 'product-service',
        status: 'up',
        timestamp: new Date().toISOString(),
      },
    });
  };
}
