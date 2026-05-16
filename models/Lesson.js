const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema({
  subject:    { type: String, required: true }, // "General Mathematics"
  title:      { type: String, required: true },
  order_num:  { type: Number, required: true },
  content:    { type: String, required: true }, // HTML string
  xp_reward:  { type: Number, default: 20 }
});

module.exports = mongoose.model("Lesson", lessonSchema);