require('dotenv').config();

const prisma = require('../src/prisma');

const DEFAULT_COUNT = 20;
const DEFAULT_PREFIX = 'test-student';

const SLEEP_SCHEDULES = ['EARLY_BIRD', 'NIGHT_OWL', 'FLEXIBLE'];
const CLEANLINESS_LEVELS = ['VERY_TIDY', 'MODERATE', 'RELAXED'];
const NOISE_PREFERENCES = ['QUIET', 'MODERATE', 'LIVELY'];
const UNIVERSITIES = ['Uniandes', 'Javeriana', 'Nacional', 'Rosario', 'Santo Tomas'];
const AREAS = ['Chapinero', 'Teusaquillo', 'Usaquen', 'Cedritos', 'La Candelaria'];
const JOBS = ['Student', 'Intern', 'Developer', 'Designer', 'Research Assistant'];

function parseCount(argv) {
  const rawArg = argv.find((arg) => arg.startsWith('--count='));
  const rawValue = rawArg ? rawArg.split('=')[1] : process.argv[2];

  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return DEFAULT_COUNT;
  }

  const parsed = Number(rawValue);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error('count must be a positive integer');
  }

  return parsed;
}

function pick(items, index) {
  return items[index % items.length];
}

function round2(value) {
  return Number(value.toFixed(2));
}

function buildStudentData(index, prefix) {
  const sequence = index + 1;
  const firstName = `Student${sequence}`;
  const lastName = 'Batch';
  const email = `${prefix}-${sequence}-${Date.now()}@example.com`;
  const budgetBase = 700 + (index % 10) * 120;

  return {
    user: {
      email,
      firstName,
      lastName,
      role: 'STUDENT',
      authProvider: 'EMAIL',
      profilePictureUrl: null,
      phone: null,
      passwordHash: null,
      isActive: true,
    },
    verification: {
      universityEmail: email,
      verificationCode: `seed-${sequence}`,
      codeExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: 'VERIFIED',
      verifiedAt: new Date(),
    },
    profile: {
      sleepSchedule: pick(SLEEP_SCHEDULES, index),
      cleanlinessLevel: pick(CLEANLINESS_LEVELS, index + 1),
      noisePreference: pick(NOISE_PREFERENCES, index + 2),
      smokes: index % 4 === 0,
      hasPets: index % 3 === 0,
      budgetMin: round2(budgetBase),
      budgetMax: round2(budgetBase + 450 + (index % 5) * 50),
      preferredArea: pick(AREAS, index),
      bio: `Batch generated student ${sequence} for roommate testing.`,
      isActive: true,
      birthDate: new Date(2000 + (index % 5), index % 12, (index % 27) + 1),
      job: pick(JOBS, index),
      university: pick(UNIVERSITIES, index),
    },
  };
}

async function main() {
  const count = parseCount(process.argv.slice(2));
  const prefix = process.env.SEED_STUDENT_PREFIX || DEFAULT_PREFIX;
  const created = [];

  console.log(`Creating ${count} verified student users...`);

  for (let i = 0; i < count; i += 1) {
    const payload = buildStudentData(i, prefix);

    const user = await prisma.user.create({ data: payload.user });
    await prisma.studentVerification.create({
      data: {
        userId: user.id,
        ...payload.verification,
      },
    });
    await prisma.roommateProfile.create({
      data: {
        userId: user.id,
        ...payload.profile,
      },
    });

    created.push({ id: user.id, email: user.email });
  }

  const sample = created.slice(0, 3).map((item) => item.email);
  console.log(`Done. Created ${created.length} students with verified roommate profiles.`);
  console.log(`Sample emails: ${sample.join(', ')}`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });