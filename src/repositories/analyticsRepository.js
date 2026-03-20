
const prisma = require('../prisma');

const analyticsRepository = {
  async logEvent({ userId, sessionId, eventType, payload, screenName }) {
    return prisma.analyticsEvent.create({
      data: { userId: userId || null, sessionId, eventType, payload, screenName: screenName || null },
    });
  },

  async logMany(events) {
    return prisma.analyticsEvent.createMany({ data: events });
  },

  async getDashboard() {
    const [totalEvents, byType] = await Promise.all([
      prisma.analyticsEvent.count(),
      prisma.analyticsEvent.groupBy({
        by: ['eventType'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
    ]);
    return { totalEvents, byType };
  },
};

module.exports = analyticsRepository;
