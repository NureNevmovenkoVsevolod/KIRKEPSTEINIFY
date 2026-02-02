const pool = require('../db/pool');
const config = require('../config/config');
const alertService = require('./alertService');

class MeasurementService {
  /**
   * Record a new measurement and process alerts
   * @param {string} stationId - Station ID
   * @param {Object} data - Measurement data
   * @returns {Promise<Object>} Created measurement with alerts
   */
  async recordMeasurementWithAlerts(stationId, data) {
    const {
      temperature,
      humidity,
      pressure,
      windSpeed,
      rainfall,
      lightLevel,
    } = data;

    // Record the measurement
    const result = await pool.query(
      `INSERT INTO measurements (station_id, temperature, humidity, pressure, wind_speed, rainfall, light_level, recorded_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
       RETURNING id, station_id, temperature, humidity, pressure, wind_speed, rainfall, light_level, recorded_at`,
      [stationId, temperature, humidity, pressure, windSpeed || null, rainfall || null, lightLevel || null]
    );

    const measurement = result.rows[0];

    // Process alerts asynchronously (don't block the response)
    try {
      const alerts = await alertService.processAlerts(stationId, {
        temperature,
        humidity,
        pressure,
      });

      return {
        measurement,
        alerts,
        alertCount: alerts.length,
      };
    } catch (error) {
      console.error('Error processing alerts:', error);
      return {
        measurement,
        alerts: [],
        alertCount: 0,
      };
    }
  }

  /**
   * Get measurements for a station within a time period
   * @param {string} stationId - Station ID
   * @param {string} period - Period string (24h, 7d, 30d, 1y)
   * @returns {Promise<Array>} Array of measurement objects
   */
  async getMeasurementsByPeriod(stationId, period = '24h') {
    // Parse period to SQL interval string
    const intervalMap = {
      '24h': '24 hours',
      '7d': '7 days',
      '30d': '30 days',
      '1y': '1 year',
    };

    const timeInterval = intervalMap[period] || intervalMap['24h'];

    const result = await pool.query(
      `SELECT id, station_id, temperature, humidity, pressure, wind_speed, rainfall, light_level, recorded_at
       FROM measurements
       WHERE station_id = $1 AND recorded_at >= NOW() - ($2)::INTERVAL
       ORDER BY recorded_at DESC
       LIMIT $3`,
      [stationId, timeInterval, config.api.measurementLimit]
    );

    return result.rows;
  }

  /**
   * Get measurements for a station by date range
   * @param {string} stationId - Station ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} Array of measurement objects
   */
  async getMeasurementsByDateRange(stationId, startDate, endDate) {
    const result = await pool.query(
      `SELECT id, station_id, temperature, humidity, pressure, wind_speed, rainfall, light_level, recorded_at
       FROM measurements
       WHERE station_id = $1 AND recorded_at >= $2 AND recorded_at <= $3
       ORDER BY recorded_at DESC
       LIMIT $4`,
      [stationId, startDate, endDate, config.api.measurementLimit]
    );

    return result.rows;
  }

  /**
   * Get latest measurement for a station
   * @param {string} stationId - Station ID
   * @returns {Promise<Object|null>} Latest measurement object or null
   */
  async getLatestMeasurement(stationId) {
    const result = await pool.query(
      `SELECT id, station_id, temperature, humidity, pressure, wind_speed, rainfall, light_level, recorded_at
       FROM measurements
       WHERE station_id = $1
       ORDER BY recorded_at DESC
       LIMIT 1`,
      [stationId]
    );

    return result.rows[0] || null;
  }

  /**
   * Get measurement statistics for a station
   * @param {string} stationId - Station ID
   * @param {string} period - Period string (24h, 7d, 30d, 1y)
   * @returns {Promise<Object>} Statistics object with min, max, avg values
   */
  async getMeasurementStats(stationId, period = '24h') {
    const intervalMap = {
      '24h': '24 hours',
      '7d': '7 days',
      '30d': '30 days',
      '1y': '1 year',
    };

    const timeInterval = intervalMap[period] || intervalMap['24h'];

    const result = await pool.query(
      `SELECT
        AVG(temperature) as avg_temperature,
        MIN(temperature) as min_temperature,
        MAX(temperature) as max_temperature,
        AVG(humidity) as avg_humidity,
        MIN(humidity) as min_humidity,
        MAX(humidity) as max_humidity,
        AVG(pressure) as avg_pressure,
        COUNT(*) as total_measurements
       FROM measurements
       WHERE station_id = $1 AND recorded_at >= NOW() - ($2)::INTERVAL`,
      [stationId, timeInterval]
    );

    return result.rows[0] || null;
  }

  /**
   * Delete old measurements
   * @param {number} days - Delete measurements older than this many days
   * @returns {Promise<number>} Number of deleted records
   */
  async deleteOldMeasurements(days = 365) {
    const result = await pool.query(
      `DELETE FROM measurements
       WHERE recorded_at < NOW() - INTERVAL '${days} days'`,
    );

    return result.rowCount;
  }
}

module.exports = new MeasurementService();
