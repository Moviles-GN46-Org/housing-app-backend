const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const userRepository = require('../repositories/userRepository');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const logger = require('../utils/logger');
const emailService = require('./emailService');
const {
  ValidationError,
  UnauthorizedError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
} = require('../utils/errors');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const SALT_ROUNDS = 12;
const CODE_EXPIRY_MINUTES = 10;

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function deriveIsVerified(user) {
  if (user.role === 'STUDENT') return user.studentVerification?.status === 'VERIFIED';
  if (user.role === 'LANDLORD') return user.landlordVerification?.status === 'VERIFIED';
  return true; // ADMIN always verified
}

const authService = {
  async register({ email, password, firstName, lastName, phone, role, profilePictureUrl }) {
    if (!email || !password || !firstName || !lastName || !role) {
      throw new ValidationError('email, password, firstName, lastName, and role are required');
    }
    if (!['STUDENT', 'LANDLORD', 'ADMIN'].includes(role)) {
      throw new ValidationError('role must be STUDENT, LANDLORD, or ADMIN');
    }

    if (role === 'STUDENT') {
      const eduPattern = /^[^\s@]+@[^\s@]+\.edu(\.[a-zA-Z]{2,})?$/i;
      if (!eduPattern.test(email)) {
        throw new ValidationError('Students must register with a valid .edu email address');
      }
    }

    const existing = await userRepository.findByEmail(email);
    if (existing) throw new ConflictError('Email already in use');

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await userRepository.create({
      email,
      passwordHash,
      firstName,
      lastName,
      phone,
      role,
      profilePictureUrl,
      authProvider: 'EMAIL',
    });

    logger.info('User registered', { userId: user.id, email, role });

    // Auto-create verification record for students
    if (role === 'STUDENT') {
      const code = generateVerificationCode();
      const codeExpiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);
      await userRepository.createStudentVerification({
        userId: user.id,
        universityEmail: email,
        verificationCode: code,
        codeExpiresAt,
        status: 'UNVERIFIED',
      });
      await emailService.sendVerificationCode({ to: email, firstName, code });
      logger.info('Verification code generated and email sent', { userId: user.id });
    }
    // ADMIN: verified by default (no verification record needed)
    if (role === 'LANDLORD') {
      await userRepository.createLandlordVerification({
        userId: user.id,
        idDocumentUrl: 'PENDING_UPLOAD',
        utilityBillUrl: 'PENDING_UPLOAD',
        status: 'PENDING',
      });
      logger.info('LandlordVerification record created (awaiting document upload)', { userId: user.id });
    }

    const freshUser = await userRepository.findById(user.id);
    const isVerified = deriveIsVerified(freshUser);
    const tokenUser = { id: freshUser.id, role: freshUser.role, isVerified };
    return {
      user: freshUser,
      accessToken: generateAccessToken(tokenUser),
      refreshToken: generateRefreshToken(tokenUser),
    };
  },

  async login({ email, password }) {
    if (!email || !password) throw new ValidationError('email and password are required');

    const user = await userRepository.findByEmail(email);
    if (!user || user.authProvider !== 'EMAIL') {
      logger.warn('Failed login attempt', { email });
      throw new UnauthorizedError('Invalid credentials');
    }
    if (!user.isActive) throw new ForbiddenError('Account is deactivated');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      logger.warn('Failed login attempt (bad password)', { email });
      throw new UnauthorizedError('Invalid credentials');
    }

    logger.info('User logged in', { userId: user.id, role: user.role });

    const isVerified = deriveIsVerified(user);
    const tokenUser = { id: user.id, role: user.role, isVerified };
    return {
      user,
      accessToken: generateAccessToken(tokenUser),
      refreshToken: generateRefreshToken(tokenUser),
    };
  },

  async googleAuth({ idToken }) {
    if (!idToken) throw new ValidationError('idToken is required');

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedError('Invalid Google token');
    }

    const { email, given_name: firstName, family_name: lastName, picture: profilePictureUrl } = payload;

    let user = await userRepository.findByEmail(email);
    if (user && user.authProvider !== 'GOOGLE') {
      throw new ConflictError('Email already registered with email/password');
    }

    if (!user) {
      user = await userRepository.create({
        email,
        firstName: firstName || 'User',
        lastName: lastName || '',
        profilePictureUrl,
        role: 'STUDENT',
        authProvider: 'GOOGLE',
        passwordHash: null,
      });
      const code = generateVerificationCode();
      const codeExpiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);
      await userRepository.createStudentVerification({
        userId: user.id,
        universityEmail: email,
        verificationCode: code,
        codeExpiresAt,
        status: 'UNVERIFIED',
      });
      logger.info('Google OAuth — new user created', { userId: user.id, email });
    } else {
      logger.info('Google OAuth — existing user signed in', { userId: user.id, email });
    }

    const freshUser = await userRepository.findById(user.id);
    const isVerified = deriveIsVerified(freshUser);
    const tokenUser = { id: freshUser.id, role: freshUser.role, isVerified };
    return {
      user: freshUser,
      accessToken: generateAccessToken(tokenUser),
      refreshToken: generateRefreshToken(tokenUser),
    };
  },

  async verifyEmail({ userId, code }) {
    if (!code) throw new ValidationError('code is required');

    const user = await userRepository.findById(userId);
    if (!user || user.role !== 'STUDENT') throw new ForbiddenError('Only students can verify email');

    const verification = await userRepository.findStudentVerification(userId);
    if (!verification) throw new NotFoundError('Verification record not found');
    if (verification.status === 'VERIFIED') throw new ConflictError('Email already verified');
    if (verification.verificationCode !== code) throw new ValidationError('Invalid verification code');
    if (new Date() > verification.codeExpiresAt) throw new ValidationError('Verification code expired');

    await userRepository.updateStudentVerification(userId, {
      status: 'VERIFIED',
      verifiedAt: new Date(),
    });

    logger.info('Student email verified', { userId });

    const freshUser = await userRepository.findById(userId);
    const tokenUser = { id: freshUser.id, role: freshUser.role, isVerified: true };
    return {
      user: freshUser,
      accessToken: generateAccessToken(tokenUser),
      refreshToken: generateRefreshToken(tokenUser),
    };
  },

  async resendCode({ userId }) {
    const user = await userRepository.findById(userId);
    if (!user || user.role !== 'STUDENT') throw new ForbiddenError('Only students can request verification codes');

    const verification = await userRepository.findStudentVerification(userId);
    if (!verification) throw new NotFoundError('Verification record not found');
    if (verification.status === 'VERIFIED') throw new ConflictError('Email already verified');

    const code = generateVerificationCode();
    const codeExpiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);
    await userRepository.updateStudentVerification(userId, { verificationCode: code, codeExpiresAt });

    await emailService.sendVerificationCode({ to: user.email, firstName: user.firstName, code });
    logger.info('Verification code resent', { userId });
    return { message: 'Verification code sent' };
  },

  async refreshToken({ refreshToken }) {
    if (!refreshToken) throw new ValidationError('refreshToken is required');

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    if (payload.type !== 'refresh') throw new UnauthorizedError('Invalid token type');

    const user = await userRepository.findById(payload.userId);
    if (!user || !user.isActive) throw new UnauthorizedError('User not found or deactivated');

    logger.debug('Token refreshed', { userId: user.id });

    const isVerified = deriveIsVerified(user);
    const tokenUser = { id: user.id, role: user.role, isVerified };
    return {
      accessToken: generateAccessToken(tokenUser),
      refreshToken: generateRefreshToken(tokenUser),
    };
  },

  async getMe(userId) {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found');
    return user;
  },
};

module.exports = authService;
