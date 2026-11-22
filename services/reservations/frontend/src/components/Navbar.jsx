import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  PlusCircle,
  BedDouble,
  Building2,
  LogOut
} from "lucide-react";
const logo = "/images/logo.png";
import { effacerToken, lireToken } from "../auth/session.js";

export default function Navbar() {
  const navigate = useNavigate();

  const deconnexion = () => {
    effacerToken();
    navigate("/connexion");
  };

  const allerVersChambres = (e) => {
    e.preventDefault();
    const token = lireToken();
    const url = token
      ? `http://localhost:3001/admin?token=${encodeURIComponent(token)}`
      : "http://localhost:3001/admin";
    window.location.href = url;
  };

  const liens = [
    {
      to: "/admin",
      label: "Tableau de bord",
      icon: LayoutDashboard,
      end: true
    },
    {
      to: "/admin/reservations",
      label: "Réservations",
      icon: CalendarDays
    },
    {
      to: "/admin/nouvelle-reservation",
      label: "Nouvelle réservation",
      icon: PlusCircle
    },
    {
      to: "/admin/sejours",
      label: "Gestion des séjours",
      icon: BedDouble
    }
  ];

  return (
    <nav className="nav">
      <div className="nav-interieur">
        <NavLink to="/admin" className="logo">
          <img src={logo} alt="Logo Riad Sous" className="logo-image" />
          <span>Riad Sous</span>
        </NavLink>

        <div className="menu-principal">
          <span className="menu-titre">Menu principal</span>

          <div className="liens">
            {liens.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  isActive ? "lien actif" : "lien"
                }
              >
                <Icon size={18} />
                <span>{label}</span>
              </NavLink>
            ))}

            <a
              href="http://localhost:3001/admin"
              onClick={allerVersChambres}
              className="lien"
            >
              <Building2 size={18} />
              <span>Chambres</span>
            </a>
          </div>
        </div>

        <div className="nav-actions">
          <div className="nav-version">
            <strong>Microservice Réservations</strong>
            <span>Version 1.0</span>
          </div>

          <button
            type="button"
            className="btn-deconnexion"
            onClick={deconnexion}
          >
            <LogOut size={17} />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
