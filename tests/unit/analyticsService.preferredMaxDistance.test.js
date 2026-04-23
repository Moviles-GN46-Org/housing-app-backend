jest.mock('../../src/repositories/analyticsRepository', () => ({
  listRadiusSearches: jest.fn(),
  findRecentSearchDuplicate: jest.fn(),
  createSearchEvent: jest.fn(),
  logEvent: jest.fn(),
  logMany: jest.fn(),
  getDashboard: jest.fn(),
  getTopSearchedZonesCurrent: jest.fn(),
  getTopSearchedZonesPrevious: jest.fn(),
  getSessionStats: jest.fn(),
  getCrashStats: jest.fn(),
  getSupplyDensityStats: jest.fn(),
}));

const analyticsRepository = require('../../src/repositories/analyticsRepository');
const analyticsService = require('../../src/services/analyticsService');

describe('analyticsService preferred max distance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns global summary with median/p75/max', async () => {
    analyticsRepository.listRadiusSearches.mockResolvedValue([
      { radiusKm: 2, searchedAt: new Date('2026-04-20T10:00:00.000Z') },
      { radiusKm: 3, searchedAt: new Date('2026-04-20T11:00:00.000Z') },
      { radiusKm: 5, searchedAt: new Date('2026-04-20T12:00:00.000Z') },
      { radiusKm: 7, searchedAt: new Date('2026-04-20T13:00:00.000Z') },
    ]);

    const result = await analyticsService.getPreferredMaxDistanceSummary({
      from: '2026-04-01T00:00:00.000Z',
      to: '2026-05-01T00:00:00.000Z',
    });

    expect(result.samples).toBe(4);
    expect(result.preferredKm).toBe(4);
    expect(result.recommendedMaxKm).toBe(5.5);
    expect(result.maxObservedKm).toBe(7);
    expect(result.lastUpdatedAt).toBe('2026-04-20T13:00:00.000Z');
  });

  test('returns empty payload when no rows in range', async () => {
    analyticsRepository.listRadiusSearches.mockResolvedValue([]);

    const result = await analyticsService.getPreferredMaxDistanceSummary({
      from: '2026-04-01T00:00:00.000Z',
      to: '2026-05-01T00:00:00.000Z',
    });

    expect(result).toMatchObject({
      preferredKm: null,
      recommendedMaxKm: null,
      maxObservedKm: null,
      samples: 0,
      lastUpdatedAt: null,
    });
  });
});