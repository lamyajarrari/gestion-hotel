
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.reservation import Reservation
from app.schemas.reservation import (
    ReservationCreate,
    ReservationResponse
)

router = APIRouter(
    prefix="/reservations",
    tags=["Réservations"]
)


# 1. Créer une réservation
@router.post("/", response_model=ReservationResponse)
def creer_reservation(
    reservation: ReservationCreate,
    db: Session = Depends(get_db)
):
    nouvelle_reservation = Reservation(
        **reservation.model_dump()
    )

    db.add(nouvelle_reservation)
    db.commit()
    db.refresh(nouvelle_reservation)

    return nouvelle_reservation


# 2. Consulter toutes les réservations
@router.get("/", response_model=list[ReservationResponse])
def obtenir_reservations(db: Session = Depends(get_db)):
    return db.query(Reservation).all()


# 3. Consulter une réservation par son identifiant
@router.get("/{id_reservation}", response_model=ReservationResponse)
def obtenir_reservation(
    id_reservation: str,
    db: Session = Depends(get_db)
):
    reservation = db.query(Reservation).filter(
        Reservation.idReservation == id_reservation
    ).first()

    if reservation is None:
        raise HTTPException(
            status_code=404,
            detail="Réservation introuvable"
        )

    return reservation
