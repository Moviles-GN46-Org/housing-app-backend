require('dotenv').config();

const prisma = require('../src/prisma');

const TARGET_NEIGHBORHOODS = ['Las Aguas', 'La Candelaria'];
const REVIEWS_PER_PROPERTY_MIN = 3;
const REVIEWS_PER_PROPERTY_MAX = 6;
const GOOD_REVIEW_RATIO = 0.7;

const GOOD_COMMENTS = [
  'Excelente ubicación, muy cerca a la universidad. El arrendador es muy responsable.',
  'Apartamento en muy buen estado, todo funcionó perfecto durante mi estadía.',
  'Muy buena experiencia, recomendado para estudiantes. Zona segura y tranquila.',
  'El lugar es exactamente como en las fotos. El landlord respondió rápido siempre.',
  'Cumple con todo lo prometido. Volvería a vivir aquí sin dudarlo.',
  'Ubicación inmejorable, buena iluminación y servicios al día.',
  'Muy contento con la estadía. El propietario es atento y todo está bien mantenido.',
  'Excelente relación calidad-precio para la zona. Recomendado.',
];

const BAD_COMMENTS = [
  'El apartamento no estaba en las condiciones que se mostraban en las fotos.',
  'Tuve varios problemas con servicios (agua, internet) y el arrendador tardó en responder.',
  'La zona es ruidosa por las noches y el aislamiento del apartamento es malo.',
  'No recomendaría este lugar. Hubo problemas de humedad que nunca se solucionaron.',
  'Experiencia regular. El precio no corresponde al estado real del inmueble.',
  'El landlord fue difícil de contactar cuando se necesitaron reparaciones.',
];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

async function main() {
  console.log('Fetching verified test students...');
  const students = await prisma.user.findMany({
    where: {
      role: 'STUDENT',
      email: { contains: 'test-student-' },
      studentVerification: { status: 'VERIFIED' },
    },
    select: { id: true, email: true },
  });

  if (students.length === 0) {
    throw new Error(
      'No verified test students found. Run `npm run seed:students` first.',
    );
  }
  console.log(`Found ${students.length} test students.`);

  console.log(
    `Fetching ACTIVE properties in ${TARGET_NEIGHBORHOODS.join(', ')}...`,
  );
  const properties = await prisma.property.findMany({
    where: {
      status: 'ACTIVE',
      OR: TARGET_NEIGHBORHOODS.map((n) => ({
        neighborhood: { equals: n, mode: 'insensitive' },
      })),
    },
    select: { id: true, title: true, neighborhood: true, landlordId: true },
  });

  if (properties.length === 0) {
    throw new Error(
      `No properties found in target neighborhoods. Run \`node scripts/seed-properties.js\` first.`,
    );
  }
  console.log(`Found ${properties.length} target properties.`);

  let createdCount = 0;
  let skippedCount = 0;

  for (const property of properties) {
    const reviewCount = Math.min(
      randInt(REVIEWS_PER_PROPERTY_MIN, REVIEWS_PER_PROPERTY_MAX),
      students.length,
    );
    const reviewers = shuffle(students).slice(0, reviewCount);

    for (const student of reviewers) {
      const isGood = Math.random() < GOOD_REVIEW_RATIO;
      const rating = isGood ? randInt(4, 5) : randInt(1, 2);
      const comment = isGood ? pickRandom(GOOD_COMMENTS) : pickRandom(BAD_COMMENTS);

      try {
        await prisma.review.create({
          data: {
            propertyId: property.id,
            authorId: student.id,
            landlordId: property.landlordId,
            rating,
            comment,
          },
        });
        createdCount++;
      } catch (err) {
        if (err.code === 'P2002') {
          skippedCount++;
        } else {
          console.error(
            `Failed to create review for property ${property.id} by ${student.email}:`,
            err.message,
          );
        }
      }
    }
  }

  console.log(`\nDone. Created ${createdCount} reviews, skipped ${skippedCount} (already existed).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
