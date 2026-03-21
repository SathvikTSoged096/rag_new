const express = require("express")
const cors = require("cors")
const axios = require("axios")
const multer = require("multer")
const FormData = require("form-data")
const fs = require("fs")
const { Pool } = require("pg")

const app = express()

app.use(cors())
app.use(express.json())

// ===== ENV VARIABLES =====
const PORT = process.env.PORT || 5000
const AI_URL = process.env.AI_URL || "https://rag-new-ajd8.onrender.com/"

// ===== PostgreSQL =====
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

// ===== Ensure uploads folder exists =====
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads")
}

// ===== Multer =====
const upload = multer({ dest: "uploads/" })

// ===== Upload Route =====
app.post("/upload", upload.single("file"), async (req, res) => {

  try {

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" })
    }

    const form = new FormData()
    form.append("file", fs.createReadStream(req.file.path))

    await axios.post(
      `${AI_URL}/upload`,
      form,
      { headers: form.getHeaders() }
    )

    // delete temp file
    fs.unlinkSync(req.file.path)

    res.json({ message: "Textbook uploaded successfully" })

  } catch (err) {

    console.error(err.response?.data || err.message)

    res.status(500).json({
      message: "Upload failed"
    })
  }
})

// ===== Chat Route =====
app.post("/chat", async (req, res) => {

  const { question, user_id } = req.body

  if (!question) {
    return res.status(400).json({ answer: "Question is required" })
  }

  try {

    const rag = await axios.post(`${AI_URL}/ask`, {
      question
    })

    const answer = rag.data.answer

    // save to DB
    await pool.query(
      "INSERT INTO chats(user_id, question, answer) VALUES($1, $2, $3)",
      [user_id || 1, question, answer]
    )

    res.json({ answer })

  } catch (err) {

    console.error(err.response?.data || err.message)

    res.status(500).json({
      answer: "AI service not reachable"
    })
  }
})

// ===== Health Check (IMPORTANT for Render) =====
app.get("/", (req, res) => {
  res.send("Backend running 🚀")
})

// ===== Start Server =====
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`)
})
