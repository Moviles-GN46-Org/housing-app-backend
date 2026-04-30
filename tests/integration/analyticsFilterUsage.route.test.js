const express = require("express");
const request = require("supertest");

jest.mock("../../src/services/analyticsService", () => ({
  getTopSearchedZones: jest.fn(),
  trackSearchEvent: jest.fn(),
  trackSearchFilterUsage: jest.fn(),
  logEvent: jest.fn(),
  logBatch: jest.fn(),
  getDashboard: jest.fn(),
}));

const analyticsService = require("../../src/services/analyticsService");
const analyticsRoutes = require("../../src/routes/analyticsRoutes");

describe("POST /analytics/search-filter-usages", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/analytics", analyticsRoutes);

    app.use((err, req, res, next) => {
      res.status(err.statusCode || 500).json({
        success: false,
        error: { message: err.message, code: err.code || "INTERNAL_ERROR" },
      });
    });
  });

  test("returns stored count from service", async () => {
    analyticsService.trackSearchFilterUsage.mockResolvedValue({ stored: 3 });

    const res = await request(app)
      .post("/analytics/search-filter-usages")
      .send({
        sessionId: "s-test-1",
        filters: [
          { category: "budget", value: "600k_900k" },
          { category: "amenities", value: "wifi" },
          { category: "utilities", value: "included" },
        ],
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual({ stored: 3 });
    expect(analyticsService.trackSearchFilterUsage).toHaveBeenCalledWith(
      null,
      expect.objectContaining({ sessionId: "s-test-1" }),
    );
  });
});
