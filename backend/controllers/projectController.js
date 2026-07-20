const mongoose = require("mongoose");
const Project = require("../models/Project");
const ProjectDocument = require("../models/ProjectDocument");
const { logActivity } = require("../utils/activityLogger");

const { DOCUMENT_TYPES } = ProjectDocument;

/**
 * POST /api/projects
 * Create a new, empty project workspace.
 */
async function createProject(req, res) {
  try {
    const { title, industry = "", stage = "ideation", description = "" } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        error: "Project title is required",
      });
    }

    const project = await Project.create({
      userId: req.user._id,
      title,
      industry,
      stage,
      description,
    });

    await logActivity({
      userId: req.user._id,
      projectId: project._id,
      entityType: "project",
      action: "created",
      projectTitle: project.title,
    });

    res.status(201).json({ success: true, data: { project } });
  } catch (error) {
    console.error("createProject error:", error);
    res.status(500).json({ success: false, error: "Could not create project" });
  }
}

/**
 * GET /api/projects
 *
 * Returns the "My Projects" / Project History list:
 *   - title, industry, stage, createdAt, updatedAt
 *   - documentTypes: the distinct ProjectDocument types saved under each project
 *   - documentCount: total documents under each project
 */
async function getUserProjects(req, res) {
  try {
    const projects = await Project.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    if (!projects.length) {
      return res.json({ success: true, data: { projects: [], count: 0 } });
    }

    const projectIds = projects.map((p) => p._id);

    // One aggregation covers every project: distinct document types + counts
    const documentSummaries = await ProjectDocument.aggregate([
      { $match: { projectId: { $in: projectIds } } },
      {
        $group: {
          _id: "$projectId",
          documentTypes: { $addToSet: "$type" },
          documentCount: { $sum: 1 },
          lastUpdatedAt: { $max: "$updatedAt" },
        },
      },
    ]);

    const summaryByProjectId = new Map(
      documentSummaries.map((summary) => [String(summary._id), summary])
    );

    const enrichedProjects = projects.map((project) => {
      const summary = summaryByProjectId.get(String(project._id));
      return {
        ...project,
        documentTypes: summary?.documentTypes || [],
        documentCount: summary?.documentCount || 0,
        lastActivityAt: summary?.lastUpdatedAt || project.updatedAt,
      };
    });

    res.json({
      success: true,
      data: {
        projects: enrichedProjects,
        count: enrichedProjects.length,
      },
    });
  } catch (error) {
    console.error("getUserProjects error:", error);
    res.status(500).json({ success: false, error: "Could not load projects" });
  }
}

/**
 * GET /api/projects/:id
 *
 * Returns a single project plus all of its ProjectDocuments, grouped by
 * type, for the Project Workspace view.
 */
async function getProjectById(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: "Invalid project id" });
    }

    const project = await Project.findOne({ _id: id, userId: req.user._id }).lean();

    if (!project) {
      return res.status(404).json({ success: false, error: "Project not found" });
    }

    const documents = await ProjectDocument.find({
      projectId: project._id,
      userId: req.user._id,
    })
      .sort({ createdAt: -1 })
      .lean();

    const documentsByType = {};
    for (const type of DOCUMENT_TYPES) {
      documentsByType[type] = [];
    }
    for (const doc of documents) {
      if (!documentsByType[doc.type]) documentsByType[doc.type] = [];
      documentsByType[doc.type].push(doc);
    }

    res.json({
      success: true,
      data: {
        project,
        documents,
        documentsByType,
      },
    });
  } catch (error) {
    console.error("getProjectById error:", error);
    res.status(500).json({ success: false, error: "Could not load project" });
  }
}

/**
 * PUT /api/projects/:id
 * Update a project's metadata (title, industry, stage, description, meta).
 */
async function updateProject(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: "Invalid project id" });
    }

    const { title, industry, stage, description, meta } = req.body;
    const update = {};

    if (title !== undefined) update.title = title;
    if (industry !== undefined) update.industry = industry;
    if (stage !== undefined) update.stage = stage;
    if (description !== undefined) update.description = description;
    if (meta !== undefined) update.meta = meta;

    const project = await Project.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      update,
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({ success: false, error: "Project not found" });
    }

    await logActivity({
      userId: req.user._id,
      projectId: project._id,
      entityType: "project",
      action: "updated",
      projectTitle: project.title,
    });

    res.json({ success: true, data: { project } });
  } catch (error) {
    console.error("updateProject error:", error);
    res.status(500).json({ success: false, error: "Could not update project" });
  }
}

/**
 * DELETE /api/projects/:id
 * Deletes a project AND every ProjectDocument that belongs to it
 * (a project is the sole owner of its documents).
 */
async function deleteProject(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: "Invalid project id" });
    }

    const project = await Project.findOneAndDelete({ _id: id, userId: req.user._id });

    if (!project) {
      return res.status(404).json({ success: false, error: "Project not found" });
    }

    await ProjectDocument.deleteMany({ projectId: project._id, userId: req.user._id });

    await logActivity({
      userId: req.user._id,
      projectId: project._id,
      entityType: "project",
      action: "deleted",
      projectTitle: project.title,
    });

    res.json({ success: true, data: { deletedProjectId: project._id } });
  } catch (error) {
    console.error("deleteProject error:", error);
    res.status(500).json({ success: false, error: "Could not delete project" });
  }
}

/**
 * POST /api/projects/quick-save-idea
 *
 * Convenience endpoint used by the "Save Idea" button on Growth Mode's
 * Ideas page. Creates a brand-new Project AND its first ProjectDocument
 * (type: "idea") in a single call, replacing the old POST /api/ideas/save.
 *
 * Body: { title, description, industry?, score? }
 */
async function quickSaveIdea(req, res) {
  try {
    const { title, description, industry = "", score = null } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        error: "Idea title and description are required",
      });
    }

    const project = await Project.create({
      userId: req.user._id,
      title,
      industry,
      stage: "ideation",
      description,
    });

    const numericScore = Number(score);

    const document = await ProjectDocument.create({
      projectId: project._id,
      userId: req.user._id,
      type: "idea",
      title,
      content: {
        description,
        score: Number.isFinite(numericScore) ? numericScore : null,
      },
    });

    await logActivity({
      userId: req.user._id,
      projectId: project._id,
      entityType: "project",
      action: "created",
      projectTitle: project.title,
    });

    await logActivity({
      userId: req.user._id,
      projectId: project._id,
      documentId: document._id,
      entityType: "idea",
      action: "created",
      projectTitle: project.title,
      documentTitle: document.title,
    });

    res.status(201).json({ success: true, data: { project, document } });
  } catch (error) {
    console.error("quickSaveIdea error:", error);
    res.status(500).json({ success: false, error: "Could not save idea" });
  }
}

module.exports = {
  createProject,
  getUserProjects,
  getProjectById,
  updateProject,
  deleteProject,
  quickSaveIdea,
};
