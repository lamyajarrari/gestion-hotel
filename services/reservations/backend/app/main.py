from datetime import date
from fastapi import FastAPI, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.database import Base, engine, get_db
from app.models.reservation import Reservation, StatutReservation  # noqa: F401
from app.routers.reservation import router as reservation_router

# Crée les tables qui n'existent pas encore (sans toucher aux existantes)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="RiadManager - Service Réservations",
    description="API REST pour la gestion des réservations hôtelières",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Accueil"])
def accueil():
    return {
        "message": "Bienvenue dans le microservice Reservations",
        "service": "reservations"
    }


@app.get("/health", tags=["Santé"])
def health_check():
    return {
        "status": "ok",
        "service": "reservations"
    }


# Route interne appelée par le microservice Chambres
@app.get("/api/internal/reservations/existe/", tags=["Interne"])
def verifier_reservation_existante(
    chambre: int = Query(...),
    debut: date = Query(...),
    fin: date = Query(...),
    db: Session = Depends(get_db)
):
    reservation = db.query(Reservation).filter(
        Reservation.chambre_id == chambre,
        Reservation.dateDebut < fin,
        Reservation.dateFin > debut,
        Reservation.statut != StatutReservation.ANNULEE
    ).first()

    return {"existe": reservation is not None}


app.include_router(reservation_router)