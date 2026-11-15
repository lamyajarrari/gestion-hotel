from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action, api_view, authentication_classes, permission_classes
from rest_framework.response import Response

from . import clients, services
from django.db.models import Q

from .models import DemandeNettoyage, ServiceMenage
from .permissions import IsClient, IsClientOrGestionnaire, IsGestionnaire
from .serializers import (
    AssignerSerializer, CreerDemandeSerializer, DemandeSerializer, ModifierSerializer,
    ServiceMenageSerializer, TraiterDemandeSerializer,
)


@extend_schema(exclude=True)
@api_view(["GET"])
@authentication_classes([])
@permission_classes([])
def health(request):
    return Response({"status": "ok", "service": "housekeeping"})


class ServiceMenageViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet,
):
    """Services de ménage : réservé au gestionnaire."""

    queryset = ServiceMenage.objects.all()
    serializer_class = ServiceMenageSerializer
    permission_classes = [IsGestionnaire]

    @extend_schema(
        parameters=[
            OpenApiParameter(n) for n in ("chambre_id", "agent_id", "statut", "type", "priorite")
        ]
    )
    def get_queryset(self):
        qs = super().get_queryset()
        for champ in ("chambre_id", "agent_id", "statut", "type", "priorite"):
            valeur = self.request.query_params.get(champ)
            if valeur:
                qs = qs.filter(**{champ: valeur})
        recherche = self.request.query_params.get("q")
        if recherche:  # recherche libre (spécification H002)
            qs = qs.filter(
                Q(description__icontains=recherche) | Q(chambre_id__icontains=recherche)
                | Q(agent_id__icontains=recherche)
            )
        return qs

    @extend_schema(request=AssignerSerializer, responses={201: ServiceMenageSerializer})
    def create(self, request, *args, **kwargs):
        """Assigner un service de ménage à un agent."""
        entree = AssignerSerializer(data=request.data)
        entree.is_valid(raise_exception=True)
        data = entree.validated_data
        service = services.assigner(
            chambre_id=data["chambre_id"],
            agent_id=data["agent_id"],
            type_service=data["type"],
            date_prevue=data["date_prevue"],
            gestionnaire_id=request.user.id,
            description=data["description"],
            priorite=data["priorite"],
        )
        return Response(ServiceMenageSerializer(service).data, status=status.HTTP_201_CREATED)

    @extend_schema(request=ModifierSerializer, responses=ServiceMenageSerializer)
    def partial_update(self, request, *args, **kwargs):
        """Modifier la description et/ou la priorité d'un service non terminé."""
        self.get_object()  # 404 si inconnu
        entree = ModifierSerializer(data=request.data)
        entree.is_valid(raise_exception=True)
        service = services.modifier(kwargs["pk"], **entree.validated_data)
        return Response(ServiceMenageSerializer(service).data)

    @extend_schema(responses={204: None})
    def destroy(self, request, *args, **kwargs):
        """Supprimer un service non démarré (confirmation demandée côté interface)."""
        self.get_object()
        services.supprimer(kwargs["pk"])
        return Response(status=status.HTTP_204_NO_CONTENT)

    @extend_schema(request=None, responses=ServiceMenageSerializer)
    @action(detail=True, methods=["post"])
    def demarrer(self, request, pk=None):
        self.get_object()  # 404 si inconnu
        return Response(ServiceMenageSerializer(services.demarrer(pk)).data)

    @extend_schema(request=None, responses=ServiceMenageSerializer)
    @action(detail=True, methods=["post"])
    def terminer(self, request, pk=None):
        self.get_object()
        return Response(ServiceMenageSerializer(services.terminer(pk)).data)

    @extend_schema(responses={200: dict})
    @action(detail=False, methods=["get"], url_path="chambres-a-nettoyer")
    def chambres_a_nettoyer(self, request):
        """Liste des chambres « à nettoyer » (lue depuis le service chambres)."""
        return Response(clients.list_chambres_a_nettoyer(request.auth))


class DemandeViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet,
):
    """Demandes de nettoyage : le client crée et suit les siennes, le gestionnaire les traite."""

    serializer_class = DemandeSerializer

    def get_permissions(self):
        if self.action == "create":
            return [IsClient()]
        if self.action == "traiter":
            return [IsGestionnaire()]
        return [IsClientOrGestionnaire()]

    def get_queryset(self):
        qs = DemandeNettoyage.objects.all()
        if self.request.user.role != "GESTIONNAIRE":  # un client ne voit que ses demandes
            qs = qs.filter(client_id=self.request.user.id)
        statut = self.request.query_params.get("statut")
        return qs.filter(statut=statut) if statut else qs

    @extend_schema(request=CreerDemandeSerializer, responses={201: DemandeSerializer})
    def create(self, request, *args, **kwargs):
        """Demander le nettoyage d'une chambre occupée."""
        entree = CreerDemandeSerializer(data=request.data)
        entree.is_valid(raise_exception=True)
        demande = services.creer_demande(client_id=request.user.id, **entree.validated_data)
        return Response(DemandeSerializer(demande).data, status=status.HTTP_201_CREATED)

    @extend_schema(request=None, responses=DemandeSerializer)
    @action(detail=True, methods=["post"])
    def annuler(self, request, pk=None):
        """Annuler une demande non traitée (client propriétaire ou gestionnaire)."""
        self.get_object()  # 404 si la demande n'appartient pas au client
        return Response(DemandeSerializer(services.annuler_demande(pk)).data)

    @extend_schema(request=TraiterDemandeSerializer, responses=DemandeSerializer)
    @action(detail=True, methods=["post"])
    def traiter(self, request, pk=None):
        """Prendre en charge une demande : assigner un agent de ménage."""
        self.get_object()
        entree = TraiterDemandeSerializer(data=request.data)
        entree.is_valid(raise_exception=True)
        demande = services.traiter_demande(
            pk, gestionnaire_id=request.user.id, **entree.validated_data
        )
        return Response(DemandeSerializer(demande).data)
