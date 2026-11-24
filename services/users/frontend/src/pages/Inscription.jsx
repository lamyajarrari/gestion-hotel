import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { inscrire, renvoyerCode, verifierCode } from "../api/auth.js";

const STYLE_LIEN = {
  background: "none",
  border: "none",
  textDecoration: "underline",
  cursor: "pointer",
  padding: 0,
  color: "inherit",
};

export default function Inscription() {
  const navigate = useNavigate();
  const location = useLocation();
  const [champs, setChamps] = useState({
    prenom: "",
    nom: "",
    email: "",
    mot_de_passe: "",
    confirmation_mot_de_passe: "",
  });
  const [etapeVerification, setEtapeVerification] = useState(false);
  const [code, setCode] = useState("");
  const [info, setInfo] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);

  function modifier(e) {
    setChamps({ ...champs, [e.target.name]: e.target.value });
  }

  async function soumettreInscription(evenement) {
    evenement.preventDefault();
    setErreur("");
    setInfo("");
    if (champs.mot_de_passe !== champs.confirmation_mot_de_passe) {
      setErreur("Les mots de passe ne correspondent pas.");
      return;
    }
    setChargement(true);
    try {
      const res = await inscrire(champs);
      setInfo(res.detail || "Un code à 6 chiffres a été envoyé à votre adresse e-mail.");
      setEtapeVerification(true);
    } catch (e) {
      setErreur(
        e.message === "Failed to fetch" ? "Le service de comptes est injoignable." : e.message
      );
    } finally {
      setChargement(false);
    }
  }

  async function soumettreVerification(evenement) {
    evenement.preventDefault();
    setErreur("");
    setChargement(true);
    try {
      await verifierCode(champs.email, code);
      navigate(`/connexion${location.search}`, {
        replace: true,
        state: { message: "Adresse e-mail vérifiée ! Vous pouvez maintenant vous connecter." },
      });
    } catch (e) {
      setErreur(
        e.message === "Failed to fetch" ? "Le service de comptes est injoignable." : e.message
      );
    } finally {
      setChargement(false);
    }
  }

  async function renvoyer() {
    setErreur("");
    setInfo("");
    setChargement(true);
    try {
      const res = await renvoyerCode(champs.email);
      setInfo(res.detail);
    } catch (e) {
      setErreur(e.message);
    } finally {
      setChargement(false);
    }
  }

  function aDejaUnCode() {
    setErreur("");
    setInfo("");
    if (!champs.email) {
      setErreur("Saisissez d’abord votre adresse e-mail.");
      return;
    }
    setEtapeVerification(true);
  }

  if (etapeVerification) {
    return (
      <main className="carte-connexion">
        <p className="etiquette">Riad Souss</p>
        <h1>Vérifiez votre e-mail</h1>
        <p className="texte-doux">
          Saisissez le code à 6 chiffres envoyé à <strong>{champs.email}</strong>.
        </p>

        <form onSubmit={soumettreVerification}>
          <label className="champ">
            Code de vérification
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="123456"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              required
              autoFocus
            />
          </label>

          {info && <p className="texte-doux" style={{ color: "#2d6a4f" }}>{info}</p>}
          {erreur && <p className="alerte" role="alert">{erreur}</p>}

          <button type="submit" className="btn btn-primaire" disabled={chargement || code.length !== 6}>
            {chargement ? "Vérification..." : "Valider mon compte"}
          </button>
        </form>

        <p className="texte-doux" style={{ marginTop: "14px" }}>
          Vous n’avez rien reçu ?{" "}
          <button type="button" onClick={renvoyer} disabled={chargement} style={STYLE_LIEN}>
            Renvoyer le code
          </button>
        </p>
        <p className="texte-doux">
          <button type="button" onClick={() => { setErreur(""); setInfo(""); setEtapeVerification(false); }} style={STYLE_LIEN}>
            Changer d’adresse e-mail
          </button>
        </p>
      </main>
    );
  }

  return (
    <main className="carte-connexion">
      <p className="etiquette">Riad Souss</p>
      <h1>Créer un compte</h1>
      <form onSubmit={soumettreInscription}>
        <label className="champ">Prénom<input name="prenom" value={champs.prenom} onChange={modifier} required /></label>
        <label className="champ">Nom<input name="nom" value={champs.nom} onChange={modifier} required /></label>
        <label className="champ">E-mail<input type="email" name="email" value={champs.email} onChange={modifier} required /></label>
        <label className="champ">Mot de passe<input type="password" name="mot_de_passe" value={champs.mot_de_passe} onChange={modifier} required /></label>
        <label className="champ">Confirmation<input type="password" name="confirmation_mot_de_passe" value={champs.confirmation_mot_de_passe} onChange={modifier} required /></label>
        <p className="texte-doux">8 caractères minimum, avec majuscule, minuscule, chiffre et caractère spécial.</p>
        {erreur && <p className="alerte" role="alert">{erreur}</p>}
        <button type="submit" className="btn btn-primaire" disabled={chargement}>
          {chargement ? "Envoi du code..." : "Créer mon compte"}
        </button>
      </form>
      <p className="texte-doux">
        Vous avez déjà un code ?{" "}
        <button type="button" onClick={aDejaUnCode} style={STYLE_LIEN}>Saisir mon code</button>
      </p>
      <p className="texte-doux">
        Déjà inscrit ? <Link to={`/connexion${location.search}`}>Se connecter</Link>
      </p>
    </main>
  );
}