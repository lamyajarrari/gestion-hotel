import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  CalendarDays,
  PlusCircle,
  LogOut,
  BedDouble,
} from "lucide-react";
import { obtenirReservations } from "../../api";
import { effacerToken, lireToken } from "../../auth/session";

const logo = "/images/logo.png";

function MesReservations() {
  const [reservations, setReservations] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

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
    return new Date(date + "T00:00:00").toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function badgeStatut(statut) {
    const config = {
      EN_ATTENTE: { label: "En attente", classe: "badge badge-warning" },
      CONFIRMEE: { label: "Confirmée", classe: "badge badge-success" },
      EN_COURS: { label: "Séjour en cours", classe: "badge badge-info" },
      TERMINEE: { label: "Terminée", classe: "badge badge-success" },
      ANNULEE: { label: "Annulée", classe: "badge badge-danger" },
    };
    const item = config[statut] || { label: statut, classe: "badge badge-info" };
    return <span className={item.classe}>{item.label}</span>;
  }

  return (
    <>
      <nav className="nav">
        <div className="nav-interieur">
          <a href="http://localhost:3001" className="logo">
            <img src={logo} alt="Logo Riad Souss" className="logo-image" />
            <span>Riad Souss</span>
          </a>

          <div className="liens">
            <a href="http://localhost:3001/chambres" className="lien">
              <Building2 size={17} />
              <span>Chambres</span>
            </a>
            <Link to="/client/reservations" className="lien actif">
              <CalendarDays size={17} />
              <span>Mes réservations</span>
            </Link>
            <Link to="/reserver" className="lien">
              <PlusCircle size={17} />
              <span>Nouvelle réservation</span>
            </Link>
          </div>

          <div className="nav-actions">
            <button
              type="button"
              className="btn-deconnexion"
              onClick={deconnecter}
              style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
            >
              <LogOut size={16} />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="section">
        <div className="conteneur">
          <div className="entete-admin">
            <div>
              <span className="etiquette">ESPACE CLIENT</span>
              <h1>Mes réservations</h1>
              <p>Consultez l'historique et le statut de vos séjours au Riad Souss.</p>
            </div>

            <Link to="/reserver" className="primary-btn">
              <PlusCircle size={18} />
              <span>Réserver une chambre</span>
            </Link>
          </div>

          {chargement && (
            <div className="content-card">
              <p style={{ color: "var(--muted)" }}>Chargement de vos réservations...</p>
            </div>
          )}

          {erreur && <div className="alerte">{erreur}</div>}

          {!chargement && !erreur && reservations.length === 0 && (
            <div
              className="content-card"
              style={{
                textAlign: "center",
                padding: "56px 24px",
                maxWidth: "600px",
                margin: "30px auto",
              }}
            >
              <div
                className="feature-icon"
                style={{ margin: "0 auto 18px", width: "64px", height: "64px" }}
              >
                <BedDouble size={30} />
              </div>
              <h2 style={{ marginBottom: "10px" }}>Aucune réservation pour le moment</h2>
              <p style={{ color: "var(--muted)", marginBottom: "24px" }}>
                Découvrez nos chambres et suites d'exception à Agadir pour planifier votre prochain séjour.
              </p>
              <Link to="/reserver" className="primary-btn">
                <PlusCircle size={18} />
                <span>Effectuer ma première réservation</span>
              </Link>
            </div>
          )}

          {!chargement && reservations.length > 0 && (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Référence</th>
                    <th>Chambre</th>
                    <th>Arrivée</th>
                    <th>Départ</th>
                    <th>Voyageurs</th>
                    <th>Montant total</th>
                    <th>Statut</th>
                  </tr>
                </thead>

                <tbody>
                  {reservations.map((reservation) => (
                    <tr key={reservation.idReservation}>
                      <td>
                        <strong>
                          #{String(reservation.idReservation).slice(0, 8).toUpperCase()}
                        </strong>
                      </td>
                      <td>Chambre {reservation.chambre_id}</td>
                      <td>{formaterDate(reservation.dateDebut)}</td>
                      <td>{formaterDate(reservation.dateFin)}</td>
                      <td>
                        {reservation.nombrePersonnes}{" "}
                        {reservation.nombrePersonnes > 1 ? "personnes" : "personne"}
                      </td>
                      <td>
                        <strong>{Number(reservation.montantTotal || 0).toFixed(2)} MAD</strong>
                      </td>
                      <td>{badgeStatut(reservation.statut)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default MesReservations;
