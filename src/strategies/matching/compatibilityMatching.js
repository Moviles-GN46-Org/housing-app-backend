const MatchingStrategy = require('./matchingStrategy');

class CompatibilityMatching extends MatchingStrategy {
  score(profileA, profileB) {
    let score = 0;
    if (profileA.sleepSchedule === profileB.sleepSchedule) score += 30;
    if (profileA.cleanlinessLevel === profileB.cleanlinessLevel) score += 25;
    if (profileA.noisePreference === profileB.noisePreference) score += 20;
    if (profileA.smokes === profileB.smokes) score += 15;
    // Budget overlap
    const budgetOverlap =
      Math.min(Number(profileA.budgetMax), Number(profileB.budgetMax)) -
      Math.max(Number(profileA.budgetMin), Number(profileB.budgetMin));
    if (budgetOverlap > 0) score += 10;
    return score; // 0–100
  }
}

module.exports = CompatibilityMatching;
