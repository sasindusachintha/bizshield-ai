require("dotenv").config();

const express = require("express");
const cors = require("cors");
const growthRoutes = require("./routes/growth");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ── Routes ──────────────────────────────────────────────
app.use("/api/growth", growthRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Growth Mode API running" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
