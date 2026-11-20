
const API_USERS = "http://localhost:8004/api/auth";
const API_RESERVATIONS = "http://localhost:8002/api/reservations";

async function traiterReponse(response) {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail || data.message || "Une erreur est survenue."
    );
  }

  return data;
}

export async function connecterUtilisateur(email, mot_de_passe) {
  const response = await fetch(`${API_USERS}/connexion/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email,
      mot_de_passe
    })
  });

  return traiterReponse(response);
}

export async function obtenirStatistiques() {
  const response = await fetch(`${API_RESERVATIONS}/statistiques`);
  return traiterReponse(response);
}

export async function obtenirReservations() {
  const response = await fetch(API_RESERVATIONS);
  return traiterReponse(response);
}

export async function obtenirClients() {
  const response = await fetch(`${API_RESERVATIONS}/clients`);
  return traiterReponse(response);
}

export async function obtenirChambres() {
  const response = await fetch(`${API_RESERVATIONS}/chambres`);
  return traiterReponse(response);
}

export async function creerReservation(donnees) {
  const response = await fetch(API_RESERVATIONS, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(donnees)
  });

  return traiterReponse(response);
}

export async function annulerReservation(id) {
  const response = await fetch(
    `${API_RESERVATIONS}/${encodeURIComponent(id)}/annuler`,
    {
      method: "PATCH"
    }
  );

  return traiterReponse(response);
}
