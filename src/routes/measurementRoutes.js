const express = require('express');
const measurementController = require('../controllers/measurementController');
const validators = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate } = require('../middleware/auth');

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
        'GET /api/measurements/demo': 'Get latest measurement (demo - no auth required)',
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
 * GET /api/measurements/demo
 * Get latest measurement (public endpoint for demo/screenshots)
 */
router.get(
  '/demo',
  asyncHandler(async (req, res) => {
    const pool = require('../db/pool');
    const result = await pool.query(
      `SELECT m.*, s.name, s.location FROM measurements m
       JOIN stations s ON m.station_id = s.id
       ORDER BY m.recorded_at DESC
       LIMIT 1`
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No measurements found' });
    }
    
    res.json({
      message: 'Latest measurement',
      measurement: result.rows[0]
    });
  })
);

/**
 * POST /api/measurements
 * Record a measurement
 */
router.post(
  '/',
  authenticate,
  validators.validateMeasurement,
  asyncHandler(measurementController.recordMeasurement.bind(measurementController))
);

/**
 * GET /api/stations/:stationId/measurements
 * Get measurements for a station
 */
router.get(
  '/station/:stationId',
  authenticate,
  validators.validatePeriod,
  asyncHandler(measurementController.getMeasurements.bind(measurementController))
);

/**
 * GET /api/stations/:stationId/measurements/latest
 * Get latest measurement
 */
router.get(
  '/station/:stationId/latest',
  authenticate,
  asyncHandler(measurementController.getLatestMeasurement.bind(measurementController))
);

/**
 * GET /api/stations/:stationId/measurements/stats
 * Get measurement statistics
 */
router.get(
  '/station/:stationId/stats',
  authenticate,
  validators.validatePeriod,
  asyncHandler(measurementController.getMeasurementStats.bind(measurementController))
);

module.exports = router;
