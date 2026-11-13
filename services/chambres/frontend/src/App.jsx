import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Pied from "./components/Pied.jsx";
import Accueil from "./pages/Accueil.jsx";
import Catalogue from "./pages/Catalogue.jsx";
import Connexion from "./pages/Connexion.jsx";
import Admin from "./pages/Admin.jsx";

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Accueil />} />
          <Route path="/chambres" element={<Catalogue />} />
          <Route path="/connexion" element={<Connexion />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<p className="vide">Page introuvable.</p>} />
        </Routes>
      </main>
      <Pied />
    </>
  );
}