/**
 * CRISIS SESSION MODEL
 *
 * Stores one full Boardroom Debate run: the crisis scenario the user
 * submitted, the full back-and-forth transcript between the AI agents
 * (CEO, Finance, PR, Engineer, Lawyer), the final weighted risk score,
 * whether the debate triggered a high-conflict CEO override, and the
 * final recovery plan.
 *
 * This is a standalone model (separate from Project / ProjectDocument)
 * because a crisis session has its own shape and lifecycle. It reuses
 * the existing mongoose connection from config/db.js — no new DB setup.
 */

const mongoose = require("mongoose");

const AGENT_ROLES = ["CEO", "Finance", "PR", "Engineer", "Lawyer"];
const STANCES = ["agree", "disagree", "neutral"];

// One turn in the boardroom debate
const debateMessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: AGENT_ROLES,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    risk_score: {
      type: Number,
      min: 1,
      max: 10,
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    problem_analysis: {
      type: String,
      default: "",
    },
    solution: {
      type: String,
      default: "",
    },
    step_by_step_recovery_plan: {
      type: [String],
      default: [],
    },
    stance: {
      type: String,
      enum: STANCES,
      default: "neutral",
    },
    reasoning: {
      type: String,
      default: "",
    },
  },
  { _id: false, timestamps: { createdAt: true, updatedAt: false } }
);

const crisisSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // The crisis scenario the user typed in
    crisisInput: {
      type: String,
      required: [true, "Crisis description is required"],
      trim: true,
      maxlength: [3000, "Crisis description must be 3000 characters or fewer"],
    },

    // Full ordered transcript of the boardroom debate
    debateMessages: {
      type: [debateMessageSchema],
      default: [],
    },

    // Weighted final risk score across all agents (1-10)
    finalRiskScore: {
      type: Number,
      min: 1,
      max: 10,
      default: null,
    },

    // True if any pair of agent risk scores differed by more than 4
    highConflict: {
      type: Boolean,
      default: false,
    },

    // The CEO's final decision / recovery strategy.
    // Shape: { summary: string, reasoning: string, steps: [{ step, title,
    // description, owner, priority, timeline }], decidedBy: string }
    finalPlan: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    // Open-ended bucket for future extension (model used, linked projectId, etc.)
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// List a user's crisis sessions, newest first
crisisSessionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("CrisisSession", crisisSessionSchema);
module.exports.AGENT_ROLES = AGENT_ROLES;
module.exports.STANCES = STANCES;
