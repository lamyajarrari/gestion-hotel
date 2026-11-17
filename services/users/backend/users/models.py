from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.db import models


class UtilisateurManager(BaseUserManager):
    def create_user(self, email, mot_de_passe=None, **extra):
        if not email:
            raise ValueError("L'adresse e-mail est obligatoire.")
        utilisateur = self.model(email=self.normalize_email(email), **extra)
        utilisateur.set_password(mot_de_passe)
        utilisateur.save(using=self._db)
        return utilisateur


class Utilisateur(AbstractBaseUser):
    class Role(models.TextChoices):
        CLIENT = "client", "Client"
        GESTIONNAIRE = "gestionnaire", "Gestionnaire"
        AGENT_MENAGE = "agent_menage", "Agent de ménage"
        ADMIN = "admin", "Administrateur"

    class Statut(models.TextChoices):
        ACTIF = "actif", "Actif"
        INACTIF = "inactif", "Inactif"

    email = models.EmailField(unique=True)
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    telephone = models.CharField(max_length=20, blank=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.CLIENT)
    statut = models.CharField(max_length=10, choices=Statut.choices, default=Statut.ACTIF)
    date_creation = models.DateTimeField(auto_now_add=True)

    objects = UtilisateurManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["nom", "prenom"]

    def __str__(self):
        return self.email