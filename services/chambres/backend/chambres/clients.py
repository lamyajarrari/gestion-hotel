import requests
from django.conf import settings


class ServiceIndisponible(Exception):
    """L'autre service ne répond pas ou renvoie une erreur."""


def _appeler(methode, base_url, chemin, **kwargs):
    try:
        reponse = requests.request(
            methode,
            f"{base_url}{chemin}",
            headers={"X-Internal-Token": settings.INTERNAL_API_TOKEN},
            timeout=3,
            **kwargs,
        )
        reponse.raise_for_status()
    except requests.RequestException as erreur:
        raise ServiceIndisponible(str(erreur)) from erreur
    return reponse.json()


# ----- reservations -----
def reservation_existe(chambre_id, debut, fin):
    donnees = _appeler(
        "GET",
        settings.RESERVATIONS_URL,
        "/api/internal/reservations/existe/",
        params={"chambre": chambre_id, "debut": debut, "fin": fin},
    )
    return donnees["existe"]


# ----- housekeeping -----
def creer_tache_menage(chambre_id):
    return _appeler(
        "POST",
        settings.HOUSEKEEPING_URL,
        "/api/internal/taches/",
        json={"chambre_id": chambre_id, "type": "menage"},
    )