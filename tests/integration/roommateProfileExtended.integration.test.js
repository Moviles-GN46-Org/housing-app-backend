require('dotenv').config();

const prisma = require('../../src/prisma');
const roommateService = require('../../src/services/roommateService');
const { toRoommateProfileDTO } = require('../../src/dtos/roommate.dto');

describe('integration: roommate profile extended fields', () => {
  const unique = `it-roomie-${Date.now()}`;
  const createdUserIds = [];

  const createStudent = async (suffix, firstName) => {
    const user = await prisma.user.create({
      data: {
        email: `${unique}-${suffix}@example.com`,
        firstName,
        lastName: 'Student',
        role: 'STUDENT',
        authProvider: 'EMAIL',
        isActive: true,
      },
    });
    createdUserIds.push(user.id);
    return user;
  };

  afterEach(async () => {
    if (createdUserIds.length) {
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds.splice(0, createdUserIds.length) } } });
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('persists birthDate/job/university and exposes Roomie-compatible fields', async () => {
    const me = await createStudent('me', 'Ana');
    const other = await createStudent('other', 'Luis');

    await roommateService.upsertProfile(me.id, {
      sleepSchedule: 'FLEXIBLE',
      cleanlinessLevel: 'MODERATE',
      noisePreference: 'MODERATE',
      smokes: false,
      hasPets: true,
      budgetMin: 900,
      budgetMax: 1300,
      preferredArea: 'Chapinero',
      bio: 'I like calm spaces',
      birthDate: '2002-04-10',
      job: 'Part-time Dev',
      university: 'Uniandes',
    });

    await roommateService.upsertProfile(other.id, {
      sleepSchedule: 'FLEXIBLE',
      cleanlinessLevel: 'MODERATE',
      noisePreference: 'MODERATE',
      smokes: false,
      hasPets: true,
      budgetMin: 950,
      budgetMax: 1200,
      preferredArea: 'Chapinero',
      bio: 'Night owl',
      birthDate: '2001-01-15',
      job: 'Designer',
      university: 'Javeriana',
    });

    const profile = await roommateService.getProfile(me.id);
    const profileDto = toRoommateProfileDTO(profile);

    expect(profileDto.firstName).toBe('Ana');
    expect(profileDto.lastName).toBe('Student');
    expect(profileDto.job).toBe('Part-time Dev');
    expect(profileDto.university).toBe('Uniandes');
    expect(profileDto.age).toBeGreaterThan(0);
    expect(profileDto.matchRate).toBe(0);

    const candidates = await roommateService.getCandidates(me.id);
    const candidateDto = toRoommateProfileDTO(candidates[0]);

    expect(candidateDto.userId).toBe(other.id);
    expect(candidateDto.matchRate).toBeGreaterThan(0);
    expect(candidateDto.compatibilityScore).toBe(candidateDto.matchRate);
  });
});
