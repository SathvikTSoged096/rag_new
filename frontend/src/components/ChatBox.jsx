import axios from "axios"
import { useState, useRef, useEffect } from "react"

export default function ChatBox(){

  const API = "https://rag-new-rz76.onrender.com"

  const [question,setQuestion] = useState("")
  const [messages,setMessages] = useState([])
  const [loading,setLoading] = useState(false)

  const bottomRef = useRef(null)

  useEffect(()=>{
    bottomRef.current?.scrollIntoView({
      behavior:"smooth"
    })
  },[messages,loading])

  const copyMessage = async(text)=>{
    try{
      await navigator.clipboard.writeText(text)
      alert("Copied!")
    }catch(err){
      console.log(err)
    }
  }

  const askAI = async ()=>{

    if(!question.trim()) return

    const userQuestion = question

    const userMsg = {
      role:"user",
      text:userQuestion
    }

    setMessages(prev => [...prev,userMsg])

    setQuestion("")
    setLoading(true)

    try{

      // wake backend
      await axios.get(API)

      const res = await axios.post(`${API}/ask`,{
        question:userQuestion,
        user_id:1
      })

      const botMsg = {
        role:"bot",
        text:res.data.answer
      }

      setMessages(prev => [...prev,botMsg])

    }catch(err){

      console.error(err)

      setMessages(prev => [
        ...prev,
        {
          role:"bot",
          text:"⚠️ AI service not reachable"
        }
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

          <div
            key={i}
            className={`message ${m.role}`}
          >

            <div className="message-text">
              {m.text}
            </div>

            {/* ACTION BUTTONS ONLY FOR BOT */}
            {m.role === "bot" && (

              <div className="message-actions">

                <button
                  className="action-btn"
                  title="Good Response"
                >
                  👍
                </button>

                <button
                  className="action-btn"
                  title="Bad Response"
                >
                  👎
                </button>

                <button
                  className="action-btn"
                  title="Copy"
                  onClick={()=>copyMessage(m.text)}
                >
                  📋
                </button>

              </div>
            )}

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
