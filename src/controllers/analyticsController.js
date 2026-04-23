const analyticsService = require("../services/analyticsService");

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
      const result = await analyticsService.logBatch(
        req.user.userId,
        req.body.events,
      );
      res.status(201).json({ success: true, data: { count: result.count } });
    } catch (err) {
      next(err);
    }
  },

  async getPreferredMaxDistanceSummary(req, res, next) {
    try {
      const data = await analyticsService.getPreferredMaxDistanceSummary(req.query);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
  async getMyPreferredMaxDistance(req, res, next) {
    try {
      const userId = req.user?.userId;
      const data = await analyticsService.getMyPreferredMaxDistance(userId, req.query);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async trackSearchEvent(req, res, next) {
    try {
      const actorUserId = req.user?.userId || null;
      const result = await analyticsService.trackSearchEvent(
        actorUserId,
        req.body,
      );
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async getTopSearchedZones(req, res, next) {
    try {
      const data = await analyticsService.getTopSearchedZones(req.query);
      res.json({ success: true, data: { zones: data } });
    } catch (err) {
      next(err);
    }
  },

  async getSessionStats(req, res, next) {
    try {
      const data = await analyticsService.getSessionStats(req.query);
      res.json({ success: true, data });
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

  async getCrashStats(req, res, next) {
    try {
      const data = await analyticsService.getCrashStats(req.query);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async getSupplyDensity(req, res, next) {
    try {
      const data = await analyticsService.getSupplyDensityStats();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = analyticsController;