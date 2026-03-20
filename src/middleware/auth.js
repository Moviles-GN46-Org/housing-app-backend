const { verifyToken } = require('../utils/jwt');
const { UnauthorizedError } = require('../utils/errors');

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing or invalid Authorization header'));
  }
  const token = header.slice(7);
  try {
    const payload = verifyToken(token);
    req.user = {
      userId: payload.userId,
      role: payload.role,
      isVerified: payload.isVerified,
    };
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
  }
}

module.exports = auth;
