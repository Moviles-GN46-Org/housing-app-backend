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

  async listRadiusSearches({ from, to, userId }) {
    const where = {
      searchedAt: { gte: from, lt: to },
      source: { not: "map" },
      radiusKm: {
        not: null,
        gt: 0,
      },
    };
    
    if (userId) where.userId = userId;
    return prisma.searchEvent.findMany({
      where,
      select: { radiusKm: true, searchedAt: true },
      orderBy: { searchedAt: "asc" },
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

  async getPopularApartmentSizesNearLocation({ latitude, longitude, radiusKm, limit = 3, bucketSize = 5 }) {
    return prisma.$queryRaw`
      WITH nearby_properties AS (
        SELECT
          "sizeM2",
          FLOOR("sizeM2" / ${bucketSize})::int * ${bucketSize} AS "bucketMinM2"
        FROM "Property"
        WHERE "status" = 'ACTIVE'
          AND "propertyType" = 'APARTMENT'
          AND "sizeM2" IS NOT NULL
          AND (
            6371 * ACOS(
              LEAST(1, GREATEST(-1,
                COS(RADIANS(${latitude})) * COS(RADIANS("latitude")) * COS(RADIANS("longitude") - RADIANS(${longitude})) +
                SIN(RADIANS(${latitude})) * SIN(RADIANS("latitude"))
              ))
            )
          ) <= ${radiusKm}
      )
      SELECT
        "bucketMinM2",
        ("bucketMinM2" + ${bucketSize} - 1)::int AS "bucketMaxM2",
        COUNT(*)::int AS "count",
        ROUND(AVG("sizeM2")::numeric, 1)::float AS "avgSizeM2"
      FROM nearby_properties
      GROUP BY "bucketMinM2"
      ORDER BY "count" DESC, "bucketMinM2" ASC
      LIMIT ${limit}
    `;
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

  async getSupplyDensityStats() {
    const results = await prisma.$queryRaw`
      SELECT AVG((payload->>'value')::float) as "averageDensity", COUNT(*)::int as "totalChecks"
      FROM "AnalyticsEvent" WHERE "eventType"::text = 'SUPPLY_DENSITY_CHECK'
    `;

    
    const stats = results[0];

    return {
      averageDensity: stats?.averageDensity || 0,
      totalChecks: stats?.totalChecks || 0,
      status: (stats?.averageDensity > 0.4) ? 'High Supply' : 'High Demand'
    };
  },

  async getLocalidadStats() {
    return prisma.$queryRaw`
      SELECT 
        COALESCE(payload->>'localidad', 'Desconocida') AS "localidad", 
        COUNT(*)::int AS "conteo"
      FROM "AnalyticsEvent"
      WHERE "eventType"::text = 'LOCATION_STATS_UPDATE'
      GROUP BY payload->>'localidad'
      ORDER BY "conteo" DESC
    `;
  },
};

module.exports = analyticsRepository;
