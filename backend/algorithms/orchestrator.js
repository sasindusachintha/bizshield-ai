/**
 * ALGORITHMS ENGINE MODULE
 * 
 * Orchestrates all algorithm functions:
 * - calculateFeasibility: Score business viability
 * - normalizeScores: Ensure scores are in valid range
 * - rankIdeas: Sort ideas by score
 * 
 * Pattern: Raw Data → Algorithms → Structured Output
 */

const { calculateFeasibility } = require("./feasibility");
const { normalizeScore } = require("./normalizeScores");
const { rankIdeas } = require("./rankIdeas");

/**
 * Process ideas through the algorithm pipeline
 * @param {Array} ideas - Raw ideas from AI
 * @returns {Array} Ranked and processed ideas
 */
function processIdeas(ideas) {
  if (!Array.isArray(ideas)) {
    throw new Error("Ideas must be an array");
  }

  // Add scores if not present
  const ideasWithScores = ideas.map((idea, idx) => ({
    id: idea.id || idx + 1,
    name: idea.name || "",
    description: idea.description || "",
    why_it_fits: idea.why_it_fits || "",
    startup_cost: idea.startup_cost || "",
    time_to_profit: idea.time_to_profit || "",
    score: idea.score || 5, // Default score if not provided
  }));

  // Rank ideas by score (highest first)
  return rankIdeas(ideasWithScores);
}

/**
 * Process analysis data through algorithms
 * @param {Object} analysis - Raw analysis from AI
 * @returns {Object} Normalized analysis with feasibility scores
 */
function processAnalysis(analysis) {
  if (!analysis) {
    throw new Error("Analysis data is required");
  }

  const demand = analysis.demand?.score || 5;
  const competition = analysis.competition?.score || 5;
  const skill_match = analysis.skill_match || 5;

  // Calculate feasibility score
  const feasibilityScore = calculateFeasibility(
    normalizeScore(demand),
    normalizeScore(competition),
    normalizeScore(skill_match)
  );

  return {
    demand: {
      score: normalizeScore(demand),
      summary: analysis.demand?.summary || "",
    },
    competition: {
      level: analysis.competition?.level || "Medium",
      score: normalizeScore(competition),
      summary: analysis.competition?.summary || "",
    },
    risk: {
      level: analysis.risk?.level || "Medium",
      top_risks: analysis.risk?.top_risks || [],
    },
    cost_estimate: analysis.cost_estimate || {
      minimum: "$0",
      recommended: "$0",
      breakdown: [],
    },
    feasibility_score: feasibilityScore,
  };
}

/**
 * Calculate final feasibility grade for an idea
 * @param {number} demand - Demand score (1-10)
 * @param {number} competition - Competition score (1-10)
 * @param {number} skillMatch - Skill match score (1-10)
 * @returns {Object} Score, grade, and verdict
 */
function calculateIdeaFeasibility(demand, competition, skillMatch) {
  const score = calculateFeasibility(
    normalizeScore(demand),
    normalizeScore(competition),
    normalizeScore(skillMatch)
  );

  let grade, verdict;

  if (score >= 7.5) {
    grade = "A";
    verdict = "Excellent";
  } else if (score >= 6) {
    grade = "B";
    verdict = "Good";
  } else if (score >= 4.5) {
    grade = "C";
    verdict = "Average";
  } else {
    grade = "D";
    verdict = "Risky";
  }

  return { score, grade, verdict };
}

module.exports = {
  processIdeas,
  processAnalysis,
  calculateIdeaFeasibility,
  normalizeScore,
  calculateFeasibility,
  rankIdeas,
};
