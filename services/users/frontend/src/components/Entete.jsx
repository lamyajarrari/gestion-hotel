import { NavLink } from "react-router-dom";
import { deconnecter, roleStocke } from "../api/auth.js";
import { URL_CHAMBRES_ACCUEIL, URL_CHAMBRES_DECONNEXION, lienChambres, lienHousekeeping, lienReservations } from "../api/services.js";

// Barre commune des pages de ce service (profil, personnel).
// L'agent de ménage n'a d'interface que son profil.
export default function Entete() {
  const role = roleStocke();
  const aDesServices = role !== "agent_menage";
  // Déconnexion : on vide la session de ce service, puis la première page vide la sienne.
  const quitter = () => {
    deconnecter();
    window.location.replace(URL_CHAMBRES_DECONNEXION);
  };
  return (
    <header className="nav">
      <div className="conteneur nav-interieur">
        <a href={URL_CHAMBRES_ACCUEIL} className="logo">
          <img src="/images/logo.png" alt="" className="logo-img" />
          <span>Riad Souss</span>
        </a>
        <nav className="liens">
          {aDesServices && <a href={lienChambres()} className="lien">Chambres</a>}
          {aDesServices && <a href={lienReservations()} className="lien">Réservations</a>}
          {aDesServices && <a href={lienHousekeeping()} className="lien">Housekeeping</a>}
          {role === "admin" && <NavLink to="/utilisateurs" className="lien">Personnel</NavLink>}
          <NavLink to="/compte" className="lien">Mon profil</NavLink>
          <button type="button" className="btn btn-secondaire btn-petit" onClick={quitter}>Déconnexion</button>
        </nav>
      </div>
    </header>
  );
}