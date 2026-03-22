import { asyncHandler } from '@ecommerce/shared';
import { SearchService } from '../services/search.service.js';

export class SearchController {
  constructor() {
    this.searchService = new SearchService();
  }

  /**
   * GET /search
   * Search products
   */
  search = asyncHandler(async (req, res) => {
    const query = {
      q: req.query.q ? req.query.q : undefined,
      category: req.query.category ? req.query.category : undefined,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : undefined,
      page: req.query.page ? parseInt(req.query.page) : 1,
      limit: req.query.limit ? parseInt(req.query.limit) : 20,
      sortBy: req.query.sortBy ? req.query.sortBy : 'created_at',
      order: req.query.order ? req.query.order : 'desc',
    };

    const result = await this.searchService.search(query);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Search completed',
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
   * GET /search/autocomplete
   * Autocomplete suggestions
   */
  autocomplete = asyncHandler(async (req, res) => {
    const { prefix, limit = 10 } = req.query;

    if (!prefix) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Prefix parameter is required',
      });
    }

    const suggestions = await this.searchService.autocomplete(prefix, parseInt(limit) || 10);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Suggestions retrieved',
      data: {
        suggestions,
      },
    });
  });

  /**
   * GET /search/filters
   * Get available filters
   */
  filters = asyncHandler(async (req, res) => {
    const categories = await this.searchService.getCategories();
    const priceRange = await this.searchService.getPriceRange();

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Filters retrieved',
      data: {
        categories,
        priceRange,
      },
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
      message: 'Search service is healthy',
      data: {
        service: 'search-service',
        status: 'up',
        timestamp: new Date().toISOString(),
      },
    });
  };
}
