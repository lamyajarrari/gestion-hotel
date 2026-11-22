import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { enregistrerRole, enregistrerToken } from "../auth/session.js";

const USERS_WEB = import.meta.env.VITE_USERS_WEB_URL || "http://localhost:3004";

export default function Connexion() {
  const navigate = useNavigate();

  useEffect(() => {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const jeton = fragment.get("jeton");
    const role = fragment.get("role");
    if (jeton) {
      enregistrerToken(jeton);
      enregistrerRole(role || "client");
      window.history.replaceState(null, "", window.location.pathname);
      navigate(role === "admin" ? "/admin" : "/chambres", { replace: true });
    } else {
      const retour = `${window.location.origin}/connexion`;
      window.location.replace(`${USERS_WEB}/connexion?retour=${encodeURIComponent(retour)}`);    }
  }, [navigate]);

  return <p>Redirection vers la connexion...</p>;
}