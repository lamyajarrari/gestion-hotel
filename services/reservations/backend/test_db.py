
from app.database import engine

try:
    with engine.connect() as connection:
        print("Connexion PostgreSQL réussie !")
except Exception as e:
    print("Erreur de connexion :", e)
