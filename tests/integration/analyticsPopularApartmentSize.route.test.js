const express = require('express');
const request = require('supertest');

jest.mock('../../src/middleware/auth', () => (req, res, next) => {
  req.user = { userId: 'user-1', role: 'STUDENT', isVerified: true };
  next();
});

jest.mock('../../src/services/analyticsService', () => ({
  getPopularApartmentSizeNearUniversity: jest.fn(),
  getTopSearchedZones: jest.fn(),
  getSessionStats: jest.fn(),
  getDashboard: jest.fn(),
  getCrashStats: jest.fn(),
  getSupplyDensityStats: jest.fn(),
  logEvent: jest.fn(),
  logBatch: jest.fn(),
  trackSearchEvent: jest.fn(),
}));

const analyticsService = require('../../src/services/analyticsService');
const analyticsRoutes = require('../../src/routes/analyticsRoutes');

describe('GET /analytics/popular-apartment-size-near-university', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/analytics', analyticsRoutes);

    app.use((err, req, res, next) => {
      res.status(err.statusCode || 500).json({
        success: false,
        error: { message: err.message, code: err.code || 'INTERNAL_ERROR' },
      });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('returns the popular apartment size payload from the service', async () => {
    analyticsService.getPopularApartmentSizeNearUniversity.mockResolvedValue({
      university: {
        id: 'uni-1',
        name: 'Universidad de los Andes',
        city: 'Bogotá',
        latitude: 4.6014,
        longitude: -74.0661,
        radiusKm: 2,
      },
      topSizes: [
        { sizeRange: '30-34 m2', bucketMinM2: 30, bucketMaxM2: 34, count: 8, averageSizeM2: 32.1 },
      ],
      popularSize: { sizeRange: '30-34 m2', bucketMinM2: 30, bucketMaxM2: 34, count: 8, averageSizeM2: 32.1 },
    });

    const res = await request(app)
      .get('/analytics/popular-apartment-size-near-university')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.popularSize).toMatchObject({
      sizeRange: '30-34 m2',
      count: 8,
    });
    expect(analyticsService.getPopularApartmentSizeNearUniversity).toHaveBeenCalledWith('user-1', {});
  });

  test('supports onlyPopularSize flag', async () => {
    analyticsService.getPopularApartmentSizeNearUniversity.mockResolvedValue({
      popularSize: {
        sizeRange: '30-34 m2',
        bucketMinM2: 30,
        bucketMaxM2: 34,
        count: 8,
        averageSizeM2: 32.1,
      },
    });

    const res = await request(app)
      .get('/analytics/popular-apartment-size-near-university')
      .query({ onlyPopularSize: true })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual({
      popularSize: {
        sizeRange: '30-34 m2',
        bucketMinM2: 30,
        bucketMaxM2: 34,
        count: 8,
        averageSizeM2: 32.1,
      },
    });
    expect(analyticsService.getPopularApartmentSizeNearUniversity).toHaveBeenCalledWith('user-1', {
      onlyPopularSize: 'true',
    });
  });
});