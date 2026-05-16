const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

  username: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
  },

  role: {
    type: String,
    enum: ["admin", "student"],
    default: "student"
  },

  // ✅ ADDED — XP / score tracking
  score: {
    type: Number,
    default: 0
  }

});

module.exports = mongoose.model("User", userSchema);