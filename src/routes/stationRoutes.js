const express = require('express');
const stationController = require('../controllers/stationController');
const validators = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * POST /api/stations
 * Create a new station
 */
router.post(
  '/',
  validators.validateCreateStation,
  asyncHandler(stationController.createStation.bind(stationController))
);

/**
 * GET /api/stations
 * Get all stations for a user
 */
router.get(
  '/',
  asyncHandler(stationController.getUserStations.bind(stationController))
);

/**
 * GET /api/stations/:stationId
 * Get a specific station
 */
router.get(
  '/:stationId',
  asyncHandler(stationController.getStationById.bind(stationController))
);

/**
 * PUT /api/stations/:stationId
 * Update a station
 */
router.put(
  '/:stationId',
  asyncHandler(stationController.updateStation.bind(stationController))
);

/**
 * DELETE /api/stations/:stationId
 * Delete a station
 */
router.delete(
  '/:stationId',
  asyncHandler(stationController.deleteStation.bind(stationController))
);

module.exports = router;
