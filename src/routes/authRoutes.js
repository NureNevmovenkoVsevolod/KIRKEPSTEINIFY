const express = require('express');
const authController = require('../controllers/authController');
const validators = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post(
  '/register',
  validators.validateRegister,
  asyncHandler(authController.register.bind(authController))
);

/**
 * POST /api/auth/login
 * Login a user
 */
router.post(
  '/login',
  validators.validateLogin,
  asyncHandler(authController.login.bind(authController))
);

/**
 * GET /api/auth/profile
 * Get current user profile (requires auth middleware)
 */
router.get(
  '/profile',
  // authMiddleware would go here
  asyncHandler(authController.getProfile.bind(authController))
);

module.exports = router;
