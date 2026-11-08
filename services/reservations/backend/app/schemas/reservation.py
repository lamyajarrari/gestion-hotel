
from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.reservation import StatutReservation


# Schéma utilisé pour créer une réservation
class ReservationCreate(BaseModel):
    client_id: str
    chambre_id: int
    dateDebut: date
    dateFin: date
    nombrePersonnes: int = Field(gt=0)

    @model_validator(mode="after")
    def verifier_dates(self):
        if self.dateFin <= self.dateDebut:
            raise ValueError(
                "La date de départ doit être après la date d'arrivée."
            )
        return self


# Schéma utilisé pour retourner une réservation
class ReservationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    idReservation: str
    client_id: str
    chambre_id: int
    dateDebut: date
    dateFin: date
    nombrePersonnes: int
    statut: StatutReservation
    montantTotal: Decimal
