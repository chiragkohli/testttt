/**
 * Request validation middleware
 */

import Joi from 'joi';
import { ValidationError } from '../types/index.js';

/**
 * Validate request body against a Joi schema
 * @param {Joi.Schema} schema - Joi validation schema
 * @returns {Function} Express middleware
 */
export const validateBody = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = {};
    error.details.forEach((detail) => {
      errors[detail.path.join('.')] = detail.message;
    });
    return next(new ValidationError('Validation failed', errors));
  }

  req.body = value;
  next();
};

/**
 * Validate query parameters against a Joi schema
 * @param {Joi.Schema} schema - Joi validation schema
 * @returns {Function} Express middleware
 */
export const validateQuery = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = {};
    error.details.forEach((detail) => {
      errors[detail.path.join('.')] = detail.message;
    });
    return next(new ValidationError('Validation failed', errors));
  }

  req.query = value;
  next();
};

/**
 * Validate URL parameters against a Joi schema
 * @param {Joi.Schema} schema - Joi validation schema
 * @returns {Function} Express middleware
 */
export const validateParams = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.params, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = {};
    error.details.forEach((detail) => {
      errors[detail.path.join('.')] = detail.message;
    });
    return next(new ValidationError('Validation failed', errors));
  }

  req.params = value;
  next();
};
