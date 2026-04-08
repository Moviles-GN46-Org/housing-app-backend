const EventEmitter = require('events');

// Central event bus (singleton)
// Events catalog:
//   'visit:confirmed'  → { visit, student, landlord, property }
//   'roommate:matched' → { user1, user2, matchId, chatId }
//   'review:submitted' → { review, property, author }
//   'report:created'   → { report, reporter, property }
//   'message:sent'     → { message, chat, sender }
//   'listing:expiring' → { property, landlord }
//   'property:created' → { property, landlord, propertyId, landlordId }

const appEvents = new EventEmitter();
appEvents.setMaxListeners(20);

module.exports = appEvents;
