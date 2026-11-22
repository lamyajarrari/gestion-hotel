
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Wifi,
  Wind,
  Coffee,
  Sun,
  Users,
  ArrowLeft,
  BedDouble,
  RefreshCw
} from "lucide-react";

const API_CHAMBRES = "http://localhost:8001/api/chambres/";

function Chambres() {
  const [chambres, setChambres] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [typeFiltre, setTypeFiltre] = useState("tous");

  async function chargerChambres() {
    try {
      setChargement(true);
      setErreur("");

      const response = await fetch(API_CHAMBRES);

      if (!response.ok) {
        throw new Error("Impossible de récupérer les chambres.");
      }

      const data = await response.json();

      setChambres(data.results || []);
    } catch (error) {
      setErreur(error.message);
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    chargerChambres();
  }, []);

  const chambresFiltrees = chambres.filter((chambre) => {
    const bonType =
      typeFiltre === "tous" || chambre.type === typeFiltre;

    return bonType && chambre.actif;
  });

  function imageChambre(chambre) {
    if (!chambre.image) {
      return "https://placehold.co/600x400?text=Riad+Sous";
    }

    return chambre.image.startsWith("http")
      ? chambre.image
      : `http://localhost:8001${chambre.image}`;
  }

  return (
    <main className="catalogue-client">
      <div className="catalogue-header">
        <Link to="/client" className="retour-client">
          <ArrowLeft size={18} />
          Retour à mon espace
        </Link>

        <p className="catalogue-surtitre">RIAD SOUSS</p>
        <h1>Nos chambres</h1>
        <p>
          Découvrez nos chambres et choisissez celle qui vous convient.
        </p>
      </div>

      <div className="catalogue-filtres">
        <label htmlFor="filtre-type">Filtrer par type :</label>

        <select
          id="filtre-type"
          value={typeFiltre}
          onChange={(e) => setTypeFiltre(e.target.value)}
        >
          <option value="tous">Tous les types</option>
          <option value="simple">Simple</option>
          <option value="double">Double</option>
          <option value="suite">Suite</option>
        </select>
      </div>

      {chargement && (
        <p className="catalogue-message">
          Chargement des chambres...
        </p>
      )}

      {erreur && (
        <div className="catalogue-erreur">
          <p>{erreur}</p>
          <button onClick={chargerChambres}>
            <RefreshCw size={16} /> Réessayer
          </button>
        </div>
      )}

      {!chargement && !erreur && chambresFiltrees.length === 0 && (
        <p className="catalogue-message">
          Aucune chambre disponible dans cette catégorie.
        </p>
      )}

      <section className="catalogue-grille">
        {!chargement &&
          !erreur &&
          chambresFiltrees.map((chambre) => (
            <article className="chambre-carte" key={chambre.id}>
              <div className="chambre-image">
                <img
                  src={imageChambre(chambre)}
                  alt={`Chambre ${chambre.numero}`}
                />
                <span className="chambre-etat">
                  {chambre.etat === "disponible"
                    ? "Disponible"
                    : chambre.etat}
                </span>
              </div>

              <div className="chambre-contenu">
                <p className="chambre-type">
                  {chambre.type}
                </p>

                <h2>Chambre {chambre.numero}</h2>

                <p className="chambre-description">
                  {chambre.description || "Découvrez le confort de Riad Sous."}
                </p>

                <div className="chambre-capacite">
                  <Users size={17} />
                  {chambre.capacite} personne(s)
                </div>

                <div className="chambre-equipements">
                  {chambre.wifi && (
                    <span><Wifi size={17} /> Wi-Fi</span>
                  )}

                  {chambre.climatisation && (
                    <span><Wind size={17} /> Climatisation</span>
                  )}

                  {chambre.minibar && (
                    <span><Coffee size={17} /> Minibar</span>
                  )}

                  {chambre.balcon && (
                    <span><Sun size={17} /> Balcon</span>
                  )}
                </div>

                <div className="chambre-bas">
                  <div>
                    <strong>{chambre.tarif} DH</strong>
                    <small> / nuit</small>
                  </div>

                  <Link
                    to={`/client/reserver?chambre=${chambre.id}`}
                    className="bouton-reserver"
                    aria-disabled={chambre.etat !== "disponible"}
                    onClick={(e) => {
                      if (chambre.etat !== "disponible") {
                        e.preventDefault();
                      }
                    }}
                  >
                    {chambre.etat === "disponible"
                      ? "Réserver"
                      : "Indisponible"}
                  </Link>
                </div>
              </div>
            </article>
          ))}
      </section>
    </main>
  );
}

export default Chambres;
