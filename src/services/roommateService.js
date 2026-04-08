const roommateRepository = require('../repositories/roommateRepository');
const chatRepository = require('../repositories/chatRepository');
const userRepository = require('../repositories/userRepository');
const appEvents = require('../events/eventEmitter');
const CompatibilityMatching = require('../strategies/matching/compatibilityMatching');
const logger = require('../utils/logger');
const { NotFoundError, ForbiddenError, ValidationError } = require('../utils/errors');

class RoommateService {
  constructor(strategy = new CompatibilityMatching()) {
    this.strategy = strategy;
  }

  setStrategy(strategy) {
    this.strategy = strategy;
  }

  async getProfile(userId) {
    const profile = await roommateRepository.getProfile(userId);
    if (!profile) throw new NotFoundError('Roommate profile not found');
    return profile;
  }

  async upsertProfile(userId, data) {
    const VALID_SLEEP = ['EARLY_BIRD', 'NIGHT_OWL', 'FLEXIBLE'];
    const VALID_CLEAN = ['VERY_TIDY', 'MODERATE', 'RELAXED'];
    const VALID_NOISE = ['QUIET', 'MODERATE', 'LIVELY'];

    if (data.sleepSchedule && !VALID_SLEEP.includes(data.sleepSchedule)) {
      throw new ValidationError(`sleepSchedule must be one of: ${VALID_SLEEP.join(', ')}`);
    }
    if (data.cleanlinessLevel && !VALID_CLEAN.includes(data.cleanlinessLevel)) {
      throw new ValidationError(`cleanlinessLevel must be one of: ${VALID_CLEAN.join(', ')}`);
    }
    if (data.noisePreference && !VALID_NOISE.includes(data.noisePreference)) {
      throw new ValidationError(`noisePreference must be one of: ${VALID_NOISE.join(', ')}`);
    }

    if (data.birthDate !== undefined && data.birthDate !== null) {
      const parsedDate = new Date(data.birthDate);
      if (Number.isNaN(parsedDate.getTime())) {
        throw new ValidationError('birthDate must be a valid date');
      }
      if (parsedDate > new Date()) {
        throw new ValidationError('birthDate cannot be in the future');
      }
      data.birthDate = parsedDate;
    }

    if (data.job !== undefined) {
      const normalized = String(data.job || '').trim();
      if (normalized.length > 100) {
        throw new ValidationError('job must be at most 100 characters');
      }
      data.job = normalized || null;
    }

    if (data.university !== undefined) {
      const normalized = String(data.university || '').trim();
      if (normalized.length > 120) {
        throw new ValidationError('university must be at most 120 characters');
      }
      data.university = normalized || null;
    }

    return roommateRepository.upsertProfile(userId, data);
  }

  async getCandidates(userId) {
    const myProfile = await roommateRepository.getProfile(userId);
    if (!myProfile) throw new NotFoundError('Create your roommate profile first');

    const alreadySwiped = await roommateRepository.getAlreadySwiped(userId);
    const allProfiles = await roommateRepository.getActiveProfiles(userId);

    const candidates = allProfiles
      .filter((p) => !alreadySwiped.includes(p.userId))
      .map((p) => {
        const score = this.strategy.score(myProfile, p);
        return {
          ...p,
          compatibilityScore: score,
          matchRate: score,
        };
      })
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    return candidates;
  }

  async swipe(swiperId, { swipedUserId, direction }) {
    if (!swipedUserId || !direction) throw new ValidationError('swipedUserId and direction are required');
    if (!['RIGHT', 'LEFT'].includes(direction)) throw new ValidationError('direction must be RIGHT or LEFT');
    if (swipedUserId === swiperId) throw new ValidationError('Cannot swipe on yourself');

    // Swiped user must have a profile
    const targetProfile = await roommateRepository.getProfile(swipedUserId);
    if (!targetProfile) throw new NotFoundError('Target user has no roommate profile');

    await roommateRepository.createSwipe(swiperId, swipedUserId, direction);

    let match = null;
    if (direction === 'RIGHT') {
      // Check for mutual right swipe
      const reverseSwipe = await roommateRepository.findReverseSwipe(swipedUserId, swiperId);
      if (reverseSwipe && reverseSwipe.direction === 'RIGHT') {
        // Check not already matched
        const existingMatch = await roommateRepository.findMatch(swiperId, swipedUserId);
        if (!existingMatch) {
          // Create chat between the two users
          const chat = await chatRepository.create({ propertyId: null });
          await chatRepository.addParticipant(chat.id, swiperId);
          await chatRepository.addParticipant(chat.id, swipedUserId);

          match = await roommateRepository.createMatch(swiperId, swipedUserId, chat.id);

          const user1 = await userRepository.findById(swiperId);
          const user2 = await userRepository.findById(swipedUserId);
          appEvents.emit('roommate:matched', { user1, user2, matchId: match.id, chatId: chat.id });
          logger.info('Roommate match created', { matchId: match.id, user1Id: swiperId, user2Id: swipedUserId, chatId: chat.id });
        }
      }
    }

    return { swiped: true, matched: !!match, match };
  }

  async getMatches(userId) {
    return roommateRepository.getMatches(userId);
  }
}

module.exports = new RoommateService();
