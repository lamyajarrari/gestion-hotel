from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models


class Chambre(models.Model):
    class Type(models.TextChoices):
        SIMPLE = "simple", "Simple"
        DOUBLE = "double", "Double"
        SUITE = "suite", "Suite"

    class Etat(models.TextChoices):
        DISPONIBLE = "disponible", "Disponible"
        OCCUPEE = "occupee", "Occupée"
        A_NETTOYER = "a_nettoyer", "À nettoyer"
        MAINTENANCE = "maintenance", "En maintenance"

    image = models.ImageField(upload_to="chambres/", blank=True, null=True)
    numero = models.CharField(max_length=10, unique=True)
    type = models.CharField(max_length=20, choices=Type.choices)
    capacite = models.PositiveSmallIntegerField(validators=[MinValueValidator(1)])
    tarif = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    etat = models.CharField(max_length=20, choices=Etat.choices, default=Etat.DISPONIBLE)
    actif = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "chambres_chambre"
        ordering = ["numero"]

    def __str__(self):
        return f"Chambre {self.numero}"

    
class Indisponibilite(models.Model):
    """Période pendant laquelle une chambre ne peut pas être proposée (cahier 4.1)."""

    chambre = models.ForeignKey(
        Chambre,
        on_delete=models.CASCADE,
        related_name="indisponibilites",
    )
    date_debut = models.DateField()
    date_fin = models.DateField()
    motif = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = "chambres_indisponibilite"
        ordering = ["date_debut"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(date_fin__gt=models.F("date_debut")),
                name="indispo_dates_valides",
            )
        ]

    def __str__(self):
        return f"{self.chambre} du {self.date_debut} au {self.date_fin}"