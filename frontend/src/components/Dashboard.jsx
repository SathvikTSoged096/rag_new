import StatCard from "./StatCard"

export default function Dashboard(){

return(

<div>

<div className="banner">

<h1>Welcome back, Administrator</h1>

</div>

<div className="stats-grid">

<StatCard title="Total Users" value="16" color="#6c63ff"/>
<StatCard title="Students" value="11" color="#00c896"/>
<StatCard title="Instructors" value="4" color="#ff9f43"/>
<StatCard title="Active Users" value="15" color="#ff4d94"/>

</div>

</div>

)

}