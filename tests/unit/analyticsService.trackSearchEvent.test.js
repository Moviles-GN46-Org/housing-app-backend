jest.mock('../../src/repositories/analyticsRepository', () => ({
  findRecentSearchDuplicate: jest.fn(),
  createSearchEvent: jest.fn(),
  logEvent: jest.fn(),
  logMany: jest.fn(),
  getDashboard: jest.fn(),
  getTopSearchedZonesCurrent: jest.fn(),
  getTopSearchedZonesPrevious: jest.fn(),
}));

const analyticsRepository = require('../../src/repositories/analyticsRepository');
const analyticsService = require('../../src/services/analyticsService');

describe('analyticsService.trackSearchEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns deduped true when duplicate exists in short window', async () => {
    analyticsRepository.findRecentSearchDuplicate.mockResolvedValue({ id: 'dup-1' });

    const result = await analyticsService.trackSearchEvent(null, {
      sessionId: 's-1',
      city: 'Bogotá',
      neighborhood: 'Santa Fe',
      source: 'house_list',
      filters: { propertyType: 'ROOM' },
    });

    expect(result).toEqual({ id: 'dup-1', deduped: true });
    expect(analyticsRepository.createSearchEvent).not.toHaveBeenCalled();
  });

  test('creates event when there is no duplicate', async () => {
    analyticsRepository.findRecentSearchDuplicate.mockResolvedValue(null);
    analyticsRepository.createSearchEvent.mockResolvedValue({ id: 'new-1' });

    const result = await analyticsService.trackSearchEvent('user-1', {
      sessionId: 's-2',
      city: 'Bogotá',
      neighborhood: 'santafé',
      source: 'map',
      filters: { amenities: ['wifi'] },
    });

    expect(result).toEqual({ id: 'new-1', deduped: false });
    expect(analyticsRepository.createSearchEvent).toHaveBeenCalledTimes(1);
    const call = analyticsRepository.createSearchEvent.mock.calls[0][0];
    expect(call.canonicalZone).toBe('bogota|santa fe');
    expect(call.userId).toBe('user-1');
  });

  test('rejects payload without valid search signal', async () => {
    await expect(
      analyticsService.trackSearchEvent(null, {
        sessionId: 's-3',
        city: 'Bogotá',
        source: 'house_list',
      })
    ).rejects.toThrow('A valid search must include neighborhood, query, or lat/lng');
  });
});
