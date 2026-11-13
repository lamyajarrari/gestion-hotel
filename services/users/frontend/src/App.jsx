import { Navigate, Route, Routes } from "react-router-dom";
import Connexion from "./pages/Connexion.jsx";
import Inscription from "./pages/Inscription.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/connexion" replace />} />
      <Route path="/connexion" element={<Connexion />} />
      <Route path="/inscription" element={<Inscription />} />
    </Routes>
  );
}