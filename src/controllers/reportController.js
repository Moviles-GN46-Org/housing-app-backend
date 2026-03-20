const reportService = require('../services/reportService');

const reportController = {
  async create(req, res, next) {
    try {
      const report = await reportService.create(req.user.userId, req.body);
      res.status(201).json({ success: true, data: { id: report.id, status: report.status } });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = reportController;
