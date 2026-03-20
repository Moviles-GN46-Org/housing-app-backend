const notificationService = require('../services/notificationService');

const notificationController = {
  async list(req, res, next) {
    try {
      const notifications = await notificationService.list(req.user.userId);
      res.json({ success: true, data: notifications });
    } catch (err) {
      next(err);
    }
  },

  async markRead(req, res, next) {
    try {
      const result = await notificationService.markRead(req.params.id, req.user.userId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async markAllRead(req, res, next) {
    try {
      const result = await notificationService.markAllRead(req.user.userId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = notificationController;
