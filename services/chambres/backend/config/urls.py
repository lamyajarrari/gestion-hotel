from django.urls import include, path
from rest_framework.routers import SimpleRouter

from chambres.views import ChambreConsultationViewSet

router = SimpleRouter(trailing_slash=True)
router.register("chambres", ChambreConsultationViewSet, basename="chambre-public")

urlpatterns = [
    path("api/", include(router.urls)),
]