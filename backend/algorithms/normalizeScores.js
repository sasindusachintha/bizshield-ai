function normalizeScore(value) {
  if (value < 1) return 1;
  if (value > 10) return 10;
  return value;
}

module.exports = { normalizeScore };