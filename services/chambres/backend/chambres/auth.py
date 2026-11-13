import hmac

import jwt
from django.conf import settings
from rest_framework import authentication, exceptions, permissions


class UtilisateurJWT:
    """Utilisateur reconstruit depuis le jeton JWT émis par le service users."""

    is_authenticated = True

    def __init__(self, payload):
        self.id = payload["sub"]
        self.role = payload.get("role", "client")

    @property
    def est_admin(self):
        return self.role == "admin"


class JWTAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        entete = request.headers.get("Authorization", "")
        if not entete.startswith("Bearer "):
            return None

        jeton = entete.removeprefix("Bearer ")
        try:
            payload = jwt.decode(jeton, settings.JWT_SECRET, algorithms=["HS256"])
        except jwt.PyJWTError:
            raise exceptions.AuthenticationFailed("Jeton invalide ou expiré.")

        if "sub" not in payload:
            raise exceptions.AuthenticationFailed("Jeton invalide.")

        return (UtilisateurJWT(payload), jeton)


class EstAdmin(permissions.BasePermission):
    message = "Réservé à l'administrateur."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.est_admin)


class EstServiceInterne(permissions.BasePermission):
    """Autorise uniquement les autres services qui connaissent le jeton interne."""

    message = "Appel interne non autorisé."

    def has_permission(self, request, view):
        jeton = request.headers.get("X-Internal-Token", "")
        return hmac.compare_digest(jeton, settings.INTERNAL_API_TOKEN)