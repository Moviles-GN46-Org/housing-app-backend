jest.mock('../../src/repositories/roommateRepository', () => ({
  getProfile: jest.fn(),
  upsertProfile: jest.fn(),
  getAlreadySwiped: jest.fn(),
  getActiveProfiles: jest.fn(),
}));

jest.mock('../../src/repositories/chatRepository', () => ({
  create: jest.fn(),
  addParticipant: jest.fn(),
}));

jest.mock('../../src/repositories/userRepository', () => ({
  findById: jest.fn(),
}));

jest.mock('../../src/events/eventEmitter', () => ({
  emit: jest.fn(),
}));

jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  http: jest.fn(),
}));

const roommateRepository = require('../../src/repositories/roommateRepository');
const roommateService = require('../../src/services/roommateService');

describe('roommateService.upsertProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('trims and persists birthDate/job/university', async () => {
    roommateRepository.upsertProfile.mockResolvedValue({ id: 'rp-1' });

    const result = await roommateService.upsertProfile('user-1', {
      sleepSchedule: 'FLEXIBLE',
      cleanlinessLevel: 'MODERATE',
      noisePreference: 'MODERATE',
      birthDate: '2002-05-20',
      job: '  Software Intern  ',
      university: '  Uniandes  ',
    });

    expect(result).toEqual({ id: 'rp-1' });
    const payload = roommateRepository.upsertProfile.mock.calls[0][1];
    expect(payload.birthDate).toBeInstanceOf(Date);
    expect(payload.job).toBe('Software Intern');
    expect(payload.university).toBe('Uniandes');
  });

  test('rejects future birthDate', async () => {
    const future = new Date(Date.now() + 86400000).toISOString();

    await expect(
      roommateService.upsertProfile('user-1', {
        sleepSchedule: 'FLEXIBLE',
        cleanlinessLevel: 'MODERATE',
        noisePreference: 'MODERATE',
        birthDate: future,
      })
    ).rejects.toThrow('birthDate cannot be in the future');
  });

  test('rejects invalid birthDate format', async () => {
    await expect(
      roommateService.upsertProfile('user-1', {
        sleepSchedule: 'FLEXIBLE',
        cleanlinessLevel: 'MODERATE',
        noisePreference: 'MODERATE',
        birthDate: 'not-a-date',
      })
    ).rejects.toThrow('birthDate must be a valid date');
  });
});
