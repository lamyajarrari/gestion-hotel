from django.urls import include, path

from users.interne import utilisateur_interne

urlpatterns = [
    path("api/auth/", include("users.urls")),
    path("api/users/<int:pk>/", utilisateur_interne, name="utilisateur-interne"),
]