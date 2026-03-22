/**
 * Global Error Handler Middleware
 */

import { AppError, ValidationError } from '../types/index.js';

/**
 * Express error handler middleware
 * @param {Object} logger - Winston logger instance
 * @returns {Function} Express error handler middleware
 */
export const errorHandler = (logger) => {
  return (err, req, res, next) => {
    // Log the error
    if (err instanceof AppError) {
      logger.warn('Application Error', {
        statusCode: err.statusCode,
        message: err.message,
        errors: err.errors,
        path: req.path,
        method: req.method,
      });
    } else {
      logger.error('Unexpected Error', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
      });
    }

    // Handle known errors
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        success: false,
        statusCode: err.statusCode,
        message: err.message,
        errors: err.errors,
      });
    }

    // Handle validation errors
    if (err instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Validation Error',
        errors: err.errors,
      });
    }

    // Handle unknown errors
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal Server Error',
      errors: process.env.NODE_ENV === 'development' ? { details: err.message } : undefined,
    });
  };
};

/**
 * Async route handler wrapper for error handling
 * @param {Function} fn - Async route handler function
 * @returns {Function} Express middleware wrapper
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
