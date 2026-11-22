import { useEffect } from "react";
import { USERS_FRONT } from "../api.js";

// Pas de formulaire de connexion propre à ce service : on utilise celle de la première page
// (service users). Sans session, on y est renvoyé, puis ramené ici avec le jeton.
export default function Login() {
  useEffect(() => {
    window.location.replace(`${USERS_FRONT}/connexion?retour=${encodeURIComponent(window.location.origin)}`);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="flex items-center gap-3">
        <img src="/images/logo.png" alt="" className="h-10 w-auto" />
        <p className="font-serif text-lg font-bold text-navy">Redirection vers la connexion…</p>
      </div>
    </div>
  );
}