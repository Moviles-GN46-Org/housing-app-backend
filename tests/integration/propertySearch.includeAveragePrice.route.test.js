const express = require('express');
const request = require('supertest');

jest.mock('../../src/middleware/auth', () => (req, res, next) => {
  req.user = { userId: 'user-1', role: 'STUDENT', isVerified: true };
  next();
});

jest.mock('../../src/controllers/reviewController', () => ({
  listForProperty: jest.fn(),
  create: jest.fn(),
}));

jest.mock('../../src/services/propertyService', () => ({
  search: jest.fn(),
}));

const propertyService = require('../../src/services/propertyService');
const propertyRoutes = require('../../src/routes/propertyRoutes');

const propertyFixture = {
  id: 'property-1',
  title: 'Studio in Chapinero',
  description: 'Bright and central',
  propertyType: 'STUDIO',
  status: 'ACTIVE',
  monthlyRent: '1200',
  depositAmount: null,
  includesUtilities: true,
  address: 'Street 123',
  neighborhood: 'Chapinero',
  city: 'Bogota',
  latitude: 4.65,
  longitude: -74.06,
  sizeM2: 35,
  bedrooms: 1,
  bathrooms: 1,
  furnished: true,
  petFriendly: false,
  hasParking: false,
  hasLaundry: false,
  hasWifi: true,
  imageUrls: [],
  landlord: null,
  reviews: [],
  publishedAt: '2026-04-19T00:00:00.000Z',
  createdAt: '2026-04-19T00:00:00.000Z',
};

describe('GET /api/properties includeAveragePrice', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/properties', propertyRoutes);

    app.use((err, req, res, next) => {
      res.status(err.statusCode || 500).json({
        success: false,
        error: { message: err.message, code: err.code || 'INTERNAL_ERROR' },
      });
    });

    propertyService.search.mockImplementation((query) => {
      const baseResponse = {
        properties: [propertyFixture],
        total: 1,
        page: 1,
        limit: 20,
      };

      if (query.includeAveragePrice === 'true') {
        return Promise.resolve({ ...baseResponse, averageMonthlyRent: 1200 });
      }

      return Promise.resolve(baseResponse);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('keeps the default response unchanged when the flag is omitted', async () => {
    const res = await request(app)
      .get('/api/properties')
      .query({ neighborhood: 'Chapinero', page: 1, limit: 20 })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      total: 1,
      page: 1,
      limit: 20,
    });
    expect(res.body.data).not.toHaveProperty('averageMonthlyRent');
  });

  test('adds averageMonthlyRent when includeAveragePrice is true', async () => {
    const res = await request(app)
      .get('/api/properties')
      .query({ neighborhood: 'Chapinero', page: 1, limit: 20, includeAveragePrice: true })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      total: 1,
      page: 1,
      limit: 20,
      averageMonthlyRent: 1200,
    });
  });
});