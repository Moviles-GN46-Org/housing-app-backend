const prisma = require("../prisma");
const { Prisma } = require("@prisma/client");

const analyticsRepository = {
  async logEvent({ userId, sessionId, eventType, payload, screenName }) {
    return prisma.analyticsEvent.create({
      data: {
        userId: userId || null,
        sessionId,
        eventType,
        payload,
        screenName: screenName || null,
      },
    });
  },

  async logMany(events) {
    return prisma.analyticsEvent.createMany({ data: events });
  },

  async findRecentSearchDuplicate({
    userId,
    sessionId,
    canonicalZone,
    filtersHash,
    source,
    searchedAt,
    dedupeWindowSeconds,
  }) {
    const windowStart = new Date(
      searchedAt.getTime() - dedupeWindowSeconds * 1000,
    );

    const identityFilter = userId
      ? {
          OR: [{ userId }, { sessionId }],
        }
      : { sessionId };

    return prisma.searchEvent.findFirst({
      where: {
        ...identityFilter,
        canonicalZone,
        filtersHash,
        source,
        searchedAt: {
          gte: windowStart,
          lte: searchedAt,
        },
      },
      orderBy: { searchedAt: "desc" },
    });
  },

  async createSearchEvent(data) {
    return prisma.searchEvent.create({ data });
  },

  async getTopSearchedZonesCurrent({ from, to, city, limit }) {
    const cityFilter = city ? Prisma.sql`AND "city" = ${city}` : Prisma.empty;

    return prisma.$queryRaw`
      SELECT
        "city" AS "city",
        "canonicalZone" AS "canonicalZone",
        MAX("neighborhood") AS "neighborhood",
        COUNT(*)::int AS "searches",
        COUNT(DISTINCT COALESCE("userId", 'session:' || "sessionId"))::int AS "uniqueUsers"
      FROM "SearchEvent"
      WHERE "searchedAt" >= ${from}
        AND "searchedAt" < ${to}
        ${cityFilter}
      GROUP BY "city", "canonicalZone"
      ORDER BY "searches" DESC, "uniqueUsers" DESC, "canonicalZone" ASC
      LIMIT ${limit}
    `;
  },

  async getTopSearchedZonesPrevious({ from, to, city }) {
    const cityFilter = city ? Prisma.sql`AND "city" = ${city}` : Prisma.empty;

    return prisma.$queryRaw`
      SELECT
        "canonicalZone" AS "canonicalZone",
        COUNT(*)::int AS "searches"
      FROM "SearchEvent"
      WHERE "searchedAt" >= ${from}
        AND "searchedAt" < ${to}
        ${cityFilter}
      GROUP BY "canonicalZone"
    `;
  },

  async getDashboard() {
    const [totalEvents, byType] = await Promise.all([
      prisma.analyticsEvent.count(),
      prisma.analyticsEvent.groupBy({
        by: ["eventType"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      }),
    ]);
    return { totalEvents, byType };
  },

  async getSessionStats({ days = 7 } = {}) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [overall, daily] = await Promise.all([
      prisma.$queryRaw`
        SELECT
          ROUND(AVG(duration_seconds)::numeric, 1)::float AS "avgSeconds",
          MIN(duration_seconds)::float                    AS "minSeconds",
          MAX(duration_seconds)::float                    AS "maxSeconds",
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration_seconds)::float AS "medianSeconds"
        FROM (
          SELECT EXTRACT(EPOCH FROM (e."timestamp" - s."timestamp"))::float AS duration_seconds
          FROM "AnalyticsEvent" s
          JOIN "AnalyticsEvent" e
            ON  e."sessionId" = s."sessionId"
            AND e."eventType" = 'SESSION_END'
          WHERE s."eventType" = 'SESSION_START'
            AND EXTRACT(EPOCH FROM (e."timestamp" - s."timestamp")) BETWEEN 0 AND 7200
        ) sessions
      `,
      prisma.$queryRaw`
        SELECT
          TO_CHAR(DATE_TRUNC('day', s."timestamp"), 'Dy') AS "day",
          ROUND(AVG(EXTRACT(EPOCH FROM (e."timestamp" - s."timestamp")))::numeric / 60, 2)::float AS "avgMinutes"
        FROM "AnalyticsEvent" s
        JOIN "AnalyticsEvent" e
          ON  e."sessionId" = s."sessionId"
          AND e."eventType" = 'SESSION_END'
        WHERE s."eventType" = 'SESSION_START'
          AND s."timestamp" >= ${since}
          AND EXTRACT(EPOCH FROM (e."timestamp" - s."timestamp")) BETWEEN 0 AND 7200
        GROUP BY DATE_TRUNC('day', s."timestamp")
        ORDER BY DATE_TRUNC('day', s."timestamp") ASC
      `,
    ]);

    return { overall: overall[0] || null, daily };
  },

  async getCrashStats({ from, to }) {
    const dateFilter = {};
    if (from) dateFilter.gte = from;
    if (to) dateFilter.lte = to;

    const where = {
      eventType: "CRASH",
      ...(from || to ? { timestamp: dateFilter } : {}),
    };

    const [total, byScreen] = await Promise.all([
      prisma.analyticsEvent.count({ where }),
      prisma.analyticsEvent.groupBy({
        by: ["screenName"],
        where,
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      }),
    ]);

    return {
      total,
      screens: byScreen.map((row) => ({
        name: row.screenName || "Unknown",
        crashes: row._count.id,
      })),
    };
  },
};

module.exports = analyticsRepository;
