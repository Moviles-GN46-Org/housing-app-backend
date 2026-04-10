const prisma = require('../prisma');
const { Prisma } = require('@prisma/client');

const analyticsRepository = {
  async logEvent({ userId, sessionId, eventType, payload, screenName }) {
    return prisma.analyticsEvent.create({
      data: { userId: userId || null, sessionId, eventType, payload, screenName: screenName || null },
    });
  },

  async logMany(events) {
    return prisma.analyticsEvent.createMany({ data: events });
  },

  async findRecentSearchDuplicate({ userId, sessionId, canonicalZone, filtersHash, source, searchedAt, dedupeWindowSeconds }) {
    const windowStart = new Date(searchedAt.getTime() - dedupeWindowSeconds * 1000);
    const identityFilter = userId ? { OR: [{ userId }, { sessionId }] } : { sessionId };
    return prisma.searchEvent.findFirst({
      where: { ...identityFilter, canonicalZone, filtersHash, source, searchedAt: { gte: windowStart, lte: searchedAt } },
      orderBy: { searchedAt: 'desc' },
    });
  },

  async createSearchEvent(data) {
    return prisma.searchEvent.create({ data });
  },

  async getTopSearchedZonesCurrent({ from, to, city, limit }) {
    const cityFilter = city ? Prisma.sql`AND "city" = ${city}` : Prisma.empty;
    return prisma.$queryRaw`
      SELECT "city", "canonicalZone", MAX("neighborhood") AS "neighborhood", 
      COUNT(*)::int AS "searches", COUNT(DISTINCT COALESCE("userId", 'session:' || "sessionId"))::int AS "uniqueUsers"
      FROM "SearchEvent" WHERE "searchedAt" >= ${from} AND "searchedAt" < ${to} ${cityFilter}
      GROUP BY "city", "canonicalZone" ORDER BY "searches" DESC LIMIT ${limit}
    `;
  },

  async getTopSearchedZonesPrevious({ from, to, city }) {
    const cityFilter = city ? Prisma.sql`AND "city" = ${city}` : Prisma.empty;
    return prisma.$queryRaw`
      SELECT "canonicalZone", COUNT(*)::int AS "searches"
      FROM "SearchEvent" WHERE "searchedAt" >= ${from} AND "searchedAt" < ${to} ${cityFilter}
      GROUP BY "canonicalZone"
    `;
  },

  async getDashboard() {
    const [totalEvents, byType] = await Promise.all([
      prisma.analyticsEvent.count(),
      prisma.analyticsEvent.groupBy({ by: ['eventType'], _count: { id: true }, orderBy: { _count: { id: 'desc' } } }),
    ]);
    return { totalEvents, byType };
  },

  async getCrashStats({ from, to }) {
    const where = { eventType: 'CRASH', ...(from || to ? { timestamp: { gte: from, lte: to } } : {}) };
    const [total, byScreen] = await Promise.all([
      prisma.analyticsEvent.count({ where }),
      prisma.analyticsEvent.groupBy({ by: ['screenName'], where, _count: { id: true } }),
    ]);
    return { total, screens: byScreen.map(row => ({ name: row.screenName || 'Unknown', crashes: row._count.id })) };
  },

  async getSupplyDensityStats() {
    const results = await prisma.$queryRaw`
      SELECT AVG((payload->>'value')::float) as "averageDensity", COUNT(*)::int as "totalChecks"
      FROM "AnalyticsEvent" WHERE "eventType"::text = 'SUPPLY_DENSITY_CHECK'
    `;
    const stats = results[0];
    return {
      averageDensity: stats.averageDensity || 0,
      totalChecks: stats.totalChecks || 0,
      status: (stats.averageDensity > 0.4) ? 'High Supply' : 'High Demand'
    };
  },
};

module.exports = analyticsRepository;