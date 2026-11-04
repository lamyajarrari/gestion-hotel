from django.urls import include, path
from rest_framework.routers import SimpleRouter

from chambres.views import (
    ChambreAdminViewSet,
    ChambreConsultationViewSet,
    ChambreInterneViewSet,
    IndisponibiliteAdminViewSet,
)

public_router = SimpleRouter(trailing_slash=True)
public_router.register("chambres", ChambreConsultationViewSet, basename="chambre-public")

admin_router = SimpleRouter(trailing_slash=True)
admin_router.register("chambres", ChambreAdminViewSet, basename="chambre-admin")
admin_router.register( "indisponibilites", IndisponibiliteAdminViewSet, basename="indisponibilite-admin",)

internal_router = SimpleRouter(trailing_slash=True)
internal_router.register("chambres", ChambreInterneViewSet, basename="chambre-interne")

urlpatterns = [
    path("api/", include(public_router.urls)),
    path("api/admin/", include(admin_router.urls)),
    path("api/internal/", include(internal_router.urls)),
]