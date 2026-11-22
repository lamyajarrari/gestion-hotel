import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { urlMedia } from "../api/client.js";
import { lireToken } from "../auth/session.js";
import { EQUIPEMENTS, TYPES } from "../constantes.js";
import DetailChambre from "./DetailChambre.jsx";
import Modal from "./Modal.jsx";

export default function ChambreCard({ chambre }) {
  const [detail, setDetail] = useState(false);
  const navigate = useNavigate();
  const image = urlMedia(chambre.image);
  const equipements = EQUIPEMENTS.filter((e) => chambre[e.cle]);

  function handleReserver(e) {
    e.stopPropagation(); // Empêche l'ouverture de la modale DetailChambre
    const token = lireToken();

    if (!token) {
      navigate("/connexion");
      return;
    }

    // Redirige vers le microservice Réservations (port 3002) avec la chambre et le jeton
    const params = new URLSearchParams({
      chambre: chambre.numero,
      token,
    });
    window.location.href = `http://localhost:3002/reserver?${params.toString()}`;
  }

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
            <button
              type="button"
              className="btn btn-secondaire btn-petit"
              onClick={handleReserver}
            >
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