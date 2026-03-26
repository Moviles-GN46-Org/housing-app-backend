const {
  canonicalizeNeighborhood,
  buildCanonicalZone,
  buildFiltersHash,
} = require('../../src/utils/searchAnalytics');

describe('searchAnalytics utils', () => {
  test('canonicalizeNeighborhood groups santa fe variants', () => {
    expect(canonicalizeNeighborhood('Santa fe')).toBe('santa fe');
    expect(canonicalizeNeighborhood('Santa Fe ')).toBe('santa fe');
    expect(canonicalizeNeighborhood('santafé')).toBe('santa fe');
  });

  test('buildCanonicalZone normalizes city and neighborhood', () => {
    expect(buildCanonicalZone('Bogotá', 'Santa Fe')).toBe('bogota|santa fe');
    expect(buildCanonicalZone('Bogotá', null)).toBe('bogota|(all)');
  });

  test('buildFiltersHash is stable for same object values with different key order', () => {
    const a = { budget: { max: 1200, min: 500 }, propertyType: 'ROOM' };
    const b = { propertyType: 'ROOM', budget: { min: 500, max: 1200 } };
    expect(buildFiltersHash(a)).toBe(buildFiltersHash(b));
  });
});
