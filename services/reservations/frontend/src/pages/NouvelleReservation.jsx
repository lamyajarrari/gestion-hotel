import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, ArrowLeft } from "lucide-react";
import { creerReservation } from "../api.js";

export default function NouvelleReservation() {
  const navigate = useNavigate();

  const [forme, setForme] = useState({
    client: "",
    chambre: "",
    arrivee: "",
    depart: "",
    personnes: 1,
  });

  const [erreur, setErreur] = useState("");
  const [enCours, setEnCours] = useState(false);

  const majChamp = (cle) => (e) => {
    setForme((f) => ({ ...f, [cle]: e.target.value }));
  };

  async function soumettre(e) {
    e.preventDefault();
    setErreur("");

    if (forme.depart <= forme.arrivee) {
      setErreur("La date de départ doit être après la date d'arrivée.");
      return;
    }

    setEnCours(true);

    try {
      await creerReservation({
        client_id: forme.client.trim(),
        chambre_id: Number(forme.chambre),
        dateDebut: forme.arrivee,
        dateFin: forme.depart,
        nombrePersonnes: Number(forme.personnes),
      });

      alert("Réservation enregistrée avec succès !");
      navigate("/admin/reservations");
    } catch (err) {
      setErreur(err.message);
      setEnCours(false);
    }
  }

  return (
    <main className="page nouvelle-reservation-page">

      <header className="page-header">
        <div>
          <span className="etiquette">GESTION HÔTELIÈRE</span>
          <h1>Nouvelle réservation</h1>
          <p>Créer une réservation pour un client.</p>
        </div>

        <button
          type="button"
          className="btn btn-secondaire"
          onClick={() => navigate("/admin/reservations")}
        >
          <ArrowLeft size={17} />
          Retour
        </button>
      </header>

      <section className="content-card form-card">
        <div className="form-heading">
          <CalendarDays size={25} />
          <div>
            <h3>Informations de réservation</h3>
            <p>Remplissez les informations nécessaires.</p>
          </div>
        </div>

        <form className="formulaire-grille" onSubmit={soumettre}>

          {erreur && (
            <p className="alerte champ-pleine">{erreur}</p>
          )}

          <label className="champ">
            Nom du client
            <input
              type="text"
              required
              placeholder="Nom complet du client"
              value={forme.client}
              onChange={majChamp("client")}
            />
          </label>

          <label className="champ">
            Numéro de chambre
            <input
              type="number"
              min="1"
              required
              placeholder="Exemple : 102"
              value={forme.chambre}
              onChange={majChamp("chambre")}
            />
          </label>

          <label className="champ">
            Date d'arrivée
            <input
              type="date"
              required
              value={forme.arrivee}
              onChange={majChamp("arrivee")}
            />
          </label>

          <label className="champ">
            Date de départ
            <input
              type="date"
              required
              min={forme.arrivee || undefined}
              value={forme.depart}
              onChange={majChamp("depart")}
            />
          </label>

          <label className="champ">
            Nombre de personnes
            <input
              type="number"
              min="1"
              required
              value={forme.personnes}
              onChange={majChamp("personnes")}
            />
          </label>

          <div className="formulaire-actions champ-pleine">
            <button
              type="button"
              className="btn btn-secondaire"
              onClick={() => navigate("/admin")}
            >
              Annuler
            </button>

            <button
              type="submit"
              className="btn btn-primaire"
              disabled={enCours}
            >
              {enCours ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>

        </form>
      </section>
    </main>
  );
}