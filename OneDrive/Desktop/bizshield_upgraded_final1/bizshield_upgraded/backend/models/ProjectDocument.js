/**
 * PROJECT DOCUMENT MODEL
 *
 * Stores every piece of AI-generated (or user-authored) content that belongs
 * to a Project — the original idea write-up, market analyses, SWOTs,
 * marketing plans, business models, financial forecasts, risk assessments,
 * pitch decks, and any future document types.
 *
 * A project can hold MANY documents of the SAME type (e.g. multiple SWOT
 * analyses generated over time), enabling full history/versioning.
 *
 * Extensibility: `favorite`, `tags`, and `meta` are included now so that
 * future features (favorites list, tag filters, PDF export refs, AI chat
 * thread links, etc.) don't require a schema migration later.
 */

const mongoose = require("mongoose");

// All supported document types. Add new types here as the product grows.
const DOCUMENT_TYPES = [
  "idea",
  "market-analysis",
  "swot",
  "marketing-plan",
  "business-model",
  "financial-forecast",
  "risk-assessment",
  "pitch-deck",
];

const projectDocumentSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      required: [true, "Document type is required"],
      enum: {
        values: DOCUMENT_TYPES,
        message: `Document type must be one of: ${DOCUMENT_TYPES.join(", ")}`,
      },
      index: true,
    },

    title: {
      type: String,
      required: [true, "Document title is required"],
      trim: true,
      maxlength: [140, "Title must be 140 characters or fewer"],
    },

    /**
     * Flexible content container. Each document type shapes this
     * differently (plain text for an idea write-up, structured JSON
     * for SWOT / financial-forecast / pitch-deck output, etc.).
     */
    content: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, "Document content is required"],
    },

    // Quick boolean flag for the future "favorites" feature
    favorite: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Free-form labels for the future "tags" feature
    tags: {
      type: [String],
      default: [],
    },

    /**
     * Open-ended bucket for future features:
     *   meta.sourceModel   – which AI model generated this
     *   meta.promptVersion – which prompt template was used
     *   meta.exportHistory – PDF export log entries
     *   meta.chatThreadId  – linked AI chat conversation
     */
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// List all documents for a project, newest first
projectDocumentSchema.index({ projectId: 1, createdAt: -1 });

// List all documents of a given type for a user (used for dashboard stats)
projectDocumentSchema.index({ userId: 1, type: 1 });

projectDocumentSchema.statics.DOCUMENT_TYPES = DOCUMENT_TYPES;

module.exports = mongoose.model("ProjectDocument", projectDocumentSchema);
module.exports.DOCUMENT_TYPES = DOCUMENT_TYPES;
