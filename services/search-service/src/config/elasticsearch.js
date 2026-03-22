import { Client } from '@elastic/elasticsearch';

let esClient = null;

/**
 * Initialize Elasticsearch client
 * @param {string} url - Elasticsearch URL
 * @returns {Promise<Client>}
 */
export const initializeElasticsearch = async (url) => {
  try {
    esClient = new Client({ node: url });

    // Test connection
    await esClient.info();
    console.log('Elasticsearch connected successfully');

    // Initialize index with mapping
    await createProductIndex(esClient);

    return esClient;
  } catch (error) {
    console.error('Elasticsearch initialization failed:', error);
    throw error;
  }
};

/**
 * Get Elasticsearch client instance
 * @returns {Client}
 */
export const getElasticsearchClient = () => {
  if (!esClient) {
    throw new Error('Elasticsearch client not initialized');
  }
  return esClient;
};

/**
 * Disconnect Elasticsearch client
 * @returns {Promise<void>}
 */
export const disconnectElasticsearch = async () => {
  if (esClient) {
    await esClient.close();
    console.log('Elasticsearch disconnected');
  }
};

/**
 * Create product index with mappings
 * @param {Client} client - Elasticsearch client
 * @returns {Promise<void>}
 */
const createProductIndex = async (client) => {
  const indexName = 'products';

  try {
    // Check if index exists
    const exists = await client.indices.exists({ index: indexName });

    if (!exists) {
      await client.indices.create({
        index: indexName,
        body: {
          settings: {
            number_of_shards: 1,
            number_of_replicas: 0,
            analysis: {
              analyzer: {
                text_analyzer: {
                  type: 'standard',
                  stopwords: '_english_',
                },
              },
            },
          },
          mappings: {
            properties: {
              product_id: {
                type: 'keyword',
              },
              sku: {
                type: 'keyword',
              },
              name: {
                type: 'text',
                analyzer: 'text_analyzer',
                fields: {
                  keyword: {
                    type: 'keyword',
                  },
                },
              },
              description: {
                type: 'text',
                analyzer: 'text_analyzer',
              },
              category: {
                type: 'keyword',
              },
              price: {
                type: 'float',
              },
              discount_percentage: {
                type: 'float',
              },
              final_price: {
                type: 'float',
              },
              stock_quantity: {
                type: 'integer',
              },
              images: {
                type: 'keyword',
              },
              rating_average: {
                type: 'float',
              },
              is_active: {
                type: 'boolean',
              },
              created_at: {
                type: 'date',
              },
              updated_at: {
                type: 'date',
              },
            },
          },
        },
      });

      console.log('Product index created successfully');
    }
  } catch (error) {
    console.error('Failed to create product index:', error);
    throw error;
  }
};
