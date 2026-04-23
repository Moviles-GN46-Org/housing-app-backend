const prisma = require('../prisma');

function normalizeUniversityName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function universityMatches(university, normalizedName) {
  if (!university || !normalizedName) return false;

  if (university.normalizedName === normalizedName) {
    return true;
  }

  const aliases = Array.isArray(university.aliases) ? university.aliases : [];
  return aliases.some((alias) => normalizeUniversityName(alias) === normalizedName);
}

const universityRepository = {
  normalizeUniversityName,

  async listActive() {
    return prisma.university.findMany({
      where: { isActive: true },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  },

  async findDefault() {
    return prisma.university.findFirst({
      where: { isActive: true, isDefault: true },
    });
  },

  async resolveByName(name) {
    const normalizedName = normalizeUniversityName(name);
    const activeUniversities = await this.listActive();
    const matchedUniversity = activeUniversities.find((university) =>
      universityMatches(university, normalizedName),
    );

    if (matchedUniversity) {
      return matchedUniversity;
    }

    return this.findDefault();
  },
};

module.exports = universityRepository;