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

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})


// multer for file uploads
const upload = multer({ dest: "uploads/" })


// Upload textbook
app.post("/upload", upload.single("file"), async (req,res)=>{

  try{

    const form = new FormData()
    

    form.append("file", fs.createReadStream(req.file.path))

    await axios.post(
      "http://127.0.0.1:8000/upload",
      form,
      { headers: form.getHeaders() }
    )

    // delete temporary file
    fs.unlinkSync(req.file.path)

    res.json({message:"Textbook uploaded successfully"})

  }catch(err){

    console.log(err)

    res.json({message:"Upload failed"})

  }

})

// Chat endpoint
app.post("/chat", async (req,res)=>{

  const { question, user_id } = req.body

  try{

    const rag = await axios.post("http://127.0.0.1:8000/ask",{
      question:question
    })

    const answer = rag.data.answer

    await pool.query(
      "INSERT INTO chats(user_id,question,answer) VALUES($1,$2,$3)",
      [user_id,question,answer]
    )

    res.json({answer})

  }catch(err){

    console.log(err)

    res.json({
      answer:"AI service not reachable"
    })

  }

})

// Start server
app.listen(5000,()=>{
  console.log("Backend running on port 5000")
})
