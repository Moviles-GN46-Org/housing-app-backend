const express = require('express');
const request = require('supertest');

jest.mock('../../src/middleware/auth', () => (req, res, next) => {
  req.user = { userId: 'user-1', role: 'ADMIN', isVerified: true };
  next();
});

jest.mock('../../src/services/analyticsService', () => ({
  getFeatureLoadTimes: jest.fn(),
  getPopularApartmentSizeNearUniversity: jest.fn(),
  getTopSearchedZones: jest.fn(),
  getSessionStats: jest.fn(),
  getDashboard: jest.fn(),
  getCrashStats: jest.fn(),
  getSupplyDensityStats: jest.fn(),
  getLocalidadStats: jest.fn(),
  logEvent: jest.fn(),
  logBatch: jest.fn(),
  trackSearchEvent: jest.fn(),
  getPreferredMaxDistanceSummary: jest.fn(),
  getMyPreferredMaxDistance: jest.fn(),
}));

const analyticsService = require('../../src/services/analyticsService');
const analyticsRoutes = require('../../src/routes/analyticsRoutes');

describe('GET /analytics/feature-load-times', () => {
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

  test('returns feature load time stats from the service', async () => {
    analyticsService.getFeatureLoadTimes.mockResolvedValue({
      screens: [
        { name: 'Home', samples: 312, avgMs: 842, medianMs: 610, p95Ms: 2100 },
        { name: 'Map Search', samples: 204, avgMs: 1210, medianMs: 980, p95Ms: 3000 },
      ],
    });

    const res = await request(app)
      .get('/analytics/feature-load-times')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.screens).toHaveLength(2);
    expect(res.body.data.screens[0]).toMatchObject({
      name: 'Home',
      samples: 312,
      avgMs: 842,
    });
    expect(analyticsService.getFeatureLoadTimes).toHaveBeenCalledWith({});
  });

  test('passes from/to query params through to the service', async () => {
    analyticsService.getFeatureLoadTimes.mockResolvedValue({ screens: [] });

    await request(app)
      .get('/analytics/feature-load-times')
      .query({ from: '2026-01-01', to: '2026-02-01' })
      .expect(200);

    expect(analyticsService.getFeatureLoadTimes).toHaveBeenCalledWith({
      from: '2026-01-01',
      to: '2026-02-01',
    });
  });
});
