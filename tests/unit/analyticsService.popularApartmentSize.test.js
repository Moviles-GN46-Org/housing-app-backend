jest.mock('../../src/repositories/roommateRepository', () => ({
  getProfile: jest.fn(),
}));

jest.mock('../../src/repositories/universityRepository', () => ({
  resolveByName: jest.fn(),
}));

jest.mock('../../src/repositories/analyticsRepository', () => ({
  getPopularApartmentSizesNearLocation: jest.fn(),
  logEvent: jest.fn(),
  logMany: jest.fn(),
  findRecentSearchDuplicate: jest.fn(),
  createSearchEvent: jest.fn(),
  getTopSearchedZonesCurrent: jest.fn(),
  getTopSearchedZonesPrevious: jest.fn(),
  getSessionStats: jest.fn(),
  getDashboard: jest.fn(),
  getCrashStats: jest.fn(),
  getSupplyDensityStats: jest.fn(),
}));

const roommateRepository = require('../../src/repositories/roommateRepository');
const universityRepository = require('../../src/repositories/universityRepository');
const analyticsRepository = require('../../src/repositories/analyticsRepository');
const analyticsService = require('../../src/services/analyticsService');

describe('analyticsService.getPopularApartmentSizeNearUniversity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('uses the user university and returns the most popular size bucket', async () => {
    roommateRepository.getProfile.mockResolvedValue({ university: 'Uniandes' });
    universityRepository.resolveByName.mockResolvedValue({
      id: 'uni-1',
      name: 'Universidad de los Andes',
      city: 'Bogotá',
      latitude: 4.6014,
      longitude: -74.0661,
      defaultRadiusKm: 2,
    });
    analyticsRepository.getPopularApartmentSizesNearLocation.mockResolvedValue([
      { bucketMinM2: 30, bucketMaxM2: 34, count: 8, avgSizeM2: 32.1 },
      { bucketMinM2: 25, bucketMaxM2: 29, count: 4, avgSizeM2: 27.3 },
    ]);

    const result = await analyticsService.getPopularApartmentSizeNearUniversity('user-1');

    expect(roommateRepository.getProfile).toHaveBeenCalledWith('user-1');
    expect(universityRepository.resolveByName).toHaveBeenCalledWith('Uniandes');
    expect(analyticsRepository.getPopularApartmentSizesNearLocation).toHaveBeenCalledWith(
      expect.objectContaining({
        latitude: 4.6014,
        longitude: -74.0661,
        radiusKm: 2,
        limit: 3,
        bucketSize: 5,
      }),
    );
    expect(result.popularSize).toMatchObject({
      sizeRange: '30-34 m2',
      count: 8,
      averageSizeM2: 32.1,
    });
    expect(result.topSizes).toHaveLength(2);
  });

  test('returns only popularSize when the compact flag is enabled', async () => {
    roommateRepository.getProfile.mockResolvedValue({ university: 'Uniandes' });
    universityRepository.resolveByName.mockResolvedValue({
      id: 'uni-1',
      name: 'Universidad de los Andes',
      city: 'Bogotá',
      latitude: 4.6014,
      longitude: -74.0661,
      defaultRadiusKm: 2,
    });
    analyticsRepository.getPopularApartmentSizesNearLocation.mockResolvedValue([
      { bucketMinM2: 30, bucketMaxM2: 34, count: 8, avgSizeM2: 32.1 },
    ]);

    const result = await analyticsService.getPopularApartmentSizeNearUniversity('user-1', {
      onlyPopularSize: 'true',
    });

    expect(result).toEqual({
      popularSize: {
        sizeRange: '30-34 m2',
        bucketMinM2: 30,
        bucketMaxM2: 34,
        count: 8,
        averageSizeM2: 32.1,
      },
    });
  });
});