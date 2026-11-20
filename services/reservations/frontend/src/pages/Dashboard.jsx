
import {
  CalendarDays,
  Clock,
  CheckCircle,
  Users,
  Plus,
  BedDouble,
  ArrowRight
} from "lucide-react";

import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  const statistiques = [
    {
      titre: "Total réservations",
      valeur: 125,
      icon: CalendarDays,
      couleur: "#1E3557",
      fond: "#E8EFF8"
    },
    {
      titre: "En attente",
      valeur: 18,
      icon: Clock,
      couleur: "#D98545",
      fond: "#FFF0E2"
    },
    {
      titre: "Confirmées",
      valeur: 92,
      icon: CheckCircle,
      couleur: "#43845B",
      fond: "#E5F3E9"
    },
    {
      titre: "Clients",
      valeur: 108,
      icon: Users,
      couleur: "#80543C",
      fond: "#F5F0E8"
    }
  ];

  const fonctionnalites = [
    {
      titre: "Gestion des réservations",
      description: "Consultez et gérez toutes les réservations de votre hôtel.",
      icon: CalendarDays,
      route: "/admin/reservations",
      bouton: "Voir les réservations"
    },
    {
      titre: "Nouvelle réservation",
      description: "Créez une nouvelle réservation pour un client.",
      icon: Plus,
      route: "/admin/nouvelle-reservation",
      bouton: "Créer une réservation"
    },
    {
      titre: "Gestion des séjours",
      description: "Consultez les arrivées et les départs des clients.",
      icon: BedDouble,
      route: "/admin/sejours",
      bouton: "Voir les séjours"
    },
    {
      titre: "Gestion des clients",
      description: "Retrouvez les informations relatives aux clients.",
      icon: Users,
      route: "/admin/reservations",
      bouton: "Consulter les clients"
    }
  ];

  return (
    <main className="dashboard dashboard-complet">
      <div className="dashboard-contenu">

        <header className="dashboard-header">
          <div>
            <span className="etiquette">ESPACE ADMINISTRATEUR</span>
            <h1>Tableau de bord</h1>
            <p>Bienvenue dans votre espace de gestion Riad Sous.</p>
          </div>
        </header>

        <section className="stats-kpi">
          {statistiques.map((stat, index) => {
            const Icone = stat.icon;

            return (
              <article className="stats-kpi-carte" key={index}>
                <div className="stat-info">
                  <p>{stat.titre}</p>
                  <h3>{stat.valeur}</h3>
                </div>

                <div
                  className="stat-icone"
                  style={{
                    background: stat.fond,
                    color: stat.couleur
                  }}
                >
                  <Icone size={38} strokeWidth={2} />
                </div>
              </article>
            );
          })}
        </section>

        <section className="bienvenue-dashboard">
          <span className="etiquette">RIAD SOUS</span>
          <h2>Bienvenue sur votre espace de gestion</h2>
          <p>
            Gérez facilement les réservations, les clients et les séjours
            de votre établissement depuis une seule interface.
          </p>
        </section>

        <section className="dashboard-fonctionnalites">
          <div className="section-titre">
            <h2>Accès rapides</h2>
            <p>Choisissez une fonctionnalité pour continuer.</p>
          </div>

          <div className="dashboard-cartes">
            {fonctionnalites.map((item, index) => {
              const Icone = item.icon;

              return (
                <article className="dashboard-feature" key={index}>
                  <div className="feature-icon">
                    <Icone size={42} strokeWidth={1.8} />
                  </div>

                  <h3>{item.titre}</h3>
                  <p>{item.description}</p>

                  <button
                    className="btn btn-primaire"
                    onClick={() => navigate(item.route)}
                  >
                    {item.bouton}
                    <ArrowRight size={19} />
                  </button>
                </article>
              );
            })}
          </div>
        </section>

      </div>
    </main>
  );
}

export default Dashboard;
