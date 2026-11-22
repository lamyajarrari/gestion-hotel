import jwt
from django.conf import settings
from rest_framework.authentication import BaseAuthentication, get_authorization_header
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import BasePermission

from .models import Utilisateur


class JWTAuthentication(BaseAuthentication):
    """Authentification par le JWT émis par le service users."""

    def authenticate(self, request):
        header = get_authorization_header(request).split()
        if not header or header[0].lower() != b"bearer":
            return None
        if len(header) != 2:
            raise AuthenticationFailed("En-tête Authorization invalide.")
        try:
            payload = jwt.decode(
                header[1].decode(), settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
            )
            user_id = int(payload["sub"])
        except (jwt.PyJWTError, KeyError, ValueError, UnicodeDecodeError) as exc:
            raise AuthenticationFailed("Jeton invalide ou expiré.") from exc

        utilisateur = Utilisateur.objects.filter(pk=user_id).first()
        if utilisateur is None or utilisateur.statut != Utilisateur.Statut.ACTIF:
            raise AuthenticationFailed("Compte introuvable ou désactivé.")
        return utilisateur, payload

    def authenticate_header(self, request):
        return "Bearer"


class EstGestionnaire(BasePermission):
    message = "Cette opération est réservée au gestionnaire."

    def has_permission(self, request, view):
        return getattr(request.user, "role", None) in (
            Utilisateur.Role.ADMIN,
            Utilisateur.Role.GESTIONNAIRE,
        )