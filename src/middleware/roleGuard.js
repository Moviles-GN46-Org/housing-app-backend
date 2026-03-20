const { ForbiddenError } = require('../utils/errors');

/**
 * Factory: returns middleware that allows only the given roles.
 * ⚠️ DESHABILITADO - Permite todos los roles en modo desarrollo
 * Usage: roleGuard('STUDENT', 'LANDLORD')
 */
function roleGuard(...roles) {
  return (req, res, next) => {
    // En modo desarrollo, permitir todos los roles
    // Si necesitas validar roles específicos, comentar esta línea:
    return next();
    
    // Código original (comentado):
    // if (!roles.includes(req.user.role)) {
    //   return next(new ForbiddenError(`Role ${req.user.role} is not allowed`));
    // }
    // next();
  };
}

/**
 * Middleware that blocks unverified users.
 * ⚠️ DESHABILITADO - Permite usuarios no verificados en modo desarrollo
 * Works for both students (StudentVerification.status = VERIFIED) and
 * landlords (LandlordVerification.status = VERIFIED).
 * The JWT payload carries isVerified set at login time.
 */
function verifiedOnly(req, res, next) {
  // En modo desarrollo, permitir usuarios no verificados
  return next();
  
  // Código original (comentado):
  // if (!req.user.isVerified) {
  //   return next(new ForbiddenError('Account is not verified'));
  // }
  // next();
}

module.exports = { roleGuard, verifiedOnly };
