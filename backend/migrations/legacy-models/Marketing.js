const mongoose = require("mongoose");

const marketingSchema = new mongoose.Schema({
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
  content: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, "Marketing content is required"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Marketing", marketingSchema);
