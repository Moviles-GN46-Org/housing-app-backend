const prisma = require("../prisma");

const favoritesRepository = {
  async addToFavorites(userId, propertyId) {
    return prisma.favorite.create({
      data: {
        userId,
        propertyId,
      },
      include: {
        property: {
          include: {
            landlord: { include: { landlordVerification: true } },
            reviews: { select: { rating: true } },
          },
        },
      },
    });
  },

  async removeFromFavorites(userId, propertyId) {
    return prisma.favorite.delete({
      where: {
        userId_propertyId: {
          userId,
          propertyId,
        },
      },
    });
  },

  async isFavorited(userId, propertyId) {
    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_propertyId: {
          userId,
          propertyId,
        },
      },
    });
    return !!favorite;
  },

  async getFavoritesByUser(userId, { page = 1, limit = 20 } = {}) {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [favorites, total] = await Promise.all([
      prisma.favorite.findMany({
        where: { userId },
        include: {
          property: {
            include: {
              landlord: { include: { landlordVerification: true } },
              reviews: { select: { rating: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.favorite.count({ where: { userId } }),
    ]);

    return {
      favorites,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    };
  },

  async getFavoriteIds(userId) {
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      select: { propertyId: true },
    });
    return favorites.map((f) => f.propertyId);
  },

  async countFavoritesForProperty(propertyId) {
    return prisma.favorite.count({ where: { propertyId } });
  },

  async deleteFavoritesByProperty(propertyId) {
    return prisma.favorite.deleteMany({ where: { propertyId } });
  },

  async deleteFavoritesByUser(userId) {
    return prisma.favorite.deleteMany({ where: { userId } });
  },
};

module.exports = favoritesRepository;
