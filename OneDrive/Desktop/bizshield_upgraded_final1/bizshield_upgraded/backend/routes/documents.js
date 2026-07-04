const express = require("express");
const {
  getDocumentById,
  updateDocument,
  deleteDocument,
  getUserDocuments,
} = require("../controllers/projectDocumentController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// ── All of the current user's documents (optionally ?type=swot) ──
router.get("/", protect, getUserDocuments);

// ── Single document by id ──
router.get("/:id", protect, getDocumentById);
router.put("/:id", protect, updateDocument);
router.delete("/:id", protect, deleteDocument);

module.exports = router;
