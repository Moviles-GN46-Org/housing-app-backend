jest.mock('../../src/repositories/propertyRepository', () => ({
  findByFilters: jest.fn(),
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

const propertyRepository = require('../../src/repositories/propertyRepository');
const propertyService = require('../../src/services/propertyService');

describe('propertyService.search includeAveragePrice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns averageMonthlyRent for the full filtered result set when requested', async () => {
    propertyRepository.findByFilters.mockResolvedValue([
      { id: 'p1', monthlyRent: '1000', reviews: [] },
      { id: 'p2', monthlyRent: '1500', reviews: [] },
      { id: 'p3', monthlyRent: '2000', reviews: [] },
    ]);

    const result = await propertyService.search({
      neighborhood: 'Chapinero',
      limit: 2,
      page: 1,
      includeAveragePrice: true,
    });

    expect(propertyRepository.findByFilters).toHaveBeenCalledWith(
      expect.objectContaining({ neighborhood: 'Chapinero' })
    );
    expect(result.total).toBe(3);
    expect(result.properties).toHaveLength(2);
    expect(result.averageMonthlyRent).toBe(1500);
  });

  test('does not include averageMonthlyRent by default', async () => {
    propertyRepository.findByFilters.mockResolvedValue([
      { id: 'p1', monthlyRent: '1000', reviews: [] },
      { id: 'p2', monthlyRent: '1500', reviews: [] },
    ]);

    const result = await propertyService.search({
      neighborhood: 'Chapinero',
      limit: 20,
      page: 1,
    });

    expect(result).not.toHaveProperty('averageMonthlyRent');
  });
});