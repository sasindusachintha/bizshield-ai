/**
 * ACTIVITY LOG MODEL
 *
 * Powers the "Recent Activity" feed on the dashboard. Every time a project
 * is created/updated/deleted, or a ProjectDocument (idea, SWOT, marketing
 * plan, etc.) is generated/updated/deleted, a lightweight entry is written
 * here so the user can see a timeline of what happened across all of their
 * projects without re-querying every collection.
 *
 * Kept intentionally small and denormalized (titles copied at write-time)
 * so the activity feed can be rendered with a single query and no joins,
 * even if the underlying project/document is later renamed or removed.
 */

const mongoose = require("mongoose");

const ACTIVITY_ACTIONS = ["created", "updated", "deleted"];

// Mirrors ProjectDocument.DOCUMENT_TYPES plus a "project" entry for
// project-level events (create/rename/delete a whole workspace).
const ACTIVITY_ENTITY_TYPES = [
  "project",
  "idea",
  "market-analysis",
  "swot",
  "marketing-plan",
  "business-model",
  "financial-forecast",
  "risk-assessment",
  "pitch-deck",
];

const activityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
      index: true,
    },

    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProjectDocument",
      default: null,
    },

    // What kind of thing this activity refers to
    entityType: {
      type: String,
      required: true,
      enum: {
        values: ACTIVITY_ENTITY_TYPES,
        message: `entityType must be one of: ${ACTIVITY_ENTITY_TYPES.join(", ")}`,
      },
    },

    // What happened to it
    action: {
      type: String,
      required: true,
      enum: {
        values: ACTIVITY_ACTIONS,
        message: `action must be one of: ${ACTIVITY_ACTIONS.join(", ")}`,
      },
    },

    // Denormalized display fields so the feed never needs a populate()
    projectTitle: {
      type: String,
      trim: true,
      default: "",
    },

    documentTitle: {
      type: String,
      trim: true,
      default: "",
    },

    // Open-ended bucket for future detail (e.g. diff summaries, export refs)
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Fetch a user's most recent activity, newest first
activityLogSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("ActivityLog", activityLogSchema);
module.exports.ACTIVITY_ACTIONS = ACTIVITY_ACTIONS;
module.exports.ACTIVITY_ENTITY_TYPES = ACTIVITY_ENTITY_TYPES;
