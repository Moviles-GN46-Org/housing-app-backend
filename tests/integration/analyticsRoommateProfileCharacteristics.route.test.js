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
  getFeatureLoadTimes: jest.fn(),
  getPreferredMaxDistanceSummary: jest.fn(),
  getMyPreferredMaxDistance: jest.fn(),
  getTopFilters: jest.fn(),
  getLocalidadStats: jest.fn(),
  getLandlordResponseTime: jest.fn(),
  getRoommateProfileCharacteristics: jest.fn(),
  logEvent: jest.fn(),
  logBatch: jest.fn(),
  trackSearchEvent: jest.fn(),
  trackSearchFilterUsage: jest.fn(),
}));

const analyticsService = require('../../src/services/analyticsService');
const analyticsRoutes = require('../../src/routes/analyticsRoutes');

describe('GET /analytics/roommate-profile-characteristics', () => {
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

  test('returns roommate profile characteristic metrics payload', async () => {
    analyticsService.getRoommateProfileCharacteristics.mockResolvedValue({
      totalProfiles: 12,
      generatedAt: '2026-05-22T12:00:00.000Z',
      metrics: {
        noisePreference: [
          { name: 'Quiet', value: 'QUIET', count: 7, pct: 58.3 },
          { name: 'Moderate', value: 'MODERATE', count: 5, pct: 41.7 },
        ],
      },
    });

    const res = await request(app)
      .get('/analytics/roommate-profile-characteristics')
      .query({ top: 5 })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.totalProfiles).toBe(12);
    expect(res.body.data.metrics.noisePreference).toHaveLength(2);
    expect(analyticsService.getRoommateProfileCharacteristics).toHaveBeenCalledWith({
      top: '5',
    });
  });
});
