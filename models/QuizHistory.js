const mongoose = require("mongoose");

const quizHistorySchema = new mongoose.Schema({
  user_id:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  score:      { type: Number, required: true },     // correct answers
  total:      { type: Number, required: true },     // total questions
  xp_earned:  { type: Number, required: true },
  time_taken: { type: Number, required: true },     // seconds
  subject:    { type: String, default: "All" },
  taken_at:   { type: Date, default: Date.now }
});

module.exports = mongoose.model("QuizHistory", quizHistorySchema);