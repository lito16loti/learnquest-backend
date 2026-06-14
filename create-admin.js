// create-admin.js — run once with: node create-admin.js
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");
const User     = require("./models/User");

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const hash = await bcrypt.hash("Admin@1234", 10);

  await User.create({
    username: "admin",
    email:    "admin@g4mify.com",
    password: hash,
    role:     "admin"
  });

  console.log("✅ Admin created!");
  process.exit();
});