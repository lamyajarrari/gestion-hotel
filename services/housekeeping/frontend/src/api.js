// URL du service housekeeping (définie au build : VITE_API_URL)
const BASE = (import.meta.env.VITE_API_URL || "http://localhost:8003").replace(/\/$/, "");
const API = `${BASE}/api/housekeeping`;

const TOKEN_KEY = "hk_token";

// La session de ce service est DÉRIVÉE de la connexion faite dans users : on la garde dans
// sessionStorage (un seul onglet, effacée à sa fermeture) et jamais dans localStorage. Ainsi
// aucun jeton ne survit à la déconnexion et les rôles des différents services ne se mélangent pas.
export const getToken = () => {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
};
export const setToken = (t) => {
  try {
    t ? sessionStorage.setItem(TOKEN_KEY, t) : sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* stockage indisponible : le jeton reste valable pour la session en cours via l'état React */
  }
};

/** Adresse du front users (écran de connexion), vue depuis le navigateur. */
export const USERS_FRONT = (import.meta.env.VITE_USERS_URL || "http://localhost:3004").replace(/\/$/, "");

/** Retour de connexion : users redirige vers « #jeton=...&role=... ». On enregistre le jeton puis on nettoie l'URL. */
export function recupererJetonDansURL() {
  try {
    // « #jeton=... » (retour de users, portail) ou « ?token=... » (liens entre services)
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const requete = new URLSearchParams(window.location.search);
    const jeton = params.get("jeton") || requete.get("token");
    if (!jeton) return;
    setToken(jeton);
    window.history.replaceState(null, "", window.location.pathname);
  } catch {
    /* URL illisible : on retombe sur l'écran de connexion */
  }
}

/** Adresses des autres services (vues depuis le navigateur) et lien avec le jeton courant. */
const CHAMBRES_FRONT = (import.meta.env.VITE_CHAMBRES_URL || "http://localhost:3001").replace(/\/$/, "");
const RESERVATIONS_FRONT = (import.meta.env.VITE_RESERVATIONS_URL || "http://localhost:3002").replace(/\/$/, "");

export const CHAMBRES_ACCUEIL = CHAMBRES_FRONT;

/** Déconnexion : on passe par users (qui vide sa session) puis on arrive sur la première page
 *  de chambres, déconnecté (« ?deconnexion=1 » demande à chaque service de vider la sienne). */
export const URL_DECONNEXION = `${USERS_FRONT}/connexion?deconnexion=1`;

/** « Mon profil » et « Personnel » sont dans le service users : on lui transmet le jeton. */
export function lienUsers(page, role) {
  const t = encodeURIComponent(getToken());
  return `${USERS_FRONT}/${page}#jeton=${t}&role=${encodeURIComponent(role || "")}`;
}

export function lienChambres(role) {
  const t = encodeURIComponent(getToken());
  return `${CHAMBRES_FRONT}/connexion#jeton=${t}&role=${encodeURIComponent(role || "")}`;
}
export function lienReservations(role) {
  const t = encodeURIComponent(getToken());
  const page = role === "client" ? "/client/reservations" : "/admin/reservations";
  return `${RESERVATIONS_FRONT}${page}?token=${t}`;
}

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Transforme les réponses d'erreur DRF ({"detail": ...} ou {"champ": [...]}) en message lisible.
function messageFrom(status, data) {
  if (status === 401) return "Session expirée ou jeton invalide. Reconnectez-vous.";
  if (status === 403) return "Accès refusé pour ce profil.";
  if (status === 503) return "Un service dépendant (chambres ou users) est indisponible.";
  if (data && typeof data === "object") {
    if (data.detail) return String(data.detail);
    const parts = Object.entries(data).map(
      ([k, v]) => `${k} : ${Array.isArray(v) ? v.join(" ") : v}`
    );
    if (parts.length) return parts.join(" — ");
  }
  return `Erreur ${status}`;
}

async function request(method, path, { body, params, token } = {}) {
  const url = new URL(`${API}${path}`);
  Object.entries(params || {}).forEach(([k, v]) => v && url.searchParams.set(k, v));
  let res;
  try {
    res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token ?? getToken()}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, "Serveur housekeeping injoignable.");
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* réponse sans corps */
  }
  if (!res.ok) throw new ApiError(res.status, messageFrom(res.status, data));
  return data;
}

// Rôle lu dans le jeton (même vocabulaire que le service chambres : « admin », « client »).
export function currentRole(token = getToken()) {
  try {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const role = String(JSON.parse(atob(part)).role || "").toLowerCase();
    if (["admin", "administrateur", "gestionnaire"].includes(role)) return "admin";
    if (role === "client") return "client";
  } catch {
    /* jeton illisible */
  }
  return "autre";
}

export const listServices = (filters) => request("GET", "/services/", { params: filters });
export const listChambresANettoyer = () => request("GET", "/services/chambres-a-nettoyer/");
export const listAgents = () => request("GET", "/agents/");
export const assigner = (payload) => request("POST", "/services/", { body: payload });
export const modifier = (id, body) => request("PATCH", `/services/${id}/`, { body });
export const demarrer = (id) => request("POST", `/services/${id}/demarrer/`);
export const terminer = (id) => request("POST", `/services/${id}/terminer/`);
export const supprimer = (id) => request("DELETE", `/services/${id}/`);
export const listDemandes = (filters) => request("GET", "/demandes/", { params: filters });
export const verifierChambre = (numero) => request("GET", "/chambres/verifier/", { params: { numero } });
export const creerDemande = (payload) => request("POST", "/demandes/", { body: payload });
export const annulerDemande = (id) => request("POST", `/demandes/${id}/annuler/`);
export const traiterDemande = (id, payload) => request("POST", `/demandes/${id}/traiter/`, { body: payload });
// 401 = jeton invalide ; 403 = rôle non autorisé (ni gestionnaire ni client)
export const verifierToken = (token) =>
  request("GET", currentRole(token) === "client" ? "/demandes/" : "/services/", { token });