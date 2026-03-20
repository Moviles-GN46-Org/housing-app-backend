
const prisma = require('../prisma');

const notificationRepository = {
  async create(data) {
    return prisma.notification.create({ data });
  },

  async findByUser(userId) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async markRead(id, userId) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  },

  async markAllRead(userId) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  },
};

module.exports = notificationRepository;
