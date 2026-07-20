/**
 * CRISIS MODE — BOARDROOM AGENTS
 *
 * Defines the 5 boardroom personas and runDebateAgent(), which prompts
 * each one in turn. Every call routes through the existing AI Engine
 * (../ai-engine) — this file never talks to Groq directly, matching the
 * "single source for all Groq calls" rule already enforced project-wide.
 */

const { callGroq, callGroqWithContext, parseAIResponse } = require("../ai-engine");

// Each role's persona + what they're responsible for weighing in on
const AGENT_PROFILES = {
  CEO: {
    focus: "overall strategy, urgency, and the final business call",
    voice:
      "a decisive, big-picture CEO who cares about company survival, speed of response, cyber resilience, customer trust, and stakeholder confidence",
  },
  Finance: {
    focus: "budget impact, cash runway, and financial risk control",
    voice:
      "a cautious CFO who pressure-tests every plan against cost, runway, and downside financial exposure",
  },
  PR: {
    focus: "brand reputation, public perception, and messaging risk",
    voice:
      "a reputation-focused communications lead who worries about how this looks publicly and how fast a narrative can spiral",
  },
  Engineer: {
    focus: "technical feasibility, cybersecurity exposure, containment, detection, and system/operational risk",
    voice:
      "a pragmatic security-minded engineering lead who evaluates whether proposed fixes are technically realistic, how long they'd actually take, and what evidence should be collected",
  },
  Lawyer: {
    focus: "legal exposure, compliance, privacy obligations, breach notification, and liability",
    voice:
      "a risk-averse legal counsel who flags regulatory, contractual, and liability exposure before anyone commits to a plan",
  },
};

const AGENT_ORDER = ["CEO", "Finance", "PR", "Engineer", "Lawyer"];

/**
 * Build the prompt for a single agent turn, including full prior debate
 * history so each agent responds contextually instead of independently.
 */
function buildAgentPrompt(role, focus, crisisInput, chatHistory, isFinalTurn) {
  const profile = AGENT_PROFILES[role];

  const historyBlock =
    chatHistory.length === 0
      ? "(No one has spoken yet — you are opening the meeting.)"
      : chatHistory
          .map((m) => `${m.role} (risk ${m.risk_score}/10, ${m.stance}): ${m.message}`)
          .join("\n");

  const finalInstruction = isFinalTurn
    ? `
This is the FINAL turn. As CEO, you must now make the final decision: weigh everyone's input, resolve any disagreement, and produce a CONCRETE, STEP-BY-STEP recovery plan — not a single paragraph.

In addition to "message" and "reasoning" as normal, you MUST also include a "recovery_plan" array with 9 concrete action steps: 3 immediate actions for the first 24 hours, 3 short-term actions for 7 days, and 3 long-term actions for 30 days. Each step must be an object with EXACTLY these fields:
{
  "step": 1,
  "title": "Short action title (4-8 words)",
  "description": "1-2 sentences describing exactly what to do",
  "owner": "CEO | Finance | PR | Engineer | Lawyer",
  "priority": "Critical | High | Medium",
  "timeline": "Immediate actions (24 hours) | Short-term actions (7 days) | Long-term strategy (30 days)"
}
Order steps the way they should actually happen (most urgent first). For cyber incidents, prioritize containment, evidence preservation, credential/session control, monitoring, recovery, communications, and compliance review as applicable. Assign "owner" to whichever boardroom role should actually execute that step, distributing ownership across the team rather than putting everything on one role. Set "reasoning" to explain why you're overriding or siding with specific agents.`
    : "";

  return `
You are roleplaying as the ${role} in a live company boardroom crisis meeting.
Your focus: ${focus}.
Stay fully in character as ${profile.voice}.

CRISIS SITUATION:
"${crisisInput}"

CONVERSATION SO FAR:
${historyBlock}
${finalInstruction}

Rules:
- React directly to what previous speakers said. Reference them by role if you disagree or agree.
- Do not repeat what's already been said — add a genuinely new angle from your role's perspective.
- Be concise but substantive (2-4 sentences in "message").
- If the crisis includes a cyber incident, data leak, account takeover, ransomware, phishing, fraud, outage, privacy issue, or suspicious system behavior, include concrete security reasoning: likely attack vector, affected assets, immediate containment, evidence to preserve, detection signals, and recovery priorities where relevant to your role.
- Do not invent exact attackers, CVEs, logs, legal deadlines, or forensic findings. If details are missing, say what information is needed in "reasoning".
- Give an honest risk_score from 1-10 reflecting how risky you believe the situation/proposed approach is from your role's lens.
- Set "priority" to "low", "medium", or "high" based on urgency.
- Provide a specific "problem_analysis", a practical "solution", and a "step_by_step_recovery_plan" with at least 3 concrete steps from your role's perspective.
- Set "stance" to "agree", "disagree", or "neutral" relative to the most recent speaker (or "neutral" if you're first).

Return ONLY this JSON object, no extra text:
{
  "role": "${role}",
  "risk_score": 1-10,
  "priority": "low | medium | high",
  "problem_analysis": "specific analysis of the crisis from your role",
  "solution": "your recommended solution",
  "step_by_step_recovery_plan": ["Step 1...", "Step 2...", "Step 3..."],
  "message": "your in-character response",
  "stance": "agree | disagree | neutral",
  "reasoning": "brief explanation of your risk_score and stance"${isFinalTurn ? ',\n  "recovery_plan": [ { "step": 1, "title": "...", "description": "...", "owner": "...", "priority": "...", "timeline": "..." } ]' : ""}
}
`;
}

/**
 * Run a single agent's turn in the debate.
 *
 * @param {string} role - one of CEO, Finance, PR, Engineer, Lawyer
 * @param {string} focus - short description of what this agent weighs in on
 * @param {string} input - the original crisis description
 * @param {Array<{role:string,message:string,risk_score:number,stance:string}>} chatHistory
 * @param {boolean} isFinalTurn - true for the CEO's closing decision turn
 * @returns {Promise<object>} structured agent turn { role, message, risk_score, stance, reasoning }
 */
// Only CEO and Engineer turns actually need the full cybersecurity-quality
// context block (IOC/MITRE checklist, containment/detection framing).
// Finance/PR/Lawyer weigh in on budget, reputation, and legal exposure —
// repeating that block for them adds tokens without adding decision-relevant
// information.
const ROLES_NEEDING_SECURITY_CONTEXT = new Set(["CEO", "Engineer"]);

async function runDebateAgent(role, focus, input, chatHistory = [], isFinalTurn = false, context = {}) {
  if (!AGENT_PROFILES[role]) {
    throw new Error(`Unknown agent role: ${role}`);
  }

  const prompt = buildAgentPrompt(role, focus, input, chatHistory, isFinalTurn);

  // The final CEO turn produces the biggest expected output (message +
  // reasoning + step_by_step_recovery_plan + a 9-step recovery_plan array),
  // so it gets a larger cap. Every other turn is a short in-character
  // reaction and doesn't need nearly as much headroom.
  const turnContext = {
    ...context,
    maxTokens: isFinalTurn ? 1800 : 700,
    skipSecurityContext: !ROLES_NEEDING_SECURITY_CONTEXT.has(role),
  };

  const aiResponse = await callGroqWithContext(prompt, turnContext);
  const parsed = parseAIResponse(aiResponse);

  // Defensive normalization — never trust raw AI output shape blindly
  const riskScoreRaw = Number(parsed.risk_score);
  const stance = ["agree", "disagree", "neutral"].includes(parsed.stance)
    ? parsed.stance
    : "neutral";
  const riskScore = Number.isFinite(riskScoreRaw) ? Math.min(10, Math.max(1, riskScoreRaw)) : 5;
  const priority = ["low", "medium", "high"].includes(parsed.priority) ? parsed.priority : (
    riskScore >= 7 ? "high" : riskScore >= 4 ? "medium" : "low"
  );
  const message = String(parsed.message || parsed.solution || "").trim() || "(no response)";
  const problemAnalysis = String(parsed.problem_analysis || parsed.analysis || "").trim()
    || `${role} sees the crisis as a ${priority}-priority issue requiring coordinated response and clear ownership.`;
  const solution = String(parsed.solution || parsed.message || "").trim()
    || "Stabilize the situation, assign accountable owners, communicate clearly, and monitor recovery metrics.";
  const recoverySteps = normalizeStringSteps(parsed.step_by_step_recovery_plan, role, priority);

  const result = {
    role,
    risk_score: riskScore,
    priority,
    problem_analysis: problemAnalysis,
    solution,
    step_by_step_recovery_plan: recoverySteps,
    message,
    stance,
    reasoning: String(parsed.reasoning || "").trim() || `Risk is rated ${riskScore}/10 because ${role} expects ${priority} urgency until the recovery plan is executed and verified.`,
  };

  if (isFinalTurn) {
    result.recovery_plan = normalizeRecoveryPlan(parsed.recovery_plan);
  }

  return result;
}

const VALID_OWNERS = ["CEO", "Finance", "PR", "Engineer", "Lawyer"];
const VALID_PRIORITIES = ["Critical", "High", "Medium"];

function normalizeStringSteps(rawSteps, role, priority) {
  const steps = Array.isArray(rawSteps) ? rawSteps : [];
  const normalized = steps
    .map((step) => {
      if (typeof step === "string") return step.trim();
      if (step && typeof step === "object") return String(step.description || step.title || step.step || "").trim();
      return "";
    })
    .filter(Boolean);

  if (normalized.length >= 3) return normalized;

  return [
    `${role}: confirm the facts, owner, severity, affected customers, and operational impact before making public or financial commitments.`,
    `${role}: execute the highest-priority containment or stabilization action and document every decision for follow-up.`,
    `${role}: review progress within 24 hours, update the boardroom, and adjust the plan if risk remains ${priority}.`,
  ];
}

/**
 * Validate/normalize the AI's recovery_plan array so the frontend can
 * always rely on a consistent shape, even if the model returns
 * malformed or partial steps.
 */
function normalizeRecoveryPlan(rawPlan) {
  if (!Array.isArray(rawPlan) || rawPlan.length === 0) {
    return [];
  }

  return rawPlan
    .map((step, index) => {
      if (!step || typeof step !== "object") return null;
      const title = String(step.title || "").trim();
      const description = String(step.description || "").trim();
      if (!title && !description) return null;

      return {
        step: Number.isFinite(Number(step.step)) ? Number(step.step) : index + 1,
        title: title || `Action ${index + 1}`,
        description: description || "",
        owner: VALID_OWNERS.includes(step.owner) ? step.owner : "CEO",
        priority: VALID_PRIORITIES.includes(step.priority) ? step.priority : "Medium",
        timeline: String(step.timeline || "").trim() || "Timeline TBD",
      };
    })
    .filter(Boolean);
}

module.exports = {
  AGENT_PROFILES,
  AGENT_ORDER,
  runDebateAgent,
};