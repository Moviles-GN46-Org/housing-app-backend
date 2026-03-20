
const prisma = require('../prisma');

const visitRepository = {
  async create(data) {
    return prisma.visit.create({ data });
  },

  async findById(id) {
    return prisma.visit.findUnique({ where: { id } });
  },

  async findByUser(userId) {
    return prisma.visit.findMany({
      where: { OR: [{ studentId: userId }, { landlordId: userId }] },
      orderBy: { scheduledAt: 'asc' },
    });
  },

  async update(id, data) {
    return prisma.visit.update({ where: { id }, data });
  },
};

module.exports = visitRepository;
