import datetime

import jwt
from django.conf import settings
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Génère un JWT de test (même format que celui émis par le service users)."

    def add_arguments(self, parser):
        parser.add_argument("--user-id", default="1")
        parser.add_argument(
            "--role", default="GESTIONNAIRE", choices=["GESTIONNAIRE", "CLIENT", "AGENT_MENAGE"]
        )
        parser.add_argument("--hours", type=int, default=8, help="Durée de validité.")

    def handle(self, *args, **options):
        # Même vocabulaire que le service chambres : « sub » et rôle en minuscules (admin = gestionnaire).
        role = {"GESTIONNAIRE": "admin", "CLIENT": "client", "AGENT_MENAGE": "agent_menage"}[options["role"]]
        payload = {
            "sub": options["user_id"],
            "user_id": options["user_id"],
            "role": role,
            "exp": datetime.datetime.now(datetime.timezone.utc)
            + datetime.timedelta(hours=options["hours"]),
        }
        token = jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
        self.stdout.write(token)
