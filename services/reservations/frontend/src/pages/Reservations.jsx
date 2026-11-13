
import { useState } from "react";
import {
  Search,
  Eye,
  XCircle,
  CalendarDays,
  Plus
} from "lucide-react";

import Navbar from "../components/Navbar";

function Reservations() {
  const [search, setSearch] = useState("");

  const [reservations, setReservations] = useState([
    {
      id: 1,
      client: "Ahmed Benali",
      chambre: "Chambre 101",
      arrivee: "15/11/2026",
      depart: "18/11/2026",
      personnes: 2,
      statut: "CONFIRMEE",
    },
    {
      id: 2,
      client: "Sara Amrani",
      chambre: "Chambre 203",
      arrivee: "17/11/2026",
      depart: "20/11/2026",
      personnes: 1,
      statut: "EN_ATTENTE",
    },
    {
      id: 3,
      client: "Youssef Alaoui",
      chambre: "Chambre 105",
      arrivee: "19/11/2026",
      depart: "22/11/2026",
      personnes: 3,
      statut: "CONFIRMEE",
    },
    {
      id: 4,
      client: "Salma Idrissi",
      chambre: "Chambre 302",
      arrivee: "21/11/2026",
      depart: "24/11/2026",
      personnes: 2,
      statut: "ANNULEE",
    },
  ]);

  const filteredReservations = reservations.filter((reservation) =>
    reservation.client.toLowerCase().includes(search.toLowerCase()) ||
    reservation.chambre.toLowerCase().includes(search.toLowerCase())
  );

  function annulerReservation(id) {
    const confirmation = window.confirm(
      "Voulez-vous vraiment annuler cette réservation ?"
    );

    if (!confirmation) return;

    setReservations((previous) =>
      previous.map((reservation) =>
        reservation.id === id
          ? { ...reservation, statut: "ANNULEE" }
          : reservation
      )
    );
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
    <>
      <Navbar />

      <div className="page-header reservation-header">
        <div>
          <h1>Gestion des réservations</h1>
          <p>Consultez et gérez toutes les réservations de votre hôtel.</p>
        </div>

        <button
          className="primary-btn"
          onClick={() => window.location.href = "/nouvelle-reservation"}
        >
          <Plus size={17} />
          Nouvelle réservation
        </button>
      </div>

      <div className="reservation-summary">
        <div className="content-card">
          <span>Total des réservations</span>
          <strong>{reservations.length}</strong>
        </div>

        <div className="content-card">
          <span>Confirmées</span>
          <strong>
            {reservations.filter(r => r.statut === "CONFIRMEE").length}
          </strong>
        </div>

        <div className="content-card">
          <span>En attente</span>
          <strong>
            {reservations.filter(r => r.statut === "EN_ATTENTE").length}
          </strong>
        </div>

        <div className="content-card">
          <span>Annulées</span>
          <strong>
            {reservations.filter(r => r.statut === "ANNULEE").length}
          </strong>
        </div>
      </div>

      <div className="content-card reservation-table-card">
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
                    <span className={`status-badge ${getStatusClass(reservation.statut)}`}>
                      {getStatusLabel(reservation.statut)}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="action-btn view-btn"
                        title="Consulter"
                        onClick={() => alert(`Réservation de ${reservation.client}`)}
                      >
                        <Eye size={17} />
                      </button>

                      <button
                        className="action-btn cancel-btn"
                        title="Annuler"
                        disabled={reservation.statut === "ANNULEE"}
                        onClick={() => annulerReservation(reservation.id)}
                      >
                        <XCircle size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredReservations.length === 0 && (
                <tr>
                  <td colSpan="7" className="empty-table">
                    Aucune réservation trouvée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default Reservations;
