const { toRoommateProfileDTO } = require('../../src/dtos/roommate.dto');

describe('toRoommateProfileDTO', () => {
  test('maps roomie fields and computes age and matchRate', () => {
    const now = new Date();
    const birthYear = now.getFullYear() - 20;
    const birthDate = new Date(Date.UTC(birthYear, 0, 1));

    const dto = toRoommateProfileDTO({
      id: 'rp-1',
      userId: 'u-1',
      user: {
        id: 'u-1',
        firstName: 'Ana',
        lastName: 'Perez',
        profilePictureUrl: 'https://example.com/pic.jpg',
      },
      sleepSchedule: 'FLEXIBLE',
      cleanlinessLevel: 'MODERATE',
      noisePreference: 'MODERATE',
      smokes: false,
      hasPets: true,
      budgetMin: '900.00',
      budgetMax: '1300.00',
      preferredArea: null,
      bio: null,
      isActive: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      birthDate,
      matchRate: 82,
      job: 'Student',
      university: 'Uniandes',
      compatibilityScore: 82,
    });

    expect(dto.firstName).toBe('Ana');
    expect(dto.lastName).toBe('Perez');
    expect(dto.profilePictureUrl).toBe('https://example.com/pic.jpg');
    expect(dto.preferredArea).toBe('');
    expect(dto.bio).toBe('');
    expect(dto.matchRate).toBe(82);
    expect(dto.age).toBeGreaterThanOrEqual(19);
    expect(dto.age).toBeLessThanOrEqual(20);
    expect(dto.job).toBe('Student');
    expect(dto.university).toBe('Uniandes');
  });

  test('defaults age and matchRate when values are missing', () => {
    const dto = toRoommateProfileDTO({
      id: 'rp-2',
      userId: 'u-2',
      sleepSchedule: 'EARLY_BIRD',
      cleanlinessLevel: 'VERY_TIDY',
      noisePreference: 'QUIET',
      smokes: false,
      hasPets: false,
      budgetMin: '500.00',
      budgetMax: '1000.00',
      preferredArea: 'Chapinero',
      bio: 'Bio',
      isActive: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      birthDate: null,
      job: null,
      university: null,
    });

    expect(dto.age).toBe(0);
    expect(dto.matchRate).toBe(0);
    expect(dto.compatibilityScore).toBe(0);
    expect(dto.job).toBe('');
    expect(dto.university).toBe('');
    expect(dto.firstName).toBe('');
  });
});
