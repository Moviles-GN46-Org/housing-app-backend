const roommateService = require('../services/roommateService');
const { toRoommateProfileDTO } = require('../dtos/roommate.dto');

const roommateController = {
  async getProfile(req, res, next) {
    try {
      const profile = await roommateService.getProfile(req.user.userId);
      res.json({ success: true, data: toRoommateProfileDTO(profile) });
    } catch (err) {
      next(err);
    }
  },

  async upsertProfile(req, res, next) {
    try {
      const profile = await roommateService.upsertProfile(req.user.userId, req.body);
      res.json({ success: true, data: toRoommateProfileDTO(profile) });
    } catch (err) {
      next(err);
    }
  },

  async getCandidates(req, res, next) {
    try {
      const candidates = await roommateService.getCandidates(req.user.userId);
      res.json({ success: true, data: candidates.map(toRoommateProfileDTO) });
    } catch (err) {
      next(err);
    }
  },

  async swipe(req, res, next) {
    try {
      const result = await roommateService.swipe(req.user.userId, req.body);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async getMatches(req, res, next) {
    try {
      const matches = await roommateService.getMatches(req.user.userId);
      res.json({ success: true, data: matches });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = roommateController;
