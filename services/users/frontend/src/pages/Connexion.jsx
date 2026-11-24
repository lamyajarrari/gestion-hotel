import { useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { connecter } from "../api/auth.js";

// Seules ces applications peuvent recevoir un jeton
const RETOURS_AUTORISES = [
  "http://localhost:3001", // chambres (Docker)
  "http://localhost:5173", // chambres (dev)
  "http://localhost:3002", // réservations (Docker)
  "http://localhost:5174", // réservations (dev)
  "http://localhost:3003", // housekeeping
  "http://localhost:3004", // ce service (profil, personnel)
  "http://localhost:5175", // ce service (dev)
];
// Destination par défaut après connexion : l'interface chambres
const RETOUR_PAR_DEFAUT = "http://localhost:3001";

function retourAutorise(url) {
  try {
    return RETOURS_AUTORISES.includes(new URL(url).origin);
  } catch {
    return false;
  }
}

export default function Connexion() {
  const [params] = useSearchParams();
  const location = useLocation();
  const retour = params.get("retour") || RETOUR_PAR_DEFAUT;
  const message = location.state?.message;
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");
  const [connecte, setConnecte] = useState(false);
  const [chargement, setChargement] = useState(false);

  async function soumettre(evenement) {
    evenement.preventDefault();
    setErreur("");
    setChargement(true);
    try {
      const { jeton, role } = await connecter(email, motDePasse);
      if (retourAutorise(retour)) {
        const fragment = `jeton=${encodeURIComponent(jeton)}&role=${encodeURIComponent(role)}`;
        window.location.replace(`${retour}#${fragment}`);
      } else {
        setConnecte(true);
      }
    } catch (e) {
      setErreur(
        e.message === "Failed to fetch"
          ? "Le service de comptes est injoignable."
          : e.message
      );
    } finally {
      setChargement(false);
    }
  }

  if (connecte) {
    return (
      <main className="carte-connexion">
        <p>Connexion réussie.</p>
      </main>
    );
  }

  return (
    <main className="carte-connexion">
      <p className="etiquette">Riad Souss</p>
      <h1>Connexion</h1>
      {message && <p className="texte-doux">{message}</p>}
      <form onSubmit={soumettre}>
        <label className="champ">
          E-mail
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="champ">
          Mot de passe
          <input type="password" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} required />
        </label>
        {erreur && <p className="alerte" role="alert">{erreur}</p>}
        <button type="submit" className="btn btn-primaire" disabled={chargement}>
          {chargement ? "Connexion..." : "Se connecter"}
        </button>
        <p className="texte-doux"><Link to="/mot-de-passe-oublie">Mot de passe oublié ?</Link></p>
      </form>
      <p className="texte-doux">
        Pas encore de compte ? <Link to={`/inscription${location.search}`}>Créer un compte</Link>
      </p>
    </main>
  );
}