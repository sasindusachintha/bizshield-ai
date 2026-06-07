const express = require("express");
const router = express.Router();
const { callAI, formatResponse, validateInput } = require("../utils/helpers");

// ════════════════════════════════════════════════════════
//  POST /api/growth/generate-ideas
//  Input:  { skills, budget, interest }
//  Output: 5 business ideas
// ════════════════════════════════════════════════════════
router.post("/generate-ideas", async (req, res) => {
  const { valid, missing } = validateInput(req, ["skills", "interest"]);
  if (!valid) {
    return res.status(400).json({ success: false, error: `Missing fields: ${missing.join(", ")}` });
  }

  const { skills, budget, interest } = req.body;

  const prompt = `You are a startup advisor. Generate exactly 5 business ideas for this person.
Skills: ${skills}
Budget: $${budget || "not specified"}
Interest/Niche: ${interest}

For each idea return a JSON array. Format your entire response as valid JSON only, no extra text:
[
  {
    "id": 1,
    "name": "Business Name",
    "description": "One-line description",
    "why_it_fits": "Why this suits their skills and budget",
    "startup_cost": "$XXX - $XXX",
    "time_to_profit": "X months"
  }
]`;

  try {
    const aiResponse = await callAI(prompt);
    const cleaned = aiResponse.replace(/```json|```/g, "").trim();
    const ideas = JSON.parse(cleaned);
    res.json(formatResponse({ ideas }));
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ════════════════════════════════════════════════════════
//  POST /api/growth/analyze-idea
//  Input:  { idea }
//  Output: demand, competition, risk, cost_estimate
// ════════════════════════════════════════════════════════
router.post("/analyze-idea", async (req, res) => {
  const { valid, missing } = validateInput(req, ["idea"]);
  if (!valid) {
    return res.status(400).json({ success: false, error: `Missing fields: ${missing.join(", ")}` });
  }

  const { idea } = req.body;

  const prompt = `Analyze this business idea: "${idea}"

Return ONLY valid JSON, no extra text:
{
  "demand": {
    "score": 7,
    "summary": "Short explanation of market demand"
  },
  "competition": {
    "level": "Medium",
    "score": 5,
    "summary": "Short explanation of competitors"
  },
  "risk": {
    "level": "Low | Medium | High",
    "top_risks": ["risk 1", "risk 2", "risk 3"]
  },
  "cost_estimate": {
    "minimum": "$XXX",
    "recommended": "$XXX",
    "breakdown": ["Item: $XXX", "Item: $XXX"]
  }
}`;

  try {
    const aiResponse = await callAI(prompt);
    const cleaned = aiResponse.replace(/```json|```/g, "").trim();
    const analysis = JSON.parse(cleaned);
    res.json(formatResponse(analysis));
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ════════════════════════════════════════════════════════
//  POST /api/growth/generate-plan
//  Input:  { idea }
//  Output: 7-day plan, 30-day plan, setup steps
// ════════════════════════════════════════════════════════
router.post("/generate-plan", async (req, res) => {
  const { valid, missing } = validateInput(req, ["idea"]);
  if (!valid) {
    return res.status(400).json({ success: false, error: `Missing fields: ${missing.join(", ")}` });
  }

  const { idea } = req.body;

  const prompt = `Create a full business roadmap for: "${idea}"

Return ONLY valid JSON, no extra text:
{
  "setup_steps": [
    { "step": 1, "title": "Step title", "description": "What to do", "cost": "$0" }
  ],
  "plan_7_day": [
    { "day": "Day 1-2", "focus": "Focus area", "tasks": ["task 1", "task 2"] }
  ],
  "plan_30_day": [
    { "week": "Week 1", "goal": "Main goal", "milestones": ["milestone 1", "milestone 2"] }
  ],
  "success_tips": ["tip 1", "tip 2", "tip 3"]
}`;

  try {
    const aiResponse = await callAI(prompt);
    const cleaned = aiResponse.replace(/```json|```/g, "").trim();
    const plan = JSON.parse(cleaned);
    res.json(formatResponse(plan));
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ════════════════════════════════════════════════════════
//  POST /api/growth/marketing-content
//  Input:  { idea }
//  Output: Instagram posts, ads text, slogans, captions
// ════════════════════════════════════════════════════════
router.post("/marketing-content", async (req, res) => {
  const { valid, missing } = validateInput(req, ["idea"]);
  if (!valid) {
    return res.status(400).json({ success: false, error: `Missing fields: ${missing.join(", ")}` });
  }

  const { idea } = req.body;

  const prompt = `Create marketing content for this business: "${idea}"

Return ONLY valid JSON, no extra text:
{
  "instagram_posts": [
    { "caption": "Post text here", "hashtags": ["#tag1", "#tag2"] },
    { "caption": "Post text here", "hashtags": ["#tag1", "#tag2"] }
  ],
  "ad_copies": [
    { "headline": "Ad headline", "body": "Ad body text", "cta": "Call to action" },
    { "headline": "Ad headline", "body": "Ad body text", "cta": "Call to action" }
  ],
  "slogans": ["Slogan 1", "Slogan 2", "Slogan 3"],
  "captions": {
    "facebook": "Facebook caption here",
    "linkedin": "LinkedIn caption here",
    "whatsapp": "WhatsApp broadcast message here"
  }
}`;

  try {
    const aiResponse = await callAI(prompt);
    const cleaned = aiResponse.replace(/```json|```/g, "").trim();
    const content = JSON.parse(cleaned);
    res.json(formatResponse(content));
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ════════════════════════════════════════════════════════
//  POST /api/growth/feasibility-score
//  Input:  { demand, competition, skill_match }
//  Output: score, grade, verdict
//  Formula: (demand * 0.4) + (skill_match * 0.4) - (competition * 0.2)
// ════════════════════════════════════════════════════════
router.post("/feasibility-score", (req, res) => {
  const { valid, missing } = validateInput(req, ["demand", "competition", "skill_match"]);
  if (!valid) {
    return res.status(400).json({ success: false, error: `Missing fields: ${missing.join(", ")}` });
  }

  const demand = parseFloat(req.body.demand);
  const competition = parseFloat(req.body.competition);
  const skill_match = parseFloat(req.body.skill_match);

  // Validate ranges (all should be 1–10)
  if ([demand, competition, skill_match].some((v) => isNaN(v) || v < 1 || v > 10)) {
    return res.status(400).json({ success: false, error: "All scores must be numbers between 1 and 10" });
  }

  // Core formula
  const raw_score = demand * 0.4 + skill_match * 0.4 - competition * 0.2;

  // Normalize to 0–10 range (raw can go from -0.2 to 8)
  const score = Math.min(10, Math.max(0, parseFloat(raw_score.toFixed(2))));

  // Grade
  let grade, verdict;
  if (score >= 7.5) {
    grade = "A";
    verdict = "Excellent — strong potential, go for it!";
  } else if (score >= 6) {
    grade = "B";
    verdict = "Good — some areas to improve but viable";
  } else if (score >= 4.5) {
    grade = "C";
    verdict = "Average — needs more planning before launch";
  } else {
    grade = "D";
    verdict = "Risky — reconsider or pivot the idea";
  }

  res.json(
    formatResponse({
      inputs: { demand, competition, skill_match },
      score,
      grade,
      verdict,
      breakdown: {
        demand_contribution: parseFloat((demand * 0.4).toFixed(2)),
        skill_contribution: parseFloat((skill_match * 0.4).toFixed(2)),
        competition_penalty: parseFloat((competition * 0.2).toFixed(2)),
      },
    })
  );
});

module.exports = router;
