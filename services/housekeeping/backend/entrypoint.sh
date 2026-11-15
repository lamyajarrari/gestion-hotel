#!/bin/sh
set -e

# 1) Attend PostgreSQL et crée le schéma "housekeeping" s'il n'existe pas
python manage.py prepare_db

# 2) Applique uniquement les migrations de ce service (dans son propre schéma)
python manage.py migrate --noinput

# 3) Démarre l'API
exec gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3 --access-logfile -
