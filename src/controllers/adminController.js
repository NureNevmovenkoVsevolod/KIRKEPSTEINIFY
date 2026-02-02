const adminService = require('../services/adminService');
const auditService = require('../services/auditService');

class AdminController {
  /**
   * GET /api/admin/stats
   * Get system statistics
   */
  async getStats(req, res, next) {
    try {
      const stats = await adminService.getDetailedStats();

      await auditService.log('ADMIN_VIEWED_STATS', {
        userId: req.userId,
        resourceType: 'admin',
      });

      res.json({
        message: 'System statistics retrieved',
        stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/health
   * Get system health status
   */
  async getHealth(req, res, next) {
    try {
      const health = await adminService.getSystemHealth();

      res.json({
        message: 'System health status retrieved',
        health,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/users
   * Get user management data
   */
  async getUsers(req, res, next) {
    try {
      const { limit = 100, offset = 0 } = req.query;

      const data = await adminService.getUserManagement({
        limit: Math.min(parseInt(limit), 1000),
        offset: parseInt(offset),
      });

      await auditService.log('ADMIN_VIEWED_USERS', {
        userId: req.userId,
        resourceType: 'admin',
      });

      res.json({
        message: 'User management data retrieved',
        ...data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/stations
   * Get station management data
   */
  async getStations(req, res, next) {
    try {
      const { limit = 100, offset = 0, active = null } = req.query;

      const data = await adminService.getStationManagement({
        limit: Math.min(parseInt(limit), 1000),
        offset: parseInt(offset),
        active: active !== null ? active === 'true' : null,
      });

      await auditService.log('ADMIN_VIEWED_STATIONS', {
        userId: req.userId,
        resourceType: 'admin',
      });

      res.json({
        message: 'Station management data retrieved',
        ...data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/admin/users/:userId/role
   * Change user role
   */
  async changeUserRole(req, res, next) {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      if (!role) {
        return res.status(400).json({ error: 'role is required' });
      }

      const updatedUser = await adminService.changeUserRole(userId, role, req.userId);

      await auditService.log('USER_ROLE_CHANGED', {
        userId: req.userId,
        resourceType: 'user',
        resourceId: userId,
        details: { newRole: role },
      });

      res.json({
        message: 'User role updated',
        user: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/audit-logs
   * Get audit logs
   */
  async getAuditLogs(req, res, next) {
    try {
      const { limit = 100, offset = 0, action = null, userId = null } = req.query;

      const logs = await auditService.getLogs({
        limit: Math.min(parseInt(limit), 1000),
        offset: parseInt(offset),
        action,
        userId,
      });

      res.json({
        message: 'Audit logs retrieved',
        count: logs.length,
        logs,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/audit-summary
   * Get audit log summary
   */
  async getAuditSummary(req, res, next) {
    try {
      const summary = await adminService.getAuditSummary();

      res.json({
        message: 'Audit summary retrieved',
        summary,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/dashboard
   * Get admin dashboard data (combined stats)
   */
  async getDashboard(req, res, next) {
    try {
      const [stats, health, auditSummary] = await Promise.all([
        adminService.getDetailedStats(),
        adminService.getSystemHealth(),
        adminService.getAuditSummary(),
      ]);

      await auditService.log('ADMIN_VIEWED_DASHBOARD', {
        userId: req.userId,
        resourceType: 'admin',
      });

      res.json({
        message: 'Admin dashboard data retrieved',
        stats,
        health,
        audit: auditSummary,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminController();
