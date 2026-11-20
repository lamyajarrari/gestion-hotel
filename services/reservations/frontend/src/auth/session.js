const CLE = "riad_token";
const CLE_ROLE = "riad_role";

export function lireToken() {
  try {
    return localStorage.getItem(CLE);
  } catch {
    return null;
  }
}

export function enregistrerToken(jeton) {
  try {
    localStorage.setItem(CLE, jeton);
  } catch {
    /* stockage indisponible */
  }
}

export function enregistrerRole(role) {
  try {
    localStorage.setItem(CLE_ROLE, role);
  } catch {
    /* stockage indisponible */
  }
}

export function effacerToken() {
  try {
    localStorage.removeItem(CLE);
    localStorage.removeItem(CLE_ROLE);
  } catch {
    /* rien à effacer */
  }
}

// Lit le jeton renvoyé par users dans l'adresse (#jeton=...&role=...),
// l'enregistre, puis retire le jeton de l'adresse visible.
export function capturerJetonDepuisUrl() {
  const fragment = new URLSearchParams(window.location.hash.slice(1));
  const jeton = fragment.get("jeton");
  if (!jeton) return;

  enregistrerToken(jeton);
  enregistrerRole(fragment.get("role") || "client");
  window.history.replaceState(
    null,
    "",
    window.location.pathname + window.location.search
  );
}

export function lireRole() {
  try {
    return localStorage.getItem(CLE_ROLE);
  } catch {
    return null;
  }
}