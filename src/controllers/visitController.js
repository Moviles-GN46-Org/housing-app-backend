const visitService = require('../services/visitService');

const visitController = {
  async list(req, res, next) {
    try {
      const visits = await visitService.listVisits(req.user.userId);
      res.json({ success: true, data: visits });
    } catch (err) {
      next(err);
    }
  },

  async cancel(req, res, next) {
    try {
      const visit = await visitService.cancelVisit(req.params.id, req.user.userId);
      res.json({ success: true, data: { id: visit.id, status: visit.status } });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = visitController;
