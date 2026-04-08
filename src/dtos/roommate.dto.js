function computeAge(birthDate) {
  if (!birthDate) return 0;
  const dob = new Date(birthDate);
  if (Number.isNaN(dob.getTime())) return 0;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDelta = today.getMonth() - dob.getMonth();
  const hasNotHadBirthday = monthDelta < 0 || (monthDelta === 0 && today.getDate() < dob.getDate());
  if (hasNotHadBirthday) age -= 1;

  return Math.max(0, age);
}

function toRoommateProfileDTO(profile) {
  const user = profile.user || {};
  const compatibilityScore = Number(profile.compatibilityScore ?? 0);
  const matchRate = Number(profile.matchRate ?? compatibilityScore ?? 0);

  return {
    id: profile.id,
    userId: profile.userId,
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    profilePictureUrl: user.profilePictureUrl || null,
    user: profile.user || undefined,
    sleepSchedule: profile.sleepSchedule,
    cleanlinessLevel: profile.cleanlinessLevel,
    noisePreference: profile.noisePreference,
    smokes: profile.smokes,
    hasPets: profile.hasPets,
    budgetMin: Number(profile.budgetMin),
    budgetMax: Number(profile.budgetMax),
    preferredArea: profile.preferredArea || '',
    bio: profile.bio || '',
    isActive: profile.isActive,
    createdAt: profile.createdAt,
    age: computeAge(profile.birthDate),
    matchRate,
    compatibilityScore,
    job: profile.job || '',
    university: profile.university || '',
  };
}

module.exports = { toRoommateProfileDTO };
