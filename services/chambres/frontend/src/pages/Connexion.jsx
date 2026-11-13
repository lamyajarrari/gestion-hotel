import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { enregistrerToken } from "../auth/session.js";

const USERS_WEB = import.meta.env.VITE_USERS_WEB_URL || "http://localhost:3004";

export default function Connexion() {
  const navigate = useNavigate();

  useEffect(() => {
    const jeton = new URLSearchParams(window.location.hash.slice(1)).get("jeton");
    if (jeton) {
      enregistrerToken(jeton);
      window.history.replaceState(null, "", window.location.pathname);
      navigate("/admin", { replace: true });
    } else {
      const retour = `${window.location.origin}/connexion`;
      window.location.href = `${USERS_WEB}/connexion?retour=${encodeURIComponent(retour)}`;
    }
  }, [navigate]);

  return <p>Redirection vers la connexion...</p>;
}