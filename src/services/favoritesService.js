const favoritesRepository = require("../repositories/favoritesRepository");
const propertyRepository = require("../repositories/propertyRepository");
const userRepository = require("../repositories/userRepository");
const appEvents = require("../events/eventEmitter");
const logger = require("../utils/logger");
const {
  NotFoundError,
  ValidationError,
  ConflictError,
} = require("../utils/errors");

const favoritesService = {
  async addToFavorites(userId, propertyId) {
    // Validate user exists
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError("User not found");

    // Validate property exists
    const property = await propertyRepository.findById(propertyId);
    if (!property) throw new NotFoundError("Property not found");

    // Check if already favorited
    const isFavorited = await favoritesRepository.isFavorited(
      userId,
      propertyId,
    );
    if (isFavorited) {
      throw new ConflictError("Property is already in favorites");
    }

    // Add to favorites
    const favorite = await favoritesRepository.addToFavorites(
      userId,
      propertyId,
    );

    // Emit event
    appEvents.emit("favorite:added", {
      userId,
      propertyId,
      property,
      user,
    });

    logger.info("Property added to favorites", { userId, propertyId });
    return favorite;
  },

  async removeFromFavorites(userId, propertyId) {
    // Validate user exists
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError("User not found");

    // Validate property exists
    const property = await propertyRepository.findById(propertyId);
    if (!property) throw new NotFoundError("Property not found");

    // Check if favorited
    const isFavorited = await favoritesRepository.isFavorited(
      userId,
      propertyId,
    );
    if (!isFavorited) {
      throw new NotFoundError("Property is not in favorites");
    }

    // Remove from favorites
    await favoritesRepository.removeFromFavorites(userId, propertyId);

    // Emit event
    appEvents.emit("favorite:removed", {
      userId,
      propertyId,
      property,
      user,
    });

    logger.info("Property removed from favorites", { userId, propertyId });
  },

  async getFavorites(userId, pagination = {}) {
    // Validate user exists
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError("User not found");

    const result = await favoritesRepository.getFavoritesByUser(
      userId,
      pagination,
    );

    logger.debug("Favorites retrieved", {
      userId,
      count: result.favorites.length,
    });
    return result;
  },

  async isFavorited(userId, propertyId) {
    if (!userId || !propertyId) {
      return false;
    }

    try {
      return await favoritesRepository.isFavorited(userId, propertyId);
    } catch (error) {
      logger.error("Error checking if property is favorited", {
        userId,
        propertyId,
        error: error.message,
      });
      return false;
    }
  },

  async getFavoriteIds(userId) {
    if (!userId) {
      return [];
    }

    try {
      return await favoritesRepository.getFavoriteIds(userId);
    } catch (error) {
      logger.error("Error retrieving favorite IDs", {
        userId,
        error: error.message,
      });
      return [];
    }
  },

  async toggleFavorite(userId, propertyId) {
    const isFavorited = await favoritesRepository.isFavorited(
      userId,
      propertyId,
    );

    if (isFavorited) {
      await this.removeFromFavorites(userId, propertyId);
      return { action: "removed", isFavorited: false };
    } else {
      await this.addToFavorites(userId, propertyId);
      return { action: "added", isFavorited: true };
    }
  },
};

module.exports = favoritesService;
