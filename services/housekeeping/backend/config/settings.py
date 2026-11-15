import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-only-insecure-key")
DEBUG = os.getenv("DJANGO_DEBUG", "0") == "1"
ALLOWED_HOSTS = os.getenv("DJANGO_ALLOWED_HOSTS", "*").split(",")

INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.auth",
    "corsheaders",
    "rest_framework",
    "drf_spectacular",
    "housekeeping",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"

# --- Base de données ---
# Une seule base PostgreSQL partagée, mais UN SCHÉMA PAR SERVICE : les tables
# (y compris django_migrations, auth_*, ...) de housekeeping vivent dans le schéma
# "housekeeping" et ne peuvent pas entrer en conflit avec celles des autres services.
POSTGRES_SCHEMA = os.getenv("POSTGRES_SCHEMA", "housekeeping")

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("POSTGRES_DB", "riadmanager"),
        "USER": os.getenv("POSTGRES_USER", "riad"),
        "PASSWORD": os.getenv("POSTGRES_PASSWORD", ""),
        "HOST": os.getenv("POSTGRES_HOST", "db"),
        "PORT": os.getenv("POSTGRES_PORT", "5432"),
        "OPTIONS": {"options": f"-c search_path={POSTGRES_SCHEMA}"},
    }
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
LANGUAGE_CODE = "fr-fr"
TIME_ZONE = "Africa/Casablanca"
USE_TZ = True

# --- Secrets partagés (variables du .env commun) ---
JWT_SECRET = os.getenv("JWT_SECRET", "change_me_commun_a_tous_les_services")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
INTERNAL_API_TOKEN = os.getenv("INTERNAL_API_TOKEN", "change_me_interne")

# --- URLs des autres services (réseau Docker Compose) ---
CHAMBRES_API_URL = os.getenv("CHAMBRES_API_URL", "http://chambres-api:8000").rstrip("/")
USERS_API_URL = os.getenv("USERS_API_URL", "http://users-api:8000").rstrip("/")
CHAMBRES_ETAT_FIELD = os.getenv("CHAMBRES_ETAT_FIELD", "etat")  # nom du champ d'état côté chambres
EXTERNAL_TIMEOUT = float(os.getenv("EXTERNAL_TIMEOUT", "2"))  # < 2 s demandé au cahier des charges

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ["housekeeping.auth.JWTAuthentication"],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 50,
    "UNAUTHENTICATED_USER": None,
}

SPECTACULAR_SETTINGS = {
    "TITLE": "RiadManager - Service Housekeeping",
    "DESCRIPTION": "API de gestion des services de ménage (assigner, démarrer, terminer).",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
}

CORS_ALLOWED_ORIGINS = [
    o for o in os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:3003,http://localhost:5173").split(",") if o
]

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "root": {"handlers": ["console"], "level": os.getenv("LOG_LEVEL", "INFO")},
}
