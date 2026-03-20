function toRoommateProfileDTO(profile) {
  return {
    id: profile.id,
    userId: profile.userId,
    user: profile.user || undefined,
    sleepSchedule: profile.sleepSchedule,
    cleanlinessLevel: profile.cleanlinessLevel,
    noisePreference: profile.noisePreference,
    smokes: profile.smokes,
    hasPets: profile.hasPets,
    budgetMin: Number(profile.budgetMin),
    budgetMax: Number(profile.budgetMax),
    preferredArea: profile.preferredArea,
    bio: profile.bio,
    isActive: profile.isActive,
    createdAt: profile.createdAt,
  };
}

module.exports = { toRoommateProfileDTO };
