from django.urls import path

from .comptes import ProfilView, UtilisateurDetailView, UtilisateursView
from .views import ConnexionView, InscriptionView, RenvoyerCodeView, VerifierCodeView
from .reset_views import changer_mot_de_passe, mot_de_passe_oublie, reinitialiser

urlpatterns = [
    path("inscription/", InscriptionView.as_view(), name="inscription"),
    path("verifier-code/", VerifierCodeView.as_view(), name="verifier-code"),
    path("renvoyer-code/", RenvoyerCodeView.as_view(), name="renvoyer-code"),
    path("connexion/", ConnexionView.as_view(), name="connexion"),
    path("mot-de-passe-oublie/", mot_de_passe_oublie),
    path("reinitialiser/", reinitialiser),
    path("changer-mot-de-passe/", changer_mot_de_passe),
    path("moi/", ProfilView.as_view(), name="profil"),
    path("utilisateurs/", UtilisateursView.as_view(), name="utilisateurs"),
    path("utilisateurs/<int:pk>/", UtilisateurDetailView.as_view(), name="utilisateur-detail"),
]