from rest_framework import viewsets
from rest_framework.permissions import AllowAny

from .models import Chambre
from .serializers import ChambreSerializer


class ChambreConsultationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ChambreSerializer
    authentication_classes = []
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Chambre.objects.filter(actif=True)