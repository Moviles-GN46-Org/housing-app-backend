const { ValidationError } = require('../utils/errors');

/**
 * Returns middleware that checks required fields exist in req.body.
 * Usage: validate('email', 'password', 'firstName')
 */
function validate(...fields) {
  return (req, res, next) => {
    const missing = fields.filter(
      (f) => req.body[f] === undefined || req.body[f] === null || req.body[f] === ''
    );
    if (missing.length > 0) {
      return next(new ValidationError(`Missing required fields: ${missing.join(', ')}`));
    }
    next();
  };
}

module.exports = { validate };
