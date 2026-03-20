const appEvents = require('../eventEmitter');
const notificationService = require('../../services/notificationService');
const logger = require('../../utils/logger');

appEvents.on('visit:confirmed', async ({ visit, student, landlord }) => {
  try {
    const dateStr = new Date(visit.scheduledAt).toLocaleString();
    await notificationService.create({
      userId: student.id,
      type: 'VISIT_CONFIRMED',
      title: 'Visit Confirmed',
      body: `Your visit is scheduled for ${dateStr}`,
      data: { visitId: visit.id, propertyId: visit.propertyId },
    });
    await notificationService.create({
      userId: landlord.id,
      type: 'VISIT_CONFIRMED',
      title: 'Visit Confirmed',
      body: `A student will visit on ${dateStr}`,
      data: { visitId: visit.id, propertyId: visit.propertyId },
    });
  } catch (err) {
    logger.error('[notificationListener] visit:confirmed error:', err.message);
  }
});

appEvents.on('roommate:matched', async ({ user1, user2, matchId, chatId }) => {
  try {
    await notificationService.create({
      userId: user1.id,
      type: 'ROOMMATE_MATCH',
      title: 'New Roommate Match!',
      body: `You matched with ${user2.firstName}`,
      data: { matchId, chatId },
    });
    await notificationService.create({
      userId: user2.id,
      type: 'ROOMMATE_MATCH',
      title: 'New Roommate Match!',
      body: `You matched with ${user1.firstName}`,
      data: { matchId, chatId },
    });
  } catch (err) {
    logger.error('[notificationListener] roommate:matched error:', err.message);
  }
});

appEvents.on('review:submitted', async ({ review, property, author }) => {
  try {
    await notificationService.create({
      userId: property.landlordId,
      type: 'REVIEW_RECEIVED',
      title: 'New Review',
      body: `${author.firstName} left a ${review.rating}-star review on ${property.title}`,
      data: { reviewId: review.id, propertyId: property.id },
    });
  } catch (err) {
    logger.error('[notificationListener] review:submitted error:', err.message);
  }
});

appEvents.on('message:sent', async ({ message, chat, sender }) => {
  try {
    // Notify all participants except sender
    const recipients = (chat.participants || []).filter((p) => p.user.id !== sender.id);
    for (const participant of recipients) {
      await notificationService.create({
        userId: participant.user.id,
        type: 'NEW_MESSAGE',
        title: `New message from ${sender.firstName}`,
        body: message.content.slice(0, 100),
        data: { chatId: chat.id, messageId: message.id },
      });
    }
  } catch (err) {
    logger.error('[notificationListener] message:sent error:', err.message);
  }
});

logger.info('[notificationListener] registered');
