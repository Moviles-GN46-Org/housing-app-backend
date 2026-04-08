jest.mock('../../src/repositories/propertyRepository', () => ({
  create: jest.fn(),
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
const userRepository = require('../../src/repositories/userRepository');
const appEvents = require('../../src/events/eventEmitter');
const propertyService = require('../../src/services/propertyService');

describe('propertyService.create', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('emits property:created with expected payload after successful creation', async () => {
    userRepository.findById.mockResolvedValue({
      id: 'landlord-1',
      firstName: 'Lana',
      landlordVerification: { status: 'VERIFIED' },
    });

    propertyRepository.create.mockResolvedValue({
      id: 'property-1',
      title: 'Modern Studio',
      propertyType: 'STUDIO',
      monthlyRent: '1200.00',
      neighborhood: 'Chapinero',
      landlordId: 'landlord-1',
    });

    const payload = {
      title: 'Modern Studio',
      description: 'Near universities',
      propertyType: 'STUDIO',
      monthlyRent: 1200,
      address: 'Street 1',
      neighborhood: 'Chapinero',
      latitude: 4.6,
      longitude: -74.07,
      bedrooms: 1,
      bathrooms: 1,
    };

    const result = await propertyService.create('landlord-1', payload);

    expect(result.id).toBe('property-1');
    expect(appEvents.emit).toHaveBeenCalledTimes(1);
    expect(appEvents.emit).toHaveBeenCalledWith('property:created', {
      property: expect.objectContaining({ id: 'property-1' }),
      landlord: expect.objectContaining({ id: 'landlord-1' }),
      propertyId: 'property-1',
      landlordId: 'landlord-1',
    });
  });
});
