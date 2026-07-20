/**
 * AI ENGINE MODULE
 * 
 * This is the SINGLE source for all Groq API calls.
 * All AI operations must route through this module.
 * 
 * Pattern: Input → Groq → Raw Output (no processing)
 */

const Groq = require("groq-sdk");
const {
  recordGroqRateLimit,
  recordGroqUsage,
} = require("./utils/groqUsageTracker");

let client = null;
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

const CYBERSECURITY_REPORT_STRUCTURE = `
For cybersecurity questions, vulnerability analysis, phishing analysis, malware explanation, compliance questions, risk assessment, file/URL/code/password review, or security recommendations, write like an experienced cybersecurity consultant.

Default response structure for human-readable answers:
# Executive Summary
A concise overview of the situation, primary concern, and recommended direction.

---

# Detailed Analysis
Explain step-by-step: what happened, why it happened, technical causes, likely security implications, and business context.

---

# Risk Assessment
Include Risk Level (Critical, High, Medium, or Low), likelihood, business impact, affected systems, and potential damage. Show the risk label clearly as "Risk Badge: Critical", "Risk Badge: High", "Risk Badge: Medium", or "Risk Badge: Low" so the existing UI can display the label without new components.

---

# Technical Explanation
Use professional cybersecurity terminology, then explain it in beginner-friendly language.

---

# Recommended Actions
Separate actions into Immediate Actions, Short-Term Improvements, Long-Term Improvements, and Best Practices.

---

# Prevention Tips
List practical ways to reduce the chance of recurrence.

---

# Additional Insights
Add useful cybersecurity context, tradeoffs, and detection guidance.

---

# References
Mention OWASP, NIST, MITRE ATT&CK, CVE, CIS Controls, or ISO 27001 only when genuinely relevant. Never fabricate a CVE, source, standard section, or technique ID.

End with:
AI Confidence
Confidence: X%
Reason: Briefly explain what the confidence is based on.
`;

const CYBERSECURITY_ANALYSIS_COVERAGE = `
When the topic involves an attack or incident, cover attack vector, entry point, affected assets, likely threat actors, indicators of compromise, MITRE techniques if applicable, detection methods, containment, eradication, recovery, and lessons learned.
When analyzing phishing, cover email indicators, suspicious URLs, spoofing indicators, domain reputation considerations, header analysis if headers exist, credential theft risk, and recommended user actions.
When analyzing passwords, cover entropy, strength, dictionary risk, brute-force resistance, and recommendations.
When analyzing files, cover possible malware indicators, suspicious behaviors, static analysis, dynamic analysis recommendations, hashes if available, and risk assessment.
When analyzing URLs, cover HTTPS, domain age if provided, typosquatting, open redirects, phishing indicators, reputation considerations, and potential risks.
When analyzing code, check for SQL injection, XSS, CSRF, SSRF, RCE, authentication flaws, authorization flaws, secrets exposure, dependency risks, and secure fixes.
If information is insufficient, say "Additional information is required." and specify exactly what is missing instead of guessing.
`;

function expectsJsonResponse(prompt) {
  return /return\s+only[\s\S]{0,120}json/i.test(prompt) || /json\s+(array|object|format)/i.test(prompt);
}

function buildSystemPrompt({ responseLanguage = "English", jsonMode = false } = {}) {
  const outputContract = jsonMode
    ? `
Output contract:
- Return ONLY valid JSON that matches the user's requested schema exactly.
- Do not add prose, markdown fences, comments, or keys that were not requested unless the requested schema explicitly allows open-ended content.
- Make every human-readable JSON string professional, specific, detailed, and actionable.
- Where the schema has summary, description, reasoning, risk, recommendation, or action fields, include enough detail to be useful without changing the field type.
- If the schema has no confidence field, include confidence only inside an existing narrative field when it is relevant and does not alter the schema.
- Preserve numeric ranges, enum values, key names, arrays, and object shapes exactly as requested.
`
    : `
Output contract:
- Use clear headings, subheadings, bullets, numbered steps, bold emphasis, warning/info/success callouts in plain Markdown, and short paragraphs.
- Never answer with a one-line response unless the user explicitly asks for brevity.
- Prioritize practical recommendations over generic filler.
`;

  // The markdown cybersecurity report template (Executive Summary / Risk
  // Assessment / References, etc.) is only ever used for free-form,
  // human-readable answers. JSON-mode calls (ideas, analysis, plans,
  // marketing content, every crisis debate turn) never use this structure,
  // so injecting it there was pure wasted input tokens on every call.
  const reportGuidance = jsonMode
    ? ""
    : `\n${CYBERSECURITY_REPORT_STRUCTURE}\n\n${CYBERSECURITY_ANALYSIS_COVERAGE}\n`;

  return `
You are BizShield AI, a professional AI cybersecurity assistant for business users.
Write in ${responseLanguage}.
Be technically accurate, context-aware, structured, practical, and helpful for both beginners and experts.
Think carefully before answering, but only reveal conclusions, evidence, and reasoning that help the user act.
Never hallucinate. If the available facts are not enough, state exactly what additional information is required.
Prioritize risks by severity, likelihood, business impact, and urgency.
${reportGuidance}
${outputContract}
`;
}

/**
 * Initialize Groq client (lazy-loaded)
 */
function initializeClient() {
  if (client) return client;

  const API_KEY = process.env.GROQ_API_KEY;

  if (!API_KEY) {
    throw new Error("GROQ_API_KEY environment variable not set");
  }

  client = new Groq({
    apiKey: API_KEY,
  });
  return client;
}

/**
 * Core AI call - returns RAW unprocessed response from Groq
 * @param {string} prompt - The prompt to send to Groq
 * @returns {Promise<string>} Raw text response from Groq
 */
async function callGroq(prompt, options = {}) {
  try {
    const groqClient = initializeClient();
    const jsonMode = expectsJsonResponse(prompt);
    const responseLanguage = options.responseLanguage || "English";

    // Cap generation length per call type. Without this, the model can
    // keep generating past the first {...}/[...] block we actually parse
    // out — tokens we still pay for but never use. Callers can override
    // via options.maxTokens for calls that need a larger structured output
    // (e.g. a 9-step recovery plan) or a smaller one (e.g. a quick analysis).
    const maxTokens = options.maxTokens || (jsonMode ? 1200 : 2000);

    const response = await groqClient.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: buildSystemPrompt({ responseLanguage, jsonMode }) },
        { role: "user", content: prompt },
      ],
      temperature: jsonMode ? 0.45 : 0.6,
      max_tokens: maxTokens,
    });
    recordGroqUsage({ model: GROQ_MODEL, usage: response.usage });

    const text = response.choices?.[0]?.message?.content?.trim();

    if (!text) {
      throw new Error("Empty response from Groq");
    }

    return text;
  } catch (error) {
    if (String(error.message || "").includes("rate_limit")) {
      recordGroqRateLimit(error.message);
    }
    throw new Error(`AI Engine Error: ${error.message}`);
  }
}

/**
 * Extract JSON from AI response
 * Used internally to parse Groq output
 * @param {string} text - Raw text from Groq
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

/**
 * Context-aware AI call — injects user business context into every prompt.
 * This ensures responses are NEVER stateless.
 * @param {string} prompt   - The core prompt
 * @param {object} context  - { user, projects, recentActivity, stage, currency, language }
 * @returns {Promise<string>} Raw Groq response
 */
async function callGroqWithContext(prompt, context = {}) {
  const {
    user,
    projects = [],
    recentActivity = [],
    stage = "startup",
    currency = "USD",
    language = "en",
    maxTokens,
    skipSecurityContext = false,
  } = context;
  const responseLanguage = language === "si" ? "Sinhala" : "English";
  const languageInstruction = language === "si"
    ? `
- IMPORTANT: All user-facing text values MUST be written in natural Sinhala.
- Do not mix English into Sinhala responses except for fixed JSON keys, brand names, platform names, currency codes, and role names such as CEO/Finance/PR/Engineer/Lawyer.
- Keep the response detailed and professional; do not shorten the answer because Sinhala is selected.
`
    : "";

  const projectSummary = projects.slice(0, 3).map(p =>
    `- "${p.title}" (${p.industry || "General"}, stage: ${p.stage || stage})`
  ).join("\n") || "No active projects yet.";

  const activitySummary = recentActivity.slice(0, 3).map(a =>
    `- ${a.action} "${a.documentTitle || a.projectTitle || "item"}" (${a.entityType})`
  ).join("\n") || "No recent activity.";

  const systemContext = `
=== BUSINESS INTELLIGENCE CONTEXT ===
User: ${user?.name || "Business Owner"}
Business Stage: ${stage}
Preferred Currency: ${currency}
Response Language: ${responseLanguage}

Active Projects:
${projectSummary}

Recent Activity:
${activitySummary}

INSTRUCTIONS:
- Use the above context to personalize and enrich your response.
- Reference the user's active projects where relevant.
- Express all financial figures in ${currency} only.
- Do not use "$" or "USD" unless the preferred currency is USD.
- If the preferred currency is not USD, convert the business estimate into that currency before responding.
- Write all human-readable response strings in ${responseLanguage}; keep JSON keys exactly as requested.
- Use ${responseLanguage} for every heading, bullet, explanation, summary, action item, CTA, caption, risk analysis, and recovery step.
${languageInstruction}
- Be structured, analytical, and decision-oriented.
- NEVER give generic advice — always tie back to the user's stated context.
=====================================

`;

  const securityContext = `
=== CYBERSECURITY RESPONSE QUALITY CONTEXT ===
- For security, risk, crisis, compliance, privacy, code, URL, password, phishing, malware, or vulnerability topics, apply BizShield AI's cybersecurity consultant standards.
- Provide deep analysis, risk prioritization, practical mitigation steps, confidence scoring, and clear explanations for beginners and experts.
- If facts are missing, say "Additional information is required." and list the missing details instead of guessing.
==============================================

`;

  const contextBlock = skipSecurityContext ? systemContext : systemContext + securityContext;

  return callGroq(contextBlock + prompt, { responseLanguage, maxTokens });
}

module.exports = {
  callGroq,
  callGroqWithContext,
  buildSystemPrompt,
  expectsJsonResponse,
  parseAIResponse,
};
