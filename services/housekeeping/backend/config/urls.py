from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from housekeeping.internal import notification_chambre_a_nettoyer

urlpatterns = [
    # Appelée par le service chambres (jeton interne) : la chambre vient de passer à « à nettoyer »
    path("api/internal/taches/", notification_chambre_a_nettoyer),
    path("api/housekeeping/", include("housekeeping.urls")),
    path("api/housekeeping/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/housekeeping/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
]
