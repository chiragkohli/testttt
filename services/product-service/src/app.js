import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  createLogger,
  createHttpLogger,
  errorHandler,
  authenticateToken,
  requireAdmin,
  validateBody,
  validateQuery,
  productCreateSchema,
  productUpdateSchema,
  productListSchema,
} from '@ecommerce/shared';
import { ProductController } from './controllers/product.controller.js';

const app = express();
const logger = createLogger('product-service');

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

// ============ Routes ============

const productController = new ProductController();

// Health check
app.get('/health', (req, res) => productController.health(req, res));

// Product routes
app.post('/products', validateBody(productCreateSchema), authenticateToken, requireAdmin, (req, res) => productController.create(req, res));
app.get('/products/:id', (req, res) => productController.getById(req, res));
app.get('/products', validateQuery(productListSchema), (req, res) => productController.list(req, res));
app.put('/products/:id', validateBody(productUpdateSchema), authenticateToken, requireAdmin, (req, res) => productController.update(req, res));
app.delete('/products/:id', authenticateToken, requireAdmin, (req, res) => productController.delete(req, res));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: 'Not Found',
  });
});

// Error handler
app.use(errorHandler(logger));

export default app;
