import axios from "axios"
import { useState, useRef, useEffect } from "react"

export default function ChatBox(){

  const API = import.meta.env.VITE_API_URL || "https://rag-new-rz76.onrender.com/"

  const [question,setQuestion] = useState("")
  const [messages,setMessages] = useState([])
  const [loading,setLoading] = useState(false)

  const bottomRef = useRef(null)

  // auto scroll
  useEffect(()=>{
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  },[messages, loading])

  const askAI = async ()=>{

    if(!question.trim()) return

    const userMsg = {role:"user", text:question}

    setMessages(prev => [...prev, userMsg])
    setQuestion("")
    setLoading(true)

    try{

      // 🔥 Wake backend (Render fix)
      await axios.get(API)

      const res = await axios.post(`${API}/chat`, {
        question,
        user_id:1
      })

      setMessages(prev => [
        ...prev,
        {role:"bot", text:res.data.answer}
      ])

    }catch(err){

      console.error(err)

      setMessages(prev => [
        ...prev,
        {role:"bot", text:"⚠️ AI service not reachable"}
      ])
    }

    setLoading(false)
  }

  return(
    <div className="chat-wrapper">

      <div className="chat-header">
        LMS AI Assistant
      </div>

      <div className="chat-messages">

        {messages.map((m,i)=>(
          <div key={i} className={`message ${m.role}`}>
            {m.text}
          </div>
        ))}

        {loading && (
          <div className="message bot typing">
            AI is thinking<span className="dots"></span>
          </div>
        )}

        <div ref={bottomRef}></div>

      </div>

      <div className="chat-input-area">

        <input
          className="chat-input"
          value={question}
          onChange={(e)=>setQuestion(e.target.value)}
          onKeyDown={(e)=> e.key==="Enter" && askAI()}
          placeholder="Ask anything..."
        />

        <button className="send-btn" onClick={askAI}>
          Send
        </button>

      </div>

    </div>
  )
}
