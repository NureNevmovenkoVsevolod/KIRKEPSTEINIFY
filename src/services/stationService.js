const pool = require('../db/pool');
const auditService = require('./auditService');

class StationService {
  /**
   * Create a new weather station
   * @param {string} userId - User ID who owns the station
   * @param {string} name - Station name
   * @param {string} location - Station location
   * @returns {Promise<Object>} Created station object
   */
  async createStation(userId, name, location) {
    const result = await pool.query(
      'INSERT INTO stations (user_id, name, location, is_active) VALUES ($1, $2, $3, true) RETURNING *',
      [userId, name, location || null]
    );

    return result.rows[0];
  }

  /**
   * Get all stations for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of station objects
   */
  async getUserStations(userId) {
    const result = await pool.query(
      `SELECT id, user_id, name, location, firmware_version, last_seen, is_active, created_at, updated_at 
       FROM stations 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );

    return result.rows;
  }

  /**
   * Get station by ID
   * @param {string} stationId - Station ID
   * @returns {Promise<Object>} Station object
   */
  async getStationById(stationId) {
    const result = await pool.query(
      'SELECT * FROM stations WHERE id = $1',
      [stationId]
    );

    return result.rows[0] || null;
  }

  /**
   * Update station
   * @param {string} stationId - Station ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated station object
   */
  async updateStation(stationId, updates) {
    const allowedFields = ['name', 'location', 'firmware_version', 'is_active'];
    const fields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (fields.length === 0) {
      return this.getStationById(stationId);
    }

    values.push(stationId);
    const query = `UPDATE stations SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex} RETURNING *`;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Delete station with all related data (ACID transaction)
   * Ensures atomic deletion: station + measurements + alerts + system_alerts
   * @param {string} stationId - Station ID
   * @param {string} userId - User ID (for audit)
   * @returns {Promise<boolean>} True if deleted successfully
   */
  async deleteStationWithRelations(stationId, userId) {
    const client = await pool.connect();
    
    try {
      // Start transaction
      await client.query('BEGIN');

      // Check if station exists and get its info for audit
      const stationResult = await client.query(
        'SELECT * FROM stations WHERE id = $1',
        [stationId]
      );

      if (stationResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return false;
      }

      const station = stationResult.rows[0];

      // Delete in correct order (respecting foreign keys)
      // 1. Delete audit logs related to this station
      await client.query(
        'DELETE FROM audit_logs WHERE resource_type = $1 AND resource_id = $2',
        ['station', stationId]
      );

      // 2. Delete alert notifications
      await client.query(
        'DELETE FROM alert_notifications WHERE station_id = $1',
        [stationId]
      );

      // 3. Delete system alerts
      await client.query(
        'DELETE FROM system_alerts WHERE station_id = $1',
        [stationId]
      );

      // 4. Delete user alerts (if any)
      await client.query(
        'DELETE FROM alerts WHERE station_id = $1',
        [stationId]
      );

      // 5. Delete measurements
      await client.query(
        'DELETE FROM measurements WHERE station_id = $1',
        [stationId]
      );

      // 6. Delete station
      await client.query(
        'DELETE FROM stations WHERE id = $1',
        [stationId]
      );

      // Commit transaction
      await client.query('COMMIT');

      // Log the action
      await auditService.log('STATION_DELETED', {
        userId,
        resourceType: 'station',
        resourceId: stationId,
        details: {
          stationName: station.name,
          stationLocation: station.location,
        },
      });

      return true;
    } catch (error) {
      // Rollback on error
      await client.query('ROLLBACK');
      console.error('Error deleting station with relations:', error);
      throw error;
    } finally {
      // Release client back to pool
      client.release();
    }
  }

  /**
   * Update station's last_seen timestamp
   * @param {string} stationId - Station ID
   * @returns {Promise<void>}
   */
  async updateLastSeen(stationId) {
    await pool.query(
      'UPDATE stations SET last_seen = CURRENT_TIMESTAMP WHERE id = $1',
      [stationId]
    );
  }

  /**
   * Check if station exists
   * @param {string} stationId - Station ID
   * @returns {Promise<boolean>} True if exists, false otherwise
   */
  async stationExists(stationId) {
    const result = await pool.query(
      'SELECT id FROM stations WHERE id = $1',
      [stationId]
    );

    return result.rows.length > 0;
  }
}

module.exports = new StationService();
