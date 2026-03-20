
const prisma = require('../prisma');

const propertyRepository = {
  async findByFilters({ maxPrice, minBedrooms, furnished, petFriendly, neighborhood, status }) {
    const where = { status: status || 'ACTIVE' };
    if (maxPrice) where.monthlyRent = { lte: maxPrice };
    if (minBedrooms) where.bedrooms = { gte: parseInt(minBedrooms) };
    if (furnished !== undefined) where.furnished = furnished === 'true' || furnished === true;
    if (petFriendly !== undefined) where.petFriendly = petFriendly === 'true' || petFriendly === true;
    if (neighborhood) where.neighborhood = { contains: neighborhood, mode: 'insensitive' };

    return prisma.property.findMany({
      where,
      include: {
        landlord: { include: { landlordVerification: true } },
        reviews: { select: { rating: true } },
      },
      orderBy: { publishedAt: 'desc' },
    });
  },

  async findById(id) {
    return prisma.property.findUnique({
      where: { id },
      include: {
        landlord: { include: { landlordVerification: true } },
        reviews: {
          where: { isVisible: true },
          include: { author: { select: { id: true, firstName: true, lastName: true, profilePictureUrl: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  },

  async findByLandlord(landlordId) {
    return prisma.property.findMany({
      where: { landlordId },
      include: {
        landlord: { include: { landlordVerification: true } },
        reviews: { select: { rating: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async create(data) {
    return prisma.property.create({
      data,
      include: {
        landlord: { include: { landlordVerification: true } },
      },
    });
  },

  async update(id, data) {
    return prisma.property.update({
      where: { id },
      data,
      include: {
        landlord: { include: { landlordVerification: true } },
      },
    });
  },

  async updateStatus(id, status) {
    return prisma.property.update({ where: { id }, data: { status } });
  },

  async countByLandlord(landlordId) {
    return prisma.property.count({ where: { landlordId } });
  },
};

module.exports = propertyRepository;
