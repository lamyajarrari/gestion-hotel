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
      <main className="carte-connexion">
        <p>Compte créé. <Link to="/connexion">Se connecter</Link></p>
      </main>
    );
  }

  return (
    <main className="carte-connexion">
      <p className="etiquette">Riad Souss</p>
      <h1>Créer un compte</h1>
      <form onSubmit={soumettre}>
        <label className="champ">Prénom<input name="prenom" value={champs.prenom} onChange={modifier} required /></label>
        <label className="champ">Nom<input name="nom" value={champs.nom} onChange={modifier} required /></label>
        <label className="champ">E-mail<input type="email" name="email" value={champs.email} onChange={modifier} required /></label>
        <label className="champ">Mot de passe (8 caractères minimum)<input type="password" name="mot_de_passe" value={champs.mot_de_passe} onChange={modifier} required /></label>
        {erreur && <p className="alerte" role="alert">{erreur}</p>}
        <button type="submit" className="btn btn-primaire">Créer mon compte</button>
      </form>
      <p className="texte-doux">
        Déjà inscrit ? <Link to="/connexion">Se connecter</Link>
      </p>
    </main>
  );
}