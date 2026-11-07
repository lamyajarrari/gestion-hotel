import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { enregistrerToken } from "../auth/session.js";

export default function Connexion() {
  const navigate = useNavigate();
  const [jeton, setJeton] = useState("");

  function soumettre(e) {
    e.preventDefault();
    if (!jeton.trim()) return;
    enregistrerToken(jeton.trim());
    navigate("/admin");
  }

  return (
    <section className="carte-connexion">
      <p className="etiquette">Espace administration</p>
      <h1>Connexion</h1>
      <p className="texte-doux">
        Collez le jeton d'accès administrateur. Il sera remplacé par une connexion
        complète dès que le service utilisateurs sera en place.
      </p>
      <form onSubmit={soumettre}>
        <label className="champ">
          Jeton d'accès
          <textarea
            rows={4}
            placeholder="eyJhbGciOi…"
            value={jeton}
            onChange={(e) => setJeton(e.target.value)}
          />
        </label>
        <button type="submit" className="btn btn-primaire">Se connecter</button>
      </form>
    </section>
  );
}