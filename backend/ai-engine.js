/**
 * AI ENGINE MODULE
 * 
 * This is the SINGLE source for all Gemini API calls.
 * All AI operations must route through this module.
 * 
 * Pattern: Input → Gemini → Raw Output (no processing)
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");

let client = null;

/**
 * Initialize Gemini client (lazy-loaded)
 */
function initializeClient() {
  if (client) return client;

  const API_KEY = process.env.GOOGLE_API_KEY;

  if (!API_KEY) {
    throw new Error("GOOGLE_API_KEY environment variable not set");
  }

  client = new GoogleGenerativeAI(API_KEY);
  return client;
}

/**
 * Core AI call - returns RAW unprocessed response from Gemini
 * @param {string} prompt - The prompt to send to Gemini
 * @returns {Promise<string>} Raw text response from Gemini
 */
async function callGemini(prompt) {
  try {
    const geminiClient = initializeClient();
    const model = geminiClient.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response?.candidates?.[0]?.content?.parts
      ?.map(p => p.text || "")
      .join("")
      .trim();

    if (!text) {
      throw new Error("Empty response from Gemini");
    }

    return text;
  } catch (error) {
    throw new Error(`AI Engine Error: ${error.message}`);
  }
}

/**
 * Extract JSON from AI response
 * Used internally to parse Gemini output
 * @param {string} text - Raw text from Gemini
 * @returns {Object} Parsed JSON object
 */
function parseAIResponse(text) {
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

    throw new Error("No valid JSON found in AI response");
  } catch (err) {
    console.error("AI Response parse error:", text);
    throw new Error(`Failed to parse AI response: ${err.message}`);
  }
}

module.exports = {
  callGemini,
  parseAIResponse,
};
