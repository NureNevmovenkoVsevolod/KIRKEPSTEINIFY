const stationService = require('../services/stationService');

class StationController {
  /**
   * POST /api/stations
   * Create a new weather station
   */
  async createStation(req, res, next) {
    try {
      const { userId, name, location } = req.body;

      const station = await stationService.createStation(userId, name, location);

      res.status(201).json({
        message: 'Station added successfully',
        station,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/stations
   * Get all stations for a user
   */
  async getUserStations(req, res, next) {
    try {
      const { userId } = req.query;

      const stations = await stationService.getUserStations(userId);

      res.json({
        message: 'Stations retrieved successfully',
        count: stations.length,
        stations,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/stations/:stationId
   * Get a specific station by ID
   */
  async getStationById(req, res, next) {
    try {
      const { stationId } = req.params;

      const station = await stationService.getStationById(stationId);

      if (!station) {
        return res.status(404).json({ error: 'Station not found' });
      }

      res.json({
        message: 'Station retrieved successfully',
        station,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/stations/:stationId
   * Update a station
   */
  async updateStation(req, res, next) {
    try {
      const { stationId } = req.params;
      const updates = req.body;

      const station = await stationService.updateStation(stationId, updates);

      if (!station) {
        return res.status(404).json({ error: 'Station not found' });
      }

      res.json({
        message: 'Station updated successfully',
        station,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/stations/:stationId
   * Delete a station (with all related data in atomic transaction)
   */
  async deleteStation(req, res, next) {
    try {
      const { stationId } = req.params;

      const deleted = await stationService.deleteStationWithRelations(stationId, req.userId);

      if (!deleted) {
        return res.status(404).json({ error: 'Station not found' });
      }

      res.json({
        message: 'Station and all related data deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new StationController();
