import axios from "axios"
import { useState, useEffect } from "react"

export default function UploadTextbook(){

  const API = "https://rag-new-rz76.onrender.com"

  const [file,setFile] = useState(null)
  const [subject,setSubject] = useState("")
  const [subjects,setSubjects] = useState([])
  const [status,setStatus] = useState("")
  const [loading,setLoading] = useState(false)

  // 🔥 FETCH SUBJECTS FROM DB
  useEffect(() => {

    axios.get(`${API}/subjects`)
      .then(res => {
        setSubjects(res.data)

        // auto-select first subject
        if(res.data.length > 0){
          setSubject(res.data[0].id)
        }
      })
      .catch(err => console.error("Subjects fetch error:", err))

  }, [])

  const uploadFile = async () => {

    if(!file){
      setStatus("Please select a file first")
      return
    }

    if(!subject){
      setStatus("Please select a subject")
      return
    }

    const formData = new FormData()
    formData.append("file", file)
    formData.append("subject_id", subject) // 🔥 IMPORTANT

    try{
      setLoading(true)
      setStatus("Uploading...")

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

        {/* 🔥 DYNAMIC SUBJECT DROPDOWN */}
        <select
          value={subject}
          onChange={(e)=>setSubject(e.target.value)}
        >
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
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
