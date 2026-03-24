const express = require("express")
const cors = require("cors")
const axios = require("axios")
const multer = require("multer")
const FormData = require("form-data")
const fs = require("fs")
const path = require("path")
const { Pool } = require("pg")

const app = express()

app.use(cors())
app.use(express.json())

// ===== ENV VARIABLES =====
const PORT = process.env.PORT || 5000

// ✅ SAFE fallback + remove trailing slash
const AI_URL = (process.env.AI_URL || "https://rag-new-ajd8.onrender.com").replace(/\/$/, "")

// ===== PostgreSQL =====
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

// ===== Ensure uploads folder exists =====
const uploadDir = path.join(__dirname, "uploads")

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir)
}

// ===== Multer =====
const upload = multer({ dest: uploadDir })

// ===== Upload Route =====
app.post("/upload", upload.single("file"), async (req, res) => {

  try {

    const subject_id = req.body.subject_id   // 🔥 ADD THIS

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" })
    }

    console.log("📤 Sending file to AI...")

    const form = new FormData()
    form.append("file", fs.createReadStream(req.file.path))

    // 🔥 PASS subject_id TO AI
    form.append("subject_id", subject_id)

    const response = await axios.post(
      `${AI_URL}/upload`,
      form,
      {
        headers: form.getHeaders(),
        timeout: 120000
      }
    )

    console.log("✅ AI response:", response.data)

    fs.unlink(req.file.path, () => {})

    res.json({ message: "Textbook uploaded successfully" })

  } catch (err) {

    console.error("❌ UPLOAD ERROR:", err.response?.data || err.message)

    res.status(500).json({ message: "Upload failed" })
  }
})
// ===== Chat Route =====
app.post("/chat", async (req, res) => {

  const { question, user_id, subject_id } = req.body

  if (!question) {
    return res.status(400).json({ answer: "Question is required" })
  }

  // 🔥 STEP 1: normalize text
  const q = question.toLowerCase().trim()

  // 🔥 STEP 2: greeting list
  const greetings = [
    "hi",
    "hello",
    "hey",
    "good morning",
    "good afternoon",
    "good evening"
  ]

  // 🔥 STEP 3: check greeting
  if (greetings.includes(q)) {

    const staticReply = "👋 Hello! I'm your LMS AI Assistant. Ask me anything about your subjects!"

    // optional: save to DB
    await pool.query(
      "INSERT INTO chats(user_id, question, answer) VALUES($1,$2,$3)",
      [user_id || 1, question, staticReply]
    )

    return res.json({ answer: staticReply })
  }

  // ===== NORMAL AI FLOW =====
  try {

    const rag = await axios.post(`${AI_URL}/ask`, {
  question,
  subject_id: subject_id   // 🔥 important
})


    const answer = rag.data.answer || "No response from AI"

    await pool.query(
      "INSERT INTO chats(user_id, question, answer) VALUES($1,$2,$3)",
      [user_id || 1, question, answer]
    )

    res.json({ answer })

  } catch (err) {

    console.error("❌ CHAT ERROR:", err.response?.data || err.message)

    res.status(500).json({
      answer: "AI service not reachable"
    })
  }
})
app.get("/subjects", async (req, res) => {
  try {

    const result = await pool.query(
      "SELECT id, title FROM subjects ORDER BY id"
    )

    res.json(result.rows)

  } catch (err) {

    console.error("❌ SUBJECT ERROR:", err.message)

    res.status(500).json({ error: "Failed to fetch subjects" })
  }
})
// ===== Health Check =====
app.get("/", (req, res) => {
  res.send("Backend running 🚀")
})

// ===== Start Server =====
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`)
})
