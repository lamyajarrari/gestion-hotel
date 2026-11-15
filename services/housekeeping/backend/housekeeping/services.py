"""Règles de gestion du housekeeping (cahier des charges, section 4.3)."""
from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from . import clients
from .auth import normaliser_role
from .exceptions import ConflictError
from .models import (
    DemandeNettoyage, Priorite, ServiceMenage, StatutDemande, StatutService, TypeService,
)


def assigner(*, chambre_id, agent_id, type_service, date_prevue, gestionnaire_id,
             description="", priorite=Priorite.NORMALE):
    chambre = clients.get_chambre(chambre_id)
    etat = chambre.get("statut")

    if type_service == TypeService.DEPART and etat != clients.CHAMBRE_A_NETTOYER:
        raise ConflictError("Le ménage de départ exige une chambre « à nettoyer ».")
    if type_service == TypeService.QUOTIDIEN and etat != clients.CHAMBRE_OCCUPEE:
        raise ConflictError("Le ménage quotidien exige une chambre « occupée ».")

    agent = clients.get_user(agent_id)
    if normaliser_role(agent.get("role")) != "AGENT_MENAGE":
        raise ValidationError({"agent_id": "Cet utilisateur n'est pas un agent de ménage."})
    if str(agent.get("statut", "")).upper() != "ACTIF":
        raise ConflictError("Le compte de cet agent est inactif.")

    if ServiceMenage.objects.filter(chambre_id=str(chambre_id)).exclude(
        statut=StatutService.TERMINE
    ).exists():
        raise ConflictError("Cette chambre a déjà un service de ménage non terminé.")

    try:
        with transaction.atomic():
            return ServiceMenage.objects.create(
                chambre_id=str(chambre_id),
                agent_id=str(agent_id),
                type=type_service,
                date_prevue=date_prevue,
                description=description,
                priorite=priorite,
                assigne_par=str(gestionnaire_id),
            )
    except IntegrityError:  # demandes simultanées : la contrainte en base fait foi
        raise ConflictError("Cette chambre a déjà un service de ménage non terminé.")


def demarrer(service_id):
    with transaction.atomic():
        service = ServiceMenage.objects.select_for_update().get(pk=service_id)
        if service.statut != StatutService.ASSIGNE:
            raise ConflictError("Seul un service « assigné » peut être démarré.")
        service.statut = StatutService.EN_COURS
        service.date_debut = timezone.now()
        service.save(update_fields=["statut", "date_debut"])
        return service


def terminer(service_id):
    # Si l'appel au service chambres échoue, la transaction est annulée (rollback).
    with transaction.atomic():
        service = ServiceMenage.objects.select_for_update().get(pk=service_id)
        if service.statut != StatutService.EN_COURS:
            raise ConflictError("Seul un service « en cours » peut être terminé.")
        service.statut = StatutService.TERMINE
        service.date_fin = timezone.now()
        service.save(update_fields=["statut", "date_fin"])
        if service.demande_id:  # la demande du client suit son service de ménage
            DemandeNettoyage.objects.filter(pk=service.demande_id).update(statut=StatutDemande.TERMINEE)
        if service.type == TypeService.DEPART:
            clients.set_chambre_statut(service.chambre_id, clients.CHAMBRE_LIBRE)
        return service


def modifier(service_id, **champs):
    """Modifie la description, la priorité et/ou la date prévue d'un service qui n'est pas terminé
    (l'historique des services terminés est conservé tel quel)."""
    with transaction.atomic():
        service = ServiceMenage.objects.select_for_update().get(pk=service_id)
        if service.statut == StatutService.TERMINE:
            raise ConflictError("Un service terminé ne peut plus être modifié.")
        for nom, valeur in champs.items():
            setattr(service, nom, valeur)
        service.save(update_fields=list(champs))
        return service


def supprimer(service_id):
    """Supprime un service qui n'a pas encore démarré (erreur de saisie).
    Un service en cours ou terminé reste dans l'historique (cahier 4.3)."""
    with transaction.atomic():
        service = ServiceMenage.objects.select_for_update().get(pk=service_id)
        if service.statut != StatutService.ASSIGNE:
            raise ConflictError(
                "Seul un service « assigné » peut être supprimé : l'historique est conservé."
            )
        if service.demande_id:  # la demande du client redevient « à traiter »
            DemandeNettoyage.objects.filter(pk=service.demande_id).update(statut=StatutDemande.DEMANDE)
        service.delete()


# ---------- demandes de nettoyage des clients (spécifications H007 et H008)

def creer_demande(*, client_id, chambre_id, description, priorite=Priorite.NORMALE):
    chambre = clients.get_chambre(chambre_id)  # 404 si la chambre n'existe pas
    if chambre.get("statut") != clients.CHAMBRE_OCCUPEE:
        raise ConflictError("Un nettoyage ne peut être demandé que pour une chambre occupée.")
    try:
        with transaction.atomic():
            return DemandeNettoyage.objects.create(
                chambre_id=str(chambre_id), client_id=str(client_id),
                description=description, priorite=priorite,
            )
    except IntegrityError:
        raise ConflictError("Vous avez déjà une demande en cours pour cette chambre.")


def annuler_demande(demande_id):
    with transaction.atomic():
        demande = DemandeNettoyage.objects.select_for_update().get(pk=demande_id)
        if demande.statut != StatutDemande.DEMANDE:
            raise ConflictError("Seule une demande non traitée peut être annulée.")
        demande.statut = StatutDemande.ANNULEE
        demande.save(update_fields=["statut"])
        return demande


def traiter_demande(demande_id, *, agent_id, date_prevue, gestionnaire_id):
    """Prend en charge une demande : assigne un agent (ménage quotidien) et lie le service."""
    with transaction.atomic():
        demande = DemandeNettoyage.objects.select_for_update().get(pk=demande_id)
        if demande.statut != StatutDemande.DEMANDE:
            raise ConflictError("Cette demande a déjà été traitée.")
        service = assigner(
            chambre_id=demande.chambre_id, agent_id=agent_id, type_service=TypeService.QUOTIDIEN,
            date_prevue=date_prevue, gestionnaire_id=gestionnaire_id,
            description=demande.description, priorite=demande.priorite,
        )
        service.demande = demande
        service.save(update_fields=["demande"])
        demande.statut = StatutDemande.EN_COURS
        demande.save(update_fields=["statut"])
        return demande
