import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useSearchParams,
} from "react-router-dom";

import Navbar from "./components/Navbar";

import Dashboard from "./pages/Dashboard";
import Reservations from "./pages/Reservations";
import NouvelleReservation from "./pages/NouvelleReservation";
import Sejours from "./pages/Sejours";
import Connexion from "./pages/Connexion";
import Reserver from "./pages/client/Reserver";
import MesReservations from "./pages/client/MesReservations";

import { lireToken, enregistrerToken } from "./auth/session.js";
import "./index.css";

function extraireRole(token) {
  if (!token) return null;
  try {
    const partie = token.split(".")[1];
    const base64 = partie.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    return payload.role || null;
  } catch {
    return null;
  }
}

// Passerelle pour les pages Client (/reserver, /client/reservations)
function ClientProtege({ children }) {
  const [searchParams] = useSearchParams();
  const tokenUrl = searchParams.get("token");

  if (tokenUrl) {
    enregistrerToken(tokenUrl);
  }

  const tokenActif = tokenUrl || lireToken();
  if (!tokenActif) {
    return <Navigate to="/connexion" replace />;
  }

  return children;
}

// Protection stricte de l'espace Administrateur
function AdminProtege() {
  const [searchParams] = useSearchParams();
  const tokenUrl = searchParams.get("token");

  if (tokenUrl) {
    enregistrerToken(tokenUrl);
  }

  const tokenActif = tokenUrl || lireToken();
  if (!tokenActif) {
    return <Navigate to="/connexion" replace />;
  }

  // Empêche un client d'accéder au dashboard admin
  if (extraireRole(tokenActif) !== "admin") {
    return <Navigate to="/client/reservations" replace />;
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

        {/* Espace Client */}
        <Route
          path="/reserver"
          element={
            <ClientProtege>
              <Reserver />
            </ClientProtege>
          }
        />
        <Route
          path="/client/reservations"
          element={
            <ClientProtege>
              <MesReservations />
            </ClientProtege>
          }
        />

        {/* Espace Administrateur */}
        <Route element={<AdminProtege />}>
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/reservations" element={<Reservations />} />
          <Route path="/admin/nouvelle-reservation" element={<NouvelleReservation />} />
          <Route path="/admin/sejours" element={<Sejours />} />
        </Route>

        {/* Redirection par défaut */}
        <Route path="/" element={<Navigate to="/connexion" replace />} />
        <Route path="*" element={<Navigate to="/connexion" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
