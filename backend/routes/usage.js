const express = require("express");
const { getGroqUsageSummary } = require("../utils/groqUsageTracker");

const router = express.Router();

router.get("/groq", (req, res) => {
  res.json({
    success: true,
    data: getGroqUsageSummary(),
  });
});

module.exports = router;
