"""Clients HTTP vers les autres microservices (jamais de SQL sur leurs tables)."""
import logging

import requests
from django.conf import settings
from rest_framework.exceptions import NotFound, PermissionDenied

from .exceptions import ExternalServiceError, ExternalServiceRefused

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


MESSAGE_CHAMBRE_INTROUVABLE = (
    "Chambre introuvable : aucune chambre active avec ce numéro. "
    "Vérifiez le numéro saisi (une chambre désactivée n'est pas reconnue)."
)

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
    if response.status_code in (401, 403):
        logger.error("Appel %s %s refusé : HTTP %s", method, url, response.status_code)
        raise ExternalServiceRefused(response.status_code)
    if response.status_code >= 400:
        logger.error("Appel %s %s -> HTTP %s", method, url, response.status_code)
        raise ExternalServiceError()
    return response


def _chercher_par_numero(numero):
    """GET /api/chambres/?q=<numero> (consultation publique, paginée) -> chambre dont le
    numéro correspond exactement, ou None. Le client connaît le numéro de sa chambre,
    pas son identifiant interne."""
    url = f"{settings.CHAMBRES_API_URL}/api/chambres/"
    params = {"q": numero}
    for _ in range(MAX_PAGES):
        data = _request("GET", url, params=params).json()
        resultats = data["results"] if isinstance(data, dict) and "results" in data else data
        for chambre in resultats:
            if str(chambre.get("numero", "")).strip().lower() == numero.lower():
                return chambre
        url = data.get("next") if isinstance(data, dict) else None
        params = None  # « next » est une URL complète
        if not url:
            break
    return None


def get_chambre(chambre_id, par_id=False):
    """GET /api/internal/chambres/{id}/ (X-Internal-Token) -> chambre ;
    ajoute la clé « statut » (état interne normalisé).

    La valeur reçue peut être le numéro de la chambre (« 101 ») ou son identifiant interne :
    on essaie d'abord le numéro, puis l'identifiant.
    Avec par_id=True (valeur déjà enregistrée chez nous, donc un identifiant), on ne
    cherche PAS par numéro : « 2 » pourrait être le numéro d'une autre chambre."""
    valeur = str(chambre_id).strip()
    trouvee = None
    if not par_id:
        try:
            trouvee = _chercher_par_numero(valeur)
        except (ExternalServiceError, NotFound) as exc:  # l'identifiant sera tenté ensuite
            logger.warning("Recherche de la chambre %r par numéro impossible : %s", valeur, exc)
        if trouvee is None:
            logger.warning("Chambre %r absente de la liste publique (inactive, ou numéro inconnu)", valeur)
    if trouvee and trouvee.get("id") is not None:
        valeur = trouvee["id"]
    if not trouvee and not valeur.isdigit():
        # Ni un numéro connu, ni un identifiant possible : inutile d'interroger le service.
        raise NotFound(MESSAGE_CHAMBRE_INTROUVABLE)
    url = f"{settings.CHAMBRES_API_URL}/api/internal/chambres/{valeur}/"
    try:
        chambre = _request("GET", url).json()
    except NotFound:
        raise NotFound(MESSAGE_CHAMBRE_INTROUVABLE)
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
        try:
            data = _request("GET", url, headers=headers, params=params).json()
        except ExternalServiceRefused:
            # Le gestionnaire est connu de housekeeping, mais pas accepté par chambres
            raise PermissionDenied(
                "Le service chambres refuse ce compte : sa liste est réservée au rôle « admin »."
            )
        if isinstance(data, dict) and "results" in data:
            chambres.extend(data["results"])
            url, params = data.get("next"), None  # « next » est une URL complète
            if not url:
                break
        else:
            chambres.extend(data)
            break
    return [c for c in chambres if normaliser_etat(c) == CHAMBRE_A_NETTOYER]

def list_agents(jeton):
    """GET /api/auth/utilisateurs/?role=agent_menage&statut=actif -> agents de ménage actifs.

    Le service users réserve cette liste au gestionnaire : on réutilise le JWT de celui qui
    nous appelle (comme pour les chambres à nettoyer). On ne garde que l'identifiant et le nom,
    pour que l'interface propose les agents par leur nom et non par leur identifiant."""
    url = f"{settings.USERS_API_URL}/api/auth/utilisateurs/"
    params = {"role": "agent_menage", "statut": "actif"}
    headers = {"Authorization": f"Bearer {jeton}"}
    try:
        data = _request("GET", url, headers=headers, params=params).json()
    except ExternalServiceRefused:
        raise PermissionDenied(
            "Le service users refuse ce compte : la liste du personnel est réservée au gestionnaire."
        )
    resultats = data["results"] if isinstance(data, dict) and "results" in data else data
    return [
        {"id": str(a.get("id")), "nom": a.get("nom") or "", "prenom": a.get("prenom") or ""}
        for a in resultats
    ]
def get_user(user_id):
    """GET /api/users/{id}/ -> {"id", "role", "statut": "ACTIF"|"INACTIF", ...}"""
    url = f"{settings.USERS_API_URL}/api/users/{user_id}/"
    return _request("GET", url).json()