const mongoose = require("mongoose");

const questionSchema =
  new mongoose.Schema({

    question: {
      type: String,
      required: true
    },

    options: {
      type: [String],
      required: true
    },

    answer: {
      type: Number,
      required: true
    },

    subject: String,

    difficulty: Number
  });

module.exports =
  mongoose.model(
    "Question",
    questionSchema
  );