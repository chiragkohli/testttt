import { asyncHandler, validateBody, userSignupSchema, userLoginSchema } from '@ecommerce/shared';
import { AuthService } from '../services/auth.service.js';

export class AuthController {
  constructor() {
    this.authService = new AuthService();
  }

  /**
   * POST /auth/signup
   * Register a new user
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  register = asyncHandler(async (req, res) => {
    const { username, email, password, firstName, lastName } = req.body;

    const result = await this.authService.signup({
      username,
      email,
      password,
      firstName,
      lastName,
    });

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'User registered successfully',
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
    });
  });

  /**
   * POST /auth/login
   * Login user
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const result = await this.authService.login(email, password);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Login successful',
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
    });
  });

  /**
   * GET /auth/profile
   * Get current user profile
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  getProfile = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: 'Unauthorized',
      });
    }

    const user = await this.authService.getProfile(userId);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Profile retrieved',
      data: user,
    });
  });

  /**
   * PUT /auth/profile
   * Update user profile
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  updateProfile = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: 'Unauthorized',
      });
    }

    const { firstName, lastName, username } = req.body;

    const updated = await this.authService.updateProfile(userId, {
      firstName,
      lastName,
      username,
    });

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Profile updated successfully',
      data: updated,
    });
  });

  /**
   * GET /health
   * Health check endpoint
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  health = (req, res) => {
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'User service is healthy',
      data: {
        service: 'user-service',
        status: 'up',
        timestamp: new Date().toISOString(),
      },
    });
  };
}
