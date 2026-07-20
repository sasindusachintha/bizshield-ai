/**
 * PROJECT MODEL
 *
 * Replaces the old Idea model as the top-level workspace container.
 * Each Project groups all AI-generated documents (ideas, plans, analyses, etc.)
 * under one roof, giving users a complete picture of their business concept.
 *
 * Extensibility: the `meta` Mixed field accepts arbitrary key-value data so
 * future features (AI chat history refs, PDF export logs, custom settings, etc.)
 * can be attached without schema changes.
 */

const mongoose = require("mongoose");

// Lifecycle stages a project can move through
const PROJECT_STAGES = ["ideation", "validation", "mvp", "growth", "scaling"];

const projectSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: [true, "Project title is required"],
      trim: true,
      maxlength: [140, "Title must be 140 characters or fewer"],
    },

    industry: {
      type: String,
      trim: true,
      maxlength: [80, "Industry label must be 80 characters or fewer"],
      default: "",
    },

    stage: {
      type: String,
      enum: {
        values: PROJECT_STAGES,
        message: `Stage must be one of: ${PROJECT_STAGES.join(", ")}`,
      },
      default: "ideation",
    },

    description: {
      type: String,
      trim: true,
      maxlength: [3000, "Description must be 3 000 characters or fewer"],
      default: "",
    },

    /**
     * Open-ended bucket for future features:
     *   meta.chatSessionIds   – AI chat history references
     *   meta.pdfExportLog     – PDF export timestamps / S3 keys
     *   meta.collaborators    – future team-sharing user IDs
     *   meta.color / meta.emoji – UI personalisation
     */
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    // Automatically manages createdAt and updatedAt
    timestamps: true,
  }
);

// Compound index: list all projects for a user, newest first
projectSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Project", projectSchema);
