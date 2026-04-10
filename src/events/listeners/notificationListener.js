const appEvents = require('../eventEmitter');
const notificationService = require('../../services/notificationService');
const roommateRepository = require('../../repositories/roommateRepository');
const logger = require('../../utils/logger');

const normalizeText = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const asNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getLatestSearchFilters = (candidate) => {
  const latest = candidate?.user?.searchEvents?.[0]?.filters;
  return latest && typeof latest === 'object' && !Array.isArray(latest) ? latest : {};
};

const matchesBudget = (candidate, propertyRent) => {
  const rent = asNumber(propertyRent);
  if (rent === null) return false;

  const min = asNumber(candidate.budgetMin);
  const max = asNumber(candidate.budgetMax);

  if (min !== null && rent < min) return false;
  if (max !== null && rent > max) return false;
  return true;
};

const matchesArea = (candidate, propertyNeighborhood) => {
  const preferredArea = normalizeText(candidate.preferredArea);
  if (!preferredArea) return true;

  const neighborhood = normalizeText(propertyNeighborhood);
  return neighborhood.includes(preferredArea) || preferredArea.includes(neighborhood);
};

const matchesPropertyType = (filters, propertyType) => {
  const preferredType = normalizeText(filters.propertyType);
  if (!preferredType) return true;
  return preferredType === normalizeText(propertyType);
};

const amenityFilterMap = {
  furnished: 'furnished',
  petFriendly: 'petFriendly',
  hasParking: 'hasParking',
  hasLaundry: 'hasLaundry',
  hasWifi: 'hasWifi',
};

const matchesAmenities = (filters, property) => {
  for (const [filterKey, propertyKey] of Object.entries(amenityFilterMap)) {
    if (filters[filterKey] === true && property[propertyKey] !== true) {
      return false;
    }
  }
  return true;
};

const buildPropertyMatchBody = (property, tenantName) => {
  const areaLabel = property.neighborhood ? ` in ${property.neighborhood}` : '';
  return `${tenantName}, a new ${String(property.propertyType || 'property').toLowerCase()}${areaLabel} matches your preferences.`;
};

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

appEvents.on('property:created', async ({ property, landlord }) => {
  try {
    const candidates = await roommateRepository.getActiveTenantNotificationCandidates(landlord?.id);
    const safeMonthlyRent = asNumber(property.monthlyRent);
    let notificationsSent = 0;

    for (const candidate of candidates) {
      try {
        if (!candidate.user || candidate.user.role !== 'STUDENT') continue;
        if (candidate.user.id === landlord?.id) continue;
        if (!matchesBudget(candidate, property.monthlyRent)) continue;
        if (!matchesArea(candidate, property.neighborhood)) continue;

        const filters = getLatestSearchFilters(candidate);
        if (!matchesPropertyType(filters, property.propertyType)) continue;
        if (!matchesAmenities(filters, property)) continue;

        await notificationService.create({
          userId: candidate.user.id,
          type: 'PROPERTY_MATCH',
          title: 'New Property Match',
          body: buildPropertyMatchBody(property, candidate.user.firstName || 'Hi'),
          data: {
            propertyId: property.id,
            landlordId: landlord?.id || null,
            neighborhood: property.neighborhood,
            monthlyRent: safeMonthlyRent,
            source: 'property_created_observer',
          },
        });

        notificationsSent += 1;
      } catch (candidateErr) {
        logger.error('[notificationListener] property:created candidate error', {
          candidateUserId: candidate?.user?.id,
          propertyId: property?.id,
          code: candidateErr?.code,
          message: candidateErr?.message,
        });
      }
    }

    logger.info('[notificationListener] property:created handled', {
      propertyId: property.id,
      landlordId: landlord?.id,
      candidates: candidates.length,
      notificationsSent,
    });
  } catch (err) {
    logger.error('[notificationListener] property:created error', {
      propertyId: property?.id,
      landlordId: landlord?.id,
      code: err?.code,
      message: err?.message,
    });
  }
});

logger.info('[notificationListener] registered');
