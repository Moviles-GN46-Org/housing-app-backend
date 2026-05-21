const MatchingStrategy = require('./matchingStrategy');

const clampScore = (value) => Math.max(0, Math.min(100, Math.round(value)));

class ProximityMatching extends MatchingStrategy {
  evaluate(profileA, profileB) {
    let score = 0;
    const breakdown = [];

    if (profileA.preferredArea && profileA.preferredArea === profileB.preferredArea) {
      score += 50;
      breakdown.push({ key: 'area', label: 'same_preferred_area', points: 50 });
    }
    if (profileA.sleepSchedule === profileB.sleepSchedule) {
      score += 20;
      breakdown.push({ key: 'sleep_schedule', label: 'same_sleep_schedule', points: 20 });
    }
    if (profileA.cleanlinessLevel === profileB.cleanlinessLevel) {
      score += 15;
      breakdown.push({ key: 'cleanliness', label: 'same_cleanliness_level', points: 15 });
    }
    if (profileA.noisePreference === profileB.noisePreference) {
      score += 10;
      breakdown.push({ key: 'noise', label: 'same_noise_preference', points: 10 });
    }
    if (profileA.smokes === profileB.smokes) {
      score += 5;
      breakdown.push({ key: 'smoking', label: 'same_smoking_preference', points: 5 });
    }

    return {
      score: clampScore(score),
      breakdown,
    };
  }
}

module.exports = ProximityMatching;
