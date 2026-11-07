import { api } from "./client.js";

export const chambresPubliques = ({ page = 1, type = "", q = "" } = {}) => {
  const params = new URLSearchParams({ page });
  if (type) params.set("type", type);
  if (q) params.set("q", q);
  return api(`/api/chambres/?${params}`);
};

export const chambresAdmin = (token, { etat = "", page = 1 } = {}) => {
  const params = new URLSearchParams({ page });
  if (etat) params.set("etat", etat);
  return api(`/api/admin/chambres/?${params}`, { token });
};

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

export const statistiquesChambres = (token, debut, fin) =>
  api(`/api/admin/chambres/statistiques/?debut=${debut}&fin=${fin}`, { token });

export const indisponibilitesChambre = (token, chambreId) =>
  api(`/api/admin/indisponibilites/?chambre=${chambreId}`, { token });

export const creerIndisponibilite = (token, corps) =>
  api("/api/admin/indisponibilites/", { methode: "POST", corps, token });

export const supprimerIndisponibilite = (token, id) =>
  api(`/api/admin/indisponibilites/${id}/`, { methode: "DELETE", token });