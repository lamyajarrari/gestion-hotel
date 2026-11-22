from rest_framework import status
from rest_framework.exceptions import APIException


class ConflictError(APIException):
    """Règle de gestion violée (409)."""

    status_code = status.HTTP_409_CONFLICT
    default_detail = "Opération incompatible avec l'état actuel."
    default_code = "conflict"


class ExternalServiceError(APIException):
    """Un autre microservice est injoignable ou répond en erreur (503)."""

    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = "Un service dépendant est momentanément indisponible."
    default_code = "external_service_unavailable"


class ExternalServiceRefused(ExternalServiceError):
    """L'autre microservice a refusé l'appel (401 ou 403) : jeton ou rôle non accepté."""

    def __init__(self, status_distant):
        super().__init__()
        self.status_distant = status_distant
