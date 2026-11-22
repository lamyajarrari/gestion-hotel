import { Navigate, useSearchParams } from "react-router-dom";
import { enregistrerRole, enregistrerToken, lireRole } from "../auth/session.js";

function extraireRoleDepuisJwt(token) {
  try {
    const partie = token.split(".")[1];
    const base64 = partie.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    return payload.role || null;
  } catch {
    return null;
  }
}

export default function RouteProtegee({ roles, children }) {
  const [searchParams] = useSearchParams();
  const tokenUrl = searchParams.get("token");

  let role = lireRole();

  if (tokenUrl) {
    const roleExtrait = extraireRoleDepuisJwt(tokenUrl);
    if (roleExtrait) {
      enregistrerToken(tokenUrl);
      enregistrerRole(roleExtrait);
      role = roleExtrait;
    }
  }

  if (!role) return <Navigate to="/connexion" replace />;
  if (!roles.includes(role)) return <Navigate to="/chambres" replace />;
  return children;
}
