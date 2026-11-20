
import { useEffect, useState } from "react";
import { obtenirReservations } from "../../api";
import { lireToken } from "../../auth/session";

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
            .map(c => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
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
          reservation => String(reservation.client_id) === idClient
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
      ANNULEE: "Annulée"
    };

    return statuts[statut] || statut;
  }

  if (chargement) {
    return <div className="mes-reservations"><p>Chargement des réservations...</p></div>;
  }

  return (
    <div className="mes-reservations">
      <h1>Mes réservations</h1>
      <p>Consultez l'historique de vos réservations.</p>

      {erreur && (
        <p style={{ color: "red" }}>{erreur}</p>
      )}

      {!erreur && reservations.length === 0 && (
        <div>
          <h3>Aucune réservation</h3>
          <p>Vous n'avez pas encore effectué de réservation.</p>
        </div>
      )}

      {reservations.length > 0 && (
        <div style={{ overflowX: "auto" }}>
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
              {reservations.map(reservation => (
                <tr key={reservation.id}>
                  <td>{reservation.id}</td>
                  <td>{reservation.chambre || "-"}</td>
                  <td>{formaterDate(reservation.arrivee)}</td>
                  <td>{formaterDate(reservation.depart)}</td>
                  <td>{reservation.personnes}</td>
                  <td>
                    {Number(reservation.montant || 0).toFixed(2)} DH
                  </td>
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
