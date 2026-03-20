function toChatDTO(chat) {
  return {
    id: chat.id,
    propertyId: chat.propertyId,
    property: chat.property || null,
    status: chat.status,
    participants: (chat.participants || []).map((p) => p.user),
    lastMessage: chat.messages?.[0] || null,
    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt,
  };
}

function toMessageDTO(message) {
  return {
    id: message.id,
    chatId: message.chatId,
    sender: message.sender,
    type: message.type,
    content: message.content,
    metadata: message.metadata || null,
    isRead: message.isRead,
    createdAt: message.createdAt,
  };
}

module.exports = { toChatDTO, toMessageDTO };
