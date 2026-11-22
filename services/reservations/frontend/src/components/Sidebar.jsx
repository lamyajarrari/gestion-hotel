
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  PlusCircle,
  BedDouble,
  Hotel,
  LogOut,
} from "lucide-react";

import { effacerToken } from "../auth/session.js";

function Sidebar() {
  const navigate = useNavigate();

  const links = [
    { to: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
    { to: "/admin/reservations", label: "Réservations", icon: CalendarDays },
    {
      to: "/admin/nouvelle-reservation",
      label: "Nouvelle réservation",
      icon: PlusCircle,
    },
    { to: "/admin/sejours", label: "Gestion des séjours", icon: BedDouble },
  ];

  function deconnecter() {
    effacerToken();
    navigate("/connexion");
  }

  return (
    <aside className="sidebar">
      <div className="brand">
        <Hotel size={30} />
        <div>
          <h2>RiadManager</h2>
        </div>
      </div>

      <p className="menu-title">MENU PRINCIPAL</p>

      <nav>
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/admin"}
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <span>Microservice Réservations</span>
        <small>Version 1.0</small>

        <button
          type="button"
          className="nav-link"
          onClick={deconnecter}
          style={{ width: "100%", marginTop: "15px", cursor: "pointer" }}
        >
          <LogOut size={20} />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
