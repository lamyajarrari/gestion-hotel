import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { effacerToken, lireToken } from "../auth/session.js";

export default function Navbar() {
  const navigate = useNavigate();
  useLocation(); // relit le token à chaque changement de page
  const connecte = Boolean(lireToken());

  function deconnecter() {
    effacerToken();
    navigate("/");
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
          {connecte && <NavLink to="/admin" className="lien">Administration</NavLink>}
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