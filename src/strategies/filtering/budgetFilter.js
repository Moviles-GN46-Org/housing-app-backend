const FilterStrategy = require('./filterStrategy');

class BudgetFilter extends FilterStrategy {
  /**
   * @param {Array} properties
   * @param {{ minPrice: number, maxPrice: number }} params
   */
  filter(properties, { minPrice, maxPrice }) {
    return properties.filter((p) => {
      const rent = Number(p.monthlyRent);
      if (minPrice && rent < Number(minPrice)) return false;
      if (maxPrice && rent > Number(maxPrice)) return false;
      return true;
    });
  }
}

module.exports = BudgetFilter;
