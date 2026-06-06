const https = require("https");

// ════════════════════════════════════════════════════════
//  callAI(prompt)  —  sends prompt to Anthropic, returns text
// ════════════════════════════════════════════════════════
async function callAI(prompt) {
  const API_KEY = process.env.ANTHROPIC_API_KEY;

  if (!API_KEY) {
    throw new Error("ANTHROPIC_API_KEY not set in environment variables");
  }

  const body = JSON.stringify({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.anthropic.com",
      path: "/v1/messages",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);

          // API-level error (e.g. invalid key, rate limit)
          if (parsed.error) {
            return reject(new Error(parsed.error.message));
          }

          const text = parsed.content
            ?.map((block) => block.text || "")
            .join("")
            .trim();

          resolve(text || "No response from AI.");
        } catch {
          reject(new Error("Failed to parse AI response"));
        }
      });
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// ════════════════════════════════════════════════════════
//  formatResponse(data)  —  consistent JSON wrapper
// ════════════════════════════════════════════════════════
function formatResponse(data) {
  return {
    success: true,
    timestamp: new Date().toISOString(),
    data: data,
  };
}

// ════════════════════════════════════════════════════════
//  validateInput(req, requiredFields)
//  Returns { valid: bool, missing: [...fields] }
// ════════════════════════════════════════════════════════
function validateInput(req, requiredFields = []) {
  const missing = requiredFields.filter(
    (field) =>
      req.body[field] === undefined ||
      req.body[field] === null ||
      req.body[field] === ""
  );

  return {
    valid: missing.length === 0,
    missing,
  };
}

module.exports = { callAI, formatResponse, validateInput };
