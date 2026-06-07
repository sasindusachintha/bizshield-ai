const express = require("express");
const router = express.Router();
const { callAI, formatResponse, validateInput } = require("../../utils/helpers");

// ════════════════════════════════════════════════════════
// SAFE JSON PARSER (FIXED)
// ════════════════════════════════════════════════════════
function safeJSONParse(text) {
  try {
    const cleaned = text
      .replace(/```json|```/g, "")
      .trim();

    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    const startArr = cleaned.indexOf("[");
    const endArr = cleaned.lastIndexOf("]");

    // Handle ARRAY response
    if (startArr !== -1 && (startArr < start || start === -1)) {
      const jsonString = cleaned.slice(startArr, endArr + 1);
      return JSON.parse(jsonString);
    }

    // Handle OBJECT response
    if (start !== -1 && end !== -1) {
      const jsonString = cleaned.slice(start, end + 1);
      return JSON.parse(jsonString);
    }

    throw new Error("No valid JSON found");
  } catch (err) {
    throw new Error("AI returned invalid JSON: " + err.message);
  }
}

//
// ════════════════════════════════════════════════════════
//  1. GENERATE IDEAS
// ════════════════════════════════════════════════════════
router.post("/generate-ideas", async (req, res) => {
  const { valid, missing } = validateInput(req, ["skills", "interest"]);
  if (!valid) {
    return res.status(400).json({ success: false, error: missing.join(", ") });
  }

  const { skills, budget, interest } = req.body;

  const prompt = `
Generate 5 business ideas as VALID JSON ARRAY ONLY.

Skills: ${skills}
Budget: ${budget || "not specified"}
Interest: ${interest}

Return format:
[
  {
    "id": 1,
    "name": "Business Name",
    "description": "One line",
    "why_it_fits": "Reason",
    "startup_cost": "$100-$500",
    "time_to_profit": "2-3 months"
  }
]
`;

  try {
    const aiResponse = await callAI(prompt);
    const ideas = safeJSONParse(aiResponse);
    res.json(formatResponse({ ideas }));
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

//
// ════════════════════════════════════════════════════════
//  2. ANALYZE IDEA
// ════════════════════════════════════════════════════════
router.post("/analyze-idea", async (req, res) => {
  const { valid, missing } = validateInput(req, ["idea"]);
  if (!valid) {
    return res.status(400).json({ success: false, error: missing.join(", ") });
  }

  const { idea } = req.body;

  const prompt = `
Analyze this business idea: "${idea}"

Return ONLY valid JSON:

{
  "demand": { "score": 7, "summary": "..." },
  "competition": { "level": "Medium", "score": 5, "summary": "..." },
  "risk": { "level": "Medium", "top_risks": ["..."] },
  "cost_estimate": {
    "minimum": "$100",
    "recommended": "$500",
    "breakdown": ["Item: $50"]
  }
}
`;

  try {
    const aiResponse = await callAI(prompt);
    const analysis = safeJSONParse(aiResponse);
    res.json(formatResponse(analysis));
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

//
// ════════════════════════════════════════════════════════
//  3. GENERATE PLAN
// ════════════════════════════════════════════════════════
router.post("/generate-plan", async (req, res) => {
  const { valid, missing } = validateInput(req, ["idea"]);
  if (!valid) {
    return res.status(400).json({ success: false, error: missing.join(", ") });
  }

  const { idea } = req.body;

  const prompt = `
Create business roadmap as VALID JSON ONLY:

{
  "setup_steps": [
    { "step": 1, "title": "...", "description": "...", "cost": "$0" }
  ],
  "plan_7_day": [
    { "day": "Day 1-2", "focus": "...", "tasks": ["..."] }
  ],
  "plan_30_day": [
    { "week": "Week 1", "goal": "...", "milestones": ["..."] }
  ],
  "success_tips": ["...", "..."]
}
`;

  try {
    const aiResponse = await callAI(prompt);
    const plan = safeJSONParse(aiResponse);
    res.json(formatResponse(plan));
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

//
// ════════════════════════════════════════════════════════
//  4. MARKETING CONTENT
// ════════════════════════════════════════════════════════
router.post("/marketing-content", async (req, res) => {
  const { valid, missing } = validateInput(req, ["idea"]);
  if (!valid) {
    return res.status(400).json({ success: false, error: missing.join(", ") });
  }

  const { idea } = req.body;

  const prompt = `
Create marketing content as VALID JSON ONLY:

{
  "instagram_posts": [
    { "caption": "...", "hashtags": ["#a", "#b"] }
  ],
  "ad_copies": [
    { "headline": "...", "body": "...", "cta": "..." }
  ],
  "slogans": ["..."],
  "captions": {
    "facebook": "...",
    "linkedin": "...",
    "whatsapp": "..."
  }
}
`;

  try {
    const aiResponse = await callAI(prompt);
    const content = safeJSONParse(aiResponse);
    res.json(formatResponse(content));
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

//
// ════════════════════════════════════════════════════════
//  5. FEASIBILITY SCORE (NO AI)
// ════════════════════════════════════════════════════════
router.post("/feasibility-score", (req, res) => {
  const { valid, missing } = validateInput(req, ["demand", "competition", "skill_match"]);
  if (!valid) {
    return res.status(400).json({ success: false, error: missing.join(", ") });
  }

  const demand = parseFloat(req.body.demand);
  const competition = parseFloat(req.body.competition);
  const skill_match = parseFloat(req.body.skill_match);

  if ([demand, competition, skill_match].some(v => isNaN(v) || v < 1 || v > 10)) {
    return res.status(400).json({ success: false, error: "Scores must be 1–10" });
  }

  const raw = demand * 0.4 + skill_match * 0.4 - competition * 0.2;
  const score = Math.min(10, Math.max(0, Number(raw.toFixed(2))));

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

  res.json(formatResponse({ score, grade, verdict }));
});

module.exports = router;