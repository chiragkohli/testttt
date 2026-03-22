import { getElasticsearchClient } from '../config/elasticsearch.js';

export class SearchService {
  constructor() {
    this.indexName = 'products';
  }

  /**
   * Search products by query and filters
   * @param {Object} query - Search query parameters
   * @returns {Promise<{products: Array, total: number, page: number, limit: number, totalPages: number}>}
   */
  async search(query) {
    const client = getElasticsearchClient();

    const { q, category, minPrice, maxPrice, page = 1, limit = 20, sortBy = 'created_at', order = 'desc' } = query;

    const skip = (page - 1) * limit;

    // Build Elasticsearch query
    const filters = [];

    if (category) {
      filters.push({ term: { category } });
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceFilter = { range: { final_price: {} } };
      if (minPrice !== undefined) {
        priceFilter.range.final_price.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        priceFilter.range.final_price.lte = maxPrice;
      }
      filters.push(priceFilter);
    }

    filters.push({ term: { is_active: true } });

    const esQuery = {
      bool: {
        must: q ? [{ multi_match: { query: q, fields: ['name^2', 'description', 'category'] } }] : [],
        filter: filters,
      },
    };

    const response = await client.search({
      index: this.indexName,
      body: {
        query: esQuery,
        sort: [{ [sortBy]: order }],
        from: skip,
        size: limit,
      },
    });

    const total = typeof response.hits.total === 'number' ? response.hits.total : response.hits.total?.value || 0;
    const products = response.hits.hits.map((hit) => ({
      _id: hit._id,
      id: hit._id,
      ...hit._source,
    }));

    const totalPages = Math.ceil(total / limit);

    return { products, total, page, limit, totalPages };
  }

  /**
   * Autocomplete search
   * @param {string} prefix - Search prefix
   * @param {number} limit - Maximum results
   * @returns {Promise<string[]>}
   */
  async autocomplete(prefix, limit = 10) {
    const client = getElasticsearchClient();

    const response = await client.search({
      index: this.indexName,
      body: {
        query: {
          bool: {
            must: [
              {
                match_phrase_prefix: {
                  name: {
                    query: prefix,
                  },
                },
              },
            ],
            filter: [{ term: { is_active: true } }],
          },
        },
        _source: ['name'],
        size: limit,
      },
    });

    const suggestions = Array.from(
      new Set(response.hits.hits.map((hit) => hit._source.name))
    );

    return suggestions;
  }

  /**
   * Get available categories
   * @returns {Promise<string[]>}
   */
  async getCategories() {
    const client = getElasticsearchClient();

    const response = await client.search({
      index: this.indexName,
      body: {
        aggs: {
          categories: {
            terms: {
              field: 'category',
              size: 100,
            },
          },
        },
        size: 0,
      },
    });

    const buckets = response.aggregations?.categories?.buckets || [];
    const categories = buckets.map((bucket) => bucket.key);

    return categories;
  }

  /**
   * Get price range
   * @returns {Promise<{min: number, max: number}>}
   */
  async getPriceRange() {
    const client = getElasticsearchClient();

    const response = await client.search({
      index: this.indexName,
      body: {
        aggs: {
          min_price: {
            min: {
              field: 'final_price',
            },
          },
          max_price: {
            max: {
              field: 'final_price',
            },
          },
        },
        size: 0,
      },
    });

    const minPrice = response.aggregations?.min_price?.value || 0;
    const maxPrice = response.aggregations?.max_price?.value || 0;

    return { min: minPrice, max: maxPrice };
  }
}
