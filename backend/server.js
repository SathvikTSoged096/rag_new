const express = require("express")
const cors = require("cors")
const axios = require("axios")
const multer = require("multer")
const FormData = require("form-data")
const fs = require("fs")
const path = require("path")
const { Pool } = require("pg")

const app = express()

// ================= MIDDLEWARE =================
app.use(cors())
app.use(express.json())

// ================= ENV VARIABLES =================
const PORT = process.env.PORT || 5000

// AI SERVICE URL
const AI_URL = (
  process.env.AI_URL ||
  "https://rag-new-ajd8.onrender.com"
).replace(/\/$/, "")

// ================= DATABASE =================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

// ================= UPLOADS FOLDER =================
const uploadDir = path.join(__dirname, "uploads")

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir)
}

// Serve uploaded files
app.use("/uploads", express.static(uploadDir))

// ================= MULTER STORAGE =================
const storage = multer.diskStorage({
  destination: uploadDir,

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + file.originalname

    cb(null, uniqueName)
  }
})

const upload = multer({ storage })

// ================= HEALTH CHECK =================
app.get("/", (req, res) => {
  res.send("Backend running 🚀")
})

// ================= TEST AI ROUTE =================
app.get("/test-ai", async (req, res) => {

  try {

    const response = await axios.post(
      `${AI_URL}/ask`,
      {
        question: "what is voltage"
      },
      {
        timeout: 120000
      }
    )

    res.json(response.data)

  } catch (err) {

    console.error(
      "❌ TEST AI ERROR:",
      err.response?.data || err.message
    )

    res.status(500).json({
      error: err.message
    })
  }
})

// ================= UPLOAD ROUTE =================
app.post(
  "/upload",
  upload.single("file"),
  async (req, res) => {

    try {

      const subject_id = req.body.subject_id

      if (!req.file) {
        return res.status(400).json({
          message: "No file uploaded"
        })
      }

      console.log("📤 Sending file to AI...")

      const form = new FormData()

      form.append(
        "file",
        fs.createReadStream(req.file.path)
      )

      form.append("subject_id", subject_id)

      const response = await axios.post(
        `${AI_URL}/upload`,
        form,
        {
          headers: form.getHeaders(),
          timeout: 120000
        }
      )

      console.log(
        "✅ AI Upload Response:",
        response.data
      )

      res.json({
        message: "Textbook uploaded successfully",
        fileUrl: `/uploads/${req.file.filename}`
      })

    } catch (err) {

      console.error(
        "❌ UPLOAD ERROR:",
        err.response?.data || err.message
      )

      res.status(500).json({
        message: "Upload failed"
      })
    }
  }
)

// ================= CHAT ROUTE =================
app.post("/chat", async (req, res) => {

  try {

    const {
      question,
      user_id,
      subject_id
    } = req.body

    console.log("📩 Question:", question)

    // Validate question
    if (!question) {
      return res.status(400).json({
        answer: "Question is required"
      })
    }

    const q = question.toLowerCase().trim()

    // Greetings
    const greetings = [
      "hi",
      "hello",
      "hey",
      "good morning",
      "good afternoon",
      "good evening"
    ]

    // ================= GREETING RESPONSE =================
    if (greetings.includes(q)) {

      const staticReply =
        "👋 Hello! I'm your LMS AI Assistant. Ask me anything about your subjects!"

      // Save greeting chat
      await pool.query(
        `
        INSERT INTO chats(user_id, question, answer)
        VALUES($1,$2,$3)
        `,
        [
          user_id || 1,
          question,
          staticReply
        ]
      )

      return res.json({
        answer: staticReply
      })
    }

    // ================= WAKE AI SERVER =================
    await axios.get(AI_URL)

    console.log(
      "📤 Sending to AI:",
      `${AI_URL}/ask`
    )

    // ================= AI REQUEST =================
    const rag = await axios.post(
      `${AI_URL}/ask`,
      {
        question,
        subject_id
      },
      {
        timeout: 120000
      }
    )

    console.log(
      "✅ AI RESPONSE:",
      rag.data
    )

    const answer =
      rag.data.answer || "No response from AI"

    // ================= SAVE CHAT =================
    await pool.query(
      `
      INSERT INTO chats(user_id, question, answer)
      VALUES($1,$2,$3)
      `,
      [
        user_id || 1,
        question,
        answer
      ]
    )

    // ================= RETURN RESPONSE =================
    return res.json({ answer })

  } catch (err) {

    console.error(
      "❌ FULL CHAT ERROR:",
      err.response?.data || err.message
    )

    return res.status(500).json({
      answer: "AI service not reachable"
    })
  }
})

// ================= SUBJECTS ROUTE =================
app.get("/subjects", async (req, res) => {

  try {

    const result = await pool.query(
      `
      SELECT id, title
      FROM subjects
      ORDER BY id
      `
    )

    res.json(result.rows)

  } catch (err) {

    console.error(
      "❌ SUBJECT ERROR:",
      err.message
    )

    res.status(500).json({
      error: "Failed to fetch subjects"
    })
  }
})

// ================= START SERVER =================
app.listen(PORT, () => {
  console.log(
    `🚀 Backend running on port ${PORT}`
  )
})
