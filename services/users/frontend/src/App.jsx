import { Navigate, Route, Routes } from "react-router-dom";
import { recupererSessionDansURL } from "./api/auth.js";
import { fermerSessionSiDemande } from "./api/services.js";
import Protege from "./components/Protege.jsx";
import Compte from "./pages/Compte.jsx";
import Connexion from "./pages/Connexion.jsx";
import Inscription from "./pages/Inscription.jsx";
import MotDePasseOublie from "./pages/MotDePasseOublie.jsx";
import Reinitialiser from "./pages/Reinitialiser.jsx";
import Utilisateurs from "./pages/Utilisateurs.jsx";

// Déconnexion demandée par un autre service : on vide la session ici, puis on part vers la première page.
fermerSessionSiDemande();
// Arrivée depuis une autre interface (« Mon profil », « Personnel ») : on ouvre la session avant d'afficher quoi que ce soit.
recupererSessionDansURL();

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/connexion" replace />} />
      <Route path="/connexion" element={<Connexion />} />
      <Route path="/inscription" element={<Inscription />} />
      <Route path="/mot-de-passe-oublie" element={<MotDePasseOublie />} />
      <Route path="/reinitialiser" element={<Reinitialiser />} />
      <Route path="/compte" element={<Protege><Compte /></Protege>} />
      <Route path="/utilisateurs" element={<Protege admin><Utilisateurs /></Protege>} />
    </Routes>
  );
}