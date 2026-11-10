import { useState } from "react";
import { Link } from "react-router-dom";
import { inscrire } from "../api/auth.js";

export default function Inscription() {
  const [champs, setChamps] = useState({ prenom: "", nom: "", email: "", mot_de_passe: "" });
  const [erreur, setErreur] = useState("");
  const [fait, setFait] = useState(false);

  function modifier(e) {
    setChamps({ ...champs, [e.target.name]: e.target.value });
  }

  async function soumettre(evenement) {
    evenement.preventDefault();
    setErreur("");
    try {
      await inscrire(champs);
      setFait(true);
    } catch (e) {
      setErreur(e.message);
    }
  }

  if (fait) {
    return (
      <p>
        Compte créé. <Link to="/connexion">Se connecter</Link>
      </p>
    );
  }

  return (
    <main>
      <h1>Créer un compte</h1>
      <form onSubmit={soumettre}>
        <label>Prénom<input name="prenom" value={champs.prenom} onChange={modifier} required /></label>
        <label>Nom<input name="nom" value={champs.nom} onChange={modifier} required /></label>
        <label>E-mail<input type="email" name="email" value={champs.email} onChange={modifier} required /></label>
        <label>Mot de passe (8 caractères minimum)<input type="password" name="mot_de_passe" value={champs.mot_de_passe} onChange={modifier} required /></label>
        {erreur && <p role="alert">{erreur}</p>}
        <button type="submit">Créer mon compte</button>
      </form>
      <p>
        Déjà inscrit ? <Link to="/connexion">Se connecter</Link>
      </p>
    </main>
  );
}