class MatchingStrategy {
  /**
   * Evaluate compatibility between two roommate profiles.
   * @param {object} profileA
   * @param {object} profileB
   * @returns {{score: number, breakdown: Array<object>}}
   */
  evaluate(profileA, profileB) {
    throw new Error('evaluate() must be implemented');
  }

  score(profileA, profileB) {
    return this.evaluate(profileA, profileB).score;
  }
}

module.exports = MatchingStrategy;
