from django.urls import path

from .views import ConnexionView, InscriptionView
from .reset_views import changer_mot_de_passe, mot_de_passe_oublie, reinitialiser

urlpatterns = [
    path("inscription/", InscriptionView.as_view(), name="inscription"),
    path("connexion/", ConnexionView.as_view(), name="connexion"),
    path("mot-de-passe-oublie/", mot_de_passe_oublie),
    path("reinitialiser/", reinitialiser),
    path("changer-mot-de-passe/", changer_mot_de_passe),
]