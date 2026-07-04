const mongoose = require("mongoose");

const businessPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  ideaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Idea",
    default: null,
    index: true,
  },
  planContent: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, "Plan content is required"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("BusinessPlan", businessPlanSchema);
