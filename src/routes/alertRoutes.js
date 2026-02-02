const express = require('express');
const alertController = require('../controllers/alertController');
const { optionalAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// All alert routes can use optional authentication
router.use(optionalAuth);

/**
 * GET /api/alerts/critical
 * Get all critical alerts (system-wide)
 */
router.get(
  '/critical',
  asyncHandler(alertController.getCriticalAlerts.bind(alertController))
);

/**
 * GET /api/alerts/stats
 * Get alert statistics
 */
router.get(
  '/stats',
  asyncHandler(alertController.getAlertStats.bind(alertController))
);

/**
 * GET /api/alerts/station/:stationId
 * Get alerts for a specific station
 */
router.get(
  '/station/:stationId',
  asyncHandler(alertController.getStationAlerts.bind(alertController))
);

/**
 * PUT /api/alerts/:alertId/resolve
 * Resolve an alert
 */
router.put(
  '/:alertId/resolve',
  asyncHandler(alertController.resolveAlert.bind(alertController))
);

/**
 * GET /api/alerts/:alertId
 * Get alert details
 */
router.get(
  '/:alertId',
  asyncHandler(alertController.getAlertDetails.bind(alertController))
);

module.exports = router;
