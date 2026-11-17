import { useState } from "react";
import { Link } from "react-router-dom";
import { demanderReinitialisation } from "../api/auth.js";

export default function MotDePasseOublie() {
  const [email, setEmail] = useState("");
  const [envoye, setEnvoye] = useState(false);
  const [erreur, setErreur] = useState("");

  async function soumettre(e) {
    e.preventDefault();
    setErreur("");
    try {
      await demanderReinitialisation(email);
      setEnvoye(true);
    } catch (err) {
      setErreur(
        err.message === "Failed to fetch"
          ? "Le service de comptes est injoignable."
          : err.message
      );
    }
  }

  if (envoye) {
    return (
      <main className="carte-connexion">
        <p>Si ce compte existe, un e-mail de réinitialisation vient d'être envoyé.</p>
        <p className="texte-doux"><Link to="/connexion">Retour à la connexion</Link></p>
      </main>
    );
  }

  return (
    <main className="carte-connexion">
      <p className="etiquette">Riad Souss</p>
      <h1>Mot de passe oublié</h1>
      <form onSubmit={soumettre}>
        <label className="champ">
          E-mail
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        {erreur && <p className="alerte" role="alert">{erreur}</p>}
        <button type="submit" className="btn btn-primaire">Envoyer le lien</button>
      </form>
      <p className="texte-doux"><Link to="/connexion">Retour à la connexion</Link></p>
    </main>
  );
}