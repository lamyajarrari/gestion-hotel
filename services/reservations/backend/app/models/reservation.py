
import uuid
from datetime import date
from decimal import Decimal
from enum import Enum as PyEnum

from sqlalchemy import (
    Column,
    String,
    Date,
    Integer,
    Numeric,
    Enum
)

from app.database import Base


# Enumération des statuts de réservation
class StatutReservation(PyEnum):
    EN_ATTENTE = "EN_ATTENTE"
    CONFIRMEE = "CONFIRMEE"
    EN_COURS = "EN_COURS"
    TERMINEE = "TERMINEE"
    ANNULEE = "ANNULEE"


# Modèle Reservation
class Reservation(Base):

    __tablename__ = "reservations"

    idReservation = Column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    # Références vers les autres microservices
    client_id = Column(String, nullable=False)
    chambre_id = Column(Integer, nullable=False)

    dateDebut = Column(Date, nullable=False)
    dateFin = Column(Date, nullable=False)

    nombrePersonnes = Column(Integer, nullable=False)

    statut = Column(
        Enum(StatutReservation),
        nullable=False,
        default=StatutReservation.EN_ATTENTE
    )

    montantTotal = Column(
        Numeric(10, 2),
        nullable=False,
        default=Decimal("0.00")
    )
