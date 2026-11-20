
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { obtenirChambres, creerReservation } from "../../api";
import { lireToken } from "../../auth/session";

function Reserver() {
  const navigate = useNavigate();

  const [chambres, setChambres] = useState([]);
  const [chargementChambres, setChargementChambres] = useState(true);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");

  const [reservation, setReservation] = useState({
    chambre_id: "",
    dateDebut: "",
    dateFin: "",
    nombrePersonnes: 1
  });

  useEffect(() => {
    async function chargerChambres() {
      try {
        const data = await obtenirChambres();
        setChambres(data);
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
      [name]: value
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

    if (!payload.sub || payload.role !== "client") {
      throw new Error("Compte client invalide.");
    }

    return String(payload.sub);
  }

  async function envoyer(e) {
    e.preventDefault();
    setErreur("");

    if (!reservation.chambre_id) {
      setErreur("Veuillez sélectionner une chambre.");
      return;
    }

    if (reservation.dateFin <= reservation.dateDebut) {
      setErreur("La date de départ doit être après la date d'arrivée.");
      return;
    }

    try {
      setChargement(true);

      const donnees = {
        client_id: obtenirIdClient(),
        chambre_id: Number(reservation.chambre_id),
        dateDebut: reservation.dateDebut,
        dateFin: reservation.dateFin,
        nombrePersonnes: Number(reservation.nombrePersonnes)
      };

      const resultat = await creerReservation(donnees);

      alert(
        `Réservation créée avec succès !\nRéférence : ${resultat.idReservation}\nMontant : ${resultat.montantTotal} DH`
      );

      navigate("/client/reservations");

    } catch (error) {
      setErreur(error.message || "Erreur lors de la création de la réservation.");
    } finally {
      setChargement(false);
    }
  }

  return (
    <div className="client-page">
      <h1>Nouvelle réservation</h1>
      <p>Renseignez les informations de votre séjour.</p>

      {erreur && (
        <p style={{ color: "red", marginBottom: "15px" }}>
          {erreur}
        </p>
      )}

      <form onSubmit={envoyer}>
        <label>Choisir une chambre</label>

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
            <option key={chambre.id} value={chambre.id}>
              Chambre {chambre.numero} - {chambre.type}
              {" - "}
              {chambre.tarif} DH / nuit
              {" - "}
              Capacité : {chambre.capacite}
            </option>
          ))}
        </select>

        <label>Date d'arrivée</label>
        <input
          type="date"
          name="dateDebut"
          value={reservation.dateDebut}
          onChange={modifier}
          min={new Date().toISOString().split("T")[0]}
          required
        />

        <label>Date de départ</label>
        <input
          type="date"
          name="dateFin"
          value={reservation.dateFin}
          onChange={modifier}
          min={reservation.dateDebut || new Date().toISOString().split("T")[0]}
          required
        />

        <label>Nombre de personnes</label>
        <input
          type="number"
          name="nombrePersonnes"
          min="1"
          value={reservation.nombrePersonnes}
          onChange={modifier}
          required
        />

        <button
          type="submit"
          disabled={chargement || chargementChambres || chambres.length === 0}
        >
          {chargement ? "Enregistrement..." : "Réserver"}
        </button>
      </form>
    </div>
  );
}

export default Reserver;
