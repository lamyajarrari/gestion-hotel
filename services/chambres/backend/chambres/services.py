from datetime import date

from django.db import transaction
from django.utils import timezone

from .models import Chambre

E = Chambre.Etat


class TransitionInvalide(Exception):
    pass


# Transitions autorisées (cahier 4.1 et 4.3)
TRANSITIONS = {
    E.DISPONIBLE: {E.OCCUPEE, E.MAINTENANCE},
    E.OCCUPEE: {E.A_NETTOYER},
    E.A_NETTOYER: {E.DISPONIBLE, E.MAINTENANCE},
    E.MAINTENANCE: {E.DISPONIBLE},
}


@transaction.atomic
def changer_etat(chambre_id, nouvel_etat):
    """Change l'état d'une chambre, en la verrouillant pour éviter les modifications concurrentes."""
    chambre = Chambre.objects.select_for_update().get(pk=chambre_id)

    if nouvel_etat == chambre.etat:
        return chambre

    if nouvel_etat not in TRANSITIONS.get(chambre.etat, set()):
        raise TransitionInvalide(
            f"Transition interdite : « {chambre.get_etat_display()} » vers "
            f"« {E(nouvel_etat).label} »."
        )

    chambre.etat = nouvel_etat
    chambre.save(update_fields=["etat", "updated_at"])
    return chambre


def est_libre_sur_periode(chambre, debut, fin, aujourdhui=None):
    if aujourdhui is None:
        aujourdhui = timezone.localdate()

    if not chambre.actif or chambre.etat == E.MAINTENANCE:
        return False

    if debut <= aujourdhui and chambre.etat in {E.OCCUPEE, E.A_NETTOYER}:
        return False

    # Deux périodes se chevauchent si l'une commence avant la fin de l'autre
    # et finit après le début de l'autre.
    chevauche = chambre.indisponibilites.filter(
        date_debut__lt=fin,
        date_fin__gt=debut,
    ).exists()

    return not chevauche

def valider_periode(debut, fin):
    """Retourne (debut, fin) ou lève ValueError si la période est invalide."""
    if not isinstance(debut, date) or not isinstance(fin, date):
        raise ValueError("Les dates doivent être au format AAAA-MM-JJ.")
    if fin <= debut:
        raise ValueError("La date de fin doit être postérieure à la date de début.")
    return debut, fin