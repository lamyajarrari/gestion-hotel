const CLE = "riad_token";

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
  } catch {
    /* rien à effacer */
  }
}