import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { obtenirReservations } from "../../api";
import { effacerToken, lireToken } from "../../auth/session";

function MesReservations() {
  const [reservations, setReservations] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  // Récupérer l'identifiant du client depuis le JWT
  function obtenirIdClient() {
    const token = lireToken();

    if (!token) return null;

    try {
      const partie = token.split(".")[1];
      const base64 = partie.replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(
        decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
            .join("")
        )
      );

      return String(payload.sub);
    } catch {
      return null;
    }
  }

  useEffect(() => {
    async function chargerReservations() {
      try {
        const idClient = obtenirIdClient();

        if (!idClient) {
          setErreur("Session invalide. Veuillez vous reconnecter.");
          return;
        }

        const data = await obtenirReservations();

        // Afficher uniquement les réservations du client connecté
        const mesReservations = data.filter(
          (reservation) => String(reservation.client_id) === idClient
        );

        setReservations(mesReservations);
      } catch (error) {
        setErreur(error.message || "Impossible de charger les réservations.");
      } finally {
        setChargement(false);
      }
    }

    chargerReservations();
  }, []);

  function deconnecter() {
    effacerToken();
    window.location.href = "http://localhost:3001";
  }

  function formaterDate(date) {
    if (!date) return "-";

    return new Date(date + "T00:00:00").toLocaleDateString("fr-FR");
  }

  function afficherStatut(statut) {
    const statuts = {
      EN_ATTENTE: "En attente",
      CONFIRMEE: "Confirmée",
      EN_COURS: "En cours",
      TERMINEE: "Terminée",
      ANNULEE: "Annulée",
    };

    return statuts[statut] || statut;
  }

  return (
    <div className="mes-reservations" style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          paddingBottom: "16px",
          borderBottom: "1px solid #e5ddd0",
        }}
      >
        <a
          href="http://localhost:3001"
          style={{ fontWeight: "bold", fontSize: "1.2rem", textDecoration: "none", color: "inherit" }}
        >
          Riad Souss
        </a>

        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <a href="http://localhost:3001/chambres" style={{ textDecoration: "none", color: "inherit" }}>
            Chambres
          </a>
          <Link to="/reserver" style={{ textDecoration: "none", fontWeight: "600", color: "#9c6644" }}>
            + Nouvelle réservation
          </Link>
          <button
            type="button"
            onClick={deconnecter}
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              border: "1px solid #c9b8a3",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            Déconnexion
          </button>
        </div>
      </div>

      <h1>Mes réservations</h1>
      <p>Consultez l'historique de vos réservations.</p>

      {chargement && <p>Chargement des réservations...</p>}

      {erreur && <p style={{ color: "red" }}>{erreur}</p>}

      {!chargement && !erreur && reservations.length === 0 && (
        <div style={{ marginTop: "24px" }}>
          <h3>Aucune réservation</h3>
          <p>Vous n'avez pas encore effectué de réservation.</p>
          <Link to="/reserver">Effectuer ma première réservation</Link>
        </div>
      )}

      {!chargement && reservations.length > 0 && (
        <div style={{ overflowX: "auto", marginTop: "20px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>Référence</th>
                <th>Chambre</th>
                <th>Arrivée</th>
                <th>Départ</th>
                <th>Personnes</th>
                <th>Montant</th>
                <th>Statut</th>
              </tr>
            </thead>

            <tbody>
              {reservations.map((reservation) => (
                <tr key={reservation.idReservation}>
                  <td>{String(reservation.idReservation).slice(0, 8).toUpperCase()}</td>
                  <td>Chambre {reservation.chambre_id}</td>
                  <td>{formaterDate(reservation.dateDebut)}</td>
                  <td>{formaterDate(reservation.dateFin)}</td>
                  <td>{reservation.nombrePersonnes}</td>
                  <td>{Number(reservation.montantTotal || 0).toFixed(2)} MAD</td>
                  <td>{afficherStatut(reservation.statut)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default MesReservations;
