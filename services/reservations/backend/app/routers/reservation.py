
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.reservation import Reservation, StatutReservation
from app.schemas.reservation import (
    ReservationCreate,
    ReservationUpdate,
    ReservationResponse,
)

router = APIRouter(
    prefix="/reservations",
    tags=["Réservations"]
)


# Fonction utilitaire : rechercher une réservation
def rechercher_reservation(id_reservation: str, db: Session):
    reservation = db.query(Reservation).filter(
        Reservation.idReservation == id_reservation
    ).first()

    if reservation is None:
        raise HTTPException(
            status_code=404,
            detail="Réservation introuvable"
        )

    return reservation


# Fonction utilitaire : vérifier les chevauchements
def verifier_disponibilite(
    chambre_id: int,
    date_debut: date,
    date_fin: date,
    db: Session,
    id_a_exclure: str | None = None
):
    query = db.query(Reservation).filter(
        Reservation.chambre_id == chambre_id,
        Reservation.dateDebut < date_fin,
        Reservation.dateFin > date_debut,
        Reservation.statut != StatutReservation.ANNULEE
    )

    if id_a_exclure is not None:
        query = query.filter(
            Reservation.idReservation != id_a_exclure
        )

    if query.first():
        raise HTTPException(
            status_code=409,
            detail="Cette chambre est déjà réservée pendant cette période."
        )


# 1. Créer une réservation
@router.post("/", response_model=ReservationResponse, status_code=201)
def creer_reservation(
    reservation: ReservationCreate,
    db: Session = Depends(get_db)
):
    verifier_disponibilite(
        reservation.chambre_id,
        reservation.dateDebut,
        reservation.dateFin,
        db
    )

    nouvelle_reservation = Reservation(
        **reservation.model_dump(),
        montantTotal=0
    )

    db.add(nouvelle_reservation)
    db.commit()
    db.refresh(nouvelle_reservation)

    return nouvelle_reservation


# 2. Consulter toutes les réservations avec filtres facultatifs
@router.get("/", response_model=list[ReservationResponse])
def obtenir_reservations(
    client_id: str | None = None,
    chambre_id: int | None = None,
    statut: StatutReservation | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(Reservation)

    if client_id is not None:
        query = query.filter(Reservation.client_id == client_id)

    if chambre_id is not None:
        query = query.filter(Reservation.chambre_id == chambre_id)

    if statut is not None:
        query = query.filter(Reservation.statut == statut)

    return query.order_by(Reservation.dateDebut.desc()).all()


# 3. Consulter une réservation par son identifiant
@router.get("/{id_reservation}", response_model=ReservationResponse)
def obtenir_reservation(
    id_reservation: str,
    db: Session = Depends(get_db)
):
    return rechercher_reservation(id_reservation, db)


# 4. Modifier une réservation
@router.put("/{id_reservation}", response_model=ReservationResponse)
def modifier_reservation(
    id_reservation: str,
    modifications: ReservationUpdate,
    db: Session = Depends(get_db)
):
    reservation = rechercher_reservation(id_reservation, db)

    if reservation.statut != StatutReservation.EN_ATTENTE:
        raise HTTPException(
            status_code=400,
            detail="Seules les réservations en attente peuvent être modifiées."
        )

    donnees = modifications.model_dump(exclude_unset=True)

    nouvelle_date_debut = donnees.get(
        "dateDebut", reservation.dateDebut
    )
    nouvelle_date_fin = donnees.get(
        "dateFin", reservation.dateFin
    )
    nouvelle_chambre_id = donnees.get(
        "chambre_id", reservation.chambre_id
    )

    if nouvelle_date_fin <= nouvelle_date_debut:
        raise HTTPException(
            status_code=422,
            detail="La date de départ doit être après la date d'arrivée."
        )

    verifier_disponibilite(
        nouvelle_chambre_id,
        nouvelle_date_debut,
        nouvelle_date_fin,
        db,
        id_a_exclure=id_reservation
    )

    for champ, valeur in donnees.items():
        setattr(reservation, champ, valeur)

    db.commit()
    db.refresh(reservation)

    return reservation


# 5. Supprimer une réservation
@router.delete("/{id_reservation}")
def supprimer_reservation(
    id_reservation: str,
    db: Session = Depends(get_db)
):
    reservation = rechercher_reservation(id_reservation, db)

    if reservation.statut == StatutReservation.EN_COURS:
        raise HTTPException(
            status_code=400,
            detail="Impossible de supprimer un séjour en cours."
        )

    db.delete(reservation)
    db.commit()

    return {
        "message": "Réservation supprimée avec succès",
        "idReservation": id_reservation
    }


# 6. Vérifier la disponibilité d'une chambre
@router.get("/disponibilite/{chambre_id}")
def verifier_chambre(
    chambre_id: int,
    dateDebut: date = Query(...),
    dateFin: date = Query(...),
    db: Session = Depends(get_db)
):
    if dateFin <= dateDebut:
        raise HTTPException(
            status_code=422,
            detail="La date de départ doit être après la date d'arrivée."
        )

    reservation_existante = db.query(Reservation).filter(
        Reservation.chambre_id == chambre_id,
        Reservation.dateDebut < dateFin,
        Reservation.dateFin > dateDebut,
        Reservation.statut != StatutReservation.ANNULEE
    ).first()

    return {
        "chambre_id": chambre_id,
        "dateDebut": dateDebut,
        "dateFin": dateFin,
        "disponible": reservation_existante is None
    }


# Fonction utilitaire : changer le statut
def changer_statut(
    id_reservation: str,
    statut_actuel: StatutReservation,
    nouveau_statut: StatutReservation,
    db: Session
):
    reservation = rechercher_reservation(id_reservation, db)

    if reservation.statut != statut_actuel:
        raise HTTPException(
            status_code=400,
            detail=f"Action impossible : statut actuel = {reservation.statut.value}"
        )

    reservation.statut = nouveau_statut
    db.commit()
    db.refresh(reservation)

    return reservation


# 7. Confirmer une réservation
@router.patch("/{id_reservation}/confirmer", response_model=ReservationResponse)
def confirmer_reservation(
    id_reservation: str,
    db: Session = Depends(get_db)
):
    return changer_statut(
        id_reservation,
        StatutReservation.EN_ATTENTE,
        StatutReservation.CONFIRMEE,
        db
    )


# 8. Annuler une réservation
@router.patch("/{id_reservation}/annuler", response_model=ReservationResponse)
def annuler_reservation(
    id_reservation: str,
    db: Session = Depends(get_db)
):
    reservation = rechercher_reservation(id_reservation, db)

    if reservation.statut not in (
        StatutReservation.EN_ATTENTE,
        StatutReservation.CONFIRMEE
    ):
        raise HTTPException(
            status_code=400,
            detail="Cette réservation ne peut pas être annulée."
        )

    reservation.statut = StatutReservation.ANNULEE
    db.commit()
    db.refresh(reservation)

    return reservation


# 9. Démarrer un séjour
@router.patch("/{id_reservation}/demarrer", response_model=ReservationResponse)
def demarrer_sejour(
    id_reservation: str,
    db: Session = Depends(get_db)
):
    return changer_statut(
        id_reservation,
        StatutReservation.CONFIRMEE,
        StatutReservation.EN_COURS,
        db
    )


# 10. Terminer un séjour
@router.patch("/{id_reservation}/terminer", response_model=ReservationResponse)
def terminer_sejour(
    id_reservation: str,
    db: Session = Depends(get_db)
):
    return changer_statut(
        id_reservation,
        StatutReservation.EN_COURS,
        StatutReservation.TERMINEE,
        db
    )
