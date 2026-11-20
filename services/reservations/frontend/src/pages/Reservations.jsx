import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Eye, CheckCircle, XCircle, Plus } from "lucide-react";
import {
  obtenirReservations,
  confirmerReservation,
  annulerReservation,
} from "../api.js";

function formaterDate(iso) {
  const [annee, mois, jour] = iso.split("-");
  return `${jour}/${mois}/${annee}`;
}

function versAffichage(r) {
  return {
    id: r.idReservation,
    client: r.client_id,
    chambre: `Chambre ${r.chambre_id}`,
    arrivee: formaterDate(r.dateDebut),
    depart: formaterDate(r.dateFin),
    personnes: r.nombrePersonnes,
    statut: r.statut,
  };
}

function Reservations() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [reservations, setReservations] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  function chargerReservations() {
    setChargement(true);
    setErreur("");
    obtenirReservations()
      .then((donnees) => setReservations(donnees.map(versAffichage)))
      .catch((e) => setErreur(e.message))
      .finally(() => setChargement(false));
  }

  useEffect(() => {
    chargerReservations();
  }, []);

  const filteredReservations = reservations.filter(
    (reservation) =>
      reservation.client.toLowerCase().includes(search.toLowerCase()) ||
      reservation.chambre.toLowerCase().includes(search.toLowerCase())
  );

  async function confirmer(id) {
    const confirmation = window.confirm(
      "Voulez-vous confirmer cette réservation ?"
    );
    if (!confirmation) return;

    try {
      await confirmerReservation(id);
      chargerReservations();
    } catch (e) {
      alert(e.message);
    }
  }

  async function annuler(id) {
    const confirmation = window.confirm(
      "Voulez-vous vraiment annuler cette réservation ?"
    );
    if (!confirmation) return;

    try {
      await annulerReservation(id);
      chargerReservations();
    } catch (e) {
      alert(e.message);
    }
  }

  function getStatusClass(statut) {
    if (statut === "CONFIRMEE") return "status-confirmed";
    if (statut === "EN_ATTENTE") return "status-pending";
    return "status-cancelled";
  }

  function getStatusLabel(statut) {
    if (statut === "CONFIRMEE") return "Confirmée";
    if (statut === "EN_ATTENTE") return "En attente";
    return "Annulée";
  }

  return (
    <main className="page reservations-page">
      <header className="page-header reservation-header">
        <div>
          <span className="etiquette">GESTION HÔTELIÈRE</span>
          <h1>Gestion des réservations</h1>
          <p>Consultez et gérez toutes les réservations de votre hôtel.</p>
        </div>

        <button
          className="primary-btn"
          onClick={() => navigate("/admin/nouvelle-reservation")}
        >
          <Plus size={17} />
          Nouvelle réservation
        </button>
      </header>

      {chargement && (
        <p className="texte-doux">Chargement des réservations...</p>
      )}
      {erreur && <p className="alerte">{erreur}</p>}

      <section className="reservation-summary">
        <div className="content-card">
          <span>Total des réservations</span>
          <strong>{reservations.length}</strong>
        </div>

        <div className="content-card">
          <span>Confirmées</span>
          <strong>
            {reservations.filter((r) => r.statut === "CONFIRMEE").length}
          </strong>
        </div>

        <div className="content-card">
          <span>En attente</span>
          <strong>
            {reservations.filter((r) => r.statut === "EN_ATTENTE").length}
          </strong>
        </div>

        <div className="content-card">
          <span>Annulées</span>
          <strong>
            {reservations.filter((r) => r.statut === "ANNULEE").length}
          </strong>
        </div>
      </section>

      <section className="content-card reservation-table-card">
        <div className="table-heading">
          <div>
            <h3>Liste des réservations</h3>
            <p>Retrouvez les informations de chaque réservation.</p>
          </div>

          <div className="search-box">
            <Search size={18} />

            <input
              type="text"
              placeholder="Rechercher un client ou une chambre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container">
          <table className="reservation-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Chambre</th>
                <th>Arrivée</th>
                <th>Départ</th>
                <th>Personnes</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredReservations.map((reservation) => (
                <tr key={reservation.id}>
                  <td className="client-name">{reservation.client}</td>
                  <td>{reservation.chambre}</td>
                  <td>{reservation.arrivee}</td>
                  <td>{reservation.depart}</td>
                  <td>{reservation.personnes}</td>

                  <td>
                    <span
                      className={`status-badge ${getStatusClass(
                        reservation.statut
                      )}`}
                    >
                      {getStatusLabel(reservation.statut)}
                    </span>
                  </td>

                  <td>
                    <div className="table-actions">
                      <button
                        className="action-btn view-btn"
                        title="Consulter"
                        onClick={() =>
                          alert(`Réservation de ${reservation.client}`)
                        }
                      >
                        <Eye size={17} />
                      </button>

                      <button
                        className="action-btn confirm-btn"
                        title="Confirmer"
                        style={{ color: "#16a34a", backgroundColor: "#dcfce7" }}
                        disabled={reservation.statut !== "EN_ATTENTE"}
                        onClick={() => confirmer(reservation.id)}
                      >
                        <CheckCircle size={17} />
                      </button>

                      <button
                        className="action-btn cancel-btn"
                        title="Annuler"
                        disabled={reservation.statut === "ANNULEE"}
                        onClick={() => annuler(reservation.id)}
                      >
                        <XCircle size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredReservations.length === 0 && !chargement && (
                <tr>
                  <td colSpan="7" className="empty-table">
                    Aucune réservation trouvée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export default Reservations;
