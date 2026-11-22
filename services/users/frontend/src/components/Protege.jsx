import { Navigate } from "react-router-dom";
import { jetonStocke, roleStocke } from "../api/auth.js";
import Entete from "./Entete.jsx";

// Pages réservées aux comptes connectés ; « admin » : réservé au rôle admin (gestion du personnel).
export default function Protege({ admin = false, children }) {
  if (!jetonStocke()) {
    // Après connexion, on revient exactement sur cette page.
    const retour = encodeURIComponent(window.location.origin + window.location.pathname);
    return <Navigate to={`/connexion?retour=${retour}`} replace />;
  }
  if (admin && roleStocke() !== "admin") return <Navigate to="/compte" replace />;
  return <><Entete />{children}</>;
}