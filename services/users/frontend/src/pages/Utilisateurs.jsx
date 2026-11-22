import { useCallback, useEffect, useState } from "react";
import { LIBELLES_ROLE, creerPersonnel, listerUtilisateurs, modifierUtilisateur } from "../api/auth.js";

const VIDE = { prenom: "", nom: "", email: "", telephone: "", role: "agent_menage", mot_de_passe: "" };

export default function Utilisateurs() {
  const [liste, setListe] = useState([]);
  const [filtres, setFiltres] = useState({ q: "", role: "", statut: "" });
  const [form, setForm] = useState(null);
  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");
  const charger = useCallback(() => listerUtilisateurs(filtres).then((d) => setListe(d.results)).catch((e) => setErreur(e.message)), [filtres]);
 useEffect(() => { charger(); }, [charger]);
  const champ = (nom) => ({ value: form?.[nom] || "", onChange: (e) => setForm({ ...form, [nom]: e.target.value }) });

  async function enregistrer(e) {
    e.preventDefault();
    setErreur("");
    try {
      if (form.id) await modifierUtilisateur(form.id, { nom: form.nom, prenom: form.prenom, telephone: form.telephone, role: form.role, statut: form.statut });
      else await creerPersonnel(form);
      setForm(null); setMessage("Compte enregistré."); charger();
    } catch (err) { setErreur(err.message); }
  }
  async function basculer(u) {
    try { await modifierUtilisateur(u.id, { statut: u.statut === "actif" ? "inactif" : "actif" }); setMessage("Statut mis à jour."); charger(); }
    catch (err) { setErreur(err.message); }
  }
  return (
    <main className="conteneur section page-compte">
      <div className="entete-admin"><div><p className="etiquette">Administration</p><h2>Gestion des utilisateurs</h2></div><button className="btn btn-primaire" onClick={() => { setErreur(""); setMessage(""); setForm(VIDE); }}>+ Créer un membre du personnel</button></div>
      <div className="filtres">
        <label className="champ">Recherche<input placeholder="Nom ou e-mail" value={filtres.q} onChange={(e) => setFiltres({ ...filtres, q: e.target.value })} /></label>
        <label className="champ">Rôle<select value={filtres.role} onChange={(e) => setFiltres({ ...filtres, role: e.target.value })}><option value="">Tous</option>{Object.entries(LIBELLES_ROLE).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        <label className="champ">Statut<select value={filtres.statut} onChange={(e) => setFiltres({ ...filtres, statut: e.target.value })}><option value="">Tous</option><option value="actif">Actif</option><option value="inactif">Inactif</option></select></label>
      </div>
      {!form && erreur && <p className="alerte" role="alert">{erreur}</p>}{message && <p className="succes" role="status">{message}</p>}
      <div className="tableau-wrap"><table><thead><tr><th>Nom</th><th>E-mail</th><th>Rôle</th><th>Statut</th><th>Actions</th></tr></thead><tbody>{liste.map((u) => <tr key={u.id}><td>{u.prenom} {u.nom}</td><td>{u.email}</td><td>{LIBELLES_ROLE[u.role]}</td><td><span className={`badge ${u.statut === "actif" ? "badge-actif" : "badge-inactif"}`}>{u.statut}</span></td><td><div className="actions"><button className="btn btn-secondaire btn-petit" onClick={() => { setErreur(""); setMessage(""); setForm(u); }}>Modifier</button><button className="btn btn-petit btn-danger" onClick={() => basculer(u)}>{u.statut === "actif" ? "Désactiver" : "Réactiver"}</button></div></td></tr>)}</tbody></table>{!liste.length && <p className="vide">Aucun utilisateur.</p>}</div>
      {form && <div className="modal-fond"><form className="modal modal-corps formulaire-grille" onSubmit={enregistrer}><h2 className="champ-pleine">{form.id ? "Modifier le compte" : "Créer un membre du personnel"}</h2><label className="champ">Prénom<input {...champ("prenom")} required /></label><label className="champ">Nom<input {...champ("nom")} required /></label><label className="champ champ-pleine">E-mail<input type="email" {...champ("email")} disabled={Boolean(form.id)} required /></label><label className="champ">Téléphone<input {...champ("telephone")} /></label><label className="champ">Rôle<select {...champ("role")}>{Object.entries(LIBELLES_ROLE).filter(([v]) => form.id || ["agent_menage", "gestionnaire"].includes(v)).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>{form.id ? <label className="champ">Statut<select {...champ("statut")}><option value="actif">Actif</option><option value="inactif">Inactif</option></select></label> : <label className="champ champ-pleine">Mot de passe provisoire<input type="password" {...champ("mot_de_passe")} required /></label>}{erreur && <p className="alerte champ-pleine" role="alert">{erreur}</p>}<div className="formulaire-actions champ-pleine"><button type="button" className="btn btn-secondaire" onClick={() => setForm(null)}>Annuler</button><button className="btn btn-primaire">Enregistrer</button></div></form></div>}
    </main>
  );
}