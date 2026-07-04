/**
 * CRISIS MODE ROUTES — BOARDROOM DEBATE
 *
 * Pipeline: INPUT → DEBATE ENGINE (sequenced AI Engine calls) → MONGODB → OUTPUT
 *
 * ✅ Uses the Debate Engine (which uses AI Engine internally) — no direct
 *    Groq calls in this layer
 * ✅ Reuses the existing MongoDB connection / mongoose models
 * ✅ Reuses the existing auth middleware + response helpers
 */

const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { formatResponse, validateInput } = require("../utils/helpers");
const { runFullDebate } = require("../algorithms/crisisDebateEngine");
const CrisisSession = require("../models/CrisisSession");
const Project = require("../models/Project");
const ActivityLog = require("../models/ActivityLog");

function successResponse(data) {
  return formatResponse(data);
}

const SUPPORTED_CURRENCIES = new Set(["USD", "LKR", "EUR", "GBP", "INR"]);
const SUPPORTED_LANGUAGES = new Set(["en", "si"]);

function normalizePreferenceContext(preferences = {}, storedContext = {}) {
  const currency = String(preferences.currency || storedContext.currency || "USD").toUpperCase();
  const language = String(preferences.language || storedContext.language || "en").toLowerCase();
  return {
    ...storedContext,
    currency: SUPPORTED_CURRENCIES.has(currency) ? currency : "USD",
    language: SUPPORTED_LANGUAGES.has(language) ? language : "en",
  };
}

async function buildUserContext(user) {
  try {
    const [projects, activity] = await Promise.all([
      Project.find({ userId: user._id }).sort({ updatedAt: -1 }).limit(5).select("title industry stage"),
      ActivityLog.find({ userId: user._id }).sort({ createdAt: -1 }).limit(5)
    ]);
    return {
      user: { name: user.name },
      projects,
      recentActivity: activity,
      stage: projects[0]?.stage || "scaling",
      currency: user.currency || "USD",
      language: user.language || "en"
    };
  } catch (_) {
    return { user: { name: user.name }, currency: user.currency || "USD" };
  }
}

// ════════════════════════════════════════════════════════
// ENDPOINT 1: RUN A NEW BOARDROOM DEBATE
// ════════════════════════════════════════════════════════
/**
 * Flow: INPUT → DEBATE ENGINE (CEO→Finance→PR→Engineer→Lawyer→CEO) →
 *       CONFLICT DETECTION → WEIGHTED SCORE → SAVE SESSION → OUTPUT
 */
router.post("/debate", protect, async (req, res) => {
  try {
    const { valid, missing } = validateInput(req, ["crisisInput"]);
    if (!valid) {
      return res.status(400).json({ success: false, error: missing.join(", ") });
    }

    const { crisisInput, preferences } = req.body;

    // Build context from user's stored projects and preferences
    const context = normalizePreferenceContext(preferences, await buildUserContext(req.user));

    // STEP 1: Run the full sequential debate with context injection
    const { debateMessages, conflict, finalRiskScore, finalPlan } = await runFullDebate(
      crisisInput,
      context
    );

    // STEP 2: Persist the session using the existing MongoDB connection
    const session = await CrisisSession.create({
      userId: req.user._id,
      crisisInput,
      debateMessages,
      finalRiskScore,
      highConflict: conflict.highConflict,
      finalPlan,
    });

    // STEP 3: Return structured response
    res.json(
      successResponse({
        sessionId: session._id,
        crisisInput: session.crisisInput,
        debateMessages: session.debateMessages,
        conflict,
        finalRiskScore: session.finalRiskScore,
        finalPlan: session.finalPlan,
        createdAt: session.createdAt,
      })
    );
  } catch (err) {
    console.error("crisis/debate error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ════════════════════════════════════════════════════════
// ENDPOINT 2: LIST A USER'S PAST CRISIS SESSIONS
// ════════════════════════════════════════════════════════
router.get("/sessions", protect, async (req, res) => {
  try {
    const sessions = await CrisisSession.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .select("crisisInput finalRiskScore highConflict createdAt");

    res.json(successResponse({ sessions, count: sessions.length }));
  } catch (err) {
    console.error("crisis/sessions error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ════════════════════════════════════════════════════════
// ENDPOINT 3: GET A SINGLE CRISIS SESSION (FULL TRANSCRIPT)
// ════════════════════════════════════════════════════════
router.get("/sessions/:id", protect, async (req, res) => {
  try {
    const session = await CrisisSession.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!session) {
      return res.status(404).json({ success: false, error: "Crisis session not found" });
    }

    res.json(successResponse(session));
  } catch (err) {
    console.error("crisis/sessions/:id error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ════════════════════════════════════════════════════════
// ENDPOINT 4: DELETE A CRISIS SESSION
// ════════════════════════════════════════════════════════
router.delete("/sessions/:id", protect, async (req, res) => {
  try {
    const deleted = await CrisisSession.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!deleted) {
      return res.status(404).json({ success: false, error: "Crisis session not found" });
    }

    res.json(successResponse({ deletedId: req.params.id }));
  } catch (err) {
    console.error("crisis/sessions/:id delete error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
