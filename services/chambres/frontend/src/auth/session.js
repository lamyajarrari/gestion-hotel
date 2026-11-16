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

export function effacerToken() {
  try {
    localStorage.removeItem(CLE);
    localStorage.removeItem(CLE_ROLE);
  } catch {
    /* rien à effacer */
  }
}

export function enregistrerRole(role) {
  try {
    localStorage.setItem(CLE_ROLE, role);
  } catch {
    /* stockage indisponible */
  }
}

export function lireRole() {
  try {
    return localStorage.getItem(CLE_ROLE);
  } catch {
    return null;
  }
}