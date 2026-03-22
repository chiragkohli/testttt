import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { v4 as uuidv4 } from 'uuid';
import { createLogger, createHttpLogger, errorHandler, authenticateToken } from '@ecommerce/shared';
import { createRateLimiter } from './config/rateLimit.js';
import { getEnv, validateEnvironment } from './config/environment.js';
import { GatewayController } from './controllers/gateway.controller.js';

const app = express();
const logger = createLogger('api-gateway');
const env = getEnv();

validateEnvironment();

// ============ Middleware ============

// Add request ID for tracing
app.use((req, res, next) => {
  req.requestId = uuidv4();
  next();
});

// Body parser
app.use(express.json());

// HTTP logging
app.use(createHttpLogger(logger));

// Rate limiting
app.use(createRateLimiter(env.rateLimitWindowMs, env.rateLimitMaxRequests));

// ============ Routes ============

const gatewayController = new GatewayController();

// Gateway routes
app.get('/', (req, res) => gatewayController.info(req, res));
app.get('/health', (req, res) => gatewayController.health(req, res));

// ============ Proxy Routes ============

/**
 * User Service Routes
 * POST /api/users/signup - public
 * POST /api/users/login - public
 * GET /api/users/profile - protected
 * PUT /api/users/profile - protected
 */
app.use(
  '/api/users/signup',
  createProxyMiddleware({
    target: env.userServiceUrl,
    changeOrigin: true,
    pathRewrite: {
      '^/api/users': '',
    },
    onError: (err, req, res) => {
      logger.error('User Service proxy error:', err);
      res.status(503).json({
        success: false,
        statusCode: 503,
        message: 'User service unavailable',
      });
    },
  })
);

app.use(
  '/api/users/login',
  createProxyMiddleware({
    target: env.userServiceUrl,
    changeOrigin: true,
    pathRewrite: {
      '^/api/users': '',
    },
    onError: (err, req, res) => {
      logger.error('User Service proxy error:', err);
      res.status(503).json({
        success: false,
        statusCode: 503,
        message: 'User service unavailable',
      });
    },
  })
);

app.use(
  '/api/users/profile',
  authenticateToken,
  createProxyMiddleware({
    target: env.userServiceUrl,
    changeOrigin: true,
    pathRewrite: {
      '^/api/users': '',
    },
    onError: (err, req, res) => {
      logger.error('User Service proxy error:', err);
      res.status(503).json({
        success: false,
        statusCode: 503,
        message: 'User service unavailable',
      });
    },
  })
);

/**
 * Product Service Routes
 * All routes proxied with auth validation
 */
app.use(
  '/api/products',
  createProxyMiddleware({
    target: env.productServiceUrl,
    changeOrigin: true,
    pathRewrite: {
      '^/api': '',
    },
    onError: (err, req, res) => {
      logger.error('Product Service proxy error:', err);
      res.status(503).json({
        success: false,
        statusCode: 503,
        message: 'Product service unavailable',
      });
    },
  })
);

/**
 * Search Service Routes
 * All routes proxied
 */
app.use(
  '/api/search',
  createProxyMiddleware({
    target: env.searchServiceUrl,
    changeOrigin: true,
    pathRewrite: {
      '^/api': '',
    },
    onError: (err, req, res) => {
      logger.error('Search Service proxy error:', err);
      res.status(503).json({
        success: false,
        statusCode: 503,
        message: 'Search service unavailable',
      });
    },
  })
);

// ============ 404 Handler ============

app.use((req, res) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: 'Endpoint not found',
    data: {
      path: req.path,
      method: req.method,
    },
  });
});

// ============ Error Handler ============

app.use(errorHandler(logger));

export default app;
