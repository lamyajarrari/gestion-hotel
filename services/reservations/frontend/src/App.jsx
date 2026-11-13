
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Reservations from "./pages/Reservations";
import NouvelleReservation from "./pages/NouvelleReservation";
import Sejours from "./pages/Sejours";
import Connexion from "./pages/Connexion";

import { lireToken } from "./auth/session.js";
import "./index.css";

function AdminProtege({ children }) {
  return lireToken() ? children : <Navigate to="/connexion" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/connexion" element={<Connexion />} />

        <Route
          path="/admin/*"
          element={
            <AdminProtege>
              <div className="app-layout">
                <Sidebar />
                <main className="main-content">
                  <Routes>
                    <Route index element={<Dashboard />} />
                    <Route path="reservations" element={<Reservations />} />
                    <Route
                      path="nouvelle-reservation"
                      element={<NouvelleReservation />}
                    />
                    <Route path="sejours" element={<Sejours />} />
                  </Routes>
                </main>
              </div>
            </AdminProtege>
          }
        />

        <Route path="/client" element={<h1>Espace client — bientôt disponible</h1>} />

        <Route path="/" element={<Navigate to="/connexion" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
