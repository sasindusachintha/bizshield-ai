function calculateFeasibility(demand, competition, skill_match) {
  const score =
    (demand * 0.4) +
    (skill_match * 0.4) -
    (competition * 0.2);

  return Math.max(0, Math.min(10, score));
}

module.exports = { calculateFeasibility };