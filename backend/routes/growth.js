/**
 * GROWTH MODE ROUTES - HYBRID ARCHITECTURE
 * 
 * Pipeline: INPUT → AI ENGINE → PARSE → ALGORITHMS → FORMAT → OUTPUT
 * 
 * ✅ Uses AI Engine for all Gemini calls
 * ✅ Uses Algorithms for processing
 * ✅ No direct API calls in this layer
 */

const express = require("express");
const router = express.Router();
const { callGemini, parseAIResponse } = require("../ai-engine");
const { 
  processIdeas, 
  processAnalysis, 
  calculateIdeaFeasibility,
  normalizeScore 
} = require("../algorithms/orchestrator");
const { formatResponse, validateInput } = require("../utils/helpers");

// ════════════════════════════════════════════════════════
// RESPONSE FORMATTER
// ════════════════════════════════════════════════════════
function successResponse(data) {
  return formatResponse(data);
}

// ════════════════════════════════════════════════════════
// ENDPOINT 1: GENERATE IDEAS
// ════════════════════════════════════════════════════════
/**
 * Flow: INPUT → AI ENGINE (generate ideas) → ALGORITHMS (rank) → OUTPUT
 */
router.post("/generate-ideas", async (req, res) => {
  try {
    const { valid, missing } = validateInput(req, ["skills", "interest"]);
    if (!valid) {
      return res.status(400).json({ success: false, error: missing.join(", ") });
    }

    const { skills, budget, interest } = req.body;

    // STEP 1: Call AI Engine (NOT direct Gemini)
    const prompt = `
Generate exactly 5 business ideas as a JSON ARRAY.

User Skills: ${skills}
Budget: ${budget || "not specified"}
Interest: ${interest}

Return ONLY this format:
[
  {
    "id": 1,
    "name": "Business Name",
    "description": "One line description",
    "why_it_fits": "How it matches skills/interests",
    "startup_cost": "$X-$Y",
    "time_to_profit": "X-Y months"
  }
]
`;

    const aiResponse = await callGemini(prompt);
    
    // STEP 2: Parse AI response
    const rawIdeas = parseAIResponse(aiResponse);
    
    // STEP 3: Process through Algorithms (rank, normalize)
    const processedIdeas = processIdeas(rawIdeas);
    
    // STEP 4: Return structured response
    res.json(successResponse({ 
      ideas: processedIdeas,
      count: processedIdeas.length 
    }));

  } catch (err) {
    console.error("generate-ideas error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ════════════════════════════════════════════════════════
// ENDPOINT 2: ANALYZE IDEA
// ════════════════════════════════════════════════════════
/**
 * Flow: INPUT → AI ENGINE (analyze) → PARSE → ALGORITHMS (normalize) → OUTPUT
 */
router.post("/analyze-idea", async (req, res) => {
  try {
    const { valid, missing } = validateInput(req, ["idea"]);
    if (!valid) {
      return res.status(400).json({ success: false, error: missing.join(", ") });
    }

    const { idea } = req.body;

    // STEP 1: Call AI Engine
    const prompt = `
Analyze this business idea in detail: "${idea}"

Return ONLY this JSON format:
{
  "demand": { 
    "score": 7, 
    "summary": "Market demand assessment"
  },
  "competition": { 
    "level": "Medium", 
    "score": 5, 
    "summary": "Competitive landscape"
  },
  "risk": { 
    "level": "Medium", 
    "top_risks": ["Risk 1", "Risk 2"]
  },
  "cost_estimate": {
    "minimum": "$100",
    "recommended": "$500",
    "breakdown": ["Item: $50"]
  },
  "skill_match": 7
}
`;

    const aiResponse = await callGemini(prompt);
    
    // STEP 2: Parse AI response
    const rawAnalysis = parseAIResponse(aiResponse);
    
    // STEP 3: Process through Algorithms (normalize scores, calculate feasibility)
    const processedAnalysis = processAnalysis(rawAnalysis);
    
    // STEP 4: Return structured response
    res.json(successResponse(processedAnalysis));

  } catch (err) {
    console.error("analyze-idea error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ════════════════════════════════════════════════════════
// ENDPOINT 3: GENERATE PLAN
// ════════════════════════════════════════════════════════
/**
 * Flow: INPUT → AI ENGINE (plan) → PARSE → OUTPUT
 */
router.post("/generate-plan", async (req, res) => {
  try {
    const { valid, missing } = validateInput(req, ["idea"]);
    if (!valid) {
      return res.status(400).json({ success: false, error: missing.join(", ") });
    }

    const { idea } = req.body;

    // STEP 1: Call AI Engine
    const prompt = `
Create a detailed business roadmap for: "${idea}"

Return ONLY this JSON format:
{
  "setup_steps": [
    { "step": 1, "title": "Title", "description": "Details", "cost": "$0" }
  ],
  "plan_7_day": [
    { "day": "Day 1-2", "focus": "Focus area", "tasks": ["Task 1"] }
  ],
  "plan_30_day": [
    { "week": "Week 1", "goal": "Goal", "milestones": ["Milestone 1"] }
  ],
  "success_tips": ["Tip 1", "Tip 2"]
}
`;

    const aiResponse = await callGemini(prompt);
    
    // STEP 2: Parse AI response
    const plan = parseAIResponse(aiResponse);
    
    // STEP 3: Return structured response
    res.json(successResponse(plan));

  } catch (err) {
    console.error("generate-plan error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ════════════════════════════════════════════════════════
// ENDPOINT 4: MARKETING CONTENT
// ════════════════════════════════════════════════════════
/**
 * Flow: INPUT → AI ENGINE (marketing) → PARSE → OUTPUT
 */
router.post("/marketing-content", async (req, res) => {
  try {
    const { valid, missing } = validateInput(req, ["idea"]);
    if (!valid) {
      return res.status(400).json({ success: false, error: missing.join(", ") });
    }

    const { idea } = req.body;

    // STEP 1: Call AI Engine
    const prompt = `
Create compelling marketing content for: "${idea}"

Return ONLY this JSON format:
{
  "instagram_posts": [
    { "caption": "Engaging caption", "hashtags": ["#tag1", "#tag2"] }
  ],
  "ad_copies": [
    { "headline": "Headline", "body": "Body text", "cta": "Call to action" }
  ],
  "slogans": ["Slogan 1", "Slogan 2"],
  "captions": {
    "facebook": "Facebook caption",
    "linkedin": "LinkedIn caption",
    "whatsapp": "WhatsApp caption"
  }
}
`;

    const aiResponse = await callGemini(prompt);
    
    // STEP 2: Parse AI response
    const content = parseAIResponse(aiResponse);
    
    // STEP 3: Return structured response
    res.json(successResponse(content));

  } catch (err) {
    console.error("marketing-content error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ════════════════════════════════════════════════════════
// ENDPOINT 5: FEASIBILITY SCORE (Pure Algorithms - No AI)
// ════════════════════════════════════════════════════════
/**
 * Flow: INPUT → ALGORITHMS (calculate) → OUTPUT
 * No AI Engine needed - pure calculation
 */
router.post("/feasibility-score", (req, res) => {
  try {
    const { valid, missing } = validateInput(req, ["demand", "competition", "skill_match"]);
    if (!valid) {
      return res.status(400).json({ success: false, error: missing.join(", ") });
    }

    const demand = parseFloat(req.body.demand);
    const competition = parseFloat(req.body.competition);
    const skill_match = parseFloat(req.body.skill_match);

    // Validate input ranges
    if ([demand, competition, skill_match].some(v => isNaN(v) || v < 1 || v > 10)) {
      return res.status(400).json({ 
        success: false, 
        error: "All scores must be between 1 and 10" 
      });
    }

    // STEP 1: Call Algorithms (no AI needed)
    const result = calculateIdeaFeasibility(demand, competition, skill_match);
    
    // STEP 2: Return structured response
    res.json(successResponse(result));

  } catch (err) {
    console.error("feasibility-score error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;