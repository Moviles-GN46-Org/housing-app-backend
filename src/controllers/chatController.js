const chatService = require('../services/chatService');
const { toChatDTO, toMessageDTO } = require('../dtos/chat.dto');

const chatController = {
  async list(req, res, next) {
    try {
      const chats = await chatService.listChats(req.user.userId);
      res.json({ success: true, data: chats.map(toChatDTO) });
    } catch (err) {
      next(err);
    }
  },

  async start(req, res, next) {
    try {
      const chat = await chatService.startChat(req.user.userId, req.body);
      res.status(201).json({ success: true, data: toChatDTO(chat) });
    } catch (err) {
      next(err);
    }
  },

  async getMessages(req, res, next) {
    try {
      const messages = await chatService.getMessages(req.params.id, req.user.userId, req.query.after);
      res.json({ success: true, data: messages.map(toMessageDTO) });
    } catch (err) {
      next(err);
    }
  },

  async sendMessage(req, res, next) {
    try {
      const message = await chatService.sendMessage(req.params.id, req.user.userId, req.body);
      res.status(201).json({ success: true, data: toMessageDTO(message) });
    } catch (err) {
      next(err);
    }
  },

  async sendVisitProposal(req, res, next) {
    try {
      const message = await chatService.sendVisitProposal(req.params.id, req.user.userId, req.body);
      res.status(201).json({ success: true, data: toMessageDTO(message) });
    } catch (err) {
      next(err);
    }
  },

  async respondToVisitProposal(req, res, next) {
    try {
      const message = await chatService.respondToVisitProposal(req.params.id, req.user.userId, req.body);
      res.status(201).json({ success: true, data: toMessageDTO(message) });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = chatController;
