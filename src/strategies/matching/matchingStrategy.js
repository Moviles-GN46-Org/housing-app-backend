class MatchingStrategy {
  /**
   * Score compatibility between two roommate profiles.
   * @param {object} profileA
   * @param {object} profileB
   * @returns {number} Score from 0 to 100
   */
  score(profileA, profileB) {
    throw new Error('score() must be implemented');
  }
}

module.exports = MatchingStrategy;
