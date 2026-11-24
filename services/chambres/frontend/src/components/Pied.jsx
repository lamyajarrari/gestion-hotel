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
          </ul>
        </div>

        <div className="pied-bloc">
          <h4>Contact</h4>
          <ul>
            <li>Quartier Talborjt, Agadir 80000, Maroc</li>
            <li>+212 5 28 00 00 00</li>
            <li>riadsouss@gmail.com</li>
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