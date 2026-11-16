import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { inscrire } from "../api/auth.js";

export default function Inscription() {
  const navigate = useNavigate();
  const location = useLocation();
  const [champs, setChamps] = useState({ prenom: "", nom: "", email: "", mot_de_passe: "" });
  const [erreur, setErreur] = useState("");

  function modifier(e) {
    setChamps({ ...champs, [e.target.name]: e.target.value });
  }

  async function soumettre(evenement) {
    evenement.preventDefault();
    setErreur("");
    try {
      await inscrire(champs);
      navigate(`/connexion${location.search}`, {
        state: { message: "Compte créé. Connectez-vous pour continuer." },
      });
    } catch (e) {
      setErreur(e.message);
    }
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
        Déjà inscrit ? <Link to={`/connexion${location.search}`}>Se connecter</Link>
      </p>
    </main>
  );
}