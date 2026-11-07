import { api } from "./client.js";

export const chambresPubliques = () => api("/api/chambres/");

export const chambresAdmin = (token, etat = "") =>
  api(`/api/admin/chambres/${etat ? `?etat=${encodeURIComponent(etat)}` : ""}`, { token });

export const creerChambre = (token, donnees) =>
  api("/api/admin/chambres/", { methode: "POST", corps: donnees, token });

export const modifierChambre = (token, id, donnees) =>
  api(`/api/admin/chambres/${id}/`, { methode: "PATCH", corps: donnees, token });

export const changerEtat = (token, id, etat) =>
  api(`/api/admin/chambres/${id}/etat/`, { methode: "POST", corps: { etat }, token });

export const activer = (token, id) =>
  api(`/api/admin/chambres/${id}/activer/`, { methode: "POST", token });

export const desactiver = (token, id) =>
  api(`/api/admin/chambres/${id}/desactiver/`, { methode: "POST", token });

export const indisponibilitesChambre = (token, chambreId) =>
  api(`/api/admin/indisponibilites/?chambre=${chambreId}`, { token });

export const creerIndisponibilite = (token, corps) =>
  api("/api/admin/indisponibilites/", { methode: "POST", corps, token });

export const supprimerIndisponibilite = (token, id) =>
  api(`/api/admin/indisponibilites/${id}/`, { methode: "DELETE", token });