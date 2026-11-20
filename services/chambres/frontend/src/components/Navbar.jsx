import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { effacerToken, lireRole, lireToken } from "../auth/session.js";

export default function Navbar() {
  const navigate = useNavigate();
  useLocation(); // relit le token à chaque changement de page
  const token = lireToken();
  const connecte = Boolean(token);
  const estAdmin = connecte && lireRole() === "admin";

  function deconnecter() {
    effacerToken();
    navigate("/");
  }

  function allerVersReservations(e) {
    e.preventDefault();
    if (!token) {
      navigate("/connexion");
      return;
    }

    const cible = estAdmin ? "/admin/reservations" : "/client/reservations";
    window.location.href = `http://localhost:3002${cible}?token=${encodeURIComponent(token)}`;
  }

  return (
    <header className="nav">
      <div className="conteneur nav-interieur">
        <Link to="/" className="logo">
          <img src="/images/logo.png" alt="" className="logo-img" />
          <span>Riad Souss</span>
        </Link>
        <nav className="liens">
          <NavLink to="/chambres" className="lien">Chambres</NavLink>
          <a
            href="http://localhost:3002"
            onClick={allerVersReservations}
            className="lien"
          >
            Réservations
          </a>
          {estAdmin && <NavLink to="/admin" className="lien">Administration</NavLink>}
          {connecte ? (
            <button className="btn btn-secondaire btn-petit" onClick={deconnecter}>
              Déconnexion
            </button>
          ) : (
            <Link to="/connexion" className="btn btn-primaire btn-petit">Se connecter</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
