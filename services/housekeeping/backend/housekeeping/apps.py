from django.apps import AppConfig
from django.conf import settings
from django.db.backends.signals import connection_created

_schemas_prets = set()


def creer_schema_si_absent(sender, connection, **kwargs):
    """Crée le schéma propre au service à la première connexion à chaque base.

    Nécessaire aussi pour la base temporaire des tests (test_<nom>), qui est vide.
    """
    cle = (connection.settings_dict["NAME"], settings.POSTGRES_SCHEMA)
    if cle in _schemas_prets:
        return
    with connection.cursor() as cursor:
        cursor.execute(
            f"CREATE SCHEMA IF NOT EXISTS {connection.ops.quote_name(settings.POSTGRES_SCHEMA)}"
        )
    _schemas_prets.add(cle)


class HousekeepingConfig(AppConfig):
    name = "housekeeping"
    verbose_name = "Housekeeping"

    def ready(self):
        connection_created.connect(creer_schema_si_absent)
