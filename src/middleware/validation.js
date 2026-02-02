/**
 * Validation middleware
 */

const validators = {
  /**
   * Validate registration request
   */
  validateRegister: (req, res, next) => {
    const { email, username, password } = req.body;

    // Check required fields
    if (!email || !username || !password) {
      return res.status(400).json({
        error: 'Email, username, and password are required',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters',
      });
    }

    // Validate username length
    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({
        error: 'Username must be between 3 and 30 characters',
      });
    }

    next();
  },

  /**
   * Validate login request
   */
  validateLogin: (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
      });
    }

    next();
  },

  /**
   * Validate station creation
   */
  validateCreateStation: (req, res, next) => {
    const { userId, name } = req.body;

    if (!userId || !name) {
      return res.status(400).json({
        error: 'userId and name are required',
      });
    }

    if (name.length < 2 || name.length > 100) {
      return res.status(400).json({
        error: 'Station name must be between 2 and 100 characters',
      });
    }

    next();
  },

  /**
   * Validate measurement recording
   */
  validateMeasurement: (req, res, next) => {
    const { stationId, temperature, humidity } = req.body;

    if (!stationId) {
      return res.status(400).json({
        error: 'stationId is required',
      });
    }

    // Validate temperature and humidity if provided
    if (temperature !== undefined && typeof temperature !== 'number') {
      return res.status(400).json({
        error: 'temperature must be a number',
      });
    }

    if (humidity !== undefined && (typeof humidity !== 'number' || humidity < 0 || humidity > 100)) {
      return res.status(400).json({
        error: 'humidity must be a number between 0 and 100',
      });
    }

    next();
  },

  /**
   * Validate period parameter
   */
  validatePeriod: (req, res, next) => {
    const { period } = req.query;
    const validPeriods = ['24h', '7d', '30d', '1y'];

    if (period && !validPeriods.includes(period)) {
      return res.status(400).json({
        error: `Invalid period. Must be one of: ${validPeriods.join(', ')}`,
      });
    }

    next();
  },
};

module.exports = validators;
