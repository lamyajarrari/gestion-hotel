import { Fragment, useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  activer,
  changerEtat,
  chambresAdmin,
  creerChambre,
  desactiver,
  modifierChambre,
} from "../api/chambres.js";
import { urlMedia } from "../api/client.js";
import { lireToken } from "../auth/session.js";
import FormulaireChambre from "../components/FormulaireChambre.jsx";
import Icone from "../components/Icone.jsx";
import Modal from "../components/Modal.jsx";
import PanneauIndisponibilites from "../components/PanneauIndisponibilites.jsx";
import { ETATS, TYPES } from "../constantes.js";

export default function Admin() {
  const token = lireToken();
  const [chambres, setChambres] = useState([]);
  const [filtreEtat, setFiltreEtat] = useState("");
  const [erreur, setErreur] = useState("");
  // null | { mode: "creer" } | { mode: "editer", chambre } | { mode: "indispo", chambre }
  const [modale, setModale] = useState(null);

  const charger = useCallback(() => {
    if (!token) return;
    chambresAdmin(token, filtreEtat)
      .then(setChambres)
      .catch((e) => setErreur(e.message));
  }, [token, filtreEtat]);

  useEffect(() => {
    charger();
  }, [charger]);

  if (!token) return <Navigate to="/connexion" replace />;

  async function executer(action) {
    setErreur("");
    try {
      await action();
      charger();
    } catch (e) {
      setErreur(e.message);
    }
  }

  async function enregistrer(donnees) {
    if (modale.mode === "creer") {
      await creerChambre(token, donnees);
    } else {
      await modifierChambre(token, modale.chambre.id, donnees);
    }
    setModale(null);
    charger();
  }

  const fermer = () => setModale(null);

  const titreModale =
    modale?.mode === "creer"
      ? "Nouvelle chambre"
      : modale?.mode === "editer"
      ? `Modifier la chambre ${modale.chambre.numero}`
      : modale?.mode === "indispo"
      ? `Indisponibilités · chambre ${modale.chambre.numero}`
      : "";

  return (
    <section className="section">
      <div className="conteneur">
        <div className="entete-admin">
          <div>
            <p className="etiquette">Administration</p>
            <h2>Gestion des chambres</h2>
          </div>
          <button className="btn btn-primaire" onClick={() => setModale({ mode: "creer" })}>
            + Nouvelle chambre
          </button>
        </div>

        <div className="filtres">
          <label className="champ">
            État
            <select value={filtreEtat} onChange={(e) => setFiltreEtat(e.target.value)}>
              <option value="">Tous les états</option>
              {Object.entries(ETATS).map(([valeur, libelle]) => (
                <option key={valeur} value={valeur}>{libelle}</option>
              ))}
            </select>
          </label>
        </div>

        {erreur && <p className="alerte">{erreur}</p>}

        <div className="tableau-wrap">
          <table>
            <thead>
              <tr>
                <th>Photo</th>
                <th>Numéro</th>
                <th>Type</th>
                <th>Capacité</th>
                <th>Tarif</th>
                <th>État</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {chambres.map((c) => (
                <Fragment key={c.id}>
                  <tr>
                    <td>
                      {c.image ? (
                        <img className="vignette" src={urlMedia(c.image)} alt="" />
                      ) : (
                        <span className="vignette vignette-vide">{c.numero}</span>
                      )}
                    </td>
                    <td>{c.numero}</td>
                    <td>{TYPES[c.type]}</td>
                    <td>{c.capacite}</td>
                    <td>{Number(c.tarif).toLocaleString("fr-MA")} MAD</td>
                    <td>
                      <span className={`badge badge-${c.etat}`}>{ETATS[c.etat]}</span>
                    </td>
                    <td>{c.actif ? "Active" : "Inactive"}</td>
                    <td>
                      <div className="actions">
                        <select
                          value={c.etat}
                          aria-label="Changer l'état"
                          onChange={(e) =>
                            executer(() => changerEtat(token, c.id, e.target.value))
                          }
                        >
                          {Object.entries(ETATS).map(([valeur, libelle]) => (
                            <option key={valeur} value={valeur}>{libelle}</option>
                          ))}
                        </select>

                        <button
                          className="btn-icone"
                          title="Modifier"
                          aria-label="Modifier"
                          onClick={() => setModale({ mode: "editer", chambre: c })}
                        >
                          <Icone nom="modifier" />
                        </button>

                        <button
                          className="btn-icone"
                          title="Indisponibilités"
                          aria-label="Indisponibilités"
                          onClick={() => setModale({ mode: "indispo", chambre: c })}
                        >
                          <Icone nom="indispo" />
                        </button>

                        <button
                          className={`btn-icone ${c.actif ? "btn-icone-danger" : "btn-icone-succes"}`}
                          title={c.actif ? "Désactiver" : "Activer"}
                          aria-label={c.actif ? "Désactiver" : "Activer"}
                          onClick={() =>
                            executer(() =>
                              c.actif ? desactiver(token, c.id) : activer(token, c.id)
                            )
                          }
                        >
                          <Icone nom={c.actif ? "desactiver" : "activer"} />
                        </button>
                      </div>
                    </td>
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modale && (
        <Modal titre={titreModale} onFermer={fermer}>
          {modale.mode === "indispo" ? (
            <PanneauIndisponibilites token={token} chambreId={modale.chambre.id} />
          ) : (
            <FormulaireChambre
              chambre={modale.mode === "editer" ? modale.chambre : null}
              onEnregistrer={enregistrer}
              onAnnuler={fermer}
            />
          )}
        </Modal>
      )}
    </section>
  );
}