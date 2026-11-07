import { Link } from "react-router-dom";

export default function Pied() {
  const annee = new Date().getFullYear();

  return (
    <footer className="pied">
      <div className="conteneur pied-grille">
        <div className="pied-bloc">
          <p className="pied-logo">
            <img src="/images/logo.png" alt="" className="pied-logo-img" />
            <span>Riad Souss</span>
          </p>
          <p className="pied-texte">
            Un séjour pensé avec soin, au cœur de la médina.
          </p>
        </div>

        <div className="pied-bloc">
          <h4>Explorer</h4>
          <ul>
            <li><Link to="/">Accueil</Link></li>
            <li><Link to="/chambres">Chambres</Link></li>
            <li><Link to="/connexion">Espace administration</Link></li>
          </ul>
        </div>

        <div className="pied-bloc">
          <h4>Contact</h4>
          <ul>
            <li>[Adresse du riad]</li>
            <li>[Numéro de téléphone]</li>
            <li>[Adresse e-mail]</li>
          </ul>
        </div>
      </div>

      <div className="conteneur pied-bas">
        <span>© {annee} Riad Souss</span>
        <span>Tous droits réservés</span>
      </div>
    </footer>
  );
}