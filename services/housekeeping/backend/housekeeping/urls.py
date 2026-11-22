from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import DemandeViewSet, ServiceMenageViewSet, agents, health, verifier_chambre

router = DefaultRouter()
router.register("services", ServiceMenageViewSet, basename="service-menage")
router.register("demandes", DemandeViewSet, basename="demande")

urlpatterns = [
    path("health/", health),
    path("chambres/verifier/", verifier_chambre),
    path("agents/", agents),
    path("", include(router.urls)),
]