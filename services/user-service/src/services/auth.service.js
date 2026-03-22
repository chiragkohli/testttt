import bcrypt from 'bcryptjs';
import { signToken, signRefreshToken, UserRole, ConflictError, NotFoundError, AuthenticationError } from '@ecommerce/shared';
import { UserRepository } from '../repositories/user.repository.js';

export class AuthService {
  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * Register a new user
   * @param {Object} data - User signup data
   * @param {string} data.username - Username
   * @param {string} data.email - Email
   * @param {string} data.password - Password
   * @param {string} [data.firstName] - First name
   * @param {string} [data.lastName] - Last name
   * @returns {Promise<Object>} Created user, accessToken, and refreshToken
   */
  async signup(data) {
    // Check if user already exists
    const existingEmail = await this.userRepository.findByEmail(data.email);
    if (existingEmail) {
      throw new ConflictError('Email already registered');
    }

    const existingUsername = await this.userRepository.findByUsername(data.username);
    if (existingUsername) {
      throw new ConflictError('Username already taken');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await this.userRepository.create({
      username: data.username,
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      role: UserRole.USER,
      isActive: true,
    });

    // Generate tokens
    const accessToken = signToken({
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    });

    const refreshToken = signRefreshToken(user.id);

    // Remove password from response
    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User, accessToken, and refreshToken
   */
  async login(email, password) {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new AuthenticationError('Account is inactive');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Generate tokens
    const accessToken = signToken({
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    });

    const refreshToken = signRefreshToken(user.id);

    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Get user profile
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User object without password
   */
  async getProfile(userId) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} data - Data to update
   * @param {string} [data.firstName] - First name
   * @param {string} [data.lastName] - Last name
   * @param {string} [data.username] - Username
   * @returns {Promise<Object>} Updated user object without password
   */
  async updateProfile(userId, data) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check if username is being changed and if it's unique
    if (data.username && data.username !== user.username) {
      const existingUsername = await this.userRepository.findByUsername(data.username);
      if (existingUsername) {
        throw new ConflictError('Username already taken');
      }
    }

    const updated = await this.userRepository.update(userId, data);

    if (!updated) {
      throw new NotFoundError('Failed to update user');
    }

    const { passwordHash: _, ...userWithoutPassword } = updated;
    return userWithoutPassword;
  }
}
