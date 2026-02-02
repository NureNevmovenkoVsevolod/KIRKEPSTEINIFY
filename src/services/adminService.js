const pool = require('../db/pool');
const auditService = require('./auditService');

class AdminService {
  /**
   * Get system statistics
   * @returns {Promise<Object>} System statistics
   */
  async getSystemStats() {
    const [usersResult, stationsResult, measurementsResult, alertsResult] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM users'),
      pool.query('SELECT COUNT(*) as count FROM stations'),
      pool.query(`SELECT COUNT(*) as count FROM measurements 
                  WHERE recorded_at > NOW() - INTERVAL '24 hours'`),
      pool.query(`SELECT COUNT(*) as count FROM system_alerts 
                  WHERE triggered_at > NOW() - INTERVAL '24 hours' AND is_resolved = FALSE`),
    ]);

    return {
      totalUsers: parseInt(usersResult.rows[0].count),
      totalStations: parseInt(stationsResult.rows[0].count),
      measurementsLast24h: parseInt(measurementsResult.rows[0].count),
      activeAlertsLast24h: parseInt(alertsResult.rows[0].count),
    };
  }

  /**
   * Get detailed system statistics
   * @returns {Promise<Object>} Detailed statistics
   */
  async getDetailedStats() {
    const basicStats = await this.getSystemStats();

    // Get admin users count
    const adminsResult = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE role = $1',
      ['admin']
    );

    // Get active stations
    const activeStationsResult = await pool.query(
      'SELECT COUNT(*) as count FROM stations WHERE is_active = TRUE'
    );

    // Get total measurements
    const totalMeasurementsResult = await pool.query(
      'SELECT COUNT(*) as count FROM measurements'
    );

    // Get alert statistics
    const alertStatsResult = await pool.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_resolved = FALSE THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical,
        SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high
       FROM system_alerts`
    );

    const alertStats = alertStatsResult.rows[0];

    // Get users by role
    const roleStatsResult = await pool.query(
      `SELECT role, COUNT(*) as count FROM users GROUP BY role`
    );

    const roleStats = {};
    roleStatsResult.rows.forEach(row => {
      roleStats[row.role] = parseInt(row.count);
    });

    return {
      ...basicStats,
      adminCount: parseInt(adminsResult.rows[0].count),
      activeStations: parseInt(activeStationsResult.rows[0].count),
      totalMeasurements: parseInt(totalMeasurementsResult.rows[0].count),
      alerts: {
        total: parseInt(alertStats.total) || 0,
        active: parseInt(alertStats.active) || 0,
        critical: parseInt(alertStats.critical) || 0,
        high: parseInt(alertStats.high) || 0,
      },
      usersByRole: roleStats,
    };
  }

  /**
   * Get user management data
   * @param {Object} options - Filter options
   * @returns {Promise<Object>} User management data
   */
  async getUserManagement(options = {}) {
    const {
      limit = 100,
      offset = 0,
    } = options;

    const result = await pool.query(
      `SELECT id, email, username, role, created_at, updated_at
       FROM users
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await pool.query('SELECT COUNT(*) as count FROM users');

    return {
      users: result.rows,
      total: parseInt(countResult.rows[0].count),
    };
  }

  /**
   * Get station management data
   * @param {Object} options - Filter options
   * @returns {Promise<Object>} Station management data
   */
  async getStationManagement(options = {}) {
    const {
      limit = 100,
      offset = 0,
      active = null,
    } = options;

    let query = `SELECT s.*, u.username, u.email, u.id as user_email
                 FROM stations s
                 LEFT JOIN users u ON s.user_id = u.id
                 WHERE 1=1`;
    const params = [];

    if (active !== null) {
      query += ` AND s.is_active = $${params.length + 1}`;
      params.push(active);
    }

    query += ` ORDER BY s.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    let countQuery = 'SELECT COUNT(*) as count FROM stations WHERE 1=1';
    const countParams = [];

    if (active !== null) {
      countQuery += ` AND is_active = $${countParams.length + 1}`;
      countParams.push(active);
    }

    const countResult = await pool.query(countQuery, countParams);

    return {
      stations: result.rows,
      total: parseInt(countResult.rows[0].count),
    };
  }

  /**
   * Change user role
   * @param {string} userId - User ID
   * @param {string} newRole - New role ('user', 'admin')
   * @param {string} adminId - Admin user ID (for audit)
   * @returns {Promise<Object>} Updated user
   */
  async changeUserRole(userId, newRole, adminId) {
    if (!['user', 'admin'].includes(newRole)) {
      throw new Error('Invalid role');
    }

    const result = await pool.query(
      'UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [newRole, userId]
    );

    // Log the action
    await auditService.log('USER_ROLE_CHANGED', {
      userId: adminId,
      resourceType: 'user',
      resourceId: userId,
      details: { newRole, oldRole: 'user' }, // Could fetch old role for better tracking
    });

    return result.rows[0];
  }

  /**
   * Get system health status
   * @returns {Promise<Object>} System health status
   */
  async getSystemHealth() {
    try {
      // Test database connection
      const dbTest = await pool.query('SELECT NOW()');
      const dbHealthy = !!dbTest.rows[0];

      // Get inactive stations (no data in 24h)
      const inactiveStations = await pool.query(
        `SELECT COUNT(*) as count FROM stations 
         WHERE last_seen IS NULL OR last_seen < NOW() - INTERVAL '24 hours'`
      );

      // Get measurement ingestion rate
      const ingestionRate = await pool.query(
        `SELECT COUNT(*) as count FROM measurements 
         WHERE recorded_at > NOW() - INTERVAL '1 hour'`
      );

      // Get alert trend
      const alertTrend = await pool.query(
        `SELECT 
          (SELECT COUNT(*) FROM system_alerts WHERE triggered_at > NOW() - INTERVAL '1 hour') as last_hour,
          (SELECT COUNT(*) FROM system_alerts WHERE triggered_at > NOW() - INTERVAL '24 hours') as last_24h`
      );

      const trend = alertTrend.rows[0];

      return {
        status: dbHealthy ? 'healthy' : 'unhealthy',
        database: dbHealthy ? 'connected' : 'disconnected',
        inactiveStations: parseInt(inactiveStations.rows[0].count),
        measurementIngestionRate: parseInt(ingestionRate.rows[0].count) + ' per hour',
        alerts: {
          lastHour: parseInt(trend.last_hour),
          last24h: parseInt(trend.last_24h),
        },
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
      };
    }
  }

  /**
   * Get audit log summary
   * @returns {Promise<Object>} Audit log summary
   */
  async getAuditSummary() {
    const recentActions = await auditService.getRecentActions(1440); // Last 24 hours
    const actionStats = await auditService.getActionStats();
    const userActivity = await auditService.getUserActivity({ limit: 10 });

    return {
      totalActionsLast24h: recentActions.length,
      actionBreakdown: actionStats,
      topActiveUsers: userActivity,
    };
  }
}

module.exports = new AdminService();
