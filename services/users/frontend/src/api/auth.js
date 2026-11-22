const BASE_URL = import.meta.env.VITE_USERS_API_URL || "http://localhost:8004";

async function appeler(chemin, corps) {
  const reponse = await fetch(`${BASE_URL}/api/auth/${chemin}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corps),
  });
  const donnees = await reponse.json().catch(() => ({}));
  if (!reponse.ok) {
    throw new Error(donnees.detail || "Une erreur est survenue.");
  }
  return donnees;
}

export const connecter = (email, mot_de_passe) =>
  appeler("connexion", { email, mot_de_passe });

export const inscrire = (donnees) => appeler("inscription", donnees);

export const verifierCode = (email, code) =>
  appeler("verifier-code", { email, code });

export const renvoyerCode = (email) =>
  appeler("renvoyer-code", { email });

export const demanderReinitialisation = (email) =>
  appeler("mot-de-passe-oublie", { email });

export const reinitialiser = (uid, jeton, mot_de_passe) =>
  appeler("reinitialiser", { uid, jeton, mot_de_passe });

const CLE_JETON = "users_jeton";
const CLE_ROLE = "users_role";

export function enregistrerSession(jeton, role) {
  localStorage.setItem(CLE_JETON, jeton);
  localStorage.setItem(CLE_ROLE, role);
}

export function jetonStocke() {
  return localStorage.getItem(CLE_JETON);
}

export function roleStocke() {
  return localStorage.getItem(CLE_ROLE);
}

/** Retour d'un autre service : « #jeton=...&role=... » → on ouvre la session ici, puis on nettoie l'adresse. */
export function recupererSessionDansURL() {
  try {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const jeton = params.get("jeton");
    if (!jeton) return;
    enregistrerSession(jeton, params.get("role") || "client");
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
  } catch {
    /* adresse ou stockage indisponible : l'utilisateur se connectera normalement */
  }
}

export function deconnecter() {
  localStorage.removeItem(CLE_JETON);
  localStorage.removeItem(CLE_ROLE);
}

export const estGestionnaire = (role) => role === "admin" || role === "gestionnaire";

async function appelerAvecJeton(methode, chemin, corps) {
  const reponse = await fetch(`${BASE_URL}/api/auth/${chemin}`, {
    method: methode,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jetonStocke()}`,
    },
    body: corps ? JSON.stringify(corps) : undefined,
  });
  const donnees = await reponse.json().catch(() => ({}));
  if (!reponse.ok) throw new Error(donnees.detail || "Une erreur est survenue.");
  return donnees;
}

export const monProfil = () => appelerAvecJeton("GET", "moi/");
export const modifierMonProfil = (champs) => appelerAvecJeton("PATCH", "moi/", champs);
export const creerPersonnel = (champs) => appelerAvecJeton("POST", "utilisateurs/", champs);
export const modifierUtilisateur = (id, champs) =>
  appelerAvecJeton("PATCH", `utilisateurs/${id}/`, champs);

export function listerUtilisateurs({ role = "", statut = "", q = "" } = {}) {
  const params = new URLSearchParams();
  if (role) params.set("role", role);
  if (statut) params.set("statut", statut);
  if (q) params.set("q", q);
  const suffixe = params.toString() ? `?${params}` : "";
  return appelerAvecJeton("GET", `utilisateurs/${suffixe}`);
}

export const LIBELLES_ROLE = {
  client: "Client",
  gestionnaire: "Gestionnaire",
  agent_menage: "Agent de ménage",
  admin: "Administrateur",
};