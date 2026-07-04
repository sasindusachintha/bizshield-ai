const mongoose = require("mongoose");
const Project = require("../models/Project");
const ProjectDocument = require("../models/ProjectDocument");
const { logActivity } = require("../utils/activityLogger");

const { DOCUMENT_TYPES } = ProjectDocument;

/**
 * POST /api/projects/:projectId/documents
 *
 * Creates a new ProjectDocument under the given project. Used to store
 * AI-generated outputs (market analyses, SWOTs, marketing plans, business
 * models, financial forecasts, risk assessments, pitch decks) as well as
 * the original idea write-up.
 *
 * A project can hold MANY documents of the same type — every save here
 * is additive, never overwrites a prior generation, so a full history of
 * AI outputs is preserved automatically.
 *
 * Body: { type, title, content, tags?, favorite?, meta? }
 */
async function createDocument(req, res) {
  try {
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ success: false, error: "Invalid project id" });
    }

    const project = await Project.findOne({ _id: projectId, userId: req.user._id });
    if (!project) {
      return res.status(404).json({ success: false, error: "Project not found" });
    }

    const { type, title, content, tags = [], favorite = false, meta = {} } = req.body;

    if (!type || !DOCUMENT_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        error: `Document type must be one of: ${DOCUMENT_TYPES.join(", ")}`,
      });
    }

    if (!title || content === undefined || content === null) {
      return res.status(400).json({
        success: false,
        error: "Document title and content are required",
      });
    }

    const document = await ProjectDocument.create({
      projectId: project._id,
      userId: req.user._id,
      type,
      title,
      content,
      tags,
      favorite,
      meta,
    });

    await logActivity({
      userId: req.user._id,
      projectId: project._id,
      documentId: document._id,
      entityType: type,
      action: "created",
      projectTitle: project.title,
      documentTitle: document.title,
    });

    res.status(201).json({ success: true, data: { document } });
  } catch (error) {
    console.error("createDocument error:", error);
    res.status(500).json({ success: false, error: "Could not save document" });
  }
}

/**
 * GET /api/projects/:projectId/documents
 * Optional query: ?type=swot to filter to a single document type.
 */
async function getProjectDocuments(req, res) {
  try {
    const { projectId } = req.params;
    const { type } = req.query;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ success: false, error: "Invalid project id" });
    }

    const project = await Project.findOne({ _id: projectId, userId: req.user._id });
    if (!project) {
      return res.status(404).json({ success: false, error: "Project not found" });
    }

    const filter = { projectId: project._id, userId: req.user._id };
    if (type) {
      if (!DOCUMENT_TYPES.includes(type)) {
        return res.status(400).json({
          success: false,
          error: `Document type must be one of: ${DOCUMENT_TYPES.join(", ")}`,
        });
      }
      filter.type = type;
    }

    const documents = await ProjectDocument.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { documents, count: documents.length },
    });
  } catch (error) {
    console.error("getProjectDocuments error:", error);
    res.status(500).json({ success: false, error: "Could not load documents" });
  }
}

/**
 * GET /api/documents/:id
 */
async function getDocumentById(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: "Invalid document id" });
    }

    const document = await ProjectDocument.findOne({ _id: id, userId: req.user._id });

    if (!document) {
      return res.status(404).json({ success: false, error: "Document not found" });
    }

    res.json({ success: true, data: { document } });
  } catch (error) {
    console.error("getDocumentById error:", error);
    res.status(500).json({ success: false, error: "Could not load document" });
  }
}

/**
 * PUT /api/documents/:id
 * Body: any of { title, content, tags, favorite, meta }
 */
async function updateDocument(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: "Invalid document id" });
    }

    const { title, content, tags, favorite, meta } = req.body;
    const update = {};

    if (title !== undefined) update.title = title;
    if (content !== undefined) update.content = content;
    if (tags !== undefined) update.tags = tags;
    if (favorite !== undefined) update.favorite = favorite;
    if (meta !== undefined) update.meta = meta;

    const document = await ProjectDocument.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      update,
      { new: true, runValidators: true }
    );

    if (!document) {
      return res.status(404).json({ success: false, error: "Document not found" });
    }

    const project = await Project.findById(document.projectId).lean();

    await logActivity({
      userId: req.user._id,
      projectId: document.projectId,
      documentId: document._id,
      entityType: document.type,
      action: "updated",
      projectTitle: project?.title || "",
      documentTitle: document.title,
    });

    res.json({ success: true, data: { document } });
  } catch (error) {
    console.error("updateDocument error:", error);
    res.status(500).json({ success: false, error: "Could not update document" });
  }
}

/**
 * DELETE /api/documents/:id
 */
async function deleteDocument(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: "Invalid document id" });
    }

    const document = await ProjectDocument.findOneAndDelete({ _id: id, userId: req.user._id });

    if (!document) {
      return res.status(404).json({ success: false, error: "Document not found" });
    }

    const project = await Project.findById(document.projectId).lean();

    await logActivity({
      userId: req.user._id,
      projectId: document.projectId,
      documentId: document._id,
      entityType: document.type,
      action: "deleted",
      projectTitle: project?.title || "",
      documentTitle: document.title,
    });

    res.json({ success: true, data: { deletedDocumentId: document._id } });
  } catch (error) {
    console.error("deleteDocument error:", error);
    res.status(500).json({ success: false, error: "Could not delete document" });
  }
}

/**
 * GET /api/documents
 * Lists ALL of the current user's documents across every project.
 * Optional query: ?type=swot
 *
 * Useful for "All my SWOT analyses" style views without needing a
 * project context.
 */
async function getUserDocuments(req, res) {
  try {
    const { type } = req.query;
    const filter = { userId: req.user._id };

    if (type) {
      if (!DOCUMENT_TYPES.includes(type)) {
        return res.status(400).json({
          success: false,
          error: `Document type must be one of: ${DOCUMENT_TYPES.join(", ")}`,
        });
      }
      filter.type = type;
    }

    const documents = await ProjectDocument.find(filter)
      .populate("projectId", "title industry stage")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: { documents, count: documents.length } });
  } catch (error) {
    console.error("getUserDocuments error:", error);
    res.status(500).json({ success: false, error: "Could not load documents" });
  }
}

module.exports = {
  createDocument,
  getProjectDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  getUserDocuments,
};
