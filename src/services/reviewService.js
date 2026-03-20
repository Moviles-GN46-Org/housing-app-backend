const reviewRepository = require('../repositories/reviewRepository');
const propertyRepository = require('../repositories/propertyRepository');
const chatRepository = require('../repositories/chatRepository');
const userRepository = require('../repositories/userRepository');
const appEvents = require('../events/eventEmitter');
const logger = require('../utils/logger');
const { NotFoundError, ForbiddenError, ValidationError, ConflictError } = require('../utils/errors');

const reviewService = {
  async listForProperty(propertyId) {
    const property = await propertyRepository.findById(propertyId);
    if (!property) throw new NotFoundError('Property not found');
    return reviewRepository.findByProperty(propertyId);
  },

  async create(propertyId, authorId, { rating, comment }) {
    if (!rating || !comment) throw new ValidationError('rating and comment are required');
    if (rating < 1 || rating > 5) throw new ValidationError('rating must be between 1 and 5');

    // Eligibility check 1: student verified
    const student = await userRepository.findById(authorId);
    if (student.studentVerification?.status !== 'VERIFIED') {
      throw new ForbiddenError('Only verified students can submit reviews');
    }

    // Eligibility check 2: property exists
    const property = await propertyRepository.findById(propertyId);
    if (!property) throw new NotFoundError('Property not found');

    // Eligibility check 3: student has a chat for this property
    const existingChat = await chatRepository.findByPropertyAndStudent(propertyId, authorId);
    if (!existingChat) {
      throw new ForbiddenError('You must have contacted this landlord about this property before reviewing it');
    }

    // Eligibility check 4: no prior review (unique constraint enforced at DB level too)
    const existing = await reviewRepository.findByAuthorAndProperty(authorId, propertyId);
    if (existing) throw new ConflictError('You have already reviewed this property');

    const review = await reviewRepository.create({
      propertyId,
      authorId,
      landlordId: property.landlordId,
      rating: parseInt(rating),
      comment,
    });

    appEvents.emit('review:submitted', { review, property, author: student });
    logger.info('Review submitted', { reviewId: review.id, propertyId, authorId, rating });
    return review;
  },
};

module.exports = reviewService;
