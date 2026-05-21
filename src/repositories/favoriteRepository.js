
const prisma = require('../prisma');

const favoriteRepository = {
  async create(data) {
    return prisma.favorite.create({ data });
  },

  async findByUserAndProperty(userId, propertyId) {
    return prisma.favorite.findUnique({
      where: { userId_propertyId: { userId, propertyId } },
    });
  },

  async findByUser(userId) {
    return prisma.favorite.findMany({
      where: { userId },
      include: { Property: true },
      orderBy: { createdAt: 'desc' },
    });
  },

  async delete(id) {
    return prisma.favorite.delete({ where: { id } });
  },
};

module.exports = favoriteRepository;
