const MatchingStrategy = require('./matchingStrategy');

class ProximityMatching extends MatchingStrategy {
  score(profileA, profileB) {
    let score = 0;
    if (profileA.preferredArea && profileA.preferredArea === profileB.preferredArea) score += 50;
    if (profileA.sleepSchedule === profileB.sleepSchedule) score += 20;
    if (profileA.cleanlinessLevel === profileB.cleanlinessLevel) score += 15;
    if (profileA.noisePreference === profileB.noisePreference) score += 10;
    if (profileA.smokes === profileB.smokes) score += 5;
    return score; // 0–100
  }
}

module.exports = ProximityMatching;
