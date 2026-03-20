
const prisma = require('../prisma');

const reviewRepository = {
  async findByProperty(propertyId) {
    return prisma.review.findMany({
      where: { propertyId, isVisible: true },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, profilePictureUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async findByAuthorAndProperty(authorId, propertyId) {
    return prisma.review.findUnique({ where: { propertyId_authorId: { propertyId, authorId } } });
  },

  async create(data) {
    return prisma.review.create({
      data,
      include: {
        author: { select: { id: true, firstName: true, lastName: true, profilePictureUrl: true } },
        property: { select: { id: true, title: true } },
      },
    });
  },
};

module.exports = reviewRepository;
