import { urlMedia } from "../api/client.js";
import { EQUIPEMENTS, TYPES } from "../constantes.js";
import Icone from "./Icone.jsx";

export default function DetailChambre({ chambre }) {
  const image = urlMedia(chambre.image);

  return (
    <div className="detail">
      <div
        className="detail-visuel"
        style={image ? { backgroundImage: `url("${image}")` } : undefined}
      >
        {!image && <span>{chambre.numero}</span>}
      </div>

      <div className="detail-entete">
        <span className="carte-type">{TYPES[chambre.type]}</span>
        <span className="detail-tarif">
          {Number(chambre.tarif).toLocaleString("fr-MA")} MAD <small>/ nuit</small>
        </span>
      </div>

      <p className="detail-capacite">
        {chambre.capacite} {chambre.capacite > 1 ? "personnes" : "personne"}
      </p>

      {chambre.description && <p className="detail-description">{chambre.description}</p>}

      <h4>Équipements</h4>
      <ul className="detail-equipements">
        {EQUIPEMENTS.map((e) => (
          <li key={e.cle} className={chambre[e.cle] ? "" : "absent"}>
            <Icone nom={e.icone} />
            <span>{e.libelle}</span>
          </li>
        ))}
      </ul>

      <button className="btn btn-secondaire" disabled title="Bientôt disponible">
        Réserver
      </button>
    </div>
  );
}