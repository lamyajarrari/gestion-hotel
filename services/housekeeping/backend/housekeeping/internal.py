import hmac

from django.conf import settings
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response


@extend_schema(exclude=True)
@api_view(["POST"])
@authentication_classes([])
@permission_classes([])
def notification_chambre_a_nettoyer(request):
    """Appelée par le service chambres quand une chambre passe à « à nettoyer ».

    Housekeeping n'invente pas de tâche : un ménage de départ exige un agent, choisi par le
    gestionnaire. La chambre apparaît dans « Chambres à nettoyer », lue directement chez chambres.
    On confirme seulement la réception pour que chambres n'enregistre pas d'incident.
    """
    recu = request.headers.get("X-Internal-Token", "")
    if not hmac.compare_digest(recu, settings.INTERNAL_API_TOKEN):
        return Response({"detail": "Appel interne non autorisé."}, status=status.HTTP_401_UNAUTHORIZED)
    chambre_id = request.data.get("chambre_id")
    if chambre_id in (None, ""):
        return Response({"detail": "chambre_id est obligatoire."}, status=status.HTTP_400_BAD_REQUEST)
    return Response(
        {"detail": "Notification reçue : la chambre est à assigner à un agent.", "chambre_id": chambre_id},
        status=status.HTTP_202_ACCEPTED,
    )
