export default function Sidebar({setPage}){

return(

<div className="sidebar">

<div className="logo">
LMS
</div>

<button onClick={()=>setPage("dashboard")}className="menu-btn">Overview</button>
<button onClick={()=>setPage("users")}className="menu-btn">All Users</button>
<button onClick={()=>setPage("students")}className="menu-btn">Students</button>
<button onClick={()=>setPage("instructors")}className="menu-btn">Instructors</button>
<button onClick={()=>setPage("ranking")}className="menu-btn">Rankings</button>
<button onClick={()=>setPage("stats")}className="menu-btn">Statistics</button>
<button onClick={()=>setPage("logs")}className="menu-btn">Activity Logs</button>
<button onClick={()=>setPage("upload")}className="menu-btn">Upload Notes</button>
<button onClick={()=>setPage("ai")}className="menu-btn">AI Tutor</button>

</div>

)

}