const appEvents = require('../events/eventEmitter');
const chatRepository = require('../repositories/chatRepository');

const initBot = () => {
  appEvents.on('message:sent', async ({ message, chat, sender }) => {
    // 1. Si el mensaje lo envió el LANDLORD, ignoramos (para evitar loops infinitos)
    if (sender.role === 'LANDLORD') return;

    // 2. Lógica del BOT
    const lowerContent = message.content.toLowerCase();
    let botResponse = null;

    if (lowerContent.includes("precio")) {
      botResponse = `Hola, el precio de la propiedad es $${chat.property.monthlyRent} pesos. ¿Te gustaría agendar una visita?`;
    } else if (lowerContent.includes("visita")) {
      botResponse = "¡Claro! Con gusto. Por favor indícame qué día de la semana te queda mejor y te propongo una hora.";
    }

    // 3. Si hay respuesta, la guardamos
    if (botResponse) {
      // Usamos el ID del Landlord para que el mensaje parezca enviado por él
      await chatRepository.createMessage({
        chatId: chat.id,
        senderId: chat.participants.find(p => p.user.role === 'LANDLORD').userId,
        type: 'TEXT',
        content: botResponse,
      });
      // Actualizamos el tiempo del chat para que aparezca arriba en la lista
      await chatRepository.updateTimestamp(chat.id);
    }
  });
};

module.exports = initBot;