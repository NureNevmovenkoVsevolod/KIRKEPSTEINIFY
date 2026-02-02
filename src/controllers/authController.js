const authService = require('../services/authService');

class AuthController {
  /**
   * POST /api/auth/register
   * Register a new user
   */
  async register(req, res, next) {
    try {
      const { email, username, password } = req.body;

      // Check if user already exists
      const existingUser = await authService.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: 'Email already exists' });
      }

      // Register user
      const user = await authService.register(email, username, password);

      res.status(201).json({
        message: 'User registered successfully',
        user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   * Login a user
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Authenticate user
      const user = await authService.login(email, password);

      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      res.json({
        message: 'Login successful',
        user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/profile
   * Get current user profile
   */
  async getProfile(req, res, next) {
    try {
      const userId = req.userId; // Set by auth middleware
      const user = await authService.findById(userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        message: 'User profile retrieved',
        user,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
