const express = require('express');
const measurementController = require('../controllers/measurementController');
const validators = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * GET /api/measurements
 * Get API info about measurements endpoint
 */
router.get(
  '/',
  (req, res) => {
    res.json({
      message: 'Measurements API',
      endpoints: {
        'POST /api/measurements': 'Record a new measurement',
        'GET /api/measurements/station/:stationId': 'Get measurements for a station',
        'GET /api/measurements/station/:stationId/latest': 'Get latest measurement',
        'GET /api/measurements/station/:stationId/stats': 'Get measurement statistics',
      },
      queryParameters: {
        period: 'Time period (1h, 24h, 7d, 30d, 90d, 1y)'
      }
    });
  }
);

/**
 * POST /api/measurements
 * Record a measurement
 */
router.post(
  '/',
  validators.validateMeasurement,
  asyncHandler(measurementController.recordMeasurement.bind(measurementController))
);

/**
 * GET /api/stations/:stationId/measurements
 * Get measurements for a station
 */
router.get(
  '/station/:stationId',
  validators.validatePeriod,
  asyncHandler(measurementController.getMeasurements.bind(measurementController))
);

/**
 * GET /api/stations/:stationId/measurements/latest
 * Get latest measurement
 */
router.get(
  '/station/:stationId/latest',
  asyncHandler(measurementController.getLatestMeasurement.bind(measurementController))
);

/**
 * GET /api/stations/:stationId/measurements/stats
 * Get measurement statistics
 */
router.get(
  '/station/:stationId/stats',
  validators.validatePeriod,
  asyncHandler(measurementController.getMeasurementStats.bind(measurementController))
);

module.exports = router;
