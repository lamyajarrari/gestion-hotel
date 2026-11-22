from rest_framework.permissions import BasePermission


class IsGestionnaire(BasePermission):
    """Seul l'administrateur (gestionnaire) gère le housekeeping."""

    message = "Réservé au gestionnaire."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role == "GESTIONNAIRE")


class IsClient(BasePermission):
    message = "Réservé au client."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role == "CLIENT")


class IsClientOrGestionnaire(BasePermission):
    message = "Accès refusé."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role in ("CLIENT", "GESTIONNAIRE"))
