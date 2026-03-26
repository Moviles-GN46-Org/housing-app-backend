const express = require('express');
const request = require('supertest');

jest.mock('../../src/services/analyticsService', () => ({
  getTopSearchedZones: jest.fn(),
  trackSearchEvent: jest.fn(),
  logEvent: jest.fn(),
  logBatch: jest.fn(),
  getDashboard: jest.fn(),
}));

const analyticsService = require('../../src/services/analyticsService');
const analyticsRoutes = require('../../src/routes/analyticsRoutes');

describe('GET /analytics/top-searched-zones', () => {
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

  test('returns zones payload from service', async () => {
    analyticsService.getTopSearchedZones.mockResolvedValue([
      {
        city: 'bogota',
        neighborhood: 'santa fe',
        searches: 10,
        uniqueUsers: 7,
        trendVsPreviousPeriod: 25,
      },
    ]);

    const res = await request(app)
      .get('/analytics/top-searched-zones')
      .query({ from: '2026-02-01T00:00:00.000Z', to: '2026-03-01T00:00:00.000Z', city: 'Bogotá', limit: 10 })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.zones).toHaveLength(1);
    expect(res.body.data.zones[0]).toMatchObject({
      city: 'bogota',
      neighborhood: 'santa fe',
      searches: 10,
      uniqueUsers: 7,
    });
    expect(analyticsService.getTopSearchedZones).toHaveBeenCalledWith(
      expect.objectContaining({ city: 'Bogotá', limit: '10' })
    );
  });
});
