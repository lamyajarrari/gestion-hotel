import { Navigate, Route, Routes } from "react-router-dom";
import Connexion from "./pages/Connexion.jsx";
import Inscription from "./pages/Inscription.jsx";
import MotDePasseOublie from "./pages/MotDePasseOublie.jsx";
import Reinitialiser from "./pages/Reinitialiser.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/connexion" replace />} />
      <Route path="/connexion" element={<Connexion />} />
      <Route path="/inscription" element={<Inscription />} />
      <Route path="/mot-de-passe-oublie" element={<MotDePasseOublie />} />
      <Route path="/reinitialiser" element={<Reinitialiser />} />
    </Routes>
  );
}