import { useEffect } from "react";

const URL_COMPTES = "http://localhost:3004/connexion";

export default function Connexion() {
  useEffect(() => {
    const retour = encodeURIComponent("http://localhost:3001/connexion");
    window.location.href = `${URL_COMPTES}?retour=${retour}`;
  }, []);

  return null;
}
