const measurementService = require('../services/measurementService');
const stationService = require('../services/stationService');

class MeasurementController {
  /**
   * POST /api/measurements
   * Record telemetry data from IoT devices
   */
  async recordMeasurement(req, res, next) {
    try {
      const { stationId, temperature, humidity, pressure, windSpeed, rainfall, lightLevel } = req.body;

      // Check if station exists
      const stationExists = await stationService.stationExists(stationId);
      if (!stationExists) {
        return res.status(404).json({ error: 'Station not found' });
      }

      // Record measurement and process alerts
      const result = await measurementService.recordMeasurementWithAlerts(stationId, {
        temperature,
        humidity,
        pressure,
        windSpeed,
        rainfall,
        lightLevel,
      });

      // Update station's last_seen timestamp
      await stationService.updateLastSeen(stationId);

      res.status(201).json({
        message: 'Measurement recorded successfully',
        measurement: result.measurement,
        alerts: result.alerts,
        alertsTriggered: result.alertCount,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/stations/:stationId/measurements
   * Get measurement history for a station
   */
  async getMeasurements(req, res, next) {
    try {
      const { stationId } = req.params;
      const { period = '24h' } = req.query;

      // Check if station exists
      const station = await stationService.getStationById(stationId);
      if (!station) {
        return res.status(404).json({ error: 'Station not found' });
      }

      // Get measurements
      const measurements = await measurementService.getMeasurementsByPeriod(stationId, period);

      res.json({
        message: 'Measurements retrieved successfully',
        count: measurements.length,
        period,
        measurements,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/stations/:stationId/measurements/latest
   * Get latest measurement for a station
   */
  async getLatestMeasurement(req, res, next) {
    try {
      const { stationId } = req.params;

      // Check if station exists
      const station = await stationService.getStationById(stationId);
      if (!station) {
        return res.status(404).json({ error: 'Station not found' });
      }

      // Get latest measurement
      const measurement = await measurementService.getLatestMeasurement(stationId);

      if (!measurement) {
        return res.json({
          message: 'No measurements found',
          measurement: null,
        });
      }

      res.json({
        message: 'Latest measurement retrieved',
        measurement,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/stations/:stationId/measurements/stats
   * Get measurement statistics for a station
   */
  async getMeasurementStats(req, res, next) {
    try {
      const { stationId } = req.params;
      const { period = '24h' } = req.query;

      // Check if station exists
      const station = await stationService.getStationById(stationId);
      if (!station) {
        return res.status(404).json({ error: 'Station not found' });
      }

      // Get statistics
      const stats = await measurementService.getMeasurementStats(stationId, period);

      res.json({
        message: 'Measurement statistics retrieved',
        period,
        stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MeasurementController();
