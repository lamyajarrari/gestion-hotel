import { urlMedia } from "../api/client.js";
import { TYPES } from "../constantes.js";

export default function ChambreCard({ chambre }) {
  const image = urlMedia(chambre.image);

  return (
    <article className="carte-chambre">
      <div
        className={`carte-visuel visuel-${chambre.type} ${image ? "avec-image" : ""}`}
        style={image ? { backgroundImage: `url("${image}")` } : undefined}
      >
        <span className="carte-visuel-numero">{chambre.numero}</span>
      </div>
      <div className="carte-corps">
        <div className="carte-entete">
          <span className="carte-numero">Chambre {chambre.numero}</span>
          <span className="carte-type">{TYPES[chambre.type]}</span>
        </div>
        <p className="carte-detail">
          {chambre.capacite} {chambre.capacite > 1 ? "personnes" : "personne"}
        </p>
        <div className="carte-bas">
          <span className="carte-tarif">
            {Number(chambre.tarif).toLocaleString("fr-MA")} MAD <small>/ nuit</small>
          </span>
          <button className="btn btn-secondaire btn-petit" disabled title="Bientôt disponible">
            Réserver
          </button>
        </div>
      </div>
    </article>
  );
}