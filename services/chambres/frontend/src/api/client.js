export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";

export function urlMedia(chemin) {
  if (!chemin) return null;
  return chemin.startsWith("http") ? chemin : `${BASE_URL}${chemin}`;
}

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export async function api(chemin, { methode = "GET", corps, token } = {}) {
  const entetes = { Accept: "application/json" };
  let body;

  if (corps instanceof FormData) {
    body = corps; // le navigateur gère le Content-Type multipart
  } else if (corps !== undefined) {
    entetes["Content-Type"] = "application/json";
    body = JSON.stringify(corps);
  }
  if (token) entetes.Authorization = `Bearer ${token}`;

  const reponse = await fetch(`${BASE_URL}${chemin}`, { method: methode, headers: entetes, body });

  if (reponse.status === 204) return null;

  const donnees = await reponse.json().catch(() => null);

  if (!reponse.ok) {
    const message =
      donnees?.detail ||
      Object.values(donnees || {}).flat().join(" ") ||
      "Une erreur est survenue.";
    throw new ApiError(reponse.status, message);
  }

  return donnees;
}