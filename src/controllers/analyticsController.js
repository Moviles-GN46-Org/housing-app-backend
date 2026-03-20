const analyticsService = require('../services/analyticsService');

const analyticsController = {
  async logEvent(req, res, next) {
    try {
      const event = await analyticsService.logEvent(req.user.userId, req.body);
      res.status(201).json({ success: true, data: { id: event.id } });
    } catch (err) {
      next(err);
    }
  },

  async logBatch(req, res, next) {
    try {
      const result = await analyticsService.logBatch(req.user.userId, req.body.events);
      res.status(201).json({ success: true, data: { count: result.count } });
    } catch (err) {
      next(err);
    }
  },

  async getDashboard(req, res, next) {
    try {
      const dashboard = await analyticsService.getDashboard();
      res.json({ success: true, data: dashboard });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = analyticsController;
