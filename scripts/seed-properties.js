require('dotenv').config();
const prisma = require('../src/prisma');

async function main() {
  // 1. Buscamos un Landlord existente para asignarle las casas
  // Si no tienes uno, esto fallará. Asegúrate de tener al menos un usuario LANDLORD.
  const landlord = await prisma.user.findFirst({
    where: { role: 'LANDLORD' }
  });

  if (!landlord) {
    console.error("No hay ningún LANDLORD en la base de datos. Crea uno primero.");
    return;
  }

  const properties = [];
  const baseLat = 4.6014; // Coordenadas aprox de Los Andes (ML)
  const baseLng = -74.0661;

  console.log(`Generando 30 propiedades cerca de Los Andes para ${landlord.email}...`);

  for (let i = 1; i <= 30; i++) {
    // Generamos una variación aleatoria de ~1km a la redonda
    const lat = baseLat + (Math.random() - 0.5) * 0.01;
    const lng = baseLng + (Math.random() - 0.5) * 0.01;
    const rent = Math.floor(Math.random() * (2500000 - 1200000 + 1) + 1200000);

    properties.push({
      landlordId: landlord.id,
      title: `Apartamento Estudiantil Uniandes #${i}`,
      description: `Excelente ubicación cerca a la universidad. Cuenta con seguridad 24/7 y ambiente tranquilo para estudiar.`,
      propertyType: i % 2 === 0 ? 'STUDIO' : 'ROOM',
      monthlyRent: rent,
      address: `Calle ${12 + i} # ${i + 3} - ${i * 2}`,
      neighborhood: i % 3 === 0 ? 'La Candelaria' : 'Las Aguas',
      latitude: lat,
      longitude: lng,
      bedrooms: Math.floor(Math.random() * 3) + 1,
      bathrooms: Math.floor(Math.random() * 2) + 1,
      imageUrls: ["https://raw.githubusercontent.com/Moviles-GN46-Org/housing-app-flutter/main/assets/images/placeholder_house.png"]
    });
  }

  // Insertamos todo de golpe
  const created = await prisma.property.createMany({
    data: properties
  });

  console.log(`¡Éxito! Se crearon ${created.count} propiedades nuevas.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });