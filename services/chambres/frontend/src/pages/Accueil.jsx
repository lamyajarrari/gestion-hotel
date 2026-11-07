import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { chambresPubliques } from "../api/chambres.js";
import { lireToken } from "../auth/session.js";
import ChambreCard from "../components/ChambreCard.jsx";
import Revele from "../components/Revele.jsx";

const ATOUTS = [
  { titre: "Au cœur de la médina", texte: "Un emplacement idéal pour découvrir la ville à pied." },
  { titre: "Un confort raffiné", texte: "Des chambres pensées pour le repos, du sol au plafond." },
  { titre: "Un accueil attentionné", texte: "Une équipe disponible pour un séjour sans friction." },
  { titre: "Des tarifs clairs", texte: "Le prix affiché par nuit, sans frais cachés." },
];

export default function Accueil() {
  const [apercu, setApercu] = useState([]);
  const connecte = Boolean(lireToken());

  useEffect(() => {
    chambresPubliques()
      .then((donnees) => setApercu(donnees.slice(0, 3)))
      .catch(() => setApercu([]));
  }, []);

  return (
    <>
      <section className="hero">
        <div className="hero-fond" aria-hidden="true" />
        <div className="conteneur hero-contenu">
          <p className="etiquette anime-entree">Bienvenue au Riad</p>
          <h1 className="anime-entree delai-1">Un séjour pensé avec soin</h1>
          <span className="hero-trait anime-entree delai-2" aria-hidden="true" />
          <p className="anime-entree delai-2">
            Découvrez nos chambres et nos suites, et profitez d'un accueil à la
            hauteur de la maison.
          </p>
          <div className="hero-actions anime-entree delai-3">
            <Link to="/chambres" className="btn btn-primaire">Voir les chambres</Link>
            {connecte ? (
              <Link to="/admin" className="btn btn-secondaire">Espace administration</Link>
            ) : (
              <Link to="/connexion" className="btn btn-secondaire">Se connecter</Link>
            )}
          </div>
        </div>
      </section>

      <section className="citation-section">
        <div className="conteneur">
          <Revele>
            <blockquote>
              Entre patio ombragé et zelliges, chaque détail est pensé pour que
              votre séjour ressemble à une parenthèse.
            </blockquote>
          </Revele>
        </div>
      </section>

      <section className="section">
        <div className="conteneur atouts">
          {ATOUTS.map((a, i) => (
            <Revele key={a.titre} delai={i * 120}>
              <div className="atout">
                <span className="atout-icone" aria-hidden="true">✦</span>
                <h3>{a.titre}</h3>
                <p>{a.texte}</p>
              </div>
            </Revele>
          ))}
        </div>
      </section>

      <section className="section section-teinte">
        <div className="conteneur">
          <Revele>
            <div className="section-titre">
              <p className="etiquette">Nos chambres</p>
              <h2>Un aperçu de notre sélection</h2>
            </div>
          </Revele>

          {apercu.length > 0 ? (
            <div className="grille-chambres">
              {apercu.map((c, i) => (
                <Revele key={c.id} delai={i * 120}>
                  <ChambreCard chambre={c} />
                </Revele>
              ))}
            </div>
          ) : (
            <p className="vide">Nos chambres seront bientôt disponibles.</p>
          )}

          <Revele>
            <div className="centre">
              <Link to="/chambres" className="btn btn-secondaire">Toutes les chambres</Link>
            </div>
          </Revele>
        </div>
      </section>

      <section className="appel-wrap">
        <Revele>
          <div className="appel">
            <p className="etiquette">Votre séjour</p>
            <h2>Prêt à découvrir le riad ?</h2>
            <p>Parcourez nos chambres et trouvez celle qui vous ressemble.</p>
            <Link to="/chambres" className="btn btn-primaire">Découvrir les chambres</Link>
          </div>
        </Revele>
      </section>
    </>
  );
}