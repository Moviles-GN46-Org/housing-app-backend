jest.mock('../../src/repositories/analyticsRepository', () => ({
  logEvent: jest.fn(),
  getFeatureLoadTimes: jest.fn(),
}));

const analyticsRepository = require('../../src/repositories/analyticsRepository');
const analyticsService = require('../../src/services/analyticsService');

describe('analyticsService.logEvent — FEATURE_LOAD_TIME duration guard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    analyticsRepository.logEvent.mockResolvedValue({ id: 'evt-1' });
  });

  test('accepts a sensible durationMs and persists the event', async () => {
    await analyticsService.logEvent('user-1', {
      sessionId: 's-1',
      eventType: 'FEATURE_LOAD_TIME',
      screenName: 'Home',
      payload: { screen: 'Home', durationMs: 842 },
    });

    expect(analyticsRepository.logEvent).toHaveBeenCalledTimes(1);
  });

  test('rejects negative durations', async () => {
    await expect(
      analyticsService.logEvent('user-1', {
        sessionId: 's-1',
        eventType: 'FEATURE_LOAD_TIME',
        screenName: 'Home',
        payload: { screen: 'Home', durationMs: -5 },
      }),
    ).rejects.toThrow(/durationMs/);
    expect(analyticsRepository.logEvent).not.toHaveBeenCalled();
  });

  test('rejects durations above the 120000 ms cap', async () => {
    await expect(
      analyticsService.logEvent('user-1', {
        sessionId: 's-1',
        eventType: 'FEATURE_LOAD_TIME',
        screenName: 'Home',
        payload: { screen: 'Home', durationMs: 999999 },
      }),
    ).rejects.toThrow(/durationMs/);
    expect(analyticsRepository.logEvent).not.toHaveBeenCalled();
  });

  test('rejects non-numeric durations', async () => {
    await expect(
      analyticsService.logEvent('user-1', {
        sessionId: 's-1',
        eventType: 'FEATURE_LOAD_TIME',
        screenName: 'Home',
        payload: { screen: 'Home', durationMs: 'fast' },
      }),
    ).rejects.toThrow(/durationMs/);
  });
});
