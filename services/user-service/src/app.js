import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  createLogger,
  createHttpLogger,
  errorHandler,
  authenticateToken,
  validateBody,
  userSignupSchema,
  userLoginSchema,
} from '@ecommerce/shared';
import { AuthController } from './controllers/auth.controller.js';

const app = express();
const logger = createLogger('user-service');

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

const authController = new AuthController();

// Health check
app.get('/health', authController.health);

// Auth routes
app.post('/signup', validateBody(userSignupSchema), authController.register);
app.post('/login', validateBody(userLoginSchema), authController.login);

// Protected routes
app.get('/profile', authenticateToken, authController.getProfile);
app.put('/profile', authenticateToken, authController.updateProfile);

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
