const express = require('express');
const adminController = require('../controllers/adminController');
const { isAdmin, optionalAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// All admin routes require admin authorization
router.use(isAdmin);

/**
 * GET /api/admin/dashboard
 * Admin dashboard with combined statistics
 */
router.get(
  '/dashboard',
  asyncHandler(adminController.getDashboard.bind(adminController))
);

/**
 * GET /api/admin/stats
 * System statistics
 */
router.get(
  '/stats',
  asyncHandler(adminController.getStats.bind(adminController))
);

/**
 * GET /api/admin/health
 * System health status
 */
router.get(
  '/health',
  asyncHandler(adminController.getHealth.bind(adminController))
);

/**
 * GET /api/admin/users
 * User management list
 */
router.get(
  '/users',
  asyncHandler(adminController.getUsers.bind(adminController))
);

/**
 * PUT /api/admin/users/:userId/role
 * Change user role
 */
router.put(
  '/users/:userId/role',
  asyncHandler(adminController.changeUserRole.bind(adminController))
);

/**
 * GET /api/admin/stations
 * Station management list
 */
router.get(
  '/stations',
  asyncHandler(adminController.getStations.bind(adminController))
);

/**
 * GET /api/admin/audit-logs
 * Audit logs
 */
router.get(
  '/audit-logs',
  asyncHandler(adminController.getAuditLogs.bind(adminController))
);

/**
 * GET /api/admin/audit-summary
 * Audit logs summary
 */
router.get(
  '/audit-summary',
  asyncHandler(adminController.getAuditSummary.bind(adminController))
);

module.exports = router;
