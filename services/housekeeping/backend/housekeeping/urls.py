from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import DemandeViewSet, ServiceMenageViewSet, health

router = DefaultRouter()
router.register("services", ServiceMenageViewSet, basename="service-menage")
router.register("demandes", DemandeViewSet, basename="demande")

urlpatterns = [
    path("health/", health),
    path("", include(router.urls)),
]
