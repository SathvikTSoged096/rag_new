import axios from "axios"
import { useState } from "react"

export default function UploadTextbook(){

  const API = import.meta.env.VITE_API_URL || "https://rag-new-rz76.onrender.com/"

  const [file,setFile] = useState(null)
  const [subject,setSubject] = useState("electronics")
  const [status,setStatus] = useState("")
  const [loading,setLoading] = useState(false)

  const uploadFile = async () => {

    if(!file){
      setStatus("Please select a file first")
      return
    }

    const formData = new FormData()
    formData.append("file", file)
    formData.append("subject", subject)

    try{
      setLoading(true)
      setStatus("Uploading...")

      // 🔥 wake backend
      await axios.get(API)

      const res = await axios.post(`${API}/upload`, formData)

      setStatus(res.data.message || "Upload successful")
      setFile(null)

    }catch(err){
      console.error(err)
      setStatus("Upload failed")
    }

    setLoading(false)
  }

  return(
    <div className="upload-section">

      <h3>Upload Textbook</h3>

      <div className="upload-controls">

        <select
          value={subject}
          onChange={(e)=>setSubject(e.target.value)}
        >
          <option value="electronics">Electronics</option>
          <option value="maths">Mathematics</option>
          <option value="data">Data Structures</option>
        </select>

        <input
          type="file"
          accept=".pdf"
          onChange={(e)=>setFile(e.target.files[0])}
        />

        <button
          className="upload-btn"
          onClick={uploadFile}
          disabled={loading}
        >
          {loading ? "Uploading..." : "Upload"}
        </button>

      </div>

      <p>{status}</p>

    </div>
  )
}
