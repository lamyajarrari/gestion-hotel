import { useEffect } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { effacerToken, lireRole, lireToken } from "../auth/session.js";

// AJOUT housekeeping
const USERS_WEB = import.meta.env.VITE_USERS_WEB_URL || "http://localhost:3004";
const HOUSEKEEPING_WEB = import.meta.env.VITE_HOUSEKEEPING_URL || "http://localhost:3003";

export default function Navbar() {
  const navigate = useNavigate();
  const emplacement = useLocation(); // relit le token à chaque changement de page
  const token = lireToken();
  const connecte = Boolean(token);
  const estAdmin = connecte && lireRole() === "admin";

  // Sur la page d'accueil, on masque Chambres / Réservations / Housekeeping
  const surAccueil = emplacement.pathname === "/";

  // AJOUT déconnexion : un autre service nous renvoie ici avec « /?deconnexion=1 ».
  // On vide la session locale pour que la première page s'affiche bien déconnectée.
  useEffect(() => {
    if (new URLSearchParams(emplacement.search).get("deconnexion") !== "1") return;
    effacerToken();
    navigate(emplacement.pathname, { replace: true });
  }, [emplacement, navigate]);

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

  // AJOUT housekeeping : pas d'interface pour l'agent de ménage
  const role = lireRole();
  const aHousekeeping = role !== "agent_menage";
  const enc = encodeURIComponent;

  function allerVersHousekeeping(e) {
    e.preventDefault();
    if (!token) {
      // Pas connecté : connexion, puis retour direct sur l'interface Housekeeping du rôle.
      window.location.href = `${USERS_WEB}/connexion?retour=${enc(HOUSEKEEPING_WEB)}`;
      return;
    }
    window.location.href = `${HOUSEKEEPING_WEB}/#jeton=${enc(token)}&role=${enc(role || "")}`;
  }

  // AJOUT : « Mon profil » et « Personnel » sont dans le service users
  const lienUsers = (page) => `${USERS_WEB}/${page}#jeton=${enc(token || "")}&role=${enc(role || "")}`;

  return (
    <header className="nav">
      <div className="conteneur nav-interieur">
        <Link to="/" className="logo">
          <img src="/images/logo.png" alt="" className="logo-img" />
          <span>Riad Souss</span>
        </Link>
        <nav className="liens">
          {!surAccueil && (
            <>
              <NavLink to="/chambres" className="lien">Chambres</NavLink>
              <a
                href="http://localhost:3002"
                onClick={allerVersReservations}
                className="lien"
              >
                Réservations
              </a>
              {/* AJOUT housekeeping */}
              {aHousekeeping && (
                <a href={HOUSEKEEPING_WEB} onClick={allerVersHousekeeping} className="lien">
                  Housekeeping
                </a>
              )}
            </>
          )}
          {estAdmin && <NavLink to="/admin" className="lien">Administration</NavLink>}
          {/* AJOUT users */}
          {estAdmin && <a href={lienUsers("utilisateurs")} className="lien">Personnel</a>}
          {connecte && <a href={lienUsers("compte")} className="lien">Mon profil</a>}
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