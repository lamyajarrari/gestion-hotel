# Tests unitaires — Microservice Reservations

## 1. Emplacement

Copier le dossier `tests` et le fichier `requirements-test.txt` dans :

`services/reservations/backend/`

La structure attendue :

```text
backend/
├── app/
│   ├── main.py
│   ├── database.py
│   ├── models/
│   ├── routers/
│   └── schemas/
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── helpers.py
│   └── test_reservation.py
├── requirements.txt
└── requirements-test.txt
```

## 2. Installer les dépendances

Dans le terminal, depuis `services/reservations/backend` :

```powershell
pip install -r requirements-test.txt
```

## 3. Lancer les tests

Toujours depuis `services/reservations/backend` :

```powershell
python -m pytest -v
```

Pour obtenir un rapport plus court :

```powershell
python -m pytest -q
```

## 4. Important

Ces tests utilisent une base SQLite temporaire en mémoire. Ils ne suppriment et ne modifient pas les données PostgreSQL du projet.

Les tests portent sur les routes et règles métier actuellement présentes dans `app/routers/reservation.py`. Le prix réel de la chambre, la capacité et l'existence de la chambre ne sont pas encore testés, car ils nécessitent la connexion au microservice Chambres.
