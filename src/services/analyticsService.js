const analyticsRepository = require('../repositories/analyticsRepository');
const { ValidationError } = require('../utils/errors');
const {
  normalizeText,
  canonicalizeNeighborhood,
  buildCanonicalZone,
  buildFiltersHash,
  sanitizeQuery,
} = require('../utils/searchAnalytics');

const VALID_EVENT_TYPES = [
  'SESSION_START', 'SESSION_END', 'SEARCH', 'PROPERTY_VIEW',
  'FILTER_APPLIED', 'FEATURE_CLICK', 'MAP_INTERACTION',
  'CHAT_STARTED', 'REVIEW_SUBMITTED', 'VISIT_SCHEDULED', 'CRASH',
];

const VALID_SEARCH_SOURCES = ['house_list', 'map'];
const DEDUPE_WINDOW_SECONDS = 45;
const DEFAULT_TOP_ZONES_LIMIT = 10;
const MAX_TOP_ZONES_LIMIT = 50;
const MAX_SESSION_ID_LENGTH = 120;
const MAX_QUERY_LENGTH = 500;
const MAX_CITY_LENGTH = 120;
const MAX_NEIGHBORHOOD_LENGTH = 120;
const MAX_RADIUS_KM = 100;

function toPositiveLimit(value) {
  if (value === undefined || value === null || value === '') {
    return DEFAULT_TOP_ZONES_LIMIT;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ValidationError('limit must be a positive integer');
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
  if (value === undefined || value === null || value === '') {
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
    throw new ValidationError('lat and lng must be provided together');
  }
  if (lat !== null && (lat < -90 || lat > 90)) {
    throw new ValidationError('lat must be between -90 and 90');
  }
  if (lng !== null && (lng < -180 || lng > 180)) {
    throw new ValidationError('lng must be between -180 and 180');
  }
}

function validateSearchSignal({ normalizedNeighborhood, sanitizedQuery, lat, lng }) {
  if (!normalizedNeighborhood && !sanitizedQuery && lat === null && lng === null) {
    throw new ValidationError('A valid search must include neighborhood, query, or lat/lng');
  }
}

const analyticsService = {
  async logEvent(userId, { sessionId, eventType, payload, screenName }) {
    if (!sessionId || !eventType || !payload) {
      throw new ValidationError('sessionId, eventType, and payload are required');
    }
    if (!VALID_EVENT_TYPES.includes(eventType)) {
      throw new ValidationError(`eventType must be one of: ${VALID_EVENT_TYPES.join(', ')}`);
    }
    return analyticsRepository.logEvent({ userId, sessionId, eventType, payload, screenName });
  },

  async logBatch(userId, events) {
    if (!Array.isArray(events) || events.length === 0) {
      throw new ValidationError('events array is required');
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
      throw new ValidationError('sessionId, city, and source are required');
    }

    if (String(sessionId).length > MAX_SESSION_ID_LENGTH) {
      throw new ValidationError(`sessionId max length is ${MAX_SESSION_ID_LENGTH}`);
    }
    if (query && String(query).length > MAX_QUERY_LENGTH) {
      throw new ValidationError(`query max length is ${MAX_QUERY_LENGTH}`);
    }
    if (String(city).length > MAX_CITY_LENGTH) {
      throw new ValidationError(`city max length is ${MAX_CITY_LENGTH}`);
    }
    if (neighborhood && String(neighborhood).length > MAX_NEIGHBORHOOD_LENGTH) {
      throw new ValidationError(`neighborhood max length is ${MAX_NEIGHBORHOOD_LENGTH}`);
    }

    if (!VALID_SEARCH_SOURCES.includes(source)) {
      throw new ValidationError(`source must be one of: ${VALID_SEARCH_SOURCES.join(', ')}`);
    }

    if (filters !== undefined && (typeof filters !== 'object' || Array.isArray(filters))) {
      throw new ValidationError('filters must be a JSON object');
    }

    const eventDate = searchedAt ? new Date(searchedAt) : new Date();
    if (Number.isNaN(eventDate.getTime())) {
      throw new ValidationError('searchedAt must be a valid ISO date');
    }

    const normalizedCity = normalizeText(city);
    if (!normalizedCity) {
      throw new ValidationError('city is required');
    }

    const parsedLat = toNullableNumber(lat, 'lat');
    const parsedLng = toNullableNumber(lng, 'lng');
    const parsedRadiusKm = toNullableNumber(radiusKm, 'radiusKm');

    validateCoordinateRange(parsedLat, parsedLng);
    if (parsedRadiusKm !== null && (parsedRadiusKm <= 0 || parsedRadiusKm > MAX_RADIUS_KM)) {
      throw new ValidationError(`radiusKm must be greater than 0 and <= ${MAX_RADIUS_KM}`);
    }

    const normalizedNeighborhood = canonicalizeNeighborhood(neighborhood);
    const sanitizedQuery = sanitizeQuery(query);
    validateSearchSignal({
      normalizedNeighborhood,
      sanitizedQuery,
      lat: parsedLat,
      lng: parsedLng,
    });

    const canonicalZone = buildCanonicalZone(normalizedCity, normalizedNeighborhood);
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

  async getTopSearchedZones(queryParams) {
    const { from, to, city, limit } = queryParams || {};
    if (!from || !to) {
      throw new ValidationError('from and to are required query params (ISO date)');
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      throw new ValidationError('from and to must be valid ISO dates');
    }
    if (toDate <= fromDate) {
      throw new ValidationError('to must be greater than from');
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
      previousRows.map((row) => [row.canonicalZone, Number(row.searches)])
    );

    return currentRows.map((row) => {
      const searches = Number(row.searches);
      const previousSearches = previousByZone.get(row.canonicalZone) || 0;
      return {
        city: row.city,
        neighborhood: row.neighborhood,
        searches,
        uniqueUsers: Number(row.uniqueUsers),
        trendVsPreviousPeriod: calculateTrendVsPrevious(searches, previousSearches),
      };
    });
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
        throw new ValidationError('from must be a valid ISO date');
      }
    }
    if (to) {
      toDate = new Date(to);
      if (Number.isNaN(toDate.getTime())) {
        throw new ValidationError('to must be a valid ISO date');
      }
    }
    if (fromDate && toDate && toDate <= fromDate) {
      throw new ValidationError('to must be greater than from');
    }

    return analyticsRepository.getCrashStats({ from: fromDate, to: toDate });
  },
};

module.exports = analyticsService;
