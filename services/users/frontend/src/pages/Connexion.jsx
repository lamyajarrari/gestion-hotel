import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { connecter } from "../api/auth.js";

// Seules ces applications peuvent recevoir un jeton
const RETOURS_AUTORISES = ["http://localhost:3001"];

function retourAutorise(url) {
  try {
    return RETOURS_AUTORISES.includes(new URL(url).origin);
  } catch {
    return false;
  }
}

export default function Connexion() {
  const [params] = useSearchParams();
  const retour = params.get("retour");
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
    if (retour && retourAutorise(retour)) {
      const fragment = `jeton=${encodeURIComponent(jeton)}&role=${encodeURIComponent(role)}`;
      window.location.href = `${retour}#${fragment}`;
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
    <main>
      <h1>Connexion</h1>
      <form onSubmit={soumettre}>
        <label>
          E-mail
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Mot de passe
          <input type="password" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} required />
        </label>
        {erreur && <p role="alert">{erreur}</p>}
        <button type="submit" disabled={chargement}>
          {chargement ? "Connexion..." : "Se connecter"}
        </button>
      </form>
      <p>
        Pas encore de compte ? <Link to="/inscription">Créer un compte</Link>
      </p>
    </main>
  );
}