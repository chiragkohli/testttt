import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createLogger, createHttpLogger, errorHandler } from '@ecommerce/shared';
import { SearchController } from './controllers/search.controller.js';

const app = express();
const logger = createLogger('search-service');

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

const searchController = new SearchController();

// Health check
app.get('/health', (req, res) => searchController.health(req, res));

// Search routes
app.get('/search', (req, res) => searchController.search(req, res));
app.get('/search/autocomplete', (req, res) => searchController.autocomplete(req, res));
app.get('/search/filters', (req, res) => searchController.filters(req, res));

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
