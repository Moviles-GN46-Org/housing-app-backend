
const prisma = require('../prisma');

const chatRepository = {
  async findById(id) {
    return prisma.chat.findUnique({
      where: { id },
      include: {
        participants: { include: { user: { select: { id: true, firstName: true, lastName: true, role: true, profilePictureUrl: true } } } },
        property: { select: { id: true, title: true, imageUrls: true } },
      },
    });
  },

  async findByUser(userId) {
    return prisma.chat.findMany({
      where: {
        participants: { some: { userId } },
        status: { not: 'BLOCKED' },
      },
      include: {
        participants: { include: { user: { select: { id: true, firstName: true, lastName: true, role: true, profilePictureUrl: true } } } },
        property: { select: { id: true, title: true, imageUrls: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    });
  },

  async findByPropertyAndStudent(propertyId, studentId) {
    return prisma.chat.findFirst({
      where: {
        propertyId,
        participants: { some: { userId: studentId } },
      },
    });
  },

  async create(data) {
    return prisma.chat.create({ data });
  },

  async addParticipant(chatId, userId) {
    return prisma.chatParticipant.create({ data: { chatId, userId } });
  },

  async getMessages(chatId, after) {
    const where = { chatId };
    if (after) where.createdAt = { gt: new Date(after) };
    return prisma.message.findMany({
      where,
      include: { sender: { select: { id: true, firstName: true, lastName: true, profilePictureUrl: true } } },
      orderBy: { createdAt: 'asc' },
    });
  },

  async createMessage(data) {
    return prisma.message.create({
      data,
      include: { sender: { select: { id: true, firstName: true, lastName: true, profilePictureUrl: true } } },
    });
  },

  async isParticipant(chatId, userId) {
    const record = await prisma.chatParticipant.findUnique({ where: { chatId_userId: { chatId, userId } } });
    return !!record;
  },

  async updateTimestamp(chatId) {
    return prisma.chat.update({ where: { id: chatId }, data: { updatedAt: new Date() } });
  },

  async findMessageById(id) {
    return prisma.message.findUnique({ where: { id } });
  },
};

module.exports = chatRepository;
