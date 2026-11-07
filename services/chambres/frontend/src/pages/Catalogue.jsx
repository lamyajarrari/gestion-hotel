import { useEffect, useState } from "react";
import { chambresPubliques } from "../api/chambres.js";
import ChambreCard from "../components/ChambreCard.jsx";
import Pagination from "../components/Pagination.jsx";
import { TYPES } from "../constantes.js";

export default function Catalogue() {
  const [donnees, setDonnees] = useState(null);
  const [erreur, setErreur] = useState("");
  const [type, setType] = useState("");
  const [recherche, setRecherche] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setErreur("");
    chambresPubliques({ page, type, q: recherche.trim() })
      .then(setDonnees)
      .catch((e) => setErreur(e.message));
  }, [page, type, recherche]);

  function changerType(valeur) {
    setType(valeur);
    setPage(1);
  }

  function changerRecherche(valeur) {
    setRecherche(valeur);
    setPage(1);
  }

  return (
    <section className="section">
      <div className="conteneur">
        <div className="section-titre">
          <p className="etiquette">Catalogue</p>
          <h2>Nos chambres et suites</h2>
        </div>

        <div className="filtres">
          <label className="champ">
            Recherche
            <input
              type="search"
              placeholder="Numéro de chambre"
              value={recherche}
              onChange={(e) => changerRecherche(e.target.value)}
            />
          </label>
          <label className="champ">
            Type
            <select value={type} onChange={(e) => changerType(e.target.value)}>
              <option value="">Tous les types</option>
              {Object.entries(TYPES).map(([valeur, libelle]) => (
                <option key={valeur} value={valeur}>{libelle}</option>
              ))}
            </select>
          </label>
        </div>

        {erreur && <p className="alerte">{erreur}</p>}
        {donnees === null && !erreur && <p className="vide">Chargement…</p>}

        {donnees && donnees.results.length === 0 && (
          <p className="vide">Aucune chambre ne correspond à votre recherche.</p>
        )}

        {donnees && donnees.results.length > 0 && (
          <>
            <div className="grille-chambres">
              {donnees.results.map((c) => (
                <ChambreCard key={c.id} chambre={c} />
              ))}
            </div>
            <Pagination
              page={page}
              hasPrev={Boolean(donnees.previous)}
              hasNext={Boolean(donnees.next)}
              onChange={setPage}
            />
          </>
        )}
      </div>
    </section>
  );
}