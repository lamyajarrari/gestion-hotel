from datetime import date
from decimal import Decimal

from app.models.reservation import Reservation, StatutReservation


def creer_reservation_en_base(
    db,
    *,
    client_id="client_test",
    chambre_id=10,
    date_debut=date(2026, 12, 10),
    date_fin=date(2026, 12, 13),
    nombre_personnes=2,
    statut=StatutReservation.EN_ATTENTE,
):
    reservation = Reservation(
        client_id=client_id,
        chambre_id=chambre_id,
        dateDebut=date_debut,
        dateFin=date_fin,
        nombrePersonnes=nombre_personnes,
        statut=statut,
        montantTotal=Decimal("0.00"),
    )
    db.add(reservation)
    db.commit()
    db.refresh(reservation)
    return reservation
