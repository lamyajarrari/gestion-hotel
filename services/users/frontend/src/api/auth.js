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