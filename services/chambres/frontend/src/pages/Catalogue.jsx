import { useEffect, useMemo, useState } from "react";
import { chambresPubliques } from "../api/chambres.js";
import ChambreCard from "../components/ChambreCard.jsx";
import { TYPES } from "../constantes.js";

export default function Catalogue() {
  const [chambres, setChambres] = useState(null);
  const [erreur, setErreur] = useState("");
  const [type, setType] = useState("");
  const [recherche, setRecherche] = useState("");

  useEffect(() => {
    chambresPubliques()
      .then(setChambres)
      .catch((e) => setErreur(e.message));
  }, []);

  const filtrees = useMemo(() => {
    if (!chambres) return [];
    const terme = recherche.trim().toLowerCase();
    return chambres.filter(
      (c) => (!type || c.type === type) && c.numero.toLowerCase().includes(terme)
    );
  }, [chambres, type, recherche]);

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
              onChange={(e) => setRecherche(e.target.value)}
            />
          </label>
          <label className="champ">
            Type
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">Tous les types</option>
              {Object.entries(TYPES).map(([valeur, libelle]) => (
                <option key={valeur} value={valeur}>{libelle}</option>
              ))}
            </select>
          </label>
        </div>

        {erreur && <p className="alerte">{erreur}</p>}
        {chambres === null && !erreur && <p className="vide">Chargement…</p>}
        {chambres && filtrees.length === 0 && (
          <p className="vide">Aucune chambre ne correspond à votre recherche.</p>
        )}

        <div className="grille-chambres">
          {filtrees.map((c) => (
            <ChambreCard key={c.id} chambre={c} />
          ))}
        </div>
      </div>
    </section>
  );
}