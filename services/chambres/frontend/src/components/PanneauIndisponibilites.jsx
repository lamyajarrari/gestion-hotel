import { useCallback, useEffect, useState } from "react";
import {
  creerIndisponibilite,
  indisponibilitesChambre,
  supprimerIndisponibilite,
} from "../api/chambres.js";

const FORME_VIDE = { date_debut: "", date_fin: "", motif: "" };

export default function PanneauIndisponibilites({ token, chambreId }) {
  const [liste, setListe] = useState([]);
  const [forme, setForme] = useState(FORME_VIDE);
  const [erreur, setErreur] = useState("");

  const charger = useCallback(() => {
    indisponibilitesChambre(token, chambreId)
      .then(setListe)
      .catch((e) => setErreur(e.message));
  }, [token, chambreId]);

  useEffect(() => {
    charger();
  }, [charger]);

  async function ajouter(e) {
    e.preventDefault();
    setErreur("");
    try {
      await creerIndisponibilite(token, { chambre: chambreId, ...forme });
      setForme(FORME_VIDE);
      charger();
    } catch (err) {
      setErreur(err.message);
    }
  }

  async function supprimer(id) {
    setErreur("");
    try {
      await supprimerIndisponibilite(token, id);
      charger();
    } catch (err) {
      setErreur(err.message);
    }
  }

  return (
    <div className="panneau-contenu">
      <h3>Périodes d'indisponibilité</h3>

      {erreur && <p className="alerte">{erreur}</p>}

      {liste.length === 0 ? (
        <p className="texte-doux">Aucune période enregistrée.</p>
      ) : (
        <ul className="liste-indispo">
          {liste.map((i) => (
            <li key={i.id}>
              <span>
                {i.date_debut} → {i.date_fin}
                {i.motif && ` · ${i.motif}`}
              </span>
              <button className="btn btn-danger btn-petit" onClick={() => supprimer(i.id)}>
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      )}

      <form className="formulaire-ligne" onSubmit={ajouter}>
        <label className="champ">
          Du
          <input
            type="date"
            required
            value={forme.date_debut}
            onChange={(e) => setForme({ ...forme, date_debut: e.target.value })}
          />
        </label>
        <label className="champ">
          Au (jour de départ)
          <input
            type="date"
            required
            value={forme.date_fin}
            onChange={(e) => setForme({ ...forme, date_fin: e.target.value })}
          />
        </label>
        <label className="champ">
          Motif
          <input
            type="text"
            maxLength={255}
            placeholder="Peinture, réparation…"
            value={forme.motif}
            onChange={(e) => setForme({ ...forme, motif: e.target.value })}
          />
        </label>
        <button type="submit" className="btn btn-primaire btn-petit">
          Ajouter
        </button>
      </form>
    </div>
  );
}