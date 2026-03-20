
const prisma = require('../prisma');

const reportRepository = {
  async create(data) {
    return prisma.report.create({ data });
  },

  async findPending() {
    return prisma.report.findMany({
      where: { status: 'PENDING' },
      include: {
        reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
        reportedUser: { select: { id: true, firstName: true, lastName: true, email: true } },
        property: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  },

  async findById(id) {
    return prisma.report.findUnique({
      where: { id },
      include: {
        reporter: true,
        property: true,
      },
    });
  },

  async update(id, data) {
    return prisma.report.update({ where: { id }, data });
  },
};

module.exports = reportRepository;
