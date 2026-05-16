require("dotenv").config();
const mongoose = require("mongoose");
const Lesson   = require("./models/Lesson");

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("Connected — seeding lessons...");

    await Lesson.deleteMany({}); // clear old lessons

    await Lesson.insertMany([
      {
        subject:   "General Mathematics",
        title:     "Functions and Relations",
        order_num: 1,
        xp_reward: 20,
        content: `
          <div class="lesson-body">
            <div class="lesson-section">
              <h2>What is a relation?</h2>
              <p>A <strong>relation</strong> is any set of ordered pairs (x, y).
              It shows a connection between two sets — the <strong>domain</strong>
              (all x-values) and the <strong>range</strong> (all y-values).</p>
              <div class="example-box">
                <p class="example-label">Example</p>
                <p>R = { (1,3), (2,5), (3,7), (4,9) }</p>
                <p>Domain: {1,2,3,4} &nbsp;|&nbsp; Range: {3,5,7,9}</p>
              </div>
            </div>
            <div class="lesson-section">
              <h2>What is a function?</h2>
              <p>A <strong>function</strong> is a relation where every input
              maps to <em>exactly one</em> output.</p>
              <div class="rule-box">📌 Each input has ONE and only ONE output.</div>
              <div class="two-col">
                <div class="col-card green">
                  <p class="col-label">✅ Function</p>
                  <p>{ (1,2), (2,4), (3,6) }</p>
                  <p class="col-note">Each x appears only once.</p>
                </div>
                <div class="col-card red">
                  <p class="col-label">❌ Not a function</p>
                  <p>{ (1,2), (1,5), (3,6) }</p>
                  <p class="col-note">x=1 maps to both 2 and 5.</p>
                </div>
              </div>
            </div>
            <div class="lesson-section">
              <h2>Function notation</h2>
              <p>Instead of y = 2x + 1, we write <strong>f(x) = 2x + 1</strong>.</p>
              <div class="example-box">
                <p class="example-label">Example</p>
                <p>f(x) = 2x + 1 &nbsp;→&nbsp; f(3) = 2(3) + 1 = <strong>7</strong></p>
              </div>
            </div>
            <div class="lesson-section">
              <h2>Key takeaways</h2>
              <ul>
                <li>A relation is any set of ordered pairs.</li>
                <li>A function gives each input exactly one output.</li>
                <li>Use the vertical line test on graphs.</li>
                <li>f(x) notation evaluates a function at any input.</li>
              </ul>
            </div>
          </div>
        `
      }
    ]);

    console.log("✅ Lessons seeded!");
    mongoose.disconnect();
  });