require("dotenv").config();

const express =
  require("express");

const mongoose =
  require("mongoose");

const cors =
  require("cors");

const bcrypt =
  require("bcryptjs");

const jwt =
  require("jsonwebtoken");

const rateLimit =
  require("express-rate-limit");

const User =
  require("./models/User");

const Question =
  require("./models/Question");

const verifyToken =
  require("./middleware/auth");

const isAdmin =
  require("./middleware/admin");

const Lesson   = require("./models/Lesson");
const Progress = require("./models/Progress");

const app = express();

/* =====================
   SECURITY
===================== */

app.use(cors({
  origin: [
    "http://127.0.0.1:5500",                        // local dev
    "https://learnquest-abc123.netlify.app"          // your netlify URL
  ]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter =
  rateLimit({

    windowMs:
      15 * 60 * 1000,

    max: 100
  });

app.use(limiter);

/* =====================
   DATABASE
===================== */

mongoose.connect(
  process.env.MONGO_URI
)
.then(() => {

  console.log(
    "✅ MongoDB Connected"
  );

})
.catch((err) => {

  console.log(err);
});

/* =====================
   HOME
===================== */

app.get("/", (req, res) => {

  res.send(
    "🚀 Server Running"
  );
});

/* =====================
   REGISTER
===================== */

app.post("/register", async (req, res) => {

  try {

    const { username, email, password } = req.body;
    const role = "student";

    // EMAIL VALIDATION
    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Invalid email"
      });
    }

    // PASSWORD VALIDATION
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{8,}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must contain uppercase, lowercase, special character, and minimum 8 characters"
      });
    }

    // CHECK EXISTING USER
    const existingUser =
      await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already exists"
      });
    }

    // HASH PASSWORD
    const hashedPassword =
      await bcrypt.hash(password, 10);

    // CREATE USER
    const newUser = new User({
      username,
      email,
      password: hashedPassword,

      // admin or student
      role
    });

    await newUser.save();

    res.json({
      message: "Registration successful"
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Server error"
    });
  }
});

/* =====================
   LOGIN
===================== */

app.post("/login", async (req, res) => {

  try {

    const { email, password } = req.body;

    const user =
      await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const isMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid password"
      });
    }

    // IMPORTANT
   const token = jwt.sign(
  { id: user._id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: "8h" }
);

res.json({
  message:  "Login successful",
  role:     user.role,
  username: user.username,
  token:    token
});

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Server error"
    });
  }
});

/* =====================
   QUESTIONS
===================== */

app.get(
  "/questions",
  async (req, res) => {

    const questions =
      await Question.find();

    res.json(questions);
  }
);

/* =====================
   ADMIN ADD QUESTION
===================== */

app.post(
  "/admin/questions",
  verifyToken,
  isAdmin,
  async (req, res) => {

    try {

      const {
        question,
        options,
        answer,
        subject,
        difficulty
      } = req.body;

      if (
        !question ||
        options.length < 4
      ) {

        return res.status(400)
        .json({
          message:
            "Invalid question"
        });
      }

      const newQuestion =
        new Question({

          question,

          options,

          answer,

          subject,

          difficulty
        });

      await newQuestion.save();

      res.json({
        message:
          "Question added"
      });

    } catch (err) {

      console.log(err);

      res.status(500)
      .json({
        message:
          "Add failed"
      });
    }
  }
);

/* =====================
   ADMIN DELETE
===================== */

app.delete(
  "/admin/questions/:id",
  verifyToken,
  isAdmin,
  async (req, res) => {

    await Question
    .findByIdAndDelete(
      req.params.id
    );

    res.json({
      message:
        "Deleted"
    });
  }
);

/* =====================
   SUBMIT SCORE
===================== */

app.post("/submit-score", verifyToken, async (req, res) => {
  try {
    const { score } = req.body;

    if (typeof score !== "number" || score < 0) {
      return res.status(400).json({ message: "Invalid score" });
    }

    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { $inc: { score: score } },
      { new: true }          // ✅ returns updated doc so we can confirm
    );

    console.log(`✅ Score updated for ${updated.username}: total XP = ${updated.score}`);

    res.json({
      message:   "Score saved",
      new_score: updated.score
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================
   LEADERBOARD
===================== */

app.get(
  "/leaderboard",
  async (req, res) => {

    const users =
      await User.find({ role: "student" })  // ✅ exclude admins
      .sort({ score: -1 })
      .limit(10)
      .select("username score email");       // ✅ only send needed fields

    res.json(users);
  }
);

/* =====================
   GET ALL LESSONS
===================== */

app.get(
  "/lessons",
  verifyToken,
  async (req, res) => {
    try {
      const lessons = await Lesson
        .find()
        .sort({ order_num: 1 })
        .select("-content"); // exclude heavy HTML from list view

      // attach completion status for this user
      const progress = await Progress.find({
        user_id: req.user.id
      });

      const completedIds = progress.map(p =>
        p.lesson_id.toString()
      );

      const lessonsWithStatus = lessons.map(l => ({
        ...l.toObject(),
        completed: completedIds.includes(l._id.toString())
      }));

      res.json(lessonsWithStatus);

    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/* =====================
   GET SINGLE LESSON
===================== */

app.get(
  "/lessons/:id",
  verifyToken,
  async (req, res) => {
    try {
      const lesson = await Lesson.findById(req.params.id);

      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }

      res.json(lesson);

    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/* =====================
   COMPLETE LESSON
===================== */

app.post(
  "/lessons/:id/complete",
  verifyToken,
  async (req, res) => {
    try {
      const lesson = await Lesson.findById(req.params.id);

      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }

      // check if already completed
      const existing = await Progress.findOne({
        user_id:   req.user.id,
        lesson_id: req.params.id
      });

      if (existing) {
        return res.json({ message: "Already completed", xp_earned: 0 });
      }

      // save progress
      await Progress.create({
        user_id:   req.user.id,
        lesson_id: req.params.id
      });

      // award XP
      await User.findByIdAndUpdate(
        req.user.id,
        { $inc: { score: lesson.xp_reward } }
      );

      res.json({
        message:    "Lesson complete!",
        xp_earned:  lesson.xp_reward
      });

    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/* =====================
   ADMIN — ADD LESSON
===================== */

app.post(
  "/admin/lessons",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const { subject, title, order_num, content, xp_reward } = req.body;

      const lesson = new Lesson({
        subject,
        title,
        order_num,
        content,
        xp_reward: xp_reward || 20
      });

      await lesson.save();
      res.json({ message: "Lesson added", lesson });

    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Add failed" });
    }
  }
);

/* =====================
   ADMIN — DELETE LESSON
===================== */
app.delete("/admin/lessons/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    await Lesson.findByIdAndDelete(req.params.id);
    await Progress.deleteMany({ lesson_id: req.params.id }); // clean up progress too
    res.json({ message: "Lesson deleted" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Delete failed" });
  }
});

/* =====================
   START SERVER
===================== */

app.listen(
  process.env.PORT,
  () => {

    console.log(
      `🚀 Running on port ${process.env.PORT}`
    );
  }
);
