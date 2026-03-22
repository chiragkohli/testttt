/**
 * JWT Authentication Middleware
 */

import { verifyToken, extractTokenFromHeader } from '../utils/jwt.js';
import { AuthenticationError, AuthorizationError, UserRole } from '../types/index.js';

/**
 * Middleware to verify JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const authenticateToken = (req, res, next) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      throw new AuthenticationError('No token provided');
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    next(new AuthenticationError('Invalid or expired token'));
  }
};

/**
 * Middleware to check if user is admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new AuthenticationError('Authentication required'));
  }

  if (req.user.role !== UserRole.ADMIN) {
    return next(new AuthorizationError('Admin access required'));
  }

  next();
};

/**
 * Middleware to check if user is authenticated
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const requireAuth = (req, res, next) => {
  if (!req.user) {
    return next(new AuthenticationError('Authentication required'));
  }

  next();
};
