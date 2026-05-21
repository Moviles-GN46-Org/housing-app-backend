const MatchingStrategy = require('./matchingStrategy');

const clampScore = (value) => Math.max(0, Math.min(100, Math.round(value)));
const normalizeText = (value) => String(value || '').trim().toLowerCase();

function addReason(breakdown, key, label, points) {
  if (points <= 0) return 0;
  breakdown.push({ key, label, points });
  return points;
}

function getAgeScore(profileA, profileB) {
  const ageA = Number(profileA.age ?? 0);
  const ageB = Number(profileB.age ?? 0);
  if (!ageA || !ageB) return { points: 0, label: null };

  const difference = Math.abs(ageA - ageB);
  if (difference === 0) return { points: 10, label: 'same_age' };
  if (difference <= 2) return { points: 8, label: 'close_age' };
  if (difference <= 5) return { points: 5, label: 'compatible_age' };
  return { points: 0, label: null };
}

class CompatibilityMatching extends MatchingStrategy {
  evaluate(profileA, profileB) {
    let score = 0;
    const breakdown = [];

    if (profileA.sleepSchedule === profileB.sleepSchedule) {
      score += addReason(breakdown, 'sleep_schedule', 'same_sleep_schedule', 18);
    }
    if (profileA.cleanlinessLevel === profileB.cleanlinessLevel) {
      score += addReason(breakdown, 'cleanliness', 'same_cleanliness_level', 12);
    }
    if (profileA.noisePreference === profileB.noisePreference) {
      score += addReason(breakdown, 'noise', 'same_noise_preference', 12);
    }
    if (profileA.smokes === profileB.smokes) {
      score += addReason(breakdown, 'smoking', 'same_smoking_preference', 8);
    }
    if (profileA.hasPets === profileB.hasPets) {
      score += addReason(breakdown, 'pets', 'same_pet_preference', 5);
    }

    const budgetOverlap =
      Math.min(Number(profileA.budgetMax), Number(profileB.budgetMax)) -
      Math.max(Number(profileA.budgetMin), Number(profileB.budgetMin));
    if (budgetOverlap > 0) {
      score += addReason(breakdown, 'budget', 'overlapping_budget', 15);
    }

    const areaA = normalizeText(profileA.preferredArea);
    const areaB = normalizeText(profileB.preferredArea);
    if (areaA && areaA === areaB) {
      score += addReason(breakdown, 'area', 'same_preferred_area', 10);
    }

    const jobA = normalizeText(profileA.job);
    const jobB = normalizeText(profileB.job);
    if (jobA && jobA === jobB) {
      score += addReason(breakdown, 'job', 'same_job', 5);
    }

    const universityA = normalizeText(profileA.university);
    const universityB = normalizeText(profileB.university);
    if (universityA && universityA === universityB) {
      score += addReason(breakdown, 'university', 'same_university', 5);
    }

    const ageScore = getAgeScore(profileA, profileB);
    score += addReason(breakdown, 'age', ageScore.label, ageScore.points);

    return {
      score: clampScore(score),
      breakdown,
    };
  }
}

module.exports = CompatibilityMatching;
