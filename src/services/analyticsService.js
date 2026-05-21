const analyticsRepository = require("../repositories/analyticsRepository");
const roommateRepository = require("../repositories/roommateRepository");
const universityRepository = require("../repositories/universityRepository");
const { ValidationError } = require("../utils/errors");
const {
  normalizeText,
  canonicalizeNeighborhood,
  buildCanonicalZone,
  buildFiltersHash,
  sanitizeQuery,
} = require("../utils/searchAnalytics");

const VALID_EVENT_TYPES = [
  "SESSION_START",
  "SESSION_END",
  "SEARCH",
  "PROPERTY_VIEW",
  "FILTER_APPLIED",
  "FEATURE_CLICK",
  "MAP_INTERACTION",
  "CHAT_STARTED",
  "REVIEW_SUBMITTED",
  "VISIT_SCHEDULED",
  "CRASH",
  "SUPPLY_DENSITY_CHECK",
  "LOCATION_STATS_UPDATE",
  "FEATURE_LOAD_TIME",
];

const MAX_FEATURE_LOAD_DURATION_MS = 120000;

const VALID_SEARCH_SOURCES = ["house_list", "map"];
const DEDUPE_WINDOW_SECONDS = 45;
const DEFAULT_TOP_ZONES_LIMIT = 10;
const MAX_TOP_ZONES_LIMIT = 50;
const MAX_SESSION_ID_LENGTH = 120;
const MAX_QUERY_LENGTH = 500;
const MAX_CITY_LENGTH = 120;
const MAX_NEIGHBORHOOD_LENGTH = 120;
const MAX_RADIUS_KM = 500;
const DEFAULT_APARTMENT_BUCKET_SIZE = 5;
const DEFAULT_POPULAR_SIZES_LIMIT = 3;
const MAX_FILTER_CATEGORY_LENGTH = 120;
const MAX_FILTER_VALUE_LENGTH = 120;
const MAX_FILTER_USAGE_ITEMS = 100;

function toNumberOrNull(value, fieldName) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new ValidationError(`${fieldName} must be a valid number`);
  }

  return parsed;
}

function formatSizeBucket(bucketMinM2, bucketMaxM2) {
  return `${bucketMinM2}-${bucketMaxM2} m2`;
}

function toBooleanFlag(value) {
  return value === true || value === "true";
}

function toPositiveLimit(value) {
  if (value === undefined || value === null || value === "") {
    return DEFAULT_TOP_ZONES_LIMIT;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ValidationError("limit must be a positive integer");
  }

  return Math.min(parsed, MAX_TOP_ZONES_LIMIT);
}

function calculateTrendVsPrevious(currentSearches, previousSearches) {
  if (previousSearches === 0) {
    return currentSearches > 0 ? 100 : 0;
  }

  const pct = ((currentSearches - previousSearches) / previousSearches) * 100;
  return Number(pct.toFixed(2));
}

function toNullableNumber(value, fieldName) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new ValidationError(`${fieldName} must be a valid number`);
  }

  return parsed;
}

function validateCoordinateRange(lat, lng) {
  if ((lat === null) !== (lng === null)) {
    throw new ValidationError("lat and lng must be provided together");
  }
  if (lat !== null && (lat < -90 || lat > 90)) {
    throw new ValidationError("lat must be between -90 and 90");
  }
  if (lng !== null && (lng < -180 || lng > 180)) {
    throw new ValidationError("lng must be between -180 and 180");
  }
}

function validateSearchSignal({
  normalizedNeighborhood,
  sanitizedQuery,
  lat,
  lng,
}) {
  if (
    !normalizedNeighborhood &&
    !sanitizedQuery &&
    lat === null &&
    lng === null
  ) {
    throw new ValidationError(
      "A valid search must include neighborhood, query, or lat/lng",
    );
  }
}

function normalizeFilterUsageItems(payload) {
  const { filter, filters } = payload || {};

  if (
    filter !== undefined &&
    (typeof filter !== "object" || Array.isArray(filter))
  ) {
    throw new ValidationError(
      "filter must be an object with category and value",
    );
  }

  let rawItems;
  if (Array.isArray(filters)) {
    rawItems = filters;
  } else if (filter) {
    rawItems = [filter];
  } else {
    throw new ValidationError("Provide filter or filters");
  }

  if (rawItems.length === 0) {
    throw new ValidationError("filters must include at least one item");
  }

  if (rawItems.length > MAX_FILTER_USAGE_ITEMS) {
    throw new ValidationError(
      `filters supports up to ${MAX_FILTER_USAGE_ITEMS} items per request`,
    );
  }

  return rawItems.map((item, idx) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new ValidationError(`filters[${idx}] must be an object`);
    }

    const category = String(item.category || "").trim();
    const value = String(item.value || "").trim();

    if (!category || !value) {
      throw new ValidationError(
        `filters[${idx}] requires non-empty category and value`,
      );
    }

    if (category.length > MAX_FILTER_CATEGORY_LENGTH) {
      throw new ValidationError(
        `filters[${idx}].category max length is ${MAX_FILTER_CATEGORY_LENGTH}`,
      );
    }

    if (value.length > MAX_FILTER_VALUE_LENGTH) {
      throw new ValidationError(
        `filters[${idx}].value max length is ${MAX_FILTER_VALUE_LENGTH}`,
      );
    }

    const metadata = item.metadata;
    if (
      metadata !== undefined &&
      (metadata === null ||
        typeof metadata !== "object" ||
        Array.isArray(metadata))
    ) {
      throw new ValidationError(
        `filters[${idx}].metadata must be a JSON object`,
      );
    }

    return {
      filterCategory: category,
      filterValue: value,
      metadata: metadata || null,
    };
  });
}

function parseDateRange(queryParams) {
  const { from, to } = queryParams || {};
  if (!from || !to) {
    throw new ValidationError(
      "from and to are required query params (ISO date)",
    );
  }
  const fromDate = new Date(from);
  const toDate = new Date(to);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    throw new ValidationError("from and to must be valid ISO dates");
  }
  if (toDate <= fromDate) {
    throw new ValidationError("to must be greater than from");
  }
  return { fromDate, toDate };
}

function round2(value) {
  return value === null ? null : Number(value.toFixed(2));
}

function percentile(sortedValues, p) {
  if (!sortedValues.length) return null;
  const idx = (sortedValues.length - 1) * p;
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sortedValues[lower];
  const weight = idx - lower;
  return (
    sortedValues[lower] + (sortedValues[upper] - sortedValues[lower]) * weight
  );
}

function buildDistanceSummary(rows, isPersonal) {
  if (!rows.length) {
    return {
      preferredKm: null,
      recommendedMaxKm: null,
      maxObservedKm: null,
      samples: 0,
      lastUpdatedAt: null,
      message: isPersonal
        ? "Aun no tenemos suficientes busquedas tuyas para recomendar una distancia."
        : "Aun no hay suficientes busquedas para calcular la recomendacion global.",
    };
  }
  const values = rows
    .map((r) => Number(r.radiusKm))
    .filter((v) => Number.isFinite(v))
    .sort((a, b) => a - b);
  const preferred = percentile(values, 0.5);
  const recommended = percentile(values, 0.75);
  const maxObserved = values[values.length - 1];
  const lastUpdatedAt =
    rows[rows.length - 1]?.searchedAt?.toISOString?.() || null;
  return {
    preferredKm: round2(preferred),
    recommendedMaxKm: round2(recommended),
    maxObservedKm: round2(maxObserved),
    samples: values.length,
    lastUpdatedAt,
    message: isPersonal
      ? "Segun tus busquedas recientes, prefieres viviendas hasta " +
        round2(preferred) +
        " km."
      : "La mayoria de usuarios prefiere viviendas hasta " +
        round2(preferred) +
        " km de su punto de busqueda.",
  };
}

const responseTimeCache = new Map();

const analyticsService = {
  async logEvent(userId, { sessionId, eventType, payload, screenName }) {
    if (!sessionId || !eventType || !payload) {
      throw new ValidationError(
        "sessionId, eventType, and payload are required",
      );
    }
    if (!VALID_EVENT_TYPES.includes(eventType)) {
      throw new ValidationError(
        `eventType must be one of: ${VALID_EVENT_TYPES.join(", ")}`,
      );
    }
    if (eventType === 'FEATURE_LOAD_TIME') {
      // Defend against garbage values from bad foreground/background
      // transitions or client clock skew. Out-of-range events are rejected
      // rather than clamped so bad data never lands in the stats table.
      const durationMs = Number(payload.durationMs);
      if (!Number.isFinite(durationMs) || durationMs < 0 || durationMs > MAX_FEATURE_LOAD_DURATION_MS) {
        throw new ValidationError(
          `payload.durationMs must be a number between 0 and ${MAX_FEATURE_LOAD_DURATION_MS}`,
        );
      }
    }
    return analyticsRepository.logEvent({
      userId,
      sessionId,
      eventType,
      payload,
      screenName,
    });
  },

  async logBatch(userId, events) {
    if (!Array.isArray(events) || events.length === 0) {
      throw new ValidationError("events array is required");
    }
    const data = events.map((e) => ({
      userId: userId || null,
      sessionId: e.sessionId,
      eventType: e.eventType,
      payload: e.payload,
      screenName: e.screenName || null,
    }));
    return analyticsRepository.logMany(data);
  },

  async trackSearchEvent(actorUserId, payload) {
    const {
      userId,
      sessionId,
      query,
      city,
      neighborhood,
      lat,
      lng,
      radiusKm,
      filters,
      source,
      searchedAt,
    } = payload || {};

    if (!sessionId || !city || !source) {
      throw new ValidationError("sessionId, city, and source are required");
    }

    if (String(sessionId).length > MAX_SESSION_ID_LENGTH) {
      throw new ValidationError(
        `sessionId max length is ${MAX_SESSION_ID_LENGTH}`,
      );
    }
    if (query && String(query).length > MAX_QUERY_LENGTH) {
      throw new ValidationError(`query max length is ${MAX_QUERY_LENGTH}`);
    }
    if (String(city).length > MAX_CITY_LENGTH) {
      throw new ValidationError(`city max length is ${MAX_CITY_LENGTH}`);
    }
    if (neighborhood && String(neighborhood).length > MAX_NEIGHBORHOOD_LENGTH) {
      throw new ValidationError(
        `neighborhood max length is ${MAX_NEIGHBORHOOD_LENGTH}`,
      );
    }

    if (!VALID_SEARCH_SOURCES.includes(source)) {
      throw new ValidationError(
        `source must be one of: ${VALID_SEARCH_SOURCES.join(", ")}`,
      );
    }

    if (
      filters !== undefined &&
      (typeof filters !== "object" || Array.isArray(filters))
    ) {
      throw new ValidationError("filters must be a JSON object");
    }

    const eventDate = searchedAt ? new Date(searchedAt) : new Date();
    if (Number.isNaN(eventDate.getTime())) {
      throw new ValidationError("searchedAt must be a valid ISO date");
    }

    const normalizedCity = normalizeText(city);
    if (!normalizedCity) {
      throw new ValidationError("city is required");
    }

    const parsedLat = toNullableNumber(lat, "lat");
    const parsedLng = toNullableNumber(lng, "lng");
    const parsedRadiusKm = toNullableNumber(radiusKm, "radiusKm");

    validateCoordinateRange(parsedLat, parsedLng);
    if (
      parsedRadiusKm !== null &&
      (parsedRadiusKm <= 0 || parsedRadiusKm > MAX_RADIUS_KM)
    ) {
      throw new ValidationError(
        `radiusKm must be greater than 0 and <= ${MAX_RADIUS_KM}`,
      );
    }

    const normalizedNeighborhood = canonicalizeNeighborhood(neighborhood);
    const sanitizedQuery = sanitizeQuery(query);
    validateSearchSignal({
      normalizedNeighborhood,
      sanitizedQuery,
      lat: parsedLat,
      lng: parsedLng,
    });

    const canonicalZone = buildCanonicalZone(
      normalizedCity,
      normalizedNeighborhood,
    );
    const filtersHash = buildFiltersHash(filters || {});
    const effectiveUserId = userId || actorUserId || null;

    const duplicate = await analyticsRepository.findRecentSearchDuplicate({
      userId: effectiveUserId,
      sessionId,
      canonicalZone,
      filtersHash,
      source,
      searchedAt: eventDate,
      dedupeWindowSeconds: DEDUPE_WINDOW_SECONDS,
    });

    if (duplicate) {
      return { id: duplicate.id, deduped: true };
    }

    const created = await analyticsRepository.createSearchEvent({
      userId: effectiveUserId,
      sessionId,
      query: sanitizedQuery,
      city: normalizedCity,
      neighborhood: normalizedNeighborhood,
      canonicalZone,
      lat: parsedLat,
      lng: parsedLng,
      radiusKm: parsedRadiusKm,
      filters: filters || {},
      filtersHash,
      source,
      searchedAt: eventDate,
    });

    return { id: created.id, deduped: false };
  },

  async trackSearchFilterUsage(actorUserId, payload) {
    const { userId, sessionId, appliedAt } = payload || {};

    if (!sessionId) {
      throw new ValidationError("sessionId is required");
    }

    if (String(sessionId).length > MAX_SESSION_ID_LENGTH) {
      throw new ValidationError(
        `sessionId max length is ${MAX_SESSION_ID_LENGTH}`,
      );
    }

    const eventDate = appliedAt ? new Date(appliedAt) : new Date();
    if (Number.isNaN(eventDate.getTime())) {
      throw new ValidationError("appliedAt must be a valid ISO date");
    }

    const items = normalizeFilterUsageItems(payload);
    const effectiveUserId = userId || actorUserId || null;

    const entries = items.map((item) => ({
      userId: effectiveUserId,
      sessionId,
      filterCategory: item.filterCategory,
      filterValue: item.filterValue,
      metadata: item.metadata,
      appliedAt: eventDate,
    }));

    const result = await analyticsRepository.createSearchFilterUsages(entries);

    return {
      stored: result.count,
    };
  },

  async getTopSearchedZones(queryParams) {
    const { from, to, city, limit } = queryParams || {};
    if (!from || !to) {
      throw new ValidationError(
        "from and to are required query params (ISO date)",
      );
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      throw new ValidationError("from and to must be valid ISO dates");
    }
    if (toDate <= fromDate) {
      throw new ValidationError("to must be greater than from");
    }

    const rangeMs = toDate.getTime() - fromDate.getTime();
    const previousFrom = new Date(fromDate.getTime() - rangeMs);
    const previousTo = new Date(fromDate.getTime());
    const normalizedCity = city ? normalizeText(city) : null;
    const safeLimit = toPositiveLimit(limit);

    const [currentRows, previousRows] = await Promise.all([
      analyticsRepository.getTopSearchedZonesCurrent({
        from: fromDate,
        to: toDate,
        city: normalizedCity,
        limit: safeLimit,
      }),
      analyticsRepository.getTopSearchedZonesPrevious({
        from: previousFrom,
        to: previousTo,
        city: normalizedCity,
      }),
    ]);

    const previousByZone = new Map(
      previousRows.map((row) => [row.canonicalZone, Number(row.searches)]),
    );

    return currentRows.map((row) => {
      const searches = Number(row.searches);
      const previousSearches = previousByZone.get(row.canonicalZone) || 0;
      return {
        city: row.city,
        neighborhood: row.neighborhood,
        searches,
        uniqueUsers: Number(row.uniqueUsers),
        trendVsPreviousPeriod: calculateTrendVsPrevious(
          searches,
          previousSearches,
        ),
      };
    });
  },

  async getSessionStats(queryParams) {
    const { days } = queryParams || {};
    let parsedDays = 7;
    if (days !== undefined && days !== null && days !== "") {
      parsedDays = parseInt(days, 10);
      if (Number.isNaN(parsedDays) || parsedDays < 1 || parsedDays > 90) {
        throw new ValidationError("days must be an integer between 1 and 90");
      }
    }
    return analyticsRepository.getSessionStats({ days: parsedDays });
  },

  async getDashboard() {
    return analyticsRepository.getDashboard();
  },

  async getCrashStats(queryParams) {
    const { from, to } = queryParams || {};
    let fromDate = null;
    let toDate = null;

    if (from) {
      fromDate = new Date(from);
      if (Number.isNaN(fromDate.getTime())) {
        throw new ValidationError("from must be a valid ISO date");
      }
    }
    if (to) {
      toDate = new Date(to);
      if (Number.isNaN(toDate.getTime())) {
        throw new ValidationError("to must be a valid ISO date");
      }
    }
    if (fromDate && toDate && toDate <= fromDate) {
      throw new ValidationError("to must be greater than from");
    }

    return analyticsRepository.getCrashStats({ from: fromDate, to: toDate });
  },

  async getFeatureLoadTimes(queryParams) {
    const { from, to } = queryParams || {};
    let fromDate = null;
    let toDate = null;

    if (from) {
      fromDate = new Date(from);
      if (Number.isNaN(fromDate.getTime())) {
        throw new ValidationError("from must be a valid ISO date");
      }
    }
    if (to) {
      toDate = new Date(to);
      if (Number.isNaN(toDate.getTime())) {
        throw new ValidationError("to must be a valid ISO date");
      }
    }
    if (fromDate && toDate && toDate <= fromDate) {
      throw new ValidationError("to must be greater than from");
    }

    const rows = await analyticsRepository.getFeatureLoadTimes({
      from: fromDate,
      to: toDate,
    });

    return {
      screens: rows.map((row) => ({
        name: row.name,
        samples: Number(row.samples),
        avgMs: Number(row.avgMs),
        medianMs: Number(row.medianMs),
        p95Ms: Number(row.p95Ms),
      })),
    };
  },

  async getPreferredMaxDistanceSummary(queryParams) {
    const { fromDate, toDate } = parseDateRange(queryParams);
    const rows = await analyticsRepository.listRadiusSearches({
      from: fromDate,
      to: toDate,
      userId: null,
    });
    return buildDistanceSummary(rows, false);
  },

  async getMyPreferredMaxDistance(userId, queryParams) {
    if (!userId) {
      throw new ValidationError("Authenticated user is required");
    }
    const { fromDate, toDate } = parseDateRange(queryParams);
    const rows = await analyticsRepository.listRadiusSearches({
      from: fromDate,
      to: toDate,
      userId,
    });
    return buildDistanceSummary(rows, true);
  },

  async getSupplyDensityStats() {
    return analyticsRepository.getSupplyDensityStats();
  },

  async getPopularApartmentSizeNearUniversity(userId, options = {}) {
    if (!userId) {
      throw new ValidationError("userId is required");
    }

    const onlyPopularSize = toBooleanFlag(options.onlyPopularSize);

    const profile = await roommateRepository.getProfile(userId);
    const university = await universityRepository.resolveByName(
      profile?.university,
    );

    if (!university) {
      throw new ValidationError("No university configuration available");
    }

    const radiusKm =
      toNumberOrNull(university.defaultRadiusKm, "defaultRadiusKm") || 2;
    const popularSizes =
      await analyticsRepository.getPopularApartmentSizesNearLocation({
        latitude: university.latitude,
        longitude: university.longitude,
        radiusKm,
        limit: DEFAULT_POPULAR_SIZES_LIMIT,
        bucketSize: DEFAULT_APARTMENT_BUCKET_SIZE,
      });

    const topSizes = popularSizes.map((row) => ({
      sizeRange: formatSizeBucket(
        Number(row.bucketMinM2),
        Number(row.bucketMaxM2),
      ),
      bucketMinM2: Number(row.bucketMinM2),
      bucketMaxM2: Number(row.bucketMaxM2),
      count: Number(row.count),
      averageSizeM2: Number(row.avgSizeM2),
    }));

    const response = {
      university: {
        id: university.id,
        name: university.name,
        city: university.city || null,
        latitude: university.latitude,
        longitude: university.longitude,
        radiusKm,
      },
      topSizes,
      popularSize: topSizes[0] || null,
    };

    if (onlyPopularSize) {
      return { popularSize: response.popularSize };
    }

    return response;
  },

  async getLocalidadStats() {
    return analyticsRepository.getLocalidadStats();
  },

  async getLandlordResponseTime(landlordId) {
    if (!landlordId) throw new ValidationError('landlordId is required');

    const cached = responseTimeCache.get(landlordId);
    if (cached && Date.now() - cached.ts < 15 * 60 * 1000) return cached.data;

    const MIN_SAMPLES = 1;
    const rows = await analyticsRepository.getLandlordResponseTime(landlordId);
    const deltas = rows
      .map((r) => Number(r.deltaMinutes))
      .filter((v) => Number.isFinite(v) && v >= 0);

    if (deltas.length < MIN_SAMPLES) {
      const result = { medianMinutes: null, sampleSize: deltas.length, bucket: 'insufficient' };
      responseTimeCache.set(landlordId, { ts: Date.now(), data: result });
      return result;
    }

    deltas.sort((a, b) => a - b);
    const median = percentile(deltas, 0.5);

    const bucket =
      median < 60   ? '<1h'   :
      median < 360  ? 'hours' :
      median < 1440 ? 'day'   : '>day';

    const result = { medianMinutes: Math.round(median), sampleSize: deltas.length, bucket };
    responseTimeCache.set(landlordId, { ts: Date.now(), data: result });
    return result;
  },

  async getTopFilters(queryParams) {
    const { from, to } = queryParams || {};
    let fromDate = null;
    let toDate = null;

    if (from) {
      fromDate = new Date(from);
      if (Number.isNaN(fromDate.getTime())) {
        throw new ValidationError("from must be a valid ISO date");
      }
    }
    if (to) {
      toDate = new Date(to);
      if (Number.isNaN(toDate.getTime())) {
        throw new ValidationError("to must be a valid ISO date");
      }
    }
    if (fromDate && toDate && toDate <= fromDate) {
      throw new ValidationError("to must be greater than from");
    }

    const rows = await analyticsRepository.getTopFilters({
      from: fromDate,
      to: toDate,
    });

    const categoryMap = new Map();
    let totalUsages = 0;

    for (const row of rows) {
      const count = Number(row.count);
      totalUsages += count;
      if (!categoryMap.has(row.filterCategory)) {
        categoryMap.set(row.filterCategory, {
          category: row.filterCategory,
          total: 0,
          values: [],
        });
      }
      const cat = categoryMap.get(row.filterCategory);
      cat.total += count;
      cat.values.push({ value: row.filterValue, count });
    }

    const byCategory = Array.from(categoryMap.values())
      .sort((a, b) => b.total - a.total)
      .map((cat) => ({
        ...cat,
        pct:
          totalUsages > 0
            ? Number(((cat.total / totalUsages) * 100).toFixed(1))
            : 0,
        values: cat.values.map((v) => ({
          ...v,
          pct:
            cat.total > 0
              ? Number(((v.count / cat.total) * 100).toFixed(1))
              : 0,
        })),
      }));

    return { byCategory, totalUsages };
  },
};

module.exports = analyticsService;
