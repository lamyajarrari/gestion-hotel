
from fastapi import FastAPI
from app.routers.reservation import router as reservation_router

app = FastAPI(
    title="RiadManager - Service Réservations",
    description="API REST pour la gestion des réservations hôtelières",
    version="1.0.0"
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


app.include_router(reservation_router)
