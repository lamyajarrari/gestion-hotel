"""Profil personnel et administration des comptes."""
from django.db.models import Q
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework.views import APIView

from .auth import EstGestionnaire, JWTAuthentication
from .models import Utilisateur
from .mot_de_passe import erreurs_mot_de_passe


ROLES_PERSONNEL = (Utilisateur.Role.AGENT_MENAGE, Utilisateur.Role.GESTIONNAIRE)


def representation(utilisateur):
    return {
        "id": utilisateur.pk,
        "email": utilisateur.email,
        "nom": utilisateur.nom,
        "prenom": utilisateur.prenom,
        "telephone": utilisateur.telephone,
        "role": utilisateur.role,
        "statut": utilisateur.statut,
        "date_creation": utilisateur.date_creation,
    }


def erreur(message, code=status.HTTP_400_BAD_REQUEST):
    return Response({"detail": message}, status=code)


def appliquer_identite(utilisateur, donnees):
    for champ in ("nom", "prenom"):
        if champ in donnees:
            valeur = str(donnees.get(champ) or "").strip()
            if not valeur:
                return f"Le champ « {champ} » ne peut pas être vide."
            setattr(utilisateur, champ, valeur[:100])
    if "telephone" in donnees:
        telephone = str(donnees.get("telephone") or "").strip()
        if len(telephone) > 20:
            return "Le téléphone ne doit pas dépasser 20 caractères."
        utilisateur.telephone = telephone
    return None


class VueComptes(APIView):
    authentication_classes = [JWTAuthentication]
    renderer_classes = [JSONRenderer]


class ProfilView(VueComptes):
    """Consultation et modification du profil de l'utilisateur connecté."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(representation(request.user))

    def patch(self, request):
        utilisateur = request.user
        message = appliquer_identite(utilisateur, request.data)
        if message:
            return erreur(message)

        nouveau = request.data.get("nouveau_mot_de_passe")
        if nouveau:
            if not utilisateur.check_password(request.data.get("mot_de_passe_actuel") or ""):
                return erreur("Le mot de passe actuel est incorrect.")
            if request.data.get("confirmation_mot_de_passe", nouveau) != nouveau:
                return erreur("Les mots de passe ne correspondent pas.")
            erreurs = erreurs_mot_de_passe(
                nouveau, utilisateur.email, utilisateur.nom, utilisateur.prenom
            )
            if erreurs:
                return erreur(" ".join(erreurs))
            utilisateur.set_password(nouveau)

        utilisateur.save()
        return Response(representation(utilisateur))


class UtilisateursView(VueComptes):
    """Liste des comptes et création des agents/gestionnaires."""
    permission_classes = [EstGestionnaire]

    def get(self, request):
        utilisateurs = Utilisateur.objects.all().order_by("nom", "prenom")
        role = request.query_params.get("role")
        statut = request.query_params.get("statut")
        recherche = (request.query_params.get("q") or "").strip()
        if role:
            utilisateurs = utilisateurs.filter(role=role)
        if statut:
            utilisateurs = utilisateurs.filter(statut=statut)
        if recherche:
            utilisateurs = utilisateurs.filter(
                Q(email__icontains=recherche)
                | Q(nom__icontains=recherche)
                | Q(prenom__icontains=recherche)
            )
        resultats = [representation(u) for u in utilisateurs[:500]]
        return Response({"count": len(resultats), "results": resultats})

    def post(self, request):
        donnees = request.data
        email = str(donnees.get("email") or "").strip().lower()
        nom = str(donnees.get("nom") or "").strip()
        prenom = str(donnees.get("prenom") or "").strip()
        mot_de_passe = str(donnees.get("mot_de_passe") or "")
        role = donnees.get("role") or Utilisateur.Role.AGENT_MENAGE
        if not all((email, nom, prenom, mot_de_passe)):
            return erreur("E-mail, mot de passe, nom et prénom sont obligatoires.")
        if role not in ROLES_PERSONNEL:
            return erreur("Le rôle doit être agent_menage ou gestionnaire.")
        erreurs = erreurs_mot_de_passe(mot_de_passe, email, nom, prenom)
        if erreurs:
            return erreur(" ".join(erreurs))
        if Utilisateur.objects.filter(email=email).exists():
            return erreur("Cette adresse e-mail est déjà utilisée.", status.HTTP_409_CONFLICT)

        utilisateur = Utilisateur(email=email, nom=nom[:100], prenom=prenom[:100], role=role)
        message = appliquer_identite(utilisateur, {"telephone": donnees.get("telephone", "")})
        if message:
            return erreur(message)
        utilisateur.set_password(mot_de_passe)
        utilisateur.save()
        return Response(representation(utilisateur), status=status.HTTP_201_CREATED)


class UtilisateurDetailView(VueComptes):
    permission_classes = [EstGestionnaire]

    def get_object(self, pk):
        return Utilisateur.objects.filter(pk=pk).first()

    def get(self, request, pk):
        utilisateur = self.get_object(pk)
        if utilisateur is None:
            return erreur("Utilisateur introuvable.", status.HTTP_404_NOT_FOUND)
        return Response(representation(utilisateur))

    def patch(self, request, pk):
        utilisateur = self.get_object(pk)
        if utilisateur is None:
            return erreur("Utilisateur introuvable.", status.HTTP_404_NOT_FOUND)

        role = request.data.get("role", utilisateur.role)
        statut = request.data.get("statut", utilisateur.statut)
        if role not in Utilisateur.Role.values or statut not in Utilisateur.Statut.values:
            return erreur("Rôle ou statut invalide.")
        if utilisateur.pk == request.user.pk and (role != utilisateur.role or statut != utilisateur.statut):
            return erreur("Vous ne pouvez pas modifier votre propre rôle ou statut.", status.HTTP_409_CONFLICT)
        if (
                Utilisateur.Role.ADMIN in (utilisateur.role, role)
                and request.user.role != Utilisateur.Role.ADMIN
        ):
            return erreur("Seul un administrateur peut gérer un compte administrateur.", status.HTTP_403_FORBIDDEN)

        message = appliquer_identite(utilisateur, request.data)
        if message:
            return erreur(message)
        utilisateur.role = role
        utilisateur.statut = statut
        utilisateur.save()
        return Response(representation(utilisateur))