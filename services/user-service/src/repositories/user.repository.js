import { AppDataSource } from '../config/database.js';
import { User } from '../models/user.model.js';

export class UserRepository {
  constructor() {
    this.repository = AppDataSource.getRepository(User);
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User object or null
   */
  async findByEmail(email) {
    return await this.repository.findOne({ where: { email } });
  }

  /**
   * Find user by username
   * @param {string} username - User username
   * @returns {Promise<Object|null>} User object or null
   */
  async findByUsername(username) {
    return await this.repository.findOne({ where: { username } });
  }

  /**
   * Find user by ID
   * @param {string} id - User ID
   * @returns {Promise<Object|null>} User object or null
   */
  async findById(id) {
    return await this.repository.findOne({ where: { id } });
  }

  /**
   * Create a new user
   * @param {Object} user - User data
   * @returns {Promise<Object>} Created user object
   */
  async create(user) {
    const newUser = this.repository.create(user);
    return await this.repository.save(newUser);
  }

  /**
   * Update user
   * @param {string} id - User ID
   * @param {Object} data - Data to update
   * @returns {Promise<Object|null>} Updated user object or null
   */
  async update(id, data) {
    await this.repository.update(id, data);
    return await this.findById(id);
  }

  /**
   * Check if email exists
   * @param {string} email - Email to check
   * @returns {Promise<boolean>} True if email exists
   */
  async emailExists(email) {
    const count = await this.repository.count({ where: { email } });
    return count > 0;
  }

  /**
   * Check if username exists
   * @param {string} username - Username to check
   * @returns {Promise<boolean>} True if username exists
   */
  async usernameExists(username) {
    const count = await this.repository.count({ where: { username } });
    return count > 0;
  }
}
