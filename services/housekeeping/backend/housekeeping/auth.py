import jwt
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed


# Le service chambres lit le rôle en minuscules (« admin », « client ») et l'identifiant dans « sub ».
# On accepte ces valeurs et on les ramène à nos rôles internes.
ROLES = {
    "admin": "GESTIONNAIRE", "administrateur": "GESTIONNAIRE", "gestionnaire": "GESTIONNAIRE",
    "client": "CLIENT",
    "agent_menage": "AGENT_MENAGE", "agent": "AGENT_MENAGE",
}


def normaliser_role(role):
    """Rôle interne (GESTIONNAIRE | CLIENT | AGENT_MENAGE) depuis la valeur du jeton ou de l'API users."""
    brut = str(role or "").strip()
    return ROLES.get(brut.lower(), brut.upper())


class TokenUser:
    """Utilisateur sans état, reconstruit depuis le JWT émis par le service users."""

    is_authenticated = True

    def __init__(self, user_id, role):
        self.id = str(user_id)
        self.role = normaliser_role(role)

    def __str__(self):
        return f"{self.id} ({self.role})"


class JWTAuthentication(BaseAuthentication):
    """Valide le jeton avec le JWT_SECRET commun à tous les services.
    Claims : « sub » (ou « user_id ») et « role » (admin | client | agent_menage, ou
    GESTIONNAIRE | CLIENT | AGENT_MENAGE). Sans rôle, l'utilisateur est un simple client."""

    def authenticate(self, request):
        header = request.headers.get("Authorization", "")
        if not header.startswith("Bearer "):
            return None
        token = header[len("Bearer "):].strip()
        try:
            payload = jwt.decode(
                token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
            )
        except jwt.PyJWTError:
            raise AuthenticationFailed("Jeton invalide ou expiré.")
        user_id = payload.get("sub", payload.get("user_id"))
        if not user_id:
            raise AuthenticationFailed("Jeton incomplet (identifiant utilisateur manquant).")
        return TokenUser(user_id, payload.get("role", "client")), token

    def authenticate_header(self, request):
        return "Bearer"
