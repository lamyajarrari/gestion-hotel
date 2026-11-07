import { useState } from "react";
import { urlMedia } from "../api/client.js";
import { EQUIPEMENTS, TYPES } from "../constantes.js";
import DetailChambre from "./DetailChambre.jsx";
import Modal from "./Modal.jsx";

export default function ChambreCard({ chambre }) {
  const [detail, setDetail] = useState(false);
  const image = urlMedia(chambre.image);
  const equipements = EQUIPEMENTS.filter((e) => chambre[e.cle]);

  return (
    <>
      <article className="carte-chambre carte-cliquable" onClick={() => setDetail(true)}>
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

          {chambre.description && (
            <p className="carte-description">{chambre.description}</p>
          )}

          {equipements.length > 0 && (
            <ul className="pastilles">
              {equipements.map((e) => (
                <li key={e.cle}>{e.libelle}</li>
              ))}
            </ul>
          )}

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

      {detail && (
        <Modal titre={`Chambre ${chambre.numero}`} onFermer={() => setDetail(false)}>
          <DetailChambre chambre={chambre} />
        </Modal>
      )}
    </>
  );
}