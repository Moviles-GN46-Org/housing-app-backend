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

  test('persists birthDate/job/university and exposes recommended score metadata', async () => {
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
    expect(profileDto.matchReasons).toEqual([]);

    const candidates = await roommateService.getCandidates(me.id);
    const candidateDto = toRoommateProfileDTO(candidates[0]);

    expect(candidateDto.userId).toBe(other.id);
    expect(candidateDto.matchRate).toBeGreaterThan(0);
    expect(candidateDto.compatibilityScore).toBe(candidateDto.matchRate);
    expect(candidateDto.scoreBreakdown.length).toBeGreaterThan(0);
    expect(candidateDto.matchReasons).toContain('same_preferred_area');
    expect(candidateDto.matchReasons).toContain('same_sleep_schedule');
  });

  test('excludes already swiped candidates from the recommendation list', async () => {
    const me = await createStudent('me2', 'Maria');
    const other = await createStudent('other2', 'Carlos');

    await roommateService.upsertProfile(me.id, {
      sleepSchedule: 'FLEXIBLE',
      cleanlinessLevel: 'MODERATE',
      noisePreference: 'MODERATE',
      smokes: false,
      hasPets: true,
      budgetMin: 800,
      budgetMax: 1500,
      preferredArea: 'Chapinero',
      bio: 'Looking for a roommate',
      birthDate: '2002-02-02',
      job: 'Developer',
      university: 'Uniandes',
    });

    await roommateService.upsertProfile(other.id, {
      sleepSchedule: 'FLEXIBLE',
      cleanlinessLevel: 'MODERATE',
      noisePreference: 'MODERATE',
      smokes: false,
      hasPets: true,
      budgetMin: 850,
      budgetMax: 1400,
      preferredArea: 'Chapinero',
      bio: 'Ready to share',
      birthDate: '2001-03-03',
      job: 'Designer',
      university: 'Javeriana',
    });

    const beforeSwipe = await roommateService.getCandidates(me.id);
    expect(beforeSwipe.map((candidate) => candidate.userId)).toContain(other.id);

    await roommateService.swipe(me.id, { swipedUserId: other.id, direction: 'RIGHT' });

    const afterSwipe = await roommateService.getCandidates(me.id);
    expect(afterSwipe.map((candidate) => candidate.userId)).not.toContain(other.id);
  });
});
