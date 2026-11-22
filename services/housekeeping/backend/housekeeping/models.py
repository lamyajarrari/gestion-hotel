import uuid

from django.db import models
from django.db.models import Q


class TypeService(models.TextChoices):
    QUOTIDIEN = "QUOTIDIEN", "Quotidien"
    DEPART = "DEPART", "Départ"


class StatutService(models.TextChoices):
    ASSIGNE = "ASSIGNE", "Assigné"
    EN_COURS = "EN_COURS", "En cours"
    TERMINE = "TERMINE", "Terminé"


class Priorite(models.TextChoices):
    BASSE = "BASSE", "Basse"
    NORMALE = "NORMALE", "Normale"
    HAUTE = "HAUTE", "Haute"


class StatutDemande(models.TextChoices):
    DEMANDE = "DEMANDE", "Demandée"
    EN_COURS = "EN_COURS", "En cours"
    TERMINEE = "TERMINEE", "Terminée"
    ANNULEE = "ANNULEE", "Annulée"


class DemandeNettoyage(models.Model):
    """Demande de nettoyage faite par un client (spécifications H007 et H008).
    Le gestionnaire la traite en assignant un agent : cela crée un service de ménage quotidien."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    chambre_id = models.CharField(max_length=64, db_index=True)
    chambre_numero = models.CharField(max_length=32, blank=True, default="")  # affichage
    client_id = models.CharField(max_length=64, db_index=True)
    description = models.TextField()
    priorite = models.CharField(max_length=10, choices=Priorite.choices, default=Priorite.NORMALE)
    statut = models.CharField(
        max_length=10, choices=StatutDemande.choices, default=StatutDemande.DEMANDE
    )
    date_demande = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "housekeeping_demandenettoyage"
        ordering = ["-date_demande"]
        constraints = [
            models.UniqueConstraint(
                fields=["chambre_id", "client_id"],
                condition=Q(statut__in=["DEMANDE", "EN_COURS"]),
                name="une_demande_ouverte_par_client_et_chambre",
            )
        ]

    def __str__(self):
        return f"Demande chambre={self.chambre_id} client={self.client_id} [{self.statut}]"


class ServiceMenage(models.Model):
    """Service de ménage. Aucune clé étrangère vers les autres services :
    chambre_id et agent_id sont des références validées via leurs API."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    chambre_id = models.CharField(max_length=64, db_index=True)
    chambre_numero = models.CharField(max_length=32, blank=True, default="")  # affichage
    agent_id = models.CharField(max_length=64, db_index=True)
    agent_nom = models.CharField(max_length=201, blank=True, default="")  # affichage
    type = models.CharField(max_length=10, choices=TypeService.choices)
    statut = models.CharField(
        max_length=10, choices=StatutService.choices, default=StatutService.ASSIGNE
    )
    description = models.TextField(blank=True, default="")
    priorite = models.CharField(
        max_length=10, choices=Priorite.choices, default=Priorite.NORMALE
    )
    date_prevue = models.DateField()
    date_creation = models.DateTimeField(auto_now_add=True)
    date_debut = models.DateTimeField(null=True, blank=True)
    date_fin = models.DateTimeField(null=True, blank=True)
    assigne_par = models.CharField(max_length=64)
    demande = models.ForeignKey(
        DemandeNettoyage, null=True, blank=True, on_delete=models.SET_NULL, related_name="services"
    )

    class Meta:
        db_table = "housekeeping_servicemenage"
        ordering = ["-date_creation"]
        constraints = [
            # Une chambre ne peut avoir qu'un seul service non terminé à la fois.
            models.UniqueConstraint(
                fields=["chambre_id"],
                condition=~Q(statut="TERMINE"),
                name="un_service_non_termine_par_chambre",
            )
        ]

    def __str__(self):
        return f"{self.type} chambre={self.chambre_id} agent={self.agent_id} [{self.statut}]"