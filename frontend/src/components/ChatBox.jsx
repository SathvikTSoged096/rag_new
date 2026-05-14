import axios from "axios"
import { useState, useRef, useEffect } from "react"

export default function ChatBox() {

  // ✅ YOUR EXPRESS BACKEND URL
  const API = "https://rag-new-rz76.onrender.com"

  const [question, setQuestion] = useState("")
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)

  const bottomRef = useRef(null)

  // ✅ Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth"
    })
  }, [messages, loading])

  // ✅ Copy Message
  const copyMessage = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      alert("Copied!")
    } catch (err) {
      console.log(err)
    }
  }

  // ✅ Ask AI
  const askAI = async () => {

    if (!question.trim()) return

    const userQuestion = question.trim()

    // Add user message
    const userMsg = {
      role: "user",
      text: userQuestion
    }

    setMessages(prev => [...prev, userMsg])

    // Clear input
    setQuestion("")

    // Show loading
    setLoading(true)

    try {

      // ✅ Optional wake-up ping (Render cold start)
      await axios.get(API)

      // ✅ CALL EXPRESS BACKEND
      const res = await axios.post(
        `${API}/chat`,
        {
          question: userQuestion,
          user_id: 1
        },
        {
          timeout: 120000
        }
      )

      // Bot response
      const botMsg = {
        role: "bot",
        text: res.data.answer || "No response from AI"
      }

      setMessages(prev => [...prev, botMsg])

    } catch (err) {

      console.error("CHAT ERROR:", err)

      setMessages(prev => [
        ...prev,
        {
          role: "bot",
          text: "⚠️ AI service not reachable"
        }
      ])
    }

    setLoading(false)
  }

  return (

    <div className="chat-wrapper">

      {/* HEADER */}
      <div className="chat-header">
        LMS AI Assistant
      </div>

      {/* CHAT AREA */}
      <div className="chat-messages">

        {messages.map((m, i) => (

          <div
            key={i}
            className={`message ${m.role}`}
          >

            {/* MESSAGE TEXT */}
            <div className="message-text">
              {m.text}
            </div>

            {/* BOT ACTION BUTTONS */}
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
                  onClick={() => copyMessage(m.text)}
                >
                  📋
                </button>

              </div>
            )}

          </div>
        ))}

        {/* LOADING */}
        {loading && (
          <div className="message bot typing">
            AI is thinking<span className="dots"></span>
          </div>
        )}

        <div ref={bottomRef}></div>

      </div>

      {/* INPUT AREA */}
      <div className="chat-input-area">

        <input
          className="chat-input"
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && askAI()}
          placeholder="Ask anything..."
        />

        <button
          className="send-btn"
          onClick={askAI}
          disabled={loading}
        >
          {loading ? "..." : "Send"}
        </button>

      </div>

    </div>
  )
}
