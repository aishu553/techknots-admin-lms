import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const sampleLabels = ["Jan","Feb","Mar","Apr","May","Jun","Jul"];
const sampleData = [50, 100, 120, 230, 210, 260, 370];

export default function Dashboard(){
  const data = {
    labels: sampleLabels,
    datasets: [{
      label: "Users",
      data: sampleData,
      fill: true,
      backgroundColor: "rgba(46,204,113,0.08)",
      borderColor: "#2ecc71",
      tension: 0.3,
      pointRadius: 3
    }]
  };

  return (
    <>
      <div className="page-title">Dashboard</div>

      <div className="grid">
        <div className="card">
          <div className="stat-value">1,280</div>
          <div className="stat-label">Total Users</div>
        </div>

        <div className="card">
          <div className="stat-value">320</div>
          <div className="stat-label">Total Mentors</div>
        </div>

        <div className="card">
          <div className="stat-value">18</div>
          <div className="stat-label">Pending Mentor Requests</div>
        </div>

        <div className="card">
          <div className="stat-value">960</div>
          <div className="stat-label">Total Students</div>
        </div>
      </div>

      <div style={{display:"grid", gridTemplateColumns:"2fr 1fr", gap:16}}>
        <div className="card" style={{minHeight:260}}>
          <div style={{fontWeight:700, marginBottom:8}}>User Growth</div>
          {/* fixed-height container prevents chart from expanding vertically */}
          <div style={{height:220}}>
            <Line
              data={data}
              options={{ maintainAspectRatio:false, plugins:{legend:{display:false}}}}
            />
          </div>
        </div>

        <div className="card">
          <div style={{fontWeight:700}}>Recent Activity</div>
          <div className="activity-list">
            <div className="activity-item"><div className="activity-bullet"/> New mentor request received</div>
            <div className="activity-item"><div className="activity-bullet"/> User registered</div>
            <div className="activity-item"><div className="activity-bullet"/> Mentor approved</div>
            <div className="activity-item"><div className="activity-bullet"/> Course published</div>
          </div>
        </div>
      </div>
    </>
  );
}