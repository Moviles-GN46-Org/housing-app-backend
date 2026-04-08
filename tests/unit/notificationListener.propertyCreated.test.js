jest.mock('../../src/events/eventEmitter', () => ({
  on: jest.fn(),
}));

jest.mock('../../src/services/notificationService', () => ({
  create: jest.fn(),
}));

jest.mock('../../src/repositories/roommateRepository', () => ({
  getActiveTenantNotificationCandidates: jest.fn(),
}));

jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  http: jest.fn(),
}));

const appEvents = require('../../src/events/eventEmitter');
const notificationService = require('../../src/services/notificationService');
const roommateRepository = require('../../src/repositories/roommateRepository');

require('../../src/events/listeners/notificationListener');
const propertyCreatedHandler = appEvents.on.mock.calls.find(([eventName]) => eventName === 'property:created')?.[1];

describe('notificationListener property:created', () => {
  beforeEach(() => {
    notificationService.create.mockClear();
    roommateRepository.getActiveTenantNotificationCandidates.mockClear();
  });

  test('creates notification only for matching student candidates', async () => {
    roommateRepository.getActiveTenantNotificationCandidates.mockResolvedValue([
      {
        budgetMin: '900.00',
        budgetMax: '1300.00',
        preferredArea: 'Chapinero',
        user: {
          id: 'student-match',
          firstName: 'Ana',
          role: 'STUDENT',
          searchEvents: [
            {
              filters: {
                propertyType: 'STUDIO',
                hasWifi: true,
                furnished: true,
              },
            },
          ],
        },
      },
      {
        budgetMin: '300.00',
        budgetMax: '700.00',
        preferredArea: 'Chapinero',
        user: {
          id: 'student-no-budget',
          firstName: 'Luis',
          role: 'STUDENT',
          searchEvents: [{ filters: { propertyType: 'STUDIO' } }],
        },
      },
      {
        budgetMin: '900.00',
        budgetMax: '1300.00',
        preferredArea: 'Chapinero',
        user: {
          id: 'landlord-2',
          firstName: 'Leo',
          role: 'LANDLORD',
          searchEvents: [{ filters: {} }],
        },
      },
    ]);

    await propertyCreatedHandler({
      property: {
        id: 'property-1',
        propertyType: 'STUDIO',
        monthlyRent: '1200.00',
        neighborhood: 'Chapinero Alto',
        hasWifi: true,
        furnished: true,
        hasParking: false,
        hasLaundry: false,
        petFriendly: false,
      },
      landlord: { id: 'landlord-1' },
    });

    expect(notificationService.create).toHaveBeenCalledTimes(1);
    expect(notificationService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'student-match',
        type: 'PROPERTY_MATCH',
        title: 'New Property Match',
        data: expect.objectContaining({ propertyId: 'property-1', landlordId: 'landlord-1' }),
      })
    );
  });

  test('does not create notifications when property type filter does not match', async () => {
    roommateRepository.getActiveTenantNotificationCandidates.mockResolvedValue([
      {
        budgetMin: '900.00',
        budgetMax: '1300.00',
        preferredArea: 'Chapinero',
        user: {
          id: 'student-1',
          firstName: 'Ana',
          role: 'STUDENT',
          searchEvents: [{ filters: { propertyType: 'APARTMENT' } }],
        },
      },
    ]);

    await propertyCreatedHandler({
      property: {
        id: 'property-2',
        propertyType: 'ROOM',
        monthlyRent: '1000.00',
        neighborhood: 'Chapinero',
        hasWifi: true,
        furnished: false,
        hasParking: false,
        hasLaundry: false,
        petFriendly: false,
      },
      landlord: { id: 'landlord-1' },
    });

    expect(notificationService.create).not.toHaveBeenCalled();
  });
});
