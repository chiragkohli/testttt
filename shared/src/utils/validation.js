/**
 * Validation schemas using Joi
 */

import Joi from 'joi';

// ============ User Validation Schemas ============
export const userSignupSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
});

export const userLoginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const userProfileUpdateSchema = Joi.object({
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
  username: Joi.string().alphanum().min(3).max(30).optional(),
});

// ============ Product Validation Schemas ============
export const productCreateSchema = Joi.object({
  sku: Joi.string().alphanum().required(),
  name: Joi.string().min(3).max(255).required(),
  description: Joi.string().max(2000).optional(),
  category: Joi.string().required(),
  price: Joi.number().positive().required(),
  discountPercentage: Joi.number().min(0).max(100).optional(),
  stockQuantity: Joi.number().integer().min(0).required(),
  images: Joi.array().items(Joi.string().uri()).optional(),
  attributes: Joi.object().unknown().optional(),
});

export const productUpdateSchema = Joi.object({
  name: Joi.string().min(3).max(255).optional(),
  description: Joi.string().max(2000).optional(),
  price: Joi.number().positive().optional(),
  discountPercentage: Joi.number().min(0).max(100).optional(),
  stockQuantity: Joi.number().integer().min(0).optional(),
  images: Joi.array().items(Joi.string().uri()).optional(),
  attributes: Joi.object().unknown().optional(),
  isActive: Joi.boolean().optional(),
});

export const productListSchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  category: Joi.string().optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  sortBy: Joi.string().optional(),
  order: Joi.string().valid('asc', 'desc').optional(),
});

// ============ Search Validation Schema ============
export const searchSchema = Joi.object({
  q: Joi.string().optional(),
  category: Joi.string().optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  sortBy: Joi.string().optional(),
  order: Joi.string().valid('asc', 'desc').optional(),
});

/**
 * Validate data against a Joi schema
 * @param {Joi.Schema} schema - Joi validation schema
 * @param {*} data - Data to validate
 * @returns {Promise<Object>} Validation result with value or error
 */
export const validate = async (schema, data) => {
  const result = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (result.error) {
    return { error: result.error };
  }

  return { value: result.value };
};
