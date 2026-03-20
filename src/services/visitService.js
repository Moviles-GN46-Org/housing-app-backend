const visitRepository = require('../repositories/visitRepository');
const propertyRepository = require('../repositories/propertyRepository');
const userRepository = require('../repositories/userRepository');
const appEvents = require('../events/eventEmitter');
const logger = require('../utils/logger');
const { NotFoundError, ForbiddenError, ValidationError } = require('../utils/errors');

const visitService = {
  /**
   * Called internally when a student accepts a visit proposal.
   */
  async createFromProposal(chat, proposalMessage, selectedSlotId, studentId) {
    const metadata = proposalMessage.metadata;
    if (!metadata || !metadata.proposedDates) throw new ValidationError('Invalid proposal metadata');

    const slot = metadata.proposedDates.find((d) => d.id === selectedSlotId);
    if (!slot) throw new ValidationError('Selected slot not found in proposal');

    const scheduledAt = new Date(`${slot.date}T${slot.time}:00`);
    if (isNaN(scheduledAt)) throw new ValidationError('Invalid slot date/time');

    const property = await propertyRepository.findById(chat.propertyId);
    if (!property) throw new NotFoundError('Property not found');

    const visit = await visitRepository.create({
      chatId: chat.id,
      propertyId: chat.propertyId,
      studentId,
      landlordId: property.landlordId,
      scheduledAt,
      status: 'CONFIRMED',
    });

    const student = await userRepository.findById(studentId);
    const landlord = await userRepository.findById(property.landlordId);
    appEvents.emit('visit:confirmed', { visit, student, landlord, property });

    logger.info('Visit confirmed', { visitId: visit.id, studentId, propertyId: chat.propertyId, scheduledAt });
    return visit;
  },

  async listVisits(userId) {
    return visitRepository.findByUser(userId);
  },

  async cancelVisit(id, userId) {
    const visit = await visitRepository.findById(id);
    if (!visit) throw new NotFoundError('Visit not found');

    const isStudent = visit.studentId === userId;
    const isLandlord = visit.landlordId === userId;
    if (!isStudent && !isLandlord) throw new ForbiddenError('Not your visit');

    if (visit.status !== 'CONFIRMED') throw new ValidationError('Only confirmed visits can be cancelled');

    const newStatus = isStudent ? 'CANCELLED_BY_STUDENT' : 'CANCELLED_BY_LANDLORD';
    return visitRepository.update(id, { status: newStatus });
  },
};

module.exports = visitService;
