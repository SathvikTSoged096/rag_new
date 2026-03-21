import axios from "axios"
import { useState, useRef, useEffect } from "react"

export default function ChatBox(){

  const [question,setQuestion] = useState("")
  const [messages,setMessages] = useState([])
  const [loading,setLoading] = useState(false)

  const bottomRef = useRef(null)

  // auto scroll to latest message
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

      const res = await axios.post(
        "https://rag-new-hhdr.onrender.com/chat",
        {
          question,
          user_id:1
        }
      )

      const botMsg = {
        role:"bot",
        text:res.data.answer
      }

      setMessages(prev => [...prev, botMsg])

    }catch(err){

      console.error(err)

      setMessages(prev => [
        ...prev,
        {role:"bot", text:"AI service not reachable"}
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
          placeholder="Ask about electronics, math..."
          value={question}
          onChange={(e)=>setQuestion(e.target.value)}
          onKeyDown={(e)=> e.key==="Enter" && askAI()}
        />

        <button
          className="send-btn"
          onClick={askAI}
        >
          Send
        </button>

      </div>

    </div>
  )
}
