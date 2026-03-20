const appEvents = require('../eventEmitter');
const analyticsRepository = require('../../repositories/analyticsRepository');
const logger = require('../../utils/logger');

appEvents.on('visit:confirmed', async ({ visit }) => {
  try {
    await analyticsRepository.logEvent({
      userId: visit.studentId,
      sessionId: 'server',
      eventType: 'VISIT_SCHEDULED',
      payload: { propertyId: visit.propertyId, chatId: visit.chatId },
    });
  } catch (err) {
    logger.error('[analyticsListener] visit:confirmed error:', err.message);
  }
});

appEvents.on('review:submitted', async ({ review }) => {
  try {
    await analyticsRepository.logEvent({
      userId: review.authorId,
      sessionId: 'server',
      eventType: 'REVIEW_SUBMITTED',
      payload: { propertyId: review.propertyId, rating: review.rating },
    });
  } catch (err) {
    logger.error('[analyticsListener] review:submitted error:', err.message);
  }
});

appEvents.on('roommate:matched', async ({ user1, matchId }) => {
  try {
    await analyticsRepository.logEvent({
      userId: user1.id,
      sessionId: 'server',
      eventType: 'FEATURE_CLICK',
      payload: { feature: 'roommate_match', matchId },
    });
  } catch (err) {
    logger.error('[analyticsListener] roommate:matched error:', err.message);
  }
});

logger.info('[analyticsListener] registered');
