const API = "http://localhost:5000";

/* =========================
   🔐 REGISTER
========================= */

async function register() {
  try {
    const username = document.getElementById("username").value;
    const email    = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const role     = document.getElementById("role").value;

    if (!validateRegister(username, email, password)) return;

    const res  = await fetch(API + "/register", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ username, email, password, role })
    });

    const data = await res.json();
    alert(data.message);

    if (res.ok) window.location.href = "index.html";

  } catch (err) {
    console.log(err);
    alert("Registration failed");
  }
}

function validateRegister(username, email, password) {
  const emailRegex    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{8,}$/;

  if (!username || !email || !password) {
    alert("All fields are required");
    return false;
  }
  if (!emailRegex.test(email)) {
    alert("Please enter a valid email");
    return false;
  }
  if (!passwordRegex.test(password)) {
    alert("Password must contain uppercase, lowercase, special character, and minimum 8 characters");
    return false;
  }
  return true;
}

/* =========================
   🔑 LOGIN
========================= */

async function login() {
  const email    = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  try {
    const res  = await fetch(API + "/login", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("role",     data.role);
      localStorage.setItem("username", data.username);
      localStorage.setItem("token",    data.token);  // ✅ save JWT

      if (data.role === "admin") {
        window.location.href = "admin.html";
      } else if (data.role === "student") {
        window.location.href = "dashboard.html";
      } else {
        alert("Role not found");
      }
    } else {
      alert(data.message);
    }

  } catch (error) {
    console.log(error);
    alert("Login failed");
  }
}

/* =========================
   🚪 LOGOUT
========================= */

function logout() {
  localStorage.removeItem("role");
  localStorage.removeItem("username");
  localStorage.removeItem("token");
  window.location.href = "index.html";
}

/* =========================
   🛡 CHECK AUTH
========================= */

function checkAuth() {
  const role = localStorage.getItem("role");
  if (!role) window.location.href = "index.html";
}

// Helper — always returns "Bearer <token>"
function authHeader() {
  const token = localStorage.getItem("token");
  return { "Authorization": "Bearer " + token };
}

/* =========================
   🎮 START QUIZ
========================= */

function startQuiz() {
  window.location.href = "quiz.html";
}

/* =========================
   ❓ QUIZ ENGINE
========================= */

let questions = [];
let current   = 0;
let score     = 0;
let startTime = null;

/* LOAD QUESTIONS */
async function loadQuestions() {
  try {
    const res = await fetch(API + "/questions");
    questions = await res.json();

    if (questions.length === 0) {
      document.getElementById("question").innerText = "No questions available";
      return;
    }

    current   = 0;
    score     = 0;
    startTime = Date.now();

    showQuestion();

  } catch (err) {
    console.log(err);
    alert("Failed to load questions");
  }
}

/* SHOW QUESTION */
function showQuestion() {
  const q = questions[current];

  document.getElementById("question").innerText = q.question;

  const optionsDiv  = document.getElementById("options");
  optionsDiv.innerHTML = "";

  q.options.forEach((opt, index) => {
    const btn     = document.createElement("button");
    btn.innerText = opt;
    btn.onclick   = () => checkAnswer(index);
    optionsDiv.appendChild(btn);
  });

  document.getElementById("progress").innerText =
    `Question ${current + 1} of ${questions.length}`;
}

/* CHECK ANSWER */
function checkAnswer(index) {
  if (index === questions[current].answer) score++;

  current++;

  if (current < questions.length) {
    showQuestion();
  } else {
    finishQuiz();
  }
}

/* FINISH QUIZ
   XP formula:
   - 10 XP per correct answer
   - bonus 20 XP for perfect score
   - bonus 10 XP if finished under 60 seconds
*/
async function finishQuiz() {
  const timeTaken = Math.round((Date.now() - startTime) / 1000); // seconds
  const baseXP    = score * 10;
  const perfectXP = score === questions.length ? 20 : 0;
  const speedXP   = timeTaken < 60 ? 10 : 0;
  const totalXP   = baseXP + perfectXP + speedXP;
  const pct       = Math.round((score / questions.length) * 100);

  try {
    const res = await fetch(API + "/submit-score", {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader()              // ✅ "Bearer <token>" — FIXED
      },
      body: JSON.stringify({ score: totalXP })  // ✅ send XP not raw count
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Score submit failed:", data.message);
    }

  } catch (err) {
    console.log("Score submit error:", err);
  }

  // Show result regardless of submit success
  const msg = [
    `✅ Quiz Complete!`,
    ``,
    `Score:    ${score} / ${questions.length} (${pct}%)`,
    `XP earned: +${totalXP}`,
    `Time:     ${timeTaken}s`,
    perfectXP ? `🌟 Perfect score bonus! +20 XP` : "",
    speedXP   ? `⚡ Speed bonus! +10 XP` : ""
  ].filter(Boolean).join("\n");

  alert(msg);
  window.location.href = "leaderboard.html";
}

/* =========================
   🏆 LEADERBOARD
========================= */

async function loadLeaderboard() {
  try {
    const res   = await fetch(API + "/leaderboard");
    const users = await res.json();

    const currentUser = localStorage.getItem("username");

    const top3 = document.getElementById("top3");
    const list = document.getElementById("list");

    if (top3) top3.innerHTML = "";
    if (list) list.innerHTML = "";

    if (!users.length) {
      if (list) list.innerHTML = "<p>No scores yet. Take a quiz!</p>";
      return;
    }

    const medals = ["🥇", "🥈", "🥉"];

    users.forEach((u, index) => {
      const isMe  = u.username === currentUser;
      const div   = document.createElement("div");
      div.classList.add("leaderboard-card");
      if (isMe) div.classList.add("leaderboard-me");

      div.innerHTML = `
        <h3>
          ${medals[index] || "#" + (index + 1)}
          ${u.username}
          ${isMe ? '<span style="color:#60a5fa;font-size:12px"> (You)</span>' : ""}
        </h3>
        <p>⚡ ${u.score || 0} XP</p>
      `;

      if (index < 3 && top3) {
        top3.appendChild(div);
      } else if (list) {
        list.appendChild(div);
      }
    });

  } catch (err) {
    console.log(err);
    alert("Leaderboard failed");
  }
}

/* =========================
   👨‍🏫 ADMIN — QUESTIONS
========================= */

async function loadAdminQuestions() {
  try {
    const res  = await fetch(API + "/questions", {
      headers: authHeader()
    });
    const data = await res.json();

    const listEl = document.getElementById("questionList");
    listEl.innerHTML = "";

    data.forEach((q) => {
      const div = document.createElement("div");
      div.classList.add("leaderboard-card");
      div.innerHTML = `
        <h3>${q.question}</h3>
        <p style="font-size:12px;color:#94a3b8">
          Subject: ${q.subject} · Difficulty: ${q.difficulty}
        </p>
        <button onclick="deleteQuestion('${q._id}')">❌ Delete</button>
      `;
      listEl.appendChild(div);
    });

  } catch (err) {
    console.log(err);
  }
}

async function addQuestion() {
  try {
    const question   = document.getElementById("question").value;
    const options    = [
      document.getElementById("opt1").value,
      document.getElementById("opt2").value,
      document.getElementById("opt3").value,
      document.getElementById("opt4").value
    ];
    const answer     = Number(document.getElementById("answer").value);
    const subject    = document.getElementById("subject").value;
    const difficulty = Number(document.getElementById("difficulty").value);

    const res  = await fetch(API + "/admin/questions", {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader()
      },
      body: JSON.stringify({ question, options, answer, subject, difficulty })
    });

    const data = await res.json();
    alert(data.message);
    loadAdminQuestions();

  } catch (err) {
    console.log(err);
    alert("Add failed");
  }
}

async function deleteQuestion(id) {
  try {
    await fetch(API + "/admin/questions/" + id, {
      method:  "DELETE",
      headers: authHeader()
    });
    loadAdminQuestions();

  } catch (err) {
    console.log(err);
    alert("Delete failed");
  }
}
