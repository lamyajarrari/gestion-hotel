from datetime import datetime, timedelta, timezone

import jwt
from django.conf import settings
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Utilisateur


def creer_jeton(utilisateur):
    maintenant = datetime.now(timezone.utc)
    payload = {
        "sub": str(utilisateur.pk),
        "role": utilisateur.role,
        "email": utilisateur.email,
        "iat": maintenant,
        "exp": maintenant + timedelta(hours=settings.JWT_DUREE_HEURES),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


class InscriptionView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        mot_de_passe = request.data.get("mot_de_passe") or ""
        nom = (request.data.get("nom") or "").strip()
        prenom = (request.data.get("prenom") or "").strip()

        if not all([email, mot_de_passe, nom, prenom]):
            return Response(
                {"detail": "E-mail, mot de passe, nom et prénom sont obligatoires."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(mot_de_passe) < 8:
            return Response(
                {"detail": "Le mot de passe doit contenir au moins 8 caractères."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if Utilisateur.objects.filter(email=email).exists():
            return Response(
                {"detail": "Cette adresse e-mail est déjà utilisée."},
                status=status.HTTP_409_CONFLICT,
            )

        # L'inscription crée toujours un client : le rôle n'est pas choisi par l'utilisateur
        utilisateur = Utilisateur.objects.create_user(
            email=email,
            mot_de_passe=mot_de_passe,
            nom=nom,
            prenom=prenom,
            role=Utilisateur.Role.CLIENT,
        )
        return Response(
            {"jeton": creer_jeton(utilisateur), "role": utilisateur.role},
            status=status.HTTP_201_CREATED,
        )


class ConnexionView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        mot_de_passe = request.data.get("mot_de_passe") or ""

        utilisateur = Utilisateur.objects.filter(email=email).first()
        if (
            utilisateur is None
            or not utilisateur.check_password(mot_de_passe)
            or utilisateur.statut != Utilisateur.Statut.ACTIF
        ):
            return Response(
                {"detail": "E-mail ou mot de passe incorrect."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        return Response({"jeton": creer_jeton(utilisateur), "role": utilisateur.role})