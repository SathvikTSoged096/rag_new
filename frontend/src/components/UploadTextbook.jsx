
import axios from "axios"
import { useState } from "react"

export default function UploadTextbook(){

  const [file,setFile] = useState(null)
  const [subject,setSubject] = useState("electronics")
  const [status,setStatus] = useState("")

  const uploadFile = async () => {

    if(!file){
      setStatus("Please select a file first")
      return
    }

    const formData = new FormData()
    formData.append("file", file)
    formData.append("subject", subject)

    try{

      const res = await axios.post(
        "https://rag-new-ecjb.onrender.com/",
        formData,
        {
          headers:{
            "Content-Type":"multipart/form-data"
          }
        }
      )

      setStatus(res.data.message)

    }catch(err){

      console.error(err)
      setStatus("Upload failed")

    }

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
    >
      Upload
    </button>

  </div>

  <p>{status}</p>

</div>

)
}
