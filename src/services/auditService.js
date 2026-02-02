const pool = require('../db/pool');

class AuditService {
  /**
   * Log an action to the audit log
   * @param {string} action - Action name (e.g., 'USER_CREATED', 'STATION_DELETED')
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Created audit log entry
   */
  async log(action, options = {}) {
    const {
      userId = null,
      resourceType = null,
      resourceId = null,
      details = null,
      ipAddress = null,
    } = options;

    const result = await pool.query(
      `INSERT INTO audit_logs 
       (action, user_id, resource_type, resource_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [action, userId, resourceType, resourceId, details ? JSON.stringify(details) : null, ipAddress]
    );

    return result.rows[0];
  }

  /**
   * Get audit logs with filtering
   * @param {Object} options - Filter options
   * @returns {Promise<Array>} Array of audit logs
   */
  async getLogs(options = {}) {
    const {
      userId = null,
      action = null,
      resourceType = null,
      limit = 100,
      offset = 0,
      startDate = null,
      endDate = null,
    } = options;

    let query = `SELECT * FROM audit_logs WHERE 1=1`;
    const params = [];

    if (userId) {
      query += ` AND user_id = $${params.length + 1}`;
      params.push(userId);
    }

    if (action) {
      query += ` AND action = $${params.length + 1}`;
      params.push(action);
    }

    if (resourceType) {
      query += ` AND resource_type = $${params.length + 1}`;
      params.push(resourceType);
    }

    if (startDate) {
      query += ` AND timestamp >= $${params.length + 1}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND timestamp <= $${params.length + 1}`;
      params.push(endDate);
    }

    query += ` ORDER BY timestamp DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get audit logs for a specific user
   * @param {string} userId - User ID
   * @param {Object} options - Filter options
   * @returns {Promise<Array>} User's audit logs
   */
  async getUserLogs(userId, options = {}) {
    return this.getLogs({
      ...options,
      userId,
    });
  }

  /**
   * Get audit logs for a specific resource
   * @param {string} resourceType - Type of resource
   * @param {string} resourceId - Resource ID
   * @returns {Promise<Array>} Resource's audit logs
   */
  async getResourceLogs(resourceType, resourceId) {
    const result = await pool.query(
      `SELECT * FROM audit_logs 
       WHERE resource_type = $1 AND resource_id = $2
       ORDER BY timestamp DESC`,
      [resourceType, resourceId]
    );

    return result.rows;
  }

  /**
   * Get recent actions
   * @param {number} minutes - Time window in minutes
   * @returns {Promise<Array>} Recent actions
   */
  async getRecentActions(minutes = 60) {
    const result = await pool.query(
      `SELECT * FROM audit_logs 
       WHERE timestamp > NOW() - INTERVAL '${minutes} minutes'
       ORDER BY timestamp DESC`,
    );

    return result.rows;
  }

  /**
   * Get action statistics
   * @param {Object} options - Filter options
   * @returns {Promise<Array>} Action statistics
   */
  async getActionStats(options = {}) {
    const {
      startDate = null,
      endDate = null,
    } = options;

    let query = `SELECT action, COUNT(*) as count FROM audit_logs WHERE 1=1`;
    const params = [];

    if (startDate) {
      query += ` AND timestamp >= $${params.length + 1}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND timestamp <= $${params.length + 1}`;
      params.push(endDate);
    }

    query += ` GROUP BY action ORDER BY count DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get user activity statistics
   * @param {Object} options - Filter options
   * @returns {Promise<Array>} User activity statistics
   */
  async getUserActivity(options = {}) {
    const {
      limit = 20,
    } = options;

    const result = await pool.query(
      `SELECT user_id, COUNT(*) as action_count, MAX(timestamp) as last_action
       FROM audit_logs
       WHERE user_id IS NOT NULL
       GROUP BY user_id
       ORDER BY action_count DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows;
  }

  /**
   * Delete old audit logs
   * @param {number} days - Delete logs older than this many days
   * @returns {Promise<number>} Number of deleted records
   */
  async deleteOldLogs(days = 90) {
    const result = await pool.query(
      `DELETE FROM audit_logs 
       WHERE timestamp < NOW() - INTERVAL '${days} days'`,
    );

    return result.rowCount;
  }
}

module.exports = new AuditService();
