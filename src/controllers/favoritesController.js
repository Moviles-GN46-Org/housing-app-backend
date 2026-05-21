const favoritesService = require("../services/favoritesService");
const { toFavoriteDTO, toFavoritesListDTO } = require("../dtos/favorites.dto");

const favoritesController = {
  async addToFavorites(req, res, next) {
    try {
      const userId = req.user.userId;
      const { propertyId } = req.params;

      if (!propertyId) {
        return res.status(400).json({
          success: false,
          error: "propertyId is required",
        });
      }

      const favorite = await favoritesService.addToFavorites(
        userId,
        propertyId,
      );
      res.status(201).json({
        success: true,
        data: toFavoriteDTO(favorite),
      });
    } catch (err) {
      next(err);
    }
  },

  async removeFromFavorites(req, res, next) {
    try {
      const userId = req.user.userId;
      const { propertyId } = req.params;

      if (!propertyId) {
        return res.status(400).json({
          success: false,
          error: "propertyId is required",
        });
      }

      await favoritesService.removeFromFavorites(userId, propertyId);
      res.json({
        success: true,
        message: "Property removed from favorites",
      });
    } catch (err) {
      next(err);
    }
  },

  async toggleFavorite(req, res, next) {
    try {
      const userId = req.user.userId;
      const { propertyId } = req.params;

      if (!propertyId) {
        return res.status(400).json({
          success: false,
          error: "propertyId is required",
        });
      }

      const result = await favoritesService.toggleFavorite(userId, propertyId);
      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },

  async getFavorites(req, res, next) {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 20 } = req.query;

      const result = await favoritesService.getFavorites(userId, {
        page,
        limit,
      });
      res.json({
        success: true,
        data: {
          favorites: toFavoritesListDTO(result.favorites),
          total: result.total,
          page: result.page,
          limit: result.limit,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async isFavorited(req, res, next) {
    try {
      const userId = req.user.userId;
      const { propertyId } = req.params;

      if (!propertyId) {
        return res.status(400).json({
          success: false,
          error: "propertyId is required",
        });
      }

      const isFavorited = await favoritesService.isFavorited(
        userId,
        propertyId,
      );
      res.json({
        success: true,
        data: { isFavorited, propertyId },
      });
    } catch (err) {
      next(err);
    }
  },

  async getFavoriteIds(req, res, next) {
    try {
      const userId = req.user.userId;

      const favoriteIds = await favoritesService.getFavoriteIds(userId);
      res.json({
        success: true,
        data: {
          favoriteIds,
          count: favoriteIds.length,
        },
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = favoritesController;
