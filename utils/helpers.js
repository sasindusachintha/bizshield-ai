const { GoogleGenerativeAI } = require("@google/generative-ai");

// ═══════════════════════════════════════
// AI CALL (SAFE + CLEAN)
// ═══════════════════════════════════════
async function callAI(prompt) {
  const API_KEY = process.env.GOOGLE_API_KEY;

  if (!API_KEY) {
    throw new Error("GOOGLE_API_KEY not set");
  }

  const client = new GoogleGenerativeAI(API_KEY);

  // USE STABLE MODEL (IMPORTANT)
  const model = client.getGenerativeModel({
    model: "gemini-2.5-flash",
  });

  const result = await model.generateContent(prompt);

  const response = result.response;
  const text = response?.candidates?.[0]?.content?.parts
    ?.map(p => p.text || "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("Empty AI response");
  }

  return text;
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