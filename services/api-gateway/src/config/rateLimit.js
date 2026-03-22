import rateLimit from 'express-rate-limit';

/**
 * Create a rate limiter middleware
 * @param {number} windowMs - Time window in milliseconds
 * @param {number} maxRequests - Maximum requests per window
 * @returns {Function} Express middleware
 */
export const createRateLimiter = (windowMs = 900000, maxRequests = 100) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    message: {
      success: false,
      statusCode: 429,
      message: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise use IP
      return req.user?.userId || req.ip || 'unknown';
    },
  });
};
