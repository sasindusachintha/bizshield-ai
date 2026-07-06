const path = require("path");
const dotenv = require("dotenv");

const envResult = dotenv.config({ path: path.join(__dirname, ".env") });
if (envResult.error) {
  dotenv.config({ path: path.join(__dirname, "AI-Engine", ".env") });
}

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const growthRoutes = require("./routes/growth");
const authRoutes = require("./routes/auth");
const projectRoutes = require("./routes/projects");
const documentRoutes = require("./routes/documents");
const dashboardRoutes = require("./routes/dashboard");
const crisisRoutes = require("./routes/crisis");

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors());
app.use(express.json());

// ── Routes ──────────────────────────────────────────────
app.use("/api/growth", growthRoutes);
app.use("/api/auth", authRoutes);

// Project Workspace: projects, their nested documents, and standalone
// document access. Replaces the old /api/ideas, /api/plans, /api/marketing
// routes — ideas/plans/marketing content is now stored as ProjectDocuments.
app.use("/api/projects", projectRoutes);
app.use("/api/documents", documentRoutes);

// Dashboard statistics + recent activity feed
app.use("/api/dashboard", dashboardRoutes);

// Crisis Mode: real-time AI boardroom debate simulation
app.use("/api/crisis", crisisRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "BizShield AI API running" });
});

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Stop the existing server or set PORT to another value.`);
    process.exit(1);
  }
  throw error;
});