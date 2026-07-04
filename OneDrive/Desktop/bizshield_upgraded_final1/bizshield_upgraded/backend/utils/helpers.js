// ═══════════════════════════════════════════════════════
// AI CALL - DEPRECATED
// ═══════════════════════════════════════════════════════
// ⚠️  DO NOT USE THIS FUNCTION
// 
// All Groq calls must route through /ai-engine.js
// This function is kept for backward compatibility only.
// Import from AI-Engine instead:
//   const { callGroq } = require("../ai-engine");
// ═══════════════════════════════════════════════════════
async function callAI(prompt) {
  throw new Error(
    "❌ DEPRECATED: callAI in helpers.js is no longer used.\n" +
    "All AI calls must route through AI-Engine: require('../ai-engine')\n" +
    "Use: const { callGroq } = require('../ai-engine')\n" +
    "Then call: callGroq(prompt)"
  );
}

// ═══════════════════════════════════════
// SAFE JSON PARSER (VERY IMPORTANT)
// ═══════════════════════════════════════
function safeJSONParse(text) {
  try {
    if (!text) throw new Error("Empty text");

    // remove markdown blocks
    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start === -1 || end === -1) {
      throw new Error("No JSON found");
    }

    const jsonString = cleaned.slice(start, end + 1);

    return JSON.parse(jsonString);
  } catch (err) {
    console.log("RAW AI OUTPUT:\n", text);
    throw new Error("AI JSON parse failed: " + err.message);
  }
}

// ═══════════════════════════════════════
// FORMAT RESPONSE
// ═══════════════════════════════════════
function formatResponse(data) {
  return {
    success: true,
    timestamp: new Date().toISOString(),
    data,
  };
}

// ═══════════════════════════════════════
// VALIDATE INPUT
// ═══════════════════════════════════════
function validateInput(req, requiredFields = []) {
  const missing = requiredFields.filter(
    (f) => !req.body?.[f]
  );

  return {
    valid: missing.length === 0,
    missing,
  };
}

module.exports = {
  callAI,
  safeJSONParse,
  formatResponse,
  validateInput,
};