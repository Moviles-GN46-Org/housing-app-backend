const authService = require('../services/authService');
const { toAuthResponseDTO } = require('../dtos/auth.dto');
const { toUserDTO } = require('../dtos/user.dto');

const authController = {
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);
      const dto = toAuthResponseDTO(result.user, result.accessToken, result.refreshToken);
      res.status(201).json({ success: true, data: dto });
    } catch (err) {
      next(err);
    }
  },

  async login(req, res, next) {
    try {
      const result = await authService.login(req.body);
      const dto = toAuthResponseDTO(result.user, result.accessToken, result.refreshToken);
      res.json({ success: true, data: dto });
    } catch (err) {
      next(err);
    }
  },

  async googleAuth(req, res, next) {
    try {
      const result = await authService.googleAuth(req.body);
      const dto = toAuthResponseDTO(result.user, result.accessToken, result.refreshToken);
      res.json({ success: true, data: dto });
    } catch (err) {
      next(err);
    }
  },

  async verifyEmail(req, res, next) {
    try {
      const result = await authService.verifyEmail({ userId: req.user.userId, code: req.body.code });
      const dto = toAuthResponseDTO(result.user, result.accessToken, result.refreshToken);
      res.json({ success: true, data: dto });
    } catch (err) {
      next(err);
    }
  },

  async resendCode(req, res, next) {
    try {
      const result = await authService.resendCode({ userId: req.user.userId });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async refresh(req, res, next) {
    try {
      const result = await authService.refreshToken(req.body);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async me(req, res, next) {
    try {
      const user = await authService.getMe(req.user.userId);
      res.json({ success: true, data: toUserDTO(user) });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = authController;
