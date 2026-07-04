const mongoose = require("mongoose");

const ideaSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: [true, "Idea title is required"],
    trim: true,
    maxlength: 140,
  },
  description: {
    type: String,
    required: [true, "Idea description is required"],
    trim: true,
    maxlength: 3000,
  },
  score: {
    type: Number,
    default: null,
    min: 0,
    max: 10,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Idea", ideaSchema);
