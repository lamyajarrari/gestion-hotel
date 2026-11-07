from datetime import date, timedelta

from django.db.models import Count
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from . import services
from .auth import EstAdmin, EstServiceInterne, JWTAuthentication
from .models import Chambre, Indisponibilite
from .pagination import PaginationChambres
from .serializers import ChambreSerializer, EtatSerializer, IndisponibiliteSerializer


class ChambreConsultationViewSet(viewsets.ReadOnlyModelViewSet):
    """Consultation publique des chambres actives (cahier 4.2)."""

    serializer_class = ChambreSerializer
    authentication_classes = []
    permission_classes = [AllowAny]
    pagination_class = PaginationChambres

    def get_queryset(self):
        qs = Chambre.objects.filter(actif=True).order_by("numero")
        type_chambre = self.request.query_params.get("type")
        recherche = self.request.query_params.get("q")
        if type_chambre:
            qs = qs.filter(type=type_chambre)
        if recherche:
            qs = qs.filter(numero__icontains=recherche)
        return qs


class ChambreAdminViewSet(viewsets.ModelViewSet):
    """Gestion des chambres réservée à l'administrateur (cahier 4.1)."""

    serializer_class = ChambreSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [EstAdmin]
    pagination_class = PaginationChambres

    def get_queryset(self):
        qs = Chambre.objects.all().order_by("numero")
        etat = self.request.query_params.get("etat")
        if etat:
            qs = qs.filter(etat=etat)
        return qs

    def destroy(self, request, *args, **kwargs):
        # Pas de suppression : on désactive pour garder l'historique
        chambre = self.get_object()
        chambre.actif = False
        chambre.save(update_fields=["actif", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)

    def _definir_actif(self, valeur):
        chambre = self.get_object()
        chambre.actif = valeur
        chambre.save(update_fields=["actif", "updated_at"])
        return Response(self.get_serializer(chambre).data)

    @action(detail=True, methods=["post"])
    def activer(self, request, pk=None):
        return self._definir_actif(True)

    @action(detail=True, methods=["post"])
    def desactiver(self, request, pk=None):
        return self._definir_actif(False)

    @action(detail=True, methods=["post"])
    def etat(self, request, pk=None):
        chambre = self.get_object()
        donnees = EtatSerializer(data=request.data)
        donnees.is_valid(raise_exception=True)
        try:
            services.changer_etat(chambre.pk, donnees.validated_data["etat"])
        except services.TransitionInvalide as erreur:
            return Response({"detail": str(erreur)}, status=status.HTTP_409_CONFLICT)
        chambre.refresh_from_db()
        return Response(self.get_serializer(chambre).data)

    @action(detail=False, methods=["get"])
    def statistiques(self, request):
        chambres = Chambre.objects.all()
        actives = chambres.filter(actif=True)

        try:
            debut = date.fromisoformat(
                request.query_params.get("debut", (date.today() - timedelta(days=30)).isoformat())
            )
            fin = date.fromisoformat(
                request.query_params.get("fin", date.today().isoformat())
            )
        except ValueError:
            return Response(
                {"detail": "Dates invalides (AAAA-MM-JJ)."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if fin <= debut:
            return Response(
                {"detail": "La date de fin doit être après la date de début."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        nuits_periode = (fin - debut).days
        indisponibilites = Indisponibilite.objects.filter(
            chambre__actif=True,
            date_debut__lt=fin,
            date_fin__gt=debut,
        )
        nuits_bloquees = 0
        for indispo in indisponibilites:
            debut_effectif = max(indispo.date_debut, debut)
            fin_effective = min(indispo.date_fin, fin)
            nuits_bloquees += (fin_effective - debut_effectif).days

        capacite = actives.count() * nuits_periode
        taux = round(100 * nuits_bloquees / capacite, 1) if capacite else 0

        return Response({
            "periode": {"debut": debut.isoformat(), "fin": fin.isoformat()},
            "total": chambres.count(),
            "actives": actives.count(),
            "par_etat": list(actives.values("etat").annotate(total=Count("id")).order_by("etat")),
            "par_type": list(actives.values("type").annotate(total=Count("id")).order_by("type")),
            "nuits_bloquees": nuits_bloquees,
            "taux_indisponibilite": taux,
        })


class IndisponibiliteAdminViewSet(viewsets.ModelViewSet):
    serializer_class = IndisponibiliteSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [EstAdmin]

    def get_queryset(self):
        qs = Indisponibilite.objects.select_related("chambre").order_by("date_debut")
        chambre_id = self.request.query_params.get("chambre")
        if chambre_id:
            qs = qs.filter(chambre_id=chambre_id)
        return qs


class ChambreInterneViewSet(viewsets.ViewSet):
    """Routes appelées par les autres services (X-Internal-Token)."""

    authentication_classes = []
    permission_classes = [EstServiceInterne]

    def retrieve(self, request, pk=None):
        chambre = get_object_or_404(Chambre, pk=pk)
        return Response(ChambreSerializer(chambre).data)

    @action(detail=True, methods=["post"])
    def etat(self, request, pk=None):
        chambre = get_object_or_404(Chambre, pk=pk)
        donnees = EtatSerializer(data=request.data)
        donnees.is_valid(raise_exception=True)
        try:
            services.changer_etat(chambre.pk, donnees.validated_data["etat"])
        except services.TransitionInvalide as erreur:
            return Response({"detail": str(erreur)}, status=status.HTTP_409_CONFLICT)
        chambre.refresh_from_db()
        return Response(ChambreSerializer(chambre).data)

    @action(detail=True, methods=["get"])
    def disponibilite(self, request, pk=None):
        chambre = get_object_or_404(Chambre, pk=pk)
        try:
            debut = date.fromisoformat(request.query_params["debut"])
            fin = date.fromisoformat(request.query_params["fin"])
            debut, fin = services.valider_periode(debut, fin)
        except (KeyError, ValueError):
            return Response(
                {"detail": "Paramètres debut et fin requis (AAAA-MM-JJ), fin après debut."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({"libre": services.est_libre_sur_periode(chambre, debut, fin)})