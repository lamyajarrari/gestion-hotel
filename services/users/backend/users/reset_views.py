import json
import logging

from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.http import JsonResponse
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from .models import Utilisateur
from .mot_de_passe import erreurs_mot_de_passe

logger = logging.getLogger(__name__)


def _donnees(request):
    try:
        donnees = json.loads(request.body or "{}")
        return donnees if isinstance(donnees, dict) else {}
    except json.JSONDecodeError:
        return {}


@csrf_exempt
@require_POST
def mot_de_passe_oublie(request):
    email = str(_donnees(request).get("email", "")).strip().lower()
    utilisateur = Utilisateur.objects.filter(email=email, statut="actif").first()
    if utilisateur:
        uid = urlsafe_base64_encode(force_bytes(utilisateur.pk))
        jeton = default_token_generator.make_token(utilisateur)
        lien = f"{settings.FRONT_USERS_URL}/reinitialiser?uid={uid}&jeton={jeton}"
        try:
            send_mail(
                "Réinitialisation de votre mot de passe",
                f"Bonjour {utilisateur.prenom},\n\n"
                f"Pour choisir un nouveau mot de passe, ouvrez ce lien :\n{lien}\n\n"
                "Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.",
                None,
                [utilisateur.email],
            )
        except Exception:
            logger.exception("Échec de l'envoi de l'e-mail de réinitialisation")
    # Même réponse que le compte existe ou non
    return JsonResponse({"detail": "Si ce compte existe, un e-mail a été envoyé."})


@csrf_exempt
@require_POST
def reinitialiser(request):
    donnees = _donnees(request)
    try:
        pk = urlsafe_base64_decode(str(donnees.get("uid", ""))).decode()
        utilisateur = Utilisateur.objects.get(pk=pk)
    except (ValueError, TypeError, OverflowError, Utilisateur.DoesNotExist):
        utilisateur = None

    if utilisateur is None or not default_token_generator.check_token(
        utilisateur, str(donnees.get("jeton", ""))
    ):
        return JsonResponse({"detail": "Lien invalide ou expiré."}, status=400)

    mot_de_passe = str(donnees.get("mot_de_passe", ""))
    erreurs = erreurs_mot_de_passe(
        mot_de_passe, utilisateur.email, utilisateur.nom, utilisateur.prenom
    )
    if erreurs:
        return JsonResponse({"detail": " ".join(erreurs)}, status=400)

    utilisateur.set_password(mot_de_passe)
    utilisateur.save()
    return JsonResponse({"detail": "Mot de passe modifié."})


@csrf_exempt
@require_POST
def changer_mot_de_passe(request):
    donnees = _donnees(request)
    email = str(donnees.get("email", "")).strip().lower()
    ancien = str(donnees.get("ancien", ""))
    nouveau = str(donnees.get("mot_de_passe", ""))

    utilisateur = Utilisateur.objects.filter(email=email, statut="actif").first()
    if utilisateur is None or not utilisateur.check_password(ancien):
        return JsonResponse({"detail": "E-mail ou ancien mot de passe incorrect."}, status=400)
    if nouveau == ancien:
        return JsonResponse(
            {"detail": "Le nouveau mot de passe doit être différent de l'ancien."}, status=400
        )
    erreurs = erreurs_mot_de_passe(nouveau, utilisateur.email, utilisateur.nom, utilisateur.prenom)
    if erreurs:
        return JsonResponse({"detail": " ".join(erreurs)}, status=400)

    utilisateur.set_password(nouveau)
    utilisateur.save()
    return JsonResponse({"detail": "Mot de passe modifié."})