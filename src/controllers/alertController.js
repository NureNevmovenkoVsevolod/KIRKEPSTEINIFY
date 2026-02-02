const alertService = require('../services/alertService');
const auditService = require('../services/auditService');

class AlertController {
  /**
   * GET /api/alerts/station/:stationId
   * Get alerts for a specific station
   */
  async getStationAlerts(req, res, next) {
    try {
      const { stationId } = req.params;
      const { resolved = false, limit = 50, offset = 0 } = req.query;

      const alerts = await alertService.getStationAlerts(stationId, {
        resolved: resolved !== 'true' ? false : true,
        limit: Math.min(parseInt(limit), 1000),
        offset: parseInt(offset),
      });

      res.json({
        message: 'Station alerts retrieved',
        count: alerts.length,
        stationId,
        alerts,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/alerts/critical
   * Get all critical alerts
   */
  async getCriticalAlerts(req, res, next) {
    try {
      const { limit = 50 } = req.query;

      const alerts = await alertService.getCriticalAlerts({
        limit: Math.min(parseInt(limit), 1000),
        unresolved: true,
      });

      await auditService.log('VIEWED_CRITICAL_ALERTS', {
        userId: req.userId,
        resourceType: 'alert',
      });

      res.json({
        message: 'Critical alerts retrieved',
        count: alerts.length,
        alerts,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/alerts/stats
   * Get alert statistics
   */
  async getAlertStats(req, res, next) {
    try {
      const { stationId = null } = req.query;

      const stats = await alertService.getAlertStats(stationId);

      res.json({
        message: 'Alert statistics retrieved',
        stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/alerts/:alertId/resolve
   * Resolve an alert
   */
  async resolveAlert(req, res, next) {
    try {
      const { alertId } = req.params;

      const alert = await alertService.resolveAlert(alertId);

      if (!alert) {
        return res.status(404).json({ error: 'Alert not found' });
      }

      await auditService.log('ALERT_RESOLVED', {
        userId: req.userId,
        resourceType: 'alert',
        resourceId: alertId,
        details: { alertType: alert.alert_type },
      });

      res.json({
        message: 'Alert resolved',
        alert,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/alerts/:alertId
   * Get alert details
   */
  async getAlertDetails(req, res, next) {
    try {
      const { alertId } = req.params;

      // In a real app, you'd fetch this from the database
      // For now, we'll just return a success response
      res.json({
        message: 'Alert details retrieved',
        // You'd fetch the alert from DB here
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AlertController();
