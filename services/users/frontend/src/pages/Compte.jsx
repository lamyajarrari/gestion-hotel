import { useEffect, useState } from "react";
import { LIBELLES_ROLE, modifierMonProfil, monProfil } from "../api/auth.js";

const MOTS_DE_PASSE_VIDES = { mot_de_passe_actuel: "", nouveau_mot_de_passe: "", confirmation_mot_de_passe: "" };

export default function Compte() {
  const [profil, setProfil] = useState(null);
  const [identite, setIdentite] = useState({ prenom: "", nom: "", telephone: "" });
  const [mdp, setMdp] = useState(MOTS_DE_PASSE_VIDES);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    monProfil().then((p) => {
      setProfil(p);
      setIdentite({ prenom: p.prenom, nom: p.nom, telephone: p.telephone || "" });
    }).catch((e) => setErreur(e.message));
  }, []);

  async function enregistrer(e) {
    e.preventDefault();
    setErreur("");
    try {
      const p = await modifierMonProfil(identite);
      setProfil(p);
      setMessage("Profil mis à jour.");
    } catch (err) { setErreur(err.message); }
  }

  async function changerMotDePasse(e) {
    e.preventDefault();
    setErreur("");
    if (mdp.nouveau_mot_de_passe !== mdp.confirmation_mot_de_passe) {
      setErreur("Les mots de passe ne correspondent pas.");
      return;
    }
    try {
      await modifierMonProfil(mdp);
      setMdp(MOTS_DE_PASSE_VIDES);
      setMessage("Mot de passe modifié.");
    } catch (err) { setErreur(err.message); }
  }

  if (!profil) return <main className="conteneur section"><p className={erreur ? "alerte" : "vide"}>{erreur || "Chargement…"}</p></main>;
  return (
    <main className="conteneur section page-compte">
      <div className="entete-admin"><div><p className="etiquette">Mon compte</p><h2>{profil.prenom} {profil.nom}</h2></div><span className="badge badge-role">{LIBELLES_ROLE[profil.role]}</span></div>
      {erreur && <p className="alerte">{erreur}</p>}{message && <p className="succes">{message}</p>}
      <div className="grille-compte">
        <form className="carte-formulaire" onSubmit={enregistrer}>
          <h3>Informations personnelles</h3>
          <label className="champ">E-mail<input value={profil.email} disabled /></label>
          <label className="champ">Prénom<input value={identite.prenom} onChange={(e) => setIdentite({ ...identite, prenom: e.target.value })} required /></label>
          <label className="champ">Nom<input value={identite.nom} onChange={(e) => setIdentite({ ...identite, nom: e.target.value })} required /></label>
          <label className="champ">Téléphone<input value={identite.telephone} onChange={(e) => setIdentite({ ...identite, telephone: e.target.value })} maxLength="20" /></label>
          <button className="btn btn-primaire">Enregistrer</button>
        </form>
        <form className="carte-formulaire" onSubmit={changerMotDePasse}>
          <h3>Changer le mot de passe</h3>
          <label className="champ">Mot de passe actuel<input type="password" value={mdp.mot_de_passe_actuel} onChange={(e) => setMdp({ ...mdp, mot_de_passe_actuel: e.target.value })} required /></label>
          <label className="champ">Nouveau mot de passe<input type="password" value={mdp.nouveau_mot_de_passe} onChange={(e) => setMdp({ ...mdp, nouveau_mot_de_passe: e.target.value })} required /></label>
          <label className="champ">Confirmation<input type="password" value={mdp.confirmation_mot_de_passe} onChange={(e) => setMdp({ ...mdp, confirmation_mot_de_passe: e.target.value })} required /></label>
          <button className="btn btn-secondaire">Changer le mot de passe</button>
        </form>
      </div>
    </main>
  );
}