from django.core.management.base import BaseCommand, CommandError

from users.models import Utilisateur
from users.mot_de_passe import erreurs_mot_de_passe


class Command(BaseCommand):
    help = "Crée un compte gestionnaire, administrateur ou agent de ménage."

    def add_arguments(self, parser):
        parser.add_argument("email")
        parser.add_argument("mot_de_passe")
        parser.add_argument("--nom", default="Personnel")
        parser.add_argument("--prenom", default="Compte")
        parser.add_argument(
            "--role", choices=["gestionnaire", "admin", "agent_menage"], default="agent_menage"
        )

    def handle(self, *args, **options):
        email = options["email"].strip().lower()
        erreurs = erreurs_mot_de_passe(
            options["mot_de_passe"], email, options["nom"], options["prenom"]
        )
        if erreurs:
            raise CommandError(" ".join(erreurs))
        if Utilisateur.objects.filter(email=email).exists():
            raise CommandError(f"{email} existe déjà.")
        utilisateur = Utilisateur.objects.create_user(
            email=email,
            mot_de_passe=options["mot_de_passe"],
            nom=options["nom"],
            prenom=options["prenom"],
            role=options["role"],
        )
        self.stdout.write(self.style.SUCCESS(f"Compte créé : id={utilisateur.pk} rôle={utilisateur.role}"))