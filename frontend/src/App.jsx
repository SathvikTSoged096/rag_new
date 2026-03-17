import { useState, useRef, useEffect } from "react"
import "./App.css"
import ChatBox from "./components/ChatBox"
import Sidebar from "./components/Sidebar"
import UploadTextbook from "./components/UploadTextbook"
import "./styles/dashboard.css"

function App(){

  const [page,setPage] = useState("dashboard")
  

  return(

    <div className="layout">

      <Sidebar setPage={setPage}/>

      <div className="main">

        {/* DASHBOARD PAGE */}
        {page==="dashboard" && (

          <div className="dashboard-header">
  <h1>Learning Dashboard</h1>

            <div className="courses">

             <div className="course-card">
<h3>⚡ Electronics</h3>
<p>Circuit theory, Ohm's law</p>
</div>

<div className="course-card">
<h3>📐 Mathematics</h3>
<p>Algebra, calculus</p>
</div>

<div className="course-card">
<h3>💻 Data Structures</h3>
<p>Arrays, trees, algorithms</p>
</div>

            </div>

          </div>
        )}

        {/* UPLOAD NOTES PAGE */}
        {page==="upload" && <UploadTextbook/>}

        {/* AI TUTOR PAGE */}
        {page==="ai" && <ChatBox/>}

      </div>

    </div>

  )

}

export default App