/**
 * CRISIS DEBATE ENGINE
 *
 * Orchestrates the full boardroom debate sequence:
 *   CEO → Finance → PR → Engineer → Lawyer → CEO (final decision)
 *
 * Each agent call passes the accumulated chatHistory so agents react to
 * what was already said. After the debate completes, this module also
 * computes the weighted final risk score and runs conflict detection.
 *
 * Pattern: matches algorithms/orchestrator.js — this file calls into
 * agents/crisisAgents.js (which is the only place that talks to the AI
 * Engine) and otherwise does pure sequencing/calculation.
 */

const { runDebateAgent, AGENT_ORDER, AGENT_PROFILES } = require("../agents/crisisAgents");

// Conflict threshold from the spec: if any two agents' risk scores
// differ by more than this, the debate is flagged HIGH CONFLICT.
const CONFLICT_THRESHOLD = 4;

// Weight each role's risk score by how much it should influence the
// final company-wide risk number. CEO carries the most weight since
// they own the final call; everyone else is weighted by how directly
// their domain usually drives crisis outcomes.
const RISK_WEIGHTS = {
  CEO: 1.4,
  Finance: 1.2,
  PR: 1.0,
  Engineer: 1.0,
  Lawyer: 1.3,
};

/**
 * Run the full sequential debate for a crisis input.
 * CEO speaks first, then Finance, PR, Engineer, Lawyer each react in
 * turn, then CEO speaks again to deliver the final decision.
 *
 * @param {string} crisisInput
 * @returns {Promise<{ debateMessages: Array, conflict: object, finalRiskScore: number, finalPlan: object }>}
 */
async function runFullDebate(crisisInput, context = {}) {
  if (!crisisInput || !crisisInput.trim()) {
    throw new Error("crisisInput is required to run a debate");
  }

  const debateMessages = [];

  for (const role of AGENT_ORDER) {
    const focus = AGENT_PROFILES[role].focus;
    const turn = await runDebateAgent(role, focus, crisisInput, debateMessages, false, context);
    debateMessages.push(turn);
  }

  // Conflict detection across the first pass
  const conflict = detectConflict(debateMessages);

  // Final turn: CEO returns to deliver the closing decision, having seen
  // every other agent's input (and knowing if there's high conflict to resolve)
  const ceoFocus = AGENT_PROFILES.CEO.focus;
  const finalCeoInput = conflict.highConflict
    ? `${crisisInput}\n\n(Note: the boardroom is in HIGH CONFLICT — risk score spread of ${conflict.maxDifference.toFixed(
        1
      )} between ${conflict.disagreementBetween.join(" and ")}. You must make the final override decision.)`
    : crisisInput;

  const finalTurn = await runDebateAgent(
    "CEO",
    ceoFocus,
    finalCeoInput,
    debateMessages,
    true,
    context
  );
  debateMessages.push(finalTurn);

  const finalRiskScore = calculateWeightedRiskScore(debateMessages);

  const recoverySteps = finalTurn.recovery_plan && finalTurn.recovery_plan.length
    ? finalTurn.recovery_plan
    : buildFallbackRecoveryPlan(finalTurn, conflict);

  return {
    debateMessages,
    conflict,
    finalRiskScore,
    finalPlan: {
      crisisSummary: finalTurn.problem_analysis || finalTurn.message,
      conflictDetectionResult: conflict,
      summary: finalTurn.message,
      reasoning: finalTurn.reasoning,
      steps: recoverySteps,
      immediateActions24Hours: recoverySteps.filter((step) => /24|immediate/i.test(step.timeline)),
      shortTermActions7Days: recoverySteps.filter((step) => /7|week|short/i.test(step.timeline)),
      longTermStrategy30Days: recoverySteps.filter((step) => /30|month|long/i.test(step.timeline)),
      decidedBy: "CEO",
    },
  };
}

/**
 * If the AI doesn't return well-formed recovery_plan steps (e.g. malformed
 * JSON, or an older response shape), build a reasonable structured fallback
 * from the CEO's closing message so the UI never has to show an empty plan.
 */
function buildFallbackRecoveryPlan(finalTurn, conflict) {
  return [
    {
      step: 1,
      title: "Confirm facts and severity",
      description: "Create a single source of truth: what happened, who is affected, which systems or customers are exposed, current business impact, and what evidence supports the assessment.",
      owner: "CEO",
      priority: "Critical",
      timeline: "Immediate actions (24 hours)",
    },
    {
      step: 2,
      title: "Stabilize operations immediately",
      description: "Stop the most damaging activity first: pause affected workflows, contain technical issues, preserve evidence, and assign one accountable owner for every urgent workstream.",
      owner: "Engineer",
      priority: "Critical",
      timeline: "Immediate actions (24 hours)",
    },
    {
      step: 3,
      title: "Prepare controlled communications",
      description: "Draft internal and external messaging that is factual, calm, legally reviewed, and clear about what the company is doing next.",
      owner: "PR",
      priority: "High",
      timeline: "Immediate actions (24 hours)",
    },
    {
      step: 4,
      title: "Align risk ownership",
      description: conflict.highConflict
        ? `Resolve the disagreement between ${conflict.disagreementBetween.join(" and ")} and document the final risk position before major customer, legal, or financial decisions.`
        : "Confirm that Finance, PR, Engineer, Lawyer, and CEO agree on severity, owner, budget, and response timeline.",
      owner: "CEO",
      priority: "High",
      timeline: "Short-term actions (7 days)",
    },
    {
      step: 5,
      title: "Complete root cause review",
      description: "Identify why the crisis happened, what controls failed, which decisions contributed, and what must change before normal operations fully resume.",
      owner: "Engineer",
      priority: "High",
      timeline: "Short-term actions (7 days)",
    },
    {
      step: 6,
      title: "Quantify financial exposure",
      description: "Estimate revenue impact, recovery costs, refund or credit exposure, vendor costs, legal costs, and cash runway implications.",
      owner: "Finance",
      priority: "Medium",
      timeline: "Short-term actions (7 days)",
    },
    {
      step: 7,
      title: "Strengthen controls permanently",
      description: "Turn lessons learned into new operating controls, monitoring, escalation rules, staff training, and executive review checkpoints.",
      owner: "Engineer",
      priority: "High",
      timeline: "Long-term strategy (30 days)",
    },
    {
      step: 8,
      title: "Repair trust with stakeholders",
      description: "Follow up with customers, employees, partners, and investors using proof of corrective action, not vague reassurance.",
      owner: "PR",
      priority: "Medium",
      timeline: "Long-term strategy (30 days)",
    },
    {
      step: 9,
      title: "Review legal obligations",
      description: "Assess contractual, regulatory, privacy, employment, and reporting obligations, then document decisions and deadlines.",
      owner: "Lawyer",
      priority: "High",
      timeline: "Long-term strategy (30 days)",
    },
  ];
}

/**
 * Conflict detection rule: if the difference between any two agents'
 * risk scores exceeds CONFLICT_THRESHOLD, mark HIGH CONFLICT.
 *
 * @param {Array<{role:string, risk_score:number}>} messages
 */
function detectConflict(messages) {
  let maxDifference = 0;
  let disagreementBetween = [];

  for (let i = 0; i < messages.length; i++) {
    for (let j = i + 1; j < messages.length; j++) {
      const diff = Math.abs(messages[i].risk_score - messages[j].risk_score);
      if (diff > maxDifference) {
        maxDifference = diff;
        disagreementBetween = [messages[i].role, messages[j].role];
      }
    }
  }

  return {
    highConflict: maxDifference > CONFLICT_THRESHOLD,
    maxDifference,
    disagreementBetween,
  };
}

/**
 * Weighted final risk score across all agent turns (1-10 scale).
 * Uses RISK_WEIGHTS so CEO/Legal risk assessments carry more influence
 * than e.g. a single PR turn, while still factoring in everyone.
 *
 * @param {Array<{role:string, risk_score:number}>} messages
 * @returns {number} rounded to 1 decimal place
 */
function calculateWeightedRiskScore(messages) {
  if (!messages.length) return 5;

  let weightedSum = 0;
  let weightTotal = 0;

  for (const m of messages) {
    const weight = RISK_WEIGHTS[m.role] || 1;
    weightedSum += m.risk_score * weight;
    weightTotal += weight;
  }

  const score = weightedSum / weightTotal;
  return Math.round(score * 10) / 10;
}

module.exports = {
  runFullDebate,
  detectConflict,
  calculateWeightedRiskScore,
  CONFLICT_THRESHOLD,
};
