export default function Sidebar({setPage}){

return(

<div className="sidebar">

<div className="logo">
LMS
</div>


<button onClick={()=>setPage("upload")}className="menu-btn">Upload Notes</button>
<button onClick={()=>setPage("ai")}className="menu-btn">AI Tutor</button>

</div>

)

}
