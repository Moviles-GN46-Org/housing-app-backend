-- ============================================================================
-- Search Analytics: SQL examples
-- ============================================================================

-- 1) Top searched zones for current period with unique users.
-- Use this to compare against GET /analytics/top-searched-zones.
SELECT
  "city",
  "canonicalZone",
  MAX("neighborhood") AS "neighborhood",
  COUNT(*)::int AS "searches",
  COUNT(DISTINCT COALESCE("userId", 'session:' || "sessionId"))::int AS "uniqueUsers"
FROM "SearchEvent"
WHERE "searchedAt" >= $1
  AND "searchedAt" < $2
  AND "city" = $3
GROUP BY "city", "canonicalZone"
ORDER BY "searches" DESC, "uniqueUsers" DESC, "canonicalZone" ASC
LIMIT $4;

-- 2) Previous period aggregation by zone for trend calculation.
SELECT
  "canonicalZone",
  COUNT(*)::int AS "searches"
FROM "SearchEvent"
WHERE "searchedAt" >= $1
  AND "searchedAt" < $2
  AND "city" = $3
GROUP BY "canonicalZone";

-- 3) Ad-hoc verification: canonical equivalence for Santa Fe variants.
SELECT
  "city",
  "neighborhood",
  "canonicalZone",
  "searchedAt"
FROM "SearchEvent"
WHERE "city" = 'bogota'
  AND "canonicalZone" = 'bogota|santa fe'
ORDER BY "searchedAt" DESC;

-- 4) Fast count in period (raw events).
SELECT COUNT(*)::int AS total_search_events
FROM "SearchEvent"
WHERE "searchedAt" >= $1
  AND "searchedAt" < $2;

-- 5) Optional index health check (PostgreSQL).
EXPLAIN ANALYZE
SELECT
  "city",
  "canonicalZone",
  COUNT(*)::int
FROM "SearchEvent"
WHERE "searchedAt" >= $1
  AND "searchedAt" < $2
  AND "city" = $3
GROUP BY "city", "canonicalZone"
ORDER BY COUNT(*) DESC
LIMIT 10;
