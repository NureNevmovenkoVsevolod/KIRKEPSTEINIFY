const express = require('express');
const measurementController = require('../controllers/measurementController');
const validators = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

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
