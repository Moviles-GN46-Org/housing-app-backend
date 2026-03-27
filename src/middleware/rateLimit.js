const { AppError } = require('../utils/errors');

function createRateLimiter({ windowMs, maxRequests, keyGenerator }) {
  const buckets = new Map();

  return function rateLimitMiddleware(req, res, next) {
    const now = Date.now();
    const key = keyGenerator(req);
    const existing = buckets.get(key);

    if (!existing || now > existing.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (existing.count >= maxRequests) {
      return next(new AppError('Too many requests, please try again later', 429, 'RATE_LIMITED'));
    }

    existing.count += 1;
    return next();
  };
}

function analyticsSearchRateLimit() {
  return createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 60,
    keyGenerator: (req) => {
      const sessionId = req.body?.sessionId || 'no-session';
      return `${req.ip}|${sessionId}`;
    },
  });
}

module.exports = {
  createRateLimiter,
  analyticsSearchRateLimit,
};
