jest.mock('../../src/repositories/roommateRepository', () => ({
  getProfile: jest.fn(),
}));

jest.mock('../../src/repositories/universityRepository', () => ({
  resolveByName: jest.fn(),
}));

jest.mock('../../src/repositories/analyticsRepository', () => ({
  logEvent: jest.fn(),
  logMany: jest.fn(),
  findRecentSearchDuplicate: jest.fn(),
  createSearchEvent: jest.fn(),
  createSearchFilterUsages: jest.fn(),
  getTopSearchedZonesCurrent: jest.fn(),
  getTopSearchedZonesPrevious: jest.fn(),
  getSessionStats: jest.fn(),
  getDashboard: jest.fn(),
  getCrashStats: jest.fn(),
  getFeatureLoadTimes: jest.fn(),
  getSupplyDensityStats: jest.fn(),
  getLocalidadStats: jest.fn(),
  getTopFilters: jest.fn(),
  getLandlordResponseTime: jest.fn(),
  getPopularApartmentSizesNearLocation: jest.fn(),
  getActiveRoommateProfilesCount: jest.fn(),
  getActiveNoisePreferenceDistribution: jest.fn(),
  getActiveHabitsSummary: jest.fn(),
  getActiveBudgetRangeDistribution: jest.fn(),
  getActivePreferredAreaDistribution: jest.fn(),
  getActiveJobDistribution: jest.fn(),
  getActiveUniversityDistribution: jest.fn(),
}));

const analyticsRepository = require('../../src/repositories/analyticsRepository');
const analyticsService = require('../../src/services/analyticsService');

describe('analyticsService.getRoommateProfileCharacteristics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns aggregated roommate profile metrics for dashboard', async () => {
    analyticsRepository.getActiveRoommateProfilesCount.mockResolvedValue(10);
    analyticsRepository.getActiveNoisePreferenceDistribution.mockResolvedValue([
      { noisePreference: 'QUIET', _count: { id: 6 } },
      { noisePreference: 'MODERATE', _count: { id: 3 } },
      { noisePreference: 'LIVELY', _count: { id: 1 } },
    ]);
    analyticsRepository.getActiveHabitsSummary.mockResolvedValue({
      smokesYes: 2,
      smokesNo: 8,
      hasPetsYes: 4,
      hasPetsNo: 6,
    });
    analyticsRepository.getActiveBudgetRangeDistribution.mockResolvedValue([
      { name: '0-500k', count: 2 },
      { name: '500k-1M', count: 5 },
      { name: '1M-1.5M', count: 3 },
    ]);
    analyticsRepository.getActivePreferredAreaDistribution.mockResolvedValue([
      { name: 'Chapinero', count: 4 },
      { name: 'Teusaquillo', count: 3 },
      { name: 'Usaquen', count: 2 },
      { name: 'Not specified', count: 1 },
    ]);
    analyticsRepository.getActiveJobDistribution.mockResolvedValue([
      { name: 'Student', count: 7 },
      { name: 'Engineer', count: 2 },
      { name: 'Not specified', count: 1 },
    ]);
    analyticsRepository.getActiveUniversityDistribution.mockResolvedValue([
      { name: 'Uniandes', count: 5 },
      { name: 'Javeriana', count: 3 },
      { name: 'Nacional', count: 2 },
    ]);

    const result = await analyticsService.getRoommateProfileCharacteristics({ top: '3' });

    expect(result.totalProfiles).toBe(10);
    expect(result.generatedAt).toBeDefined();

    expect(result.metrics.noisePreference).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Quiet', count: 6, pct: 60 }),
      ]),
    );

    expect(result.metrics.smokes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Smokes', count: 2, pct: 20 }),
      ]),
    );

    expect(result.metrics.hasPets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Has pets', count: 4, pct: 40 }),
      ]),
    );

    expect(result.metrics.budgetRanges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: '1.5M+', count: 0, pct: 0 }),
      ]),
    );

    expect(result.metrics.preferredArea.items).toHaveLength(4);
    expect(result.metrics.preferredArea.items[3]).toMatchObject({
      name: 'Others',
      count: 1,
      pct: 10,
    });
    expect(result.metrics.job.items).toHaveLength(3);
    expect(result.metrics.university.items).toHaveLength(3);
  });

  test('validates top query param range', async () => {
    await expect(
      analyticsService.getRoommateProfileCharacteristics({ top: '0' }),
    ).rejects.toThrow('top must be an integer between 1 and 15');
  });
});
