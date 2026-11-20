
import { useState } from "react";

function Profil() {
  const [profil, setProfil] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: ""
  });

  function modifier(e) {
    setProfil({
      ...profil,
      [e.target.name]: e.target.value
    });
  }

  function enregistrer(e) {
    e.preventDefault();
    alert("Profil modifié localement. La sauvegarde serveur reste à connecter.");
  }

  return (
    <div className="client-page">
      <h1>Mon profil</h1>
      <p>Consultez et modifiez vos informations personnelles.</p>

      <form onSubmit={enregistrer}>
        <label>Nom</label>
        <input name="nom" value={profil.nom} onChange={modifier} />

        <label>Prénom</label>
        <input name="prenom" value={profil.prenom} onChange={modifier} />

        <label>E-mail</label>
        <input
          type="email"
          name="email"
          value={profil.email}
          onChange={modifier}
        />

        <label>Téléphone</label>
        <input name="telephone" value={profil.telephone} onChange={modifier} />

        <button type="submit">Enregistrer les modifications</button>
      </form>
    </div>
  );
}

export default Profil;
