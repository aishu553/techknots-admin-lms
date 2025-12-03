import React from "react";
import { Bar, Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);

export default function Analytics(){
  const labels = ["Jan","Feb","Mar","Apr","May","Jun"];
  const growthData = { labels, datasets:[{ label:"Users", data:[30,60,90,150,200,260], borderColor:"#036F3E", backgroundColor:"rgba(3,111,62,0.08)", fill:true, tension:0.3 }]};
  const approvalsData = { labels, datasets:[{ label:"Approvals", data:[2,4,6,3,7,5], backgroundColor:"#036F3E" }]};

  const coursesPie = {
    labels: ["IOT","AI","Robotics","Embedded Systems","Data Science"],
    datasets: [
      {
        data: [120, 230, 95, 75, 180],
        backgroundColor: [
          "#036F3E",
          "#48BB78",
          "#81E6D9",
          "#63B3ED",
          "#A3E635",
        ],
        hoverOffset: 8,
      },
    ],
  };

  const lineOptions = { plugins:{ legend:{ display:false }}, maintainAspectRatio:false, scales:{ y:{ beginAtZero:true } } };
  const barOptions = { plugins:{ legend:{ display:false }}, maintainAspectRatio:false };
  const pieOptions = { plugins:{ legend:{ position: 'bottom' as const }}, maintainAspectRatio:false };

  return (
    <>
      <div className="page-title">Analytics</div>

      <div style={{display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:16}}>
        <div className="card">
          <div style={{fontWeight:700, marginBottom:8}}>Total Logins This Month</div>
          <div style={{fontSize:28, fontWeight:800}}>8,420</div>
          <div className="small-muted">+12% vs last month</div>
        </div>

        <div className="card">
          <div style={{fontWeight:700, marginBottom:8}}>New Registrations</div>
          <div style={{fontSize:28, fontWeight:800}}>420</div>
          <div className="small-muted">Conversion rate 4.2%</div>
        </div>

        <div className="card">
          <div style={{fontWeight:700, marginBottom:8}}>Mentor Conversions</div>
          <div style={{fontSize:28, fontWeight:800}}>54</div>
          <div className="small-muted">Pending approvals: 3</div>
        </div>
      </div>

      <div style={{display:"grid", gridTemplateColumns:"2fr 1fr", gap:16, marginTop:16}}>
        <div className="card">
          <div style={{fontWeight:700, marginBottom:8}}>User growth (last 6 months)</div>
          <div style={{height:240}}><Line data={growthData} options={lineOptions} /></div>
        </div>

        <div className="card">
          <div style={{fontWeight:700, marginBottom:8}}>Courses enrolled</div>
          <div style={{height:240}}><Pie data={coursesPie} options={pieOptions} /></div>
        </div>
      </div>

      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginTop:16}}>
        <div className="card">
          <div style={{fontWeight:700, marginBottom:8}}>Mentor approvals trend</div>
          <div style={{height:220}}><Bar data={approvalsData} options={barOptions} /></div>
        </div>

        <div className="card">
          <div style={{fontWeight:700, marginBottom:8}}>Top courses by enrollments</div>
          <ol style={{margin:0, paddingLeft:18}}>
            <li>IOT — 120 enrollments</li>
            <li>AI — 230 enrollments</li>
            <li>Data Science — 180 enrollments</li>
            <li>Robotics — 95 enrollments</li>
            <li>Embedded Systems — 75 enrollments</li>
          </ol>
        </div>
      </div>
    </>
  );
}