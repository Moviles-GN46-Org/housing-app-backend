const notificationRepository = require('../repositories/notificationRepository');

const notificationService = {
  async create({ userId, type, title, body, data }) {
    return notificationRepository.create({ userId, type, title, body, data: data || null });
  },

  async list(userId) {
    return notificationRepository.findByUser(userId);
  },

  async markRead(id, userId) {
    await notificationRepository.markRead(id, userId);
    return { message: 'Notification marked as read' };
  },

  async markAllRead(userId) {
    await notificationRepository.markAllRead(userId);
    return { message: 'All notifications marked as read' };
  },
};

module.exports = notificationService;
