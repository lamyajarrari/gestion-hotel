import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Building2,
  CalendarDays,
  PlusCircle,
  LogOut,
  ArrowLeft,
} from "lucide-react";
import { obtenirChambres, creerReservation } from "../../api";
import { effacerToken, lireToken } from "../../auth/session";

const logo = "/images/logo.png";

function Reserver() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const chambrePreselectionnee = searchParams.get("chambre") || "";

  const [chambres, setChambres] = useState([]);
  const [chargementChambres, setChargementChambres] = useState(true);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");

  const [reservation, setReservation] = useState({
    chambre_id: chambrePreselectionnee,
    dateDebut: "",
    dateFin: "",
    nombrePersonnes: 1,
  });

  useEffect(() => {
    async function chargerChambres() {
      try {
        const data = await obtenirChambres();
        const liste = Array.isArray(data) ? data : data.results || [];
        setChambres(liste);
      } catch (error) {
        setErreur(error.message || "Impossible de charger les chambres.");
      } finally {
        setChargementChambres(false);
      }
    }

    chargerChambres();
  }, []);

  function modifier(e) {
    const { name, value } = e.target;
    setReservation((ancienne) => ({
      ...ancienne,
      [name]: value,
    }));
  }

  function obtenirIdClient() {
    const token = lireToken();
    if (!token) {
      throw new Error("Votre session a expiré. Veuillez vous reconnecter.");
    }
    const partie = token.split(".")[1];
    const base64 = partie.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    if (!payload.sub) {
      throw new Error("Compte client invalide.");
    }
    return String(payload.sub);
  }

  function deconnecter() {
    effacerToken();
    window.location.href = "http://localhost:3001";
  }

  async function envoyer(e) {
    e.preventDefault();
    setErreur("");

    if (!reservation.chambre_id) {
      setErreur("Veuillez sélectionner une chambre.");
      return;
    }

    if (reservation.dateFin <= reservation.dateDebut) {
      setErreur("La date de départ doit être postérieure à la date d'arrivée.");
      return;
    }

    try {
      setChargement(true);
      const donnees = {
        client_id: obtenirIdClient(),
        chambre_id: Number(reservation.chambre_id),
        dateDebut: reservation.dateDebut,
        dateFin: reservation.dateFin,
        nombrePersonnes: Number(reservation.nombrePersonnes),
      };

      await creerReservation(donnees);
      navigate("/client/reservations");
    } catch (error) {
      setErreur(error.message || "Erreur lors de la création de la réservation.");
    } finally {
      setChargement(false);
    }
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
            <Link to="/client/reservations" className="lien">
              <CalendarDays size={17} />
              <span>Mes réservations</span>
            </Link>
            <Link to="/reserver" className="lien actif">
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
              <h1>Nouvelle réservation</h1>
              <p>Sélectionnez votre chambre et les dates de votre séjour au Riad Souss.</p>
            </div>

            <Link to="/client/reservations" className="btn btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
              <ArrowLeft size={17} />
              <span>Mes réservations</span>
            </Link>
          </div>

          <div className="form-card">
            <form onSubmit={envoyer}>
              <div className="formulaire-grille">
                <label className="champ champ-pleine">
                  Choisir une chambre
                  <select
                    name="chambre_id"
                    value={reservation.chambre_id}
                    onChange={modifier}
                    required
                    disabled={chargementChambres}
                  >
                    <option value="">
                      {chargementChambres
                        ? "Chargement des chambres..."
                        : "Sélectionnez une chambre"}
                    </option>

                    {chambres.map((chambre) => (
                      <option key={chambre.id} value={chambre.numero}>
                        Chambre {chambre.numero} — {chambre.type} ({chambre.tarif} MAD / nuit · Capacité : {chambre.capacite})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="champ">
                  Date d'arrivée
                  <input
                    type="date"
                    name="dateDebut"
                    value={reservation.dateDebut}
                    onChange={modifier}
                    min={new Date().toISOString().split("T")[0]}
                    required
                  />
                </label>

                <label className="champ">
                  Date de départ
                  <input
                    type="date"
                    name="dateFin"
                    value={reservation.dateFin}
                    onChange={modifier}
                    min={reservation.dateDebut || new Date().toISOString().split("T")[0]}
                    required
                  />
                </label>

                <label className="champ champ-pleine">
                  Nombre de voyageurs
                  <input
                    type="number"
                    name="nombrePersonnes"
                    min="1"
                    value={reservation.nombrePersonnes}
                    onChange={modifier}
                    required
                  />
                </label>
              </div>

              {erreur && <div className="alerte" style={{ marginTop: "18px" }}>{erreur}</div>}

              <div className="formulaire-actions" style={{ marginTop: "24px" }}>
                <Link to="/client/reservations" className="btn btn-secondary">
                  Annuler
                </Link>
                <button
                  type="submit"
                  className="btn"
                  disabled={chargement || chargementChambres || chambres.length === 0}
                >
                  {chargement ? "Enregistrement..." : "Confirmer la réservation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}

export default Reserver;
