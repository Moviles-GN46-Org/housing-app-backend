const crypto = require('crypto');
const favoriteRepository = require('../repositories/favoriteRepository');
const propertyRepository = require('../repositories/propertyRepository');
const logger = require('../utils/logger');
const { NotFoundError } = require('../utils/errors');

const favoriteService = {
  async toggleFavorite(userId, propertyId) {
    const property = await propertyRepository.findById(propertyId);
    if (!property) throw new NotFoundError('Property not found');

    const existing = await favoriteRepository.findByUserAndProperty(userId, propertyId);

    if (existing) {
      await favoriteRepository.delete(existing.id);
      logger.info('Favorite removed', { userId, propertyId });
      return { id: existing.id, propertyId, removed: true };
    }

    const favorite = await favoriteRepository.create({
      id: crypto.randomUUID(),
      userId,
      propertyId,
    });
    logger.info('Favorite added', { userId, propertyId });
    return { ...favorite, removed: false };
  },

  async listUserFavorites(userId) {
    return favoriteRepository.findByUser(userId);
  },
};

module.exports = favoriteService;
