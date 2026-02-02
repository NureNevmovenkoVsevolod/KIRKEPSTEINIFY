const bcrypt = require('bcrypt');
const pool = require('../db/pool');
const config = require('../config/config');

class AuthService {
  /**
   * Register a new user
   * @param {string} email - User email
   * @param {string} username - User username
   * @param {string} password - User password
   * @returns {Promise<Object>} Created user object
   */
  async register(email, username, password) {
    // Hash password
    const passwordHash = await bcrypt.hash(password, config.bcrypt.saltRounds);

    // Insert user into database
    const result = await pool.query(
      'INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) RETURNING id, email, username, created_at',
      [email, username, passwordHash]
    );

    return result.rows[0];
  }

  /**
   * Login a user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User object with id, email, username, role
   */
  async login(email, password) {
    // Find user by email
    const result = await pool.query(
      'SELECT id, email, username, password_hash, role FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return null; // User not found
    }

    const user = result.rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return null; // Invalid password
    }

    // Return user without password hash
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Find user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User object
   */
  async findById(userId) {
    const result = await pool.query(
      'SELECT id, email, username, role, created_at, updated_at FROM users WHERE id = $1',
      [userId]
    );

    return result.rows[0] || null;
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<Object>} User object
   */
  async findByEmail(email) {
    const result = await pool.query(
      'SELECT id, email, username, role, created_at, updated_at FROM users WHERE email = $1',
      [email]
    );

    return result.rows[0] || null;
  }
}

module.exports = new AuthService();
