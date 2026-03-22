export class GatewayController {
  /**
   * GET /health
   * Gateway health check
   */
  health = (req, res) => {
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Gateway is healthy',
      data: {
        service: 'api-gateway',
        status: 'up',
        timestamp: new Date().toISOString(),
      },
    });
  };

  /**
   * GET /
   * Gateway info
   */
  info = (req, res) => {
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'API Gateway',
      data: {
        name: 'E-Commerce API Gateway',
        version: '1.0.0',
        services: {
          users: '/api/users',
          products: '/api/products',
          search: '/api/search',
        },
        timestamp: new Date().toISOString(),
      },
    });
  };
}
