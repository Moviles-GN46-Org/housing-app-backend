const analyticsRepository = require('../repositories/analyticsRepository');
const { ValidationError } = require('../utils/errors');

const VALID_EVENT_TYPES = [
  'SESSION_START', 'SESSION_END', 'SEARCH', 'PROPERTY_VIEW',
  'FILTER_APPLIED', 'FEATURE_CLICK', 'MAP_INTERACTION',
  'CHAT_STARTED', 'REVIEW_SUBMITTED', 'VISIT_SCHEDULED', 'CRASH',
];

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

  async getDashboard() {
    return analyticsRepository.getDashboard();
  },
};

module.exports = analyticsService;
