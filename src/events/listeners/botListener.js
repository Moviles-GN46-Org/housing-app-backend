const appEvents = require('../eventEmitter');
const chatRepository = require('../../repositories/chatRepository');
const prisma = require('../../prisma'); 

appEvents.on('message:sent', async ({ message, chat, sender }) => {
  if (sender.role === 'LANDLORD') return;

  const content = message.content.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const userName = sender.firstName ? sender.firstName : '';

  let botResponse = null;

  // CONSULTA A LA BASE DE DATOS (Una sola vez para toda la lógica)
  const propId = chat.propertyId || chat.property;
  const prop = await prisma.property.findUnique({ where: { id: propId } });

  if (!prop) return; // Si no hay propiedad, no podemos responder

  // --- LÓGICA DE CATEGORÍAS ---

  // 1. SALUDOS
  if (content.match(/h+o+l+a+/) || content.includes("buen")) {
    botResponse = `¡Hola${userName ? ' ' + userName : ''}! Soy el asistente virtual de la propiedad "${prop.title}". ¿Tienes alguna duda sobre el precio, los servicios o te gustaría agendar una visita?`;
  }
  
  // 2. DINERO Y PAGOS
  else if (content.includes("preci") || content.includes("cuanto cuesta") || content.includes("valor") || content.includes("deposito")) {
    botResponse = `El valor mensual es de $${prop.monthlyRent.toLocaleString()} pesos.${prop.includesUtilities ? ' Los servicios están incluidos en el precio.' : ' Los servicios no están incluidos.'}`;
    if (prop.depositAmount) {
      botResponse += ` Se requiere un depósito de $${prop.depositAmount.toLocaleString()}.`;
    }
  }

  // 3. MASCOTAS
  else if (content.includes("mascota") || content.includes("perro") || content.includes("gato")) {
    botResponse = prop.petFriendly 
      ? "¡Claro que sí! La propiedad es pet-friendly, así que puedes traer a tu mascota." 
      : "Lo siento, por políticas de la propiedad no se permiten mascotas.";
  }

  // 4. COMODIDADES (Wifi, Lavandería, Parking)
  else if (content.includes("wifi") || content.includes("internet")) {
    botResponse = prop.hasWifi ? "¡Sí! La propiedad cuenta con conexión Wi-Fi." : "No, la propiedad no cuenta con Wi-Fi incluido.";
  }
  else if (content.includes("parqueadero") || content.includes("garaje") || content.includes("parking")) {
    botResponse = prop.hasParking ? "Sí, la propiedad incluye parqueadero." : "No, la propiedad no cuenta con parqueadero.";
  }
  else if (content.includes("lavanderia") || content.includes("lavado")) {
    botResponse = prop.hasLaundry ? "Sí, cuenta con zona de lavandería." : "No tiene zona de lavandería propia.";
  }

  // 5. DETALLES DE ESPACIO
  else if (content.includes("habitacion") || content.includes("cuarto") || content.includes("bano") || content.includes("metros") || content.includes("tamano")) {
    botResponse = `La propiedad tiene ${prop.bedrooms} habitaciones, ${prop.bathrooms} baños y un área de ${prop.sizeM2 || 'N/A'} m². ¿Te parece bien el espacio?`;
  }

  // 6. VISITAS
  else if (content.includes("visit") || content.includes("agend") || content.includes("cita") || content.includes("verla")) {
    botResponse = `¡Claro! Me encantaría mostrarte el lugar. Por favor, dime qué día y hora te queda mejor y coordinamos para que pases a conocerla.`;
  }

  // 7. DESPEDIDAS
  else if (content.includes("gracias") || content.includes("chao") || content.includes("adios")) {
    botResponse = `¡Con mucho gusto! Espero que tengas un excelente día. Avísame si necesitas algo más.`;
  }

  // 8. FALLBACK (Mensaje genérico)
  else {
    botResponse = `Disculpa, no entendí bien esa parte. Como asistente, puedo responderte sobre el **precio**, **mascotas**, **servicios** (como el wifi), o ayudarte a **agendar una visita**. ¿En qué más te puedo ayudar?`;
  }

  // --- ENVÍO DE RESPUESTA ---
  if (botResponse) {
    const landlord = chat.participants.find(p => p.user.role === 'LANDLORD');
    if (landlord) {
      setTimeout(async () => {
        await chatRepository.createMessage({
          chatId: chat.id,
          senderId: landlord.userId,
          type: 'TEXT',
          content: botResponse,
        });
        await chatRepository.updateTimestamp(chat.id);
      }, 1500); 
    }
  }
});