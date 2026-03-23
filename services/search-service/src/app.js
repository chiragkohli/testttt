import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const createLogger = (name) => ({ info: console.log, error: console.error, warn: console.warn });
const createHttpLogger = () => (req, res, next) => next();
const errorHandler = () => (err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ success: false, statusCode: 500, message: 'Internal Server Error' });
};

let logger = createLogger('search-service');
let httpLogger = createHttpLogger();
let errorHandlerMiddleware = errorHandler();

try {
  const shared = await import('@ecommerce/shared');
  logger = shared.createLogger('search-service');
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

app.get('/health', (req, res) => {
  res.status(200).json({ success: true, status: 'healthy', service: 'search-service' });
});

app.get('/search', (req, res) => {
  res.status(200).json({ success: true, data: [] });
});

app.use((req, res) => {
  res.status(404).json({ success: false, statusCode: 404, message: 'Not Found' });
});

app.use(errorHandlerMiddleware);

export default app;
