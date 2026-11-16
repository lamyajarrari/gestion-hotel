import { Navigate } from "react-router-dom";
import { lireRole } from "../auth/session.js";

export default function RouteProtegee({ roles, children }) {
  const role = lireRole();
  if (!role) return <Navigate to="/connexion" replace />;
  if (!roles.includes(role)) return <Navigate to="/chambres" replace />;
  return children;
}