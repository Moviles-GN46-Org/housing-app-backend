
const prisma = require('../prisma');

const roommateRepository = {
  async getProfile(userId) {
    return prisma.roommateProfile.findUnique({ where: { userId } });
  },

  async upsertProfile(userId, data) {
    return prisma.roommateProfile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  },

  async getActiveProfiles(excludeUserId) {
    return prisma.roommateProfile.findMany({
      where: { isActive: true, userId: { not: excludeUserId } },
      include: { user: { select: { id: true, firstName: true, lastName: true, profilePictureUrl: true } } },
    });
  },

  async getAlreadySwiped(swiperId) {
    const swipes = await prisma.roommateSwipe.findMany({ where: { swiperId }, select: { swipedId: true } });
    return swipes.map((s) => s.swipedId);
  },

  async createSwipe(swiperId, swipedId, direction) {
    return prisma.roommateSwipe.upsert({
      where: { swiperId_swipedId: { swiperId, swipedId } },
      create: { swiperId, swipedId, direction },
      update: { direction },
    });
  },

  async findReverseSwipe(swipedId, swiperId) {
    return prisma.roommateSwipe.findUnique({
      where: { swiperId_swipedId: { swiperId: swipedId, swipedId: swiperId } },
    });
  },

  async findMatch(user1Id, user2Id) {
    const [a, b] = [user1Id, user2Id].sort();
    return prisma.roommateMatch.findUnique({ where: { user1Id_user2Id: { user1Id: a, user2Id: b } } });
  },

  async createMatch(user1Id, user2Id, chatId) {
    const [a, b] = [user1Id, user2Id].sort();
    return prisma.roommateMatch.create({ data: { user1Id: a, user2Id: b, chatId } });
  },

  async updateMatchChat(matchId, chatId) {
    return prisma.roommateMatch.update({ where: { id: matchId }, data: { chatId } });
  },

  async getMatches(userId) {
    return prisma.roommateMatch.findMany({
      where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
      orderBy: { createdAt: 'desc' },
    });
  },
};

module.exports = roommateRepository;
