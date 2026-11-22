import hmac

from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.http import require_GET

from .models import Utilisateur


@require_GET
def utilisateur_interne(request, pk):
    """Lecture d'un utilisateur par les AUTRES services (housekeeping...).

    Protégée par l'en-tête X-Internal-Token (même valeur que INTERNAL_API_TOKEN
    dans tous les services). Ne renvoie ni e-mail, ni téléphone, ni mot de passe.
    """
    attendu = settings.INTERNAL_API_TOKEN
    recu = request.headers.get("X-Internal-Token", "")
    if not attendu or not hmac.compare_digest(recu, attendu):
        return JsonResponse({"detail": "Jeton interne invalide."}, status=401)

    utilisateur = Utilisateur.objects.filter(pk=pk).first()
    if utilisateur is None:
        return JsonResponse({"detail": "Utilisateur introuvable."}, status=404)

    return JsonResponse(
        {
            "id": utilisateur.pk,
            "role": utilisateur.role,
            "statut": utilisateur.statut,
            "nom": utilisateur.nom,
            "prenom": utilisateur.prenom,
        }
    )