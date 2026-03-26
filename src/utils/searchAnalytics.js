const crypto = require('crypto');

const NEIGHBORHOOD_EQUIVALENCES = {
  santafe: 'santa fe',
};

function normalizeText(value) {
  if (value === undefined || value === null) {
    return '';
  }

  return String(value)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

function canonicalizeNeighborhood(neighborhood) {
  const normalized = normalizeText(neighborhood);
  if (!normalized) {
    return null;
  }

  const compact = normalized.replace(/\s+/g, '');
  return NEIGHBORHOOD_EQUIVALENCES[compact] || normalized;
}

function buildCanonicalZone(city, neighborhood) {
  const canonicalCity = normalizeText(city);
  const canonicalNeighborhood = canonicalizeNeighborhood(neighborhood);

  return canonicalNeighborhood
    ? `${canonicalCity}|${canonicalNeighborhood}`
    : `${canonicalCity}|(all)`;
}

function sortKeysDeep(input) {
  if (Array.isArray(input)) {
    return input.map(sortKeysDeep);
  }

  if (input && typeof input === 'object') {
    return Object.keys(input)
      .sort()
      .reduce((acc, key) => {
        acc[key] = sortKeysDeep(input[key]);
        return acc;
      }, {});
  }

  return input;
}

function stableStringify(value) {
  return JSON.stringify(sortKeysDeep(value ?? {}));
}

function buildFiltersHash(filters) {
  return crypto
    .createHash('sha256')
    .update(stableStringify(filters))
    .digest('hex');
}

function sanitizeQuery(query) {
  const normalized = String(query || '').trim();
  if (!normalized) {
    return null;
  }

  const maybeEmail = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
  const maybePhone = /\b(?:\+?\d[\d\s().-]{7,}\d)\b/;

  if (maybeEmail.test(normalized) || maybePhone.test(normalized)) {
    return '[redacted]';
  }

  return normalized.slice(0, 200);
}

module.exports = {
  normalizeText,
  canonicalizeNeighborhood,
  buildCanonicalZone,
  stableStringify,
  buildFiltersHash,
  sanitizeQuery,
};
