
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet
} from "react-router-dom";

import Navbar from "./components/Navbar";

import Dashboard from "./pages/Dashboard";
import Reservations from "./pages/Reservations";
import NouvelleReservation from "./pages/NouvelleReservation";
import Sejours from "./pages/Sejours";
import Connexion from "./pages/Connexion";

import { lireToken } from "./auth/session.js";
import "./index.css";

// Protection de l'espace administrateur
function AdminProtege() {
  if (!lireToken()) {
    return <Navigate to="/connexion" replace />;
  }

  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Page de connexion */}
        <Route path="/connexion" element={<Connexion />} />

        {/* Espace administrateur : une seule Navbar */}
        <Route element={<AdminProtege />}>
          <Route path="/admin" element={<Dashboard />} />

          <Route
            path="/admin/reservations"
            element={<Reservations />}
          />

          <Route
            path="/admin/nouvelle-reservation"
            element={<NouvelleReservation />}
          />

          <Route
            path="/admin/sejours"
            element={<Sejours />}
          />
        </Route>

        {/* Redirection */}
        <Route
          path="/"
          element={<Navigate to="/connexion" replace />}
        />

        <Route
          path="*"
          element={<Navigate to="/connexion" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
