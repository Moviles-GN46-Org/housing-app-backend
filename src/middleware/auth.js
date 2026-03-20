// ⚠️ AUTENTICACIÓN DESHABILITADA - Middleware que permite acceso sin validación de JWT
function auth(req, res, next) {
  // Si hay un token válido en la solicitud, usarlo; si no, usar un usuario de prueba
  const header = req.headers.authorization;
  
  if (header && header.startsWith('Bearer ')) {
    // Intentar usar el token si existe (para compatibilidad)
    try {
      const { verifyToken } = require('../utils/jwt');
      const token = header.slice(7);
      const payload = verifyToken(token);
      req.user = {
        userId: payload.userId,
        role: payload.role,
        isVerified: payload.isVerified,
      };
      return next();
    } catch (err) {
      // Si el token es inválido, continuar con usuario de prueba
    }
  }
  
  // Usuario de prueba por defecto (autenticación deshabilitada)
  req.user = {
    userId: 1,
    role: 'LANDLORD', // Cambiar a 'STUDENT' o el rol que necesites
    isVerified: true,
  };
  next();
}

module.exports = auth;
