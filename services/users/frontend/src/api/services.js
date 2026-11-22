import { deconnecter, jetonStocke, roleStocke } from "./auth.js";

// Adresses des autres interfaces (vues depuis le navigateur)
const CHAMBRES = import.meta.env.VITE_CHAMBRES_URL || "http://localhost:3001";
const RESERVATIONS = import.meta.env.VITE_RESERVATIONS_URL || "http://localhost:3002";
const HOUSEKEEPING = import.meta.env.VITE_HOUSEKEEPING_URL || "http://localhost:3003";

const enc = encodeURIComponent;

/** Chambres lit « #jeton=...&role=... » sur /connexion puis choisit la page selon le rôle. */
export const lienChambres = () => `${CHAMBRES}/connexion#jeton=${enc(jetonStocke() || "")}&role=${enc(roleStocke() || "")}`;

/** Réservations lit « ?token=... » ; l'admin/gestionnaire et le client n'ont pas la même page. */
export const lienReservations = () =>
  `${RESERVATIONS}${roleStocke() === "client" ? "/client/reservations" : "/admin/reservations"}?token=${enc(jetonStocke() || "")}`;

/** Housekeeping lit « #jeton=...&role=... » et affiche l'interface du rôle. */
export const lienHousekeeping = () => `${HOUSEKEEPING}/#jeton=${enc(jetonStocke() || "")}&role=${enc(roleStocke() || "")}`;

export const URL_CHAMBRES_ACCUEIL = CHAMBRES;

/** Première page, avec la demande de vider la session locale de chambres. */
export const URL_CHAMBRES_DECONNEXION = `${CHAMBRES}/?deconnexion=1`;

/** Déconnexion générale : un service nous envoie « ?deconnexion=1 ». On vide la session de
 *  ce service, puis on renvoie vers la première page qui videra la sienne. */
export function fermerSessionSiDemande() {
  try {
    if (new URLSearchParams(window.location.search).get("deconnexion") !== "1") return;
    deconnecter();
    window.location.replace(URL_CHAMBRES_DECONNEXION);
  } catch {
    /* adresse illisible : on continue normalement */
  }
}