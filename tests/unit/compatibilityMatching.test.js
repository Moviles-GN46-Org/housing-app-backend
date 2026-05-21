const CompatibilityMatching = require('../../src/strategies/matching/compatibilityMatching');

describe('CompatibilityMatching', () => {
  test('returns a richer score breakdown for aligned profiles', () => {
    const strategy = new CompatibilityMatching();

    const result = strategy.evaluate(
      {
        sleepSchedule: 'FLEXIBLE',
        cleanlinessLevel: 'MODERATE',
        noisePreference: 'MODERATE',
        smokes: false,
        hasPets: true,
        budgetMin: 900,
        budgetMax: 1400,
        preferredArea: 'Chapinero',
        job: 'Developer',
        university: 'Uniandes',
        age: 23,
      },
      {
        sleepSchedule: 'FLEXIBLE',
        cleanlinessLevel: 'MODERATE',
        noisePreference: 'MODERATE',
        smokes: false,
        hasPets: true,
        budgetMin: 1000,
        budgetMax: 1300,
        preferredArea: 'Chapinero',
        job: 'Developer',
        university: 'Uniandes',
        age: 24,
      }
    );

    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.breakdown.map((item) => item.label)).toEqual(
      expect.arrayContaining([
        'same_sleep_schedule',
        'same_cleanliness_level',
        'same_noise_preference',
        'same_smoking_preference',
        'same_pet_preference',
        'overlapping_budget',
        'same_preferred_area',
        'same_job',
        'same_university',
        'close_age',
      ])
    );
  });
});