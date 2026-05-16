const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema({
  user_id:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  lesson_id:    { type: mongoose.Schema.Types.ObjectId, ref: "Lesson", required: true },
  completed_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Progress", progressSchema);