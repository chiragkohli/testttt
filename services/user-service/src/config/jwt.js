import { signToken, signRefreshToken, verifyToken } from '@ecommerce/shared';

/**
 * Get JWT configuration
 * @returns {Object} JWT configuration object
 */
export const getJwtConfig = () => ({
  secret: process.env.JWT_SECRET || 'your-very-secret-key-change-in-production',
  expiresIn: process.env.JWT_EXPIRY || '15m',
  refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d',
});

/**
 * Token utilities
 */
export const tokenUtils = {
  sign: signToken,
  signRefresh: signRefreshToken,
  verify: verifyToken,
};
