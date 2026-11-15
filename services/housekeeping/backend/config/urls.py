from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path("api/housekeeping/", include("housekeeping.urls")),
    path("api/housekeeping/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/housekeeping/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
]
