import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { reinitialiser } from "../api/auth.js";

export default function Reinitialiser() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");

  async function soumettre(e) {
    e.preventDefault();
    setErreur("");
    try {
      await reinitialiser(params.get("uid"), params.get("jeton"), motDePasse);
      navigate("/connexion", {
        state: { message: "Mot de passe modifié. Connectez-vous." },
      });
    } catch (err) {
      setErreur(
        err.message === "Failed to fetch"
          ? "Le service de comptes est injoignable."
          : err.message
      );
    }
  }

  return (
    <main className="carte-connexion">
      <p className="etiquette">Riad Souss</p>
      <h1>Nouveau mot de passe</h1>
      <form onSubmit={soumettre}>
        <label className="champ">
          Nouveau mot de passe (8 caractères minimum)
          <input type="password" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} required />
        </label>
        {erreur && <p className="alerte" role="alert">{erreur}</p>}
        <button type="submit" className="btn btn-primaire">Enregistrer</button>
      </form>
      <p className="texte-doux"><Link to="/connexion">Retour à la connexion</Link></p>
    </main>
  );
}