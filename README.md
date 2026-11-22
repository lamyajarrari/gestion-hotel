# RiadManager — Riad Souss

Application de gestion d'hôtel en microservices : chambres, réservations, housekeeping (ménage) et utilisateurs. Chaque service a son API et son frontend, et tous partagent une base PostgreSQL.

## Lancer le projet

Prérequis : Docker Desktop.

```bash
git clone https://github.com/lamyajarrari/gestion-hotel.git
cd gestion-hotel
cp .env.example .env
docker compose up --build
```

## Adresses

| Service | Interface |
|---|---|
| Chambres | http://localhost:3001 |
| Réservations | http://localhost:3002 |
| Housekeeping | http://localhost:3003 |
| Utilisateurs | http://localhost:3004 |

## Arrêter le projet

```bash
docker compose down
```

## Tester

1. Ouvrez http://localhost:3004 et créez un compte.
2. Le code de vérification s'affiche dans les logs : `docker compose logs -f users-api`.
3. Entrez le code, puis connectez-vous.

## Tests unitaires

```bash
docker compose exec chambres-api python manage.py test
docker compose exec housekeeping-api python manage.py test
docker compose exec users-api python manage.py test
```