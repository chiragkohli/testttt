/**
 * Shared Type Definitions for E-Commerce Microservices
 * Converted to JavaScript - types are documented in JSDoc
 */

// ============ User Role Constants ============
const UserRole = {
  USER: 'USER',
  ADMIN: 'ADMIN',
};

// ============ Order Status Constants ============
const OrderStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
};

// ============ Payment Status Constants ============
const PaymentStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
};

// ============ Event Type Constants ============
const EventType = {
  PRODUCT_CREATED: 'product.created',
  PRODUCT_UPDATED: 'product.updated',
  PRODUCT_DELETED: 'product.deleted',
};

// ============ HTTP Status Codes ============
const HttpStatusCode = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// ============ Custom Error Classes ============
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
  }
}

class ValidationError extends AppError {
  constructor(message, errors = {}) {
    super(message, HttpStatusCode.BAD_REQUEST);
    this.errors = errors;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, HttpStatusCode.UNAUTHORIZED);
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, HttpStatusCode.FORBIDDEN);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, HttpStatusCode.NOT_FOUND);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, HttpStatusCode.CONFLICT);
  }
}

export {
  UserRole,
  OrderStatus,
  PaymentStatus,
  EventType,
  HttpStatusCode,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
};
