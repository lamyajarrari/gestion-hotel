"""Clients HTTP vers les autres microservices (jamais de SQL sur leurs tables)."""
import logging

import requests
from django.conf import settings
from rest_framework.exceptions import NotFound

from .exceptions import ExternalServiceError

logger = logging.getLogger(__name__)

# États des chambres utilisés dans ce service (diagramme de classes : StatutChambre).
CHAMBRE_LIBRE = "LIBRE"
CHAMBRE_OCCUPEE = "OCCUPEE"
CHAMBRE_A_NETTOYER = "A_NETTOYER"

# Vocabulaire du service chambres (dossier de tests, section 6.1 : champ « etat » avec les
# valeurs disponible / occupee / a_nettoyer / maintenance). Si ce contrat change, ne modifier
# que ce bloc et la variable d'environnement CHAMBRES_ETAT_FIELD.
VALEUR_API = {
    CHAMBRE_LIBRE: "disponible",
    CHAMBRE_OCCUPEE: "occupee",
    CHAMBRE_A_NETTOYER: "a_nettoyer",
}
_VERS_INTERNE = {
    "disponible": CHAMBRE_LIBRE, "libre": CHAMBRE_LIBRE,
    "occupee": CHAMBRE_OCCUPEE, "occupée": CHAMBRE_OCCUPEE,
    "a_nettoyer": CHAMBRE_A_NETTOYER, "à nettoyer": CHAMBRE_A_NETTOYER,
    "maintenance": "MAINTENANCE",
}


def normaliser_etat(chambre):
    """État interne (LIBRE, OCCUPEE, A_NETTOYER, MAINTENANCE) d'une chambre renvoyée par l'API.
    Accepte les champs « etat » ou « statut » et toute casse."""
    brut = chambre.get(settings.CHAMBRES_ETAT_FIELD, chambre.get("statut"))
    return _VERS_INTERNE.get(str(brut).strip().lower(), str(brut).upper())


MAX_PAGES = 20  # garde-fou contre une pagination sans fin


def _headers():
    return {"X-Internal-Token": settings.INTERNAL_API_TOKEN}


def _request(method, url, headers=None, **kwargs):
    try:
        response = requests.request(
            method, url, headers=headers or _headers(), timeout=settings.EXTERNAL_TIMEOUT, **kwargs
        )
    except requests.RequestException as exc:
        logger.error("Appel %s %s impossible : %s", method, url, exc)
        raise ExternalServiceError() from exc
    if response.status_code == 404:
        raise NotFound("Ressource introuvable dans le service distant.")
    if response.status_code >= 400:
        logger.error("Appel %s %s -> HTTP %s", method, url, response.status_code)
        raise ExternalServiceError()
    return response


def get_chambre(chambre_id):
    """GET /api/internal/chambres/{id}/ (X-Internal-Token) -> chambre ;
    ajoute la clé « statut » (état interne normalisé)."""
    url = f"{settings.CHAMBRES_API_URL}/api/internal/chambres/{chambre_id}/"
    chambre = _request("GET", url).json()
    chambre["statut"] = normaliser_etat(chambre)
    return chambre


def set_chambre_statut(chambre_id, statut):
    """POST /api/internal/chambres/{id}/etat/ (X-Internal-Token) avec {"etat": "disponible"}
    (statut = état interne). Le service chambres peut répondre 409 si la transition est refusée."""
    url = f"{settings.CHAMBRES_API_URL}/api/internal/chambres/{chambre_id}/etat/"
    corps = {settings.CHAMBRES_ETAT_FIELD: VALEUR_API[statut]}
    return _request("POST", url, json=corps).json()


def list_chambres_a_nettoyer(jeton):
    """GET /api/admin/chambres/?etat=a_nettoyer -> liste des chambres « à nettoyer ».

    Le service chambres n'a pas (encore) de liste interne : cette route est réservée à
    l'administrateur et paginée. On réutilise donc le JWT du gestionnaire qui nous appelle
    et on suit les pages. Le filtre est aussi appliqué ici, par sécurité."""
    url = f"{settings.CHAMBRES_API_URL}/api/admin/chambres/"
    params = {settings.CHAMBRES_ETAT_FIELD: VALEUR_API[CHAMBRE_A_NETTOYER]}
    headers = {"Authorization": f"Bearer {jeton}"}
    chambres = []
    for _ in range(MAX_PAGES):
        data = _request("GET", url, headers=headers, params=params).json()
        if isinstance(data, dict) and "results" in data:
            chambres.extend(data["results"])
            url, params = data.get("next"), None  # « next » est une URL complète
            if not url:
                break
        else:
            chambres.extend(data)
            break
    return [c for c in chambres if normaliser_etat(c) == CHAMBRE_A_NETTOYER]


def get_user(user_id):
    """GET /api/users/{id}/ -> {"id", "role", "statut": "ACTIF"|"INACTIF", ...}"""
    url = f"{settings.USERS_API_URL}/api/users/{user_id}/"
    return _request("GET", url).json()
