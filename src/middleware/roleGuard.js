const { ForbiddenError } = require('../utils/errors');

/**
 * Factory: returns middleware that allows only the given roles.
 * Usage: roleGuard('STUDENT', 'LANDLORD')
 */
function roleGuard(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError(`Role ${req.user.role} is not allowed`));
    }
    next();
  };
}

/**
 * Middleware that blocks unverified users.
 * Works for both students (StudentVerification.status = VERIFIED) and
 * landlords (LandlordVerification.status = VERIFIED).
 * The JWT payload carries isVerified set at login time.
 */
function verifiedOnly(req, res, next) {
  if (!req.user.isVerified) {
    return next(new ForbiddenError('Account is not verified'));
  }
  next();
}

module.exports = { roleGuard, verifiedOnly };
