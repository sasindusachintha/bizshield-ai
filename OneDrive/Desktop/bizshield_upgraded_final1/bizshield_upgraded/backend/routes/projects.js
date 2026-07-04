const express = require("express");
const {
  createProject,
  getUserProjects,
  getProjectById,
  updateProject,
  deleteProject,
  quickSaveIdea,
} = require("../controllers/projectController");
const {
  createDocument,
  getProjectDocuments,
} = require("../controllers/projectDocumentController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// ── Convenience: Save Idea -> creates Project + idea ProjectDocument ──
// Replaces the old POST /api/ideas/save
router.post("/quick-save-idea", protect, quickSaveIdea);

// ── Project CRUD (My Projects / Project History) ──
router.post("/", protect, createProject);
router.get("/", protect, getUserProjects);
router.get("/:id", protect, getProjectById);
router.put("/:id", protect, updateProject);
router.delete("/:id", protect, deleteProject);

// ── Documents nested under a project ──
router.post("/:projectId/documents", protect, createDocument);
router.get("/:projectId/documents", protect, getProjectDocuments);

module.exports = router;
