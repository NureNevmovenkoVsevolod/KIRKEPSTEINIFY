const pool = require('../db/pool');

class AlertService {
  /**
   * Check for storm warning (pressure drop > 5 gPa in 1 hour)
   * @param {string} stationId - Station ID
   * @param {number} currentPressure - Current pressure reading
   * @returns {Promise<Object|null>} Alert data if triggered, null otherwise
   */
  async checkStormWarning(stationId, currentPressure) {
    if (!currentPressure) return null;

    // Get oldest measurement from last hour
    const oldMeasurementResult = await pool.query(
      `SELECT pressure FROM measurements 
       WHERE station_id = $1 AND recorded_at > NOW() - INTERVAL '1 hour' 
       ORDER BY recorded_at ASC LIMIT 1`,
      [stationId]
    );

    if (oldMeasurementResult.rows.length === 0) {
      return null; // Not enough data yet
    }

    const oldPressure = oldMeasurementResult.rows[0].pressure;
    const pressureDrop = oldPressure - currentPressure;

    // Alert if pressure dropped more than 5 gPa
    if (pressureDrop > 5) {
      return {
        alertType: 'STORM_WARNING',
        description: `Pressure drop detected: ${pressureDrop.toFixed(2)} gPa in last hour (from ${oldPressure} to ${currentPressure})`,
        severity: pressureDrop > 10 ? 'high' : 'medium',
        pressureChange: pressureDrop,
        temperatureValue: null,
      };
    }

    return null;
  }

  /**
   * Check for frost warning (temperature < 0°C)
   * @param {string} stationId - Station ID
   * @param {number} temperature - Current temperature
   * @returns {Promise<Object|null>} Alert data if triggered, null otherwise
   */
  async checkFrostWarning(stationId, temperature) {
    if (temperature === undefined || temperature === null) return null;

    if (temperature < 0) {
      return {
        alertType: 'FROST_WARNING',
        description: `Frost warning: Temperature dropped to ${temperature}°C`,
        severity: temperature < -10 ? 'high' : 'medium',
        pressureChange: null,
        temperatureValue: temperature,
      };
    }

    return null;
  }

  /**
   * Check for extreme heat warning (temperature > 35°C)
   * @param {string} stationId - Station ID
   * @param {number} temperature - Current temperature
   * @returns {Promise<Object|null>} Alert data if triggered, null otherwise
   */
  async checkExtremeHeatWarning(stationId, temperature) {
    if (temperature === undefined || temperature === null) return null;

    if (temperature > 35) {
      return {
        alertType: 'EXTREME_HEAT_WARNING',
        description: `Extreme heat warning: Temperature reached ${temperature}°C`,
        severity: temperature > 45 ? 'critical' : 'high',
        pressureChange: null,
        temperatureValue: temperature,
      };
    }

    return null;
  }

  /**
   * Check for high humidity warning (humidity > 90%)
   * @param {string} stationId - Station ID
   * @param {number} humidity - Current humidity percentage
   * @returns {Promise<Object|null>} Alert data if triggered, null otherwise
   */
  async checkHighHumidityWarning(stationId, humidity) {
    if (humidity === undefined || humidity === null) return null;

    if (humidity > 90) {
      return {
        alertType: 'HIGH_HUMIDITY_WARNING',
        description: `High humidity warning: ${humidity}% humidity detected`,
        severity: humidity > 98 ? 'high' : 'medium',
        pressureChange: null,
        temperatureValue: null,
      };
    }

    return null;
  }

  /**
   * Check if similar alert already exists (debounce)
   * @param {string} stationId - Station ID
   * @param {string} alertType - Alert type
   * @returns {Promise<boolean>} True if similar alert exists
   */
  async hasRecentAlert(stationId, alertType) {
    const result = await pool.query(
      `SELECT id FROM system_alerts 
       WHERE station_id = $1 AND alert_type = $2 AND is_resolved = FALSE
       AND triggered_at > NOW() - INTERVAL '1 hour'
       LIMIT 1`,
      [stationId, alertType]
    );

    return result.rows.length > 0;
  }

  /**
   * Create a system alert
   * @param {string} stationId - Station ID
   * @param {Object} alertData - Alert data with type, description, severity, etc.
   * @returns {Promise<Object>} Created alert
   */
  async createSystemAlert(stationId, alertData) {
    const {
      alertType,
      description,
      severity = 'medium',
      pressureChange = null,
      temperatureValue = null,
    } = alertData;

    const result = await pool.query(
      `INSERT INTO system_alerts 
       (station_id, alert_type, description, severity, pressure_change, temperature_value)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [stationId, alertType, description, severity, pressureChange, temperatureValue]
    );

    return result.rows[0];
  }

  /**
   * Get all alerts for a station
   * @param {string} stationId - Station ID
   * @param {Object} options - Filter options
   * @returns {Promise<Array>} Array of alerts
   */
  async getStationAlerts(stationId, options = {}) {
    const {
      resolved = false,
      limit = 100,
      offset = 0,
    } = options;

    let query = `SELECT * FROM system_alerts WHERE station_id = $1`;
    const params = [stationId];

    if (resolved !== null) {
      query += ` AND is_resolved = $${params.length + 1}`;
      params.push(resolved);
    }

    query += ` ORDER BY triggered_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Resolve an alert
   * @param {string} alertId - Alert ID
   * @returns {Promise<Object>} Updated alert
   */
  async resolveAlert(alertId) {
    const result = await pool.query(
      `UPDATE system_alerts 
       SET is_resolved = TRUE, resolved_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [alertId]
    );

    return result.rows[0] || null;
  }

  /**
   * Get critical alerts across all stations
   * @param {Object} options - Filter options
   * @returns {Promise<Array>} Array of critical alerts
   */
  async getCriticalAlerts(options = {}) {
    const {
      limit = 50,
      unresolved = true,
    } = options;

    let query = `SELECT sa.*, s.name as station_name, s.user_id
                 FROM system_alerts sa
                 JOIN stations s ON sa.station_id = s.id
                 WHERE sa.severity IN ('high', 'critical')`;
    const params = [];

    if (unresolved) {
      query += ` AND sa.is_resolved = FALSE`;
    }

    query += ` ORDER BY sa.triggered_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get alert statistics
   * @param {string} stationId - Optional station ID to filter by
   * @returns {Promise<Object>} Alert statistics
   */
  async getAlertStats(stationId = null) {
    let query = `SELECT 
                  COUNT(*) as total_alerts,
                  SUM(CASE WHEN is_resolved = FALSE THEN 1 ELSE 0 END) as active_alerts,
                  SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical_alerts,
                  SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high_alerts
                 FROM system_alerts`;
    const params = [];

    if (stationId) {
      query += ` WHERE station_id = $1`;
      params.push(stationId);
    }

    const result = await pool.query(query, params);
    return result.rows[0];
  }

  /**
   * Process all potential alerts for a measurement
   * @param {string} stationId - Station ID
   * @param {Object} measurement - Measurement data
   * @returns {Promise<Array>} Created alerts
   */
  async processAlerts(stationId, measurement) {
    const alerts = [];

    // Check all alert conditions
    const checksToRun = [
      {
        check: () => this.checkStormWarning(stationId, measurement.pressure),
        name: 'STORM_WARNING',
      },
      {
        check: () => this.checkFrostWarning(stationId, measurement.temperature),
        name: 'FROST_WARNING',
      },
      {
        check: () => this.checkExtremeHeatWarning(stationId, measurement.temperature),
        name: 'EXTREME_HEAT_WARNING',
      },
      {
        check: () => this.checkHighHumidityWarning(stationId, measurement.humidity),
        name: 'HIGH_HUMIDITY_WARNING',
      },
    ];

    for (const { check, name } of checksToRun) {
      try {
        const alertData = await check();
        if (alertData) {
          // Check for debounce (don't create if recent alert exists)
          const hasRecent = await this.hasRecentAlert(stationId, name);
          if (!hasRecent) {
            const createdAlert = await this.createSystemAlert(stationId, alertData);
            alerts.push(createdAlert);
          }
        }
      } catch (error) {
        console.error(`Error checking ${name}:`, error);
      }
    }

    return alerts;
  }
}

module.exports = new AlertService();
