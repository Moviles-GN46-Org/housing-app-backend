const favoriteService = require('../services/favoriteService');

const favoriteController = {
  async toggleFavorite(req, res, next) {
    try {
      const result = await favoriteService.toggleFavorite(req.user.userId, req.params.propertyId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async listFavorites(req, res, next) {
    try {
      const favorites = await favoriteService.listUserFavorites(req.user.userId);
      res.json({ success: true, data: favorites });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = favoriteController;
