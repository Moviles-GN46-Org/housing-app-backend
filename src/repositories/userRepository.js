
const prisma = require('../prisma');

const userRepository = {
  async findById(id) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        studentVerification: true,
        landlordVerification: true,
      },
    });
  },

  async findByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        studentVerification: true,
        landlordVerification: true,
      },
    });
  },

  async create(data) {
    return prisma.user.create({ data });
  },

  async update(id, data) {
    return prisma.user.update({ where: { id }, data });
  },

  // StudentVerification
  async findStudentVerification(userId) {
    return prisma.studentVerification.findUnique({ where: { userId } });
  },

  async createStudentVerification(data) {
    return prisma.studentVerification.create({ data });
  },

  async updateStudentVerification(userId, data) {
    return prisma.studentVerification.update({ where: { userId }, data });
  },

  async findStudentVerificationByCode(universityEmail, code) {
    return prisma.studentVerification.findFirst({
      where: { universityEmail, verificationCode: code },
    });
  },

  // LandlordVerification
  async findLandlordVerification(userId) {
    return prisma.landlordVerification.findUnique({ where: { userId } });
  },

  async createLandlordVerification(data) {
    return prisma.landlordVerification.create({ data });
  },

  async updateLandlordVerification(id, data) {
    return prisma.landlordVerification.update({ where: { id }, data });
  },

  async findPendingLandlordVerifications() {
    return prisma.landlordVerification.findMany({
      where: { status: 'PENDING' },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    });
  },
};

module.exports = userRepository;
