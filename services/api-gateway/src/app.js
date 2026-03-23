import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { v4 as uuidv4 } from 'uuid';

const createLogger = (name) => ({ info: console.log, error: console.error, warn: console.warn });
const createHttpLogger = () => (req, res, next) => next();
const errorHandler = () => (err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ success: false, statusCode: 500, message: 'Internal Server Error' });
};

let logger = createLogger('api-gateway');
let httpLogger = createHttpLogger();
let errorHandlerMiddleware = errorHandler();

try {
  const shared = await import('@ecommerce/shared');
  logger = shared.createLogger('api-gateway');
  httpLogger = shared.createHttpLogger(logger);
  errorHandlerMiddleware = shared.errorHandler(logger);
} catch (e) {
  console.log('Warning: Could not load shared module, using fallbacks');
}

const app = express();

app.use((req, res, next) => {
  req.requestId = uuidv4();
  next();
});

app.use(express.json());
app.use(httpLogger);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, status: 'healthy', service: 'api-gateway' });
});

// Info endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'API Gateway',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Proxy configuration
const proxyErrorHandler = (err, req, res) => {
  logger.warn('Proxy error: ' + err.message);
  res.status(503).json({ success: false, statusCode: 503, message: 'Service temporarily unavailable' });
};

// User Service proxy
app.use('/api/users', createProxyMiddleware({
  target: 'http://user-service:3001',
  changeOrigin: true,
  onError: proxyErrorHandler,
  pathRewrite: { '^/api/users': '' }
}));

// Product Service proxy
app.use('/api/products', createProxyMiddleware({
  target: 'http://product-service:3002',
  changeOrigin: true,
  onError: proxyErrorHandler,
  pathRewrite: { '^/api/products': '' }
}));

// Search Service proxy
app.use('/api/search', createProxyMiddleware({
  target: 'http://search-service:3003',
  changeOrigin: true,
  onError: proxyErrorHandler,
  pathRewrite: { '^/api/search': '' }
}));

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, statusCode: 404, message: 'Not Found' });
});

app.use(errorHandlerMiddleware);

export default app;
