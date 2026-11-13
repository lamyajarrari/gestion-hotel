
import {
  CalendarDays,
  Clock,
  CheckCircle,
  Users,
  Plus
} from "lucide-react";

import Navbar from "../components/Navbar";

function Dashboard() {
  const stats = [
    { title: "Total réservations", value: "125", icon: CalendarDays },
    { title: "En attente", value: "18", icon: Clock },
    { title: "Confirmées", value: "92", icon: CheckCircle },
    { title: "Clients", value: "108", icon: Users },
  ];

  return (
    <>
      <Navbar />

      <div className="page-header">
        <h1>Tableau de bord</h1>
        <p>Vue générale de votre activité hôtelière.</p>
      </div>

      <div className="stats-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div className="stat-card" key={stat.title}>
              <h4>{stat.title}</h4>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>{stat.value}</strong>
                <Icon size={25} color="#d8b779" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="content-card">
        <h3>Bienvenue sur RiadManager</h3>
        <p style={{ color: "#8793a5", fontSize: "13px", lineHeight: 1.8 }}>
          Gérez facilement les réservations, les clients et les séjours
          de votre établissement depuis une seule interface.
        </p>
        <br />
        <button
          className="primary-btn"
          onClick={() => window.location.href = "/nouvelle-reservation"}
        >
          <Plus size={16} style={{ verticalAlign: "middle" }} />
          {" "}Nouvelle réservation
        </button>
      </div>
    </>
  );
}

export default Dashboard;
