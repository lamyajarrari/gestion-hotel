import logging
import secrets
from datetime import datetime, timedelta, timezone

import jwt
from django.conf import settings
from django.core.mail import send_mail
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Utilisateur
from .mot_de_passe import erreurs_mot_de_passe

logger = logging.getLogger(__name__)
DUREE_CODE_MINUTES = 10


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


def generer_et_envoyer_code(utilisateur):
    code = f"{secrets.randbelow(1000000):06d}"
    utilisateur.code_verification = code
    utilisateur.code_expiration = datetime.now(timezone.utc) + timedelta(minutes=DUREE_CODE_MINUTES)
    utilisateur.save(update_fields=["code_verification", "code_expiration"])

    send_mail(
        "Riad Souss — Code de vérification de votre compte",
        f"Bonjour {utilisateur.prenom},\n\n"
        f"Votre code de vérification pour finaliser votre inscription est : {code}\n\n"
        f"Ce code est valable pendant {DUREE_CODE_MINUTES} minutes.\n"
        "Si vous n'êtes pas à l'origine de cette inscription, ignorez ce message.",
        None,
        [utilisateur.email],
    )


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

        erreurs = erreurs_mot_de_passe(mot_de_passe, email, nom, prenom)
        if erreurs:
            return Response(
                {"detail": " ".join(erreurs)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        existant = Utilisateur.objects.filter(email=email).first()
        if existant and existant.statut == Utilisateur.Statut.ACTIF:
            return Response(
                {"detail": "Cette adresse e-mail est déjà utilisée."},
                status=status.HTTP_409_CONFLICT,
            )

        if existant:
            existant.nom = nom
            existant.prenom = prenom
            existant.set_password(mot_de_passe)
            existant.save()
            utilisateur = existant
        else:
            utilisateur = Utilisateur.objects.create_user(
                email=email,
                mot_de_passe=mot_de_passe,
                nom=nom,
                prenom=prenom,
                role=Utilisateur.Role.CLIENT,
                statut=Utilisateur.Statut.INACTIF,
            )

        try:
            generer_et_envoyer_code(utilisateur)
        except Exception:
            logger.exception("Échec de l'envoi du code de vérification par e-mail")
            return Response(
                {"detail": "Impossible d'envoyer l'e-mail de vérification. Réessayez."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {
                "detail": "Un code de vérification à 6 chiffres a été envoyé à votre adresse e-mail.",
                "email": utilisateur.email,
                "verification_requise": True,
            },
            status=status.HTTP_201_CREATED,
        )


class VerifierCodeView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        code = (request.data.get("code") or "").strip()

        if not email or not code:
            return Response(
                {"detail": "L'e-mail et le code de vérification sont obligatoires."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        utilisateur = Utilisateur.objects.filter(email=email).first()
        if not utilisateur:
            return Response(
                {"detail": "Compte introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if utilisateur.statut == Utilisateur.Statut.ACTIF:
            return Response({"jeton": creer_jeton(utilisateur), "role": utilisateur.role})

        maintenant = datetime.now(timezone.utc)
        if (
            not utilisateur.code_verification
            or not utilisateur.code_expiration
            or utilisateur.code_expiration < maintenant
        ):
            return Response(
                {"detail": "Le code a expiré. Demandez un nouveau code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not secrets.compare_digest(utilisateur.code_verification, code):
            return Response(
                {"detail": "Code de vérification incorrect."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        utilisateur.statut = Utilisateur.Statut.ACTIF
        utilisateur.code_verification = ""
        utilisateur.code_expiration = None
        utilisateur.save(update_fields=["statut", "code_verification", "code_expiration"])

        return Response(
            {
                "detail": "Compte activé avec succès.",
                "jeton": creer_jeton(utilisateur),
                "role": utilisateur.role,
            },
            status=status.HTTP_200_OK,
        )


class RenvoyerCodeView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        utilisateur = Utilisateur.objects.filter(
            email=email, statut=Utilisateur.Statut.INACTIF
        ).first()

        if not utilisateur:
            return Response(
                {"detail": "Aucun compte en attente de vérification pour cet e-mail."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            generer_et_envoyer_code(utilisateur)
        except Exception:
            logger.exception("Échec du renvoi du code de vérification")
            return Response(
                {"detail": "Impossible d'envoyer l'e-mail pour le moment."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response({"detail": "Un nouveau code de vérification a été envoyé."})


class ConnexionView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        mot_de_passe = request.data.get("mot_de_passe") or ""

        utilisateur = Utilisateur.objects.filter(email=email).first()
        if utilisateur is None or not utilisateur.check_password(mot_de_passe):
            return Response(
                {"detail": "E-mail ou mot de passe incorrect."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if utilisateur.statut != Utilisateur.Statut.ACTIF:
            return Response(
                {
                    "detail": "Votre compte n'est pas encore vérifié. Saisissez le code envoyé par e-mail.",
                    "verification_requise": True,
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        return Response({"jeton": creer_jeton(utilisateur), "role": utilisateur.role})
