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

// ✅ AI URL (safe cleanup)
const AI_URL = (process.env.AI_URL || "https://rag-new-ajd8.onrender.com").replace(/\/$/, "")

// ===== PostgreSQL =====
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})


// =====================================================
// ✅ CORRECT UPLOAD FOLDER (IMPORTANT FIX)
// =====================================================

// server.js is inside /src → go one level up
const uploadDir = path.join(__dirname, "../uploads")

// Create uploads folder if not exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// Serve uploads statically
app.use("/uploads", express.static(uploadDir))


// =====================================================
// ✅ MULTER CONFIG
// =====================================================
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname
    cb(null, uniqueName)
  }
})

const upload = multer({ storage })


// =====================================================
// ✅ FILE UPLOAD ROUTE
// =====================================================
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const subject_id = req.body.subject_id

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" })
    }

    console.log("📤 File saved locally:", req.file.path)

    // Send file to AI
    const form = new FormData()
    form.append("file", fs.createReadStream(req.file.path))
    form.append("subject_id", subject_id)

    const response = await axios.post(`${AI_URL}/upload`, form, {
      headers: form.getHeaders(),
      timeout: 120000
    })

    console.log("✅ AI response:", response.data)

    // ✅ RETURN FULL FILE URL (IMPORTANT)
    const fileUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`

    res.json({
      message: "Textbook uploaded successfully",
      fileUrl
    })

  } catch (err) {
    console.error("❌ UPLOAD ERROR:", err.response?.data || err.message)

    res.status(500).json({ message: "Upload failed" })
  }
})


// =====================================================
// ✅ CHAT ROUTE
// =====================================================
app.post("/chat", async (req, res) => {

  const { question, user_id, subject_id } = req.body

  if (!question) {
    return res.status(400).json({ answer: "Question is required" })
  }

  const q = question.toLowerCase().trim()

  const greetings = [
    "hi", "hello", "hey",
    "good morning", "good afternoon", "good evening"
  ]

  // Greeting handling
  if (greetings.includes(q)) {

    const staticReply = "👋 Hello! I'm your LMS AI Assistant. Ask me anything about your subjects!"

    await pool.query(
      "INSERT INTO chats(user_id, question, answer) VALUES($1,$2,$3)",
      [user_id || 1, question, staticReply]
    )

    return res.json({ answer: staticReply })
  }

  try {
    const rag = await axios.post(`${AI_URL}/ask`, {
      question,
      subject_id
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


// =====================================================
// ✅ SUBJECTS ROUTE
// =====================================================
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


// =====================================================
// ✅ HEALTH CHECK
// =====================================================
app.get("/", (req, res) => {
  res.send("Backend running 🚀")
})


// =====================================================
// ✅ START SERVER
// =====================================================
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`)
  console.log(`📂 Uploads served at: http://localhost:${PORT}/uploads`)
})
