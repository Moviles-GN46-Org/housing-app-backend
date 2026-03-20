const chatRepository = require('../repositories/chatRepository');
const userRepository = require('../repositories/userRepository');
const propertyRepository = require('../repositories/propertyRepository');
const appEvents = require('../events/eventEmitter');
const logger = require('../utils/logger');
const { NotFoundError, ForbiddenError, ValidationError } = require('../utils/errors');

const chatService = {
  async listChats(userId) {
    return chatRepository.findByUser(userId);
  },

  async startChat(studentId, { propertyId }) {
    if (!propertyId) throw new ValidationError('propertyId is required');

    // Student must be verified
    const student = await userRepository.findById(studentId);
    if (student.studentVerification?.status !== 'VERIFIED') {
      throw new ForbiddenError('Only verified students can start chats');
    }

    const property = await propertyRepository.findById(propertyId);
    if (!property) throw new NotFoundError('Property not found');
    if (property.status !== 'ACTIVE') throw new ForbiddenError('Cannot start a chat on an inactive listing');

    // Prevent duplicate chats
    const existing = await chatRepository.findByPropertyAndStudent(propertyId, studentId);
    if (existing) return chatRepository.findById(existing.id);

    const chat = await chatRepository.create({ propertyId });
    await chatRepository.addParticipant(chat.id, studentId);
    await chatRepository.addParticipant(chat.id, property.landlordId);

    logger.info('Chat started', { chatId: chat.id, studentId, propertyId, landlordId: property.landlordId });
    return chatRepository.findById(chat.id);
  },

  async getMessages(chatId, userId, after) {
    const chat = await chatRepository.findById(chatId);
    if (!chat) throw new NotFoundError('Chat not found');

    const isParticipant = await chatRepository.isParticipant(chatId, userId);
    if (!isParticipant) throw new ForbiddenError('Not a participant of this chat');

    return chatRepository.getMessages(chatId, after);
  },

  async sendMessage(chatId, senderId, { content, type = 'TEXT', metadata }) {
    if (!content && type === 'TEXT') throw new ValidationError('content is required for text messages');

    const chat = await chatRepository.findById(chatId);
    if (!chat) throw new NotFoundError('Chat not found');
    if (chat.status !== 'ACTIVE') throw new ForbiddenError('Chat is not active');

    const isParticipant = await chatRepository.isParticipant(chatId, senderId);
    if (!isParticipant) throw new ForbiddenError('Not a participant of this chat');

    const message = await chatRepository.createMessage({
      chatId,
      senderId,
      type,
      content: content || '',
      metadata,
    });
    await chatRepository.updateTimestamp(chatId);

    const sender = await userRepository.findById(senderId);
    appEvents.emit('message:sent', { message, chat, sender });

    logger.debug('Message sent', { chatId, senderId, type, messageId: message.id });
    return message;
  },

  async sendVisitProposal(chatId, landlordId, { proposedDates, message: proposalMessage }) {
    if (!proposedDates || !Array.isArray(proposedDates) || proposedDates.length === 0) {
      throw new ValidationError('proposedDates array is required');
    }

    const chat = await chatRepository.findById(chatId);
    if (!chat) throw new NotFoundError('Chat not found');
    if (!chat.propertyId) throw new ForbiddenError('Visit proposals only for property chats');

    const isParticipant = await chatRepository.isParticipant(chatId, landlordId);
    if (!isParticipant) throw new ForbiddenError('Not a participant of this chat');

    const sender = await userRepository.findById(landlordId);
    if (sender.role !== 'LANDLORD') throw new ForbiddenError('Only landlords can send visit proposals');

    return chatRepository.createMessage({
      chatId,
      senderId: landlordId,
      type: 'VISIT_PROPOSAL',
      content: proposalMessage || 'Visit proposal',
      metadata: { proposedDates, message: proposalMessage },
    });
  },

  async respondToVisitProposal(chatId, studentId, { proposalMessageId, selectedSlotId, accepted }) {
    const chat = await chatRepository.findById(chatId);
    if (!chat) throw new NotFoundError('Chat not found');

    const isParticipant = await chatRepository.isParticipant(chatId, studentId);
    if (!isParticipant) throw new ForbiddenError('Not a participant of this chat');

    const proposalMessage = await chatRepository.findMessageById(proposalMessageId);
    if (!proposalMessage || proposalMessage.type !== 'VISIT_PROPOSAL') {
      throw new NotFoundError('Visit proposal message not found');
    }

    const responseMessage = await chatRepository.createMessage({
      chatId,
      senderId: studentId,
      type: 'VISIT_RESPONSE',
      content: accepted ? 'Visit accepted' : 'Visit declined',
      metadata: { proposalMessageId, selectedSlotId: selectedSlotId || null, accepted },
    });

    // If accepted, create Visit record via visitService (imported lazily to avoid circular deps)
    if (accepted && selectedSlotId) {
      const visitService = require('./visitService');
      await visitService.createFromProposal(chat, proposalMessage, selectedSlotId, studentId);
    }

    return responseMessage;
  },

  async getChatById(chatId, userId) {
    const chat = await chatRepository.findById(chatId);
    if (!chat) throw new NotFoundError('Chat not found');
    const isParticipant = await chatRepository.isParticipant(chatId, userId);
    if (!isParticipant) throw new ForbiddenError('Not a participant of this chat');
    return chat;
  },
};

module.exports = chatService;
