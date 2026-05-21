jest.mock("../../src/repositories/analyticsRepository", () => ({
  createSearchFilterUsages: jest.fn(),
  findRecentSearchDuplicate: jest.fn(),
  createSearchEvent: jest.fn(),
  logEvent: jest.fn(),
  logMany: jest.fn(),
  getDashboard: jest.fn(),
  getTopSearchedZonesCurrent: jest.fn(),
  getTopSearchedZonesPrevious: jest.fn(),
}));

const analyticsRepository = require("../../src/repositories/analyticsRepository");
const analyticsService = require("../../src/services/analyticsService");

describe("analyticsService.trackSearchFilterUsage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("stores one filter when payload uses filter object", async () => {
    analyticsRepository.createSearchFilterUsages.mockResolvedValue({
      count: 1,
    });

    const result = await analyticsService.trackSearchFilterUsage("user-1", {
      sessionId: "sess-1",
      filter: {
        category: "budget",
        value: "under_600k",
      },
    });

    expect(result).toEqual({ stored: 1 });
    expect(analyticsRepository.createSearchFilterUsages).toHaveBeenCalledTimes(
      1,
    );

    const rows = analyticsRepository.createSearchFilterUsages.mock.calls[0][0];
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      userId: "user-1",
      sessionId: "sess-1",
      filterCategory: "budget",
      filterValue: "under_600k",
    });
  });

  test("stores many filters when payload uses filters array", async () => {
    analyticsRepository.createSearchFilterUsages.mockResolvedValue({
      count: 2,
    });

    const result = await analyticsService.trackSearchFilterUsage(null, {
      sessionId: "sess-2",
      filters: [
        { category: "amenities", value: "wifi" },
        {
          category: "location",
          value: "chapinero",
          metadata: { uiSource: "search_panel" },
        },
      ],
    });

    expect(result).toEqual({ stored: 2 });
    const rows = analyticsRepository.createSearchFilterUsages.mock.calls[0][0];
    expect(rows).toHaveLength(2);
    expect(rows[1]).toMatchObject({
      filterCategory: "location",
      filterValue: "chapinero",
      metadata: { uiSource: "search_panel" },
    });
  });

  test("rejects payload without filter or filters", async () => {
    await expect(
      analyticsService.trackSearchFilterUsage(null, {
        sessionId: "sess-3",
      }),
    ).rejects.toThrow("Provide filter or filters");
  });
});
