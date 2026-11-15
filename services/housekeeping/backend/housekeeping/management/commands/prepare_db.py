import time

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Attend que PostgreSQL réponde, puis crée le schéma propre au service."

    def add_arguments(self, parser):
        parser.add_argument("--timeout", type=int, default=60, help="Secondes d'attente max.")

    def handle(self, *args, **options):
        db = settings.DATABASES["default"]
        import psycopg
        from psycopg import sql

        schema = settings.POSTGRES_SCHEMA
        deadline = time.time() + options["timeout"]
        while True:
            try:
                with psycopg.connect(
                    dbname=db["NAME"], user=db["USER"], password=db["PASSWORD"],
                    host=db["HOST"], port=db["PORT"], connect_timeout=3, autocommit=True,
                ) as conn:
                    conn.execute(
                        sql.SQL("CREATE SCHEMA IF NOT EXISTS {}").format(sql.Identifier(schema))
                    )
                break
            except psycopg.OperationalError as exc:
                if time.time() > deadline:
                    raise CommandError(f"PostgreSQL injoignable : {exc}")
                self.stdout.write("En attente de PostgreSQL...")
                time.sleep(2)
        self.stdout.write(self.style.SUCCESS(f"Base prête, schéma « {schema} » disponible."))
