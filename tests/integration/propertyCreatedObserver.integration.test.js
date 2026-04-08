require('dotenv').config();

const prisma = require('../../src/prisma');
const propertyService = require('../../src/services/propertyService');

// Ensure observer listeners are registered for this integration test.
require('../../src/events/listeners/notificationListener');

const unique = `it-observer-${Date.now()}`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitFor = async (predicate, { retries = 30, delayMs = 50 } = {}) => {
  for (let i = 0; i < retries; i += 1) {
    const result = await predicate();
    if (result) return result;
    await sleep(delayMs);
  }
  return null;
};

describe('integration: property created observer', () => {
  const createdUserIds = [];

  const createUser = async ({ email, firstName, role }) => {
    const user = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName: 'Integration',
        role,
        authProvider: 'EMAIL',
        isActive: true,
      },
    });
    createdUserIds.push(user.id);
    return user;
  };

  beforeEach(async () => {
    await prisma.notification.deleteMany({
      where: {
        OR: [
          { user: { email: { startsWith: unique } } },
          { data: { path: ['source'], equals: 'property_created_observer' } },
        ],
      },
    });
  });

  afterEach(async () => {
    if (createdUserIds.length) {
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds.splice(0, createdUserIds.length) } } });
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('creates PROPERTY_MATCH notifications only for compatible tenants', async () => {
    const landlord = await createUser({
      email: `${unique}-landlord@example.com`,
      firstName: 'Lana',
      role: 'LANDLORD',
    });

    await prisma.landlordVerification.create({
      data: {
        userId: landlord.id,
        idDocumentUrl: 'https://example.com/id.png',
        utilityBillUrl: 'https://example.com/bill.png',
        status: 'VERIFIED',
      },
    });

    const matchingStudent = await createUser({
      email: `${unique}-student-match@example.com`,
      firstName: 'Ana',
      role: 'STUDENT',
    });

    const nonMatchingStudent = await createUser({
      email: `${unique}-student-no-match@example.com`,
      firstName: 'Luis',
      role: 'STUDENT',
    });

    await prisma.roommateProfile.create({
      data: {
        userId: matchingStudent.id,
        sleepSchedule: 'FLEXIBLE',
        cleanlinessLevel: 'MODERATE',
        noisePreference: 'MODERATE',
        smokes: false,
        hasPets: false,
        budgetMin: '900.00',
        budgetMax: '1300.00',
        preferredArea: 'Chapinero',
        isActive: true,
      },
    });

    await prisma.roommateProfile.create({
      data: {
        userId: nonMatchingStudent.id,
        sleepSchedule: 'FLEXIBLE',
        cleanlinessLevel: 'MODERATE',
        noisePreference: 'MODERATE',
        smokes: false,
        hasPets: false,
        budgetMin: '900.00',
        budgetMax: '1300.00',
        preferredArea: 'Chapinero',
        isActive: true,
      },
    });

    await prisma.searchEvent.create({
      data: {
        userId: matchingStudent.id,
        sessionId: `${unique}-sess-1`,
        city: 'Bogotá',
        neighborhood: 'Chapinero',
        canonicalZone: 'bogota|chapinero',
        filters: { propertyType: 'STUDIO', hasWifi: true, furnished: true },
        filtersHash: `${unique}-hash-1`,
        source: 'house_list',
      },
    });

    await prisma.searchEvent.create({
      data: {
        userId: nonMatchingStudent.id,
        sessionId: `${unique}-sess-2`,
        city: 'Bogotá',
        neighborhood: 'Chapinero',
        canonicalZone: 'bogota|chapinero',
        filters: { propertyType: 'APARTMENT', hasWifi: true, furnished: true },
        filtersHash: `${unique}-hash-2`,
        source: 'house_list',
      },
    });

    const property = await propertyService.create(landlord.id, {
      title: 'Studio near campus',
      description: 'Walking distance to university',
      propertyType: 'STUDIO',
      monthlyRent: 1200,
      address: '123 Main St',
      neighborhood: 'Chapinero Alto',
      latitude: 4.6483,
      longitude: -74.0628,
      bedrooms: 1,
      bathrooms: 1,
      furnished: true,
      hasWifi: true,
      hasParking: false,
      hasLaundry: false,
      petFriendly: false,
    });

    const notifications = await waitFor(async () => {
      const rows = await prisma.notification.findMany({
        where: {
          type: 'PROPERTY_MATCH',
          userId: { in: [matchingStudent.id, nonMatchingStudent.id] },
          data: { path: ['propertyId'], equals: property.id },
        },
        orderBy: { createdAt: 'asc' },
      });
      return rows.length >= 1 ? rows : null;
    });

    expect(notifications).not.toBeNull();
    expect(notifications).toHaveLength(1);
    expect(notifications[0].userId).toBe(matchingStudent.id);
    expect(notifications[0].title).toBe('New Property Match');
    expect(notifications[0].data).toMatchObject({
      propertyId: property.id,
      landlordId: landlord.id,
      source: 'property_created_observer',
    });
  });
});
