from datetime import date

from app.models.reservation import StatutReservation
from tests.helpers import creer_reservation_en_base


def donnees_reservation(**overrides):
    donnees = {
        "client_id": "client_test",
        "chambre_id": 10,
        "dateDebut": "2026-12-10",
        "dateFin": "2026-12-13",
        "nombrePersonnes": 2,
    }
    donnees.update(overrides)
    return donnees


def test_creer_reservation(client):
    response = client.post("/reservations/", json=donnees_reservation())

    assert response.status_code == 201
    data = response.json()
    assert data["client_id"] == "client_test"
    assert data["chambre_id"] == 10
    assert data["statut"] == "EN_ATTENTE"
    assert "idReservation" in data


def test_refuser_dates_invalides(client):
    response = client.post(
        "/reservations/",
        json=donnees_reservation(
            dateDebut="2026-12-13",
            dateFin="2026-12-10",
        ),
    )
    assert response.status_code == 422


def test_refuser_chevauchement(client):
    premier = client.post(
        "/reservations/",
        json=donnees_reservation(),
    )
    assert premier.status_code == 201

    second = client.post(
        "/reservations/",
        json=donnees_reservation(client_id="autre_client"),
    )
    assert second.status_code == 409
    assert "déjà réservée" in second.json()["detail"]


def test_lister_reservations(client):
    client.post("/reservations/", json=donnees_reservation())
    response = client.get("/reservations/")

    assert response.status_code == 200
    assert len(response.json()) == 1


def test_filtrer_par_client(client):
    client.post("/reservations/", json=donnees_reservation(client_id="client_A"))
    client.post(
        "/reservations/",
        json=donnees_reservation(
            client_id="client_B",
            chambre_id=11,
            dateDebut="2026-12-15",
            dateFin="2026-12-17",
        ),
    )

    response = client.get(
        "/reservations/",
        params={"client_id": "client_A"},
    )

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["client_id"] == "client_A"


def test_consulter_reservation_par_id(client, db_session):
    reservation = creer_reservation_en_base(db_session)

    response = client.get(f"/reservations/{reservation.idReservation}")

    assert response.status_code == 200
    assert response.json()["idReservation"] == reservation.idReservation


def test_reservation_introuvable(client):
    response = client.get("/reservations/id-inexistant")
    assert response.status_code == 404


def test_modifier_reservation_en_attente(client, db_session):
    reservation = creer_reservation_en_base(db_session)

    response = client.put(
        f"/reservations/{reservation.idReservation}",
        json={"nombrePersonnes": 3},
    )

    assert response.status_code == 200
    assert response.json()["nombrePersonnes"] == 3



def test_refuser_modification_avec_chevauchement(client, db_session):
    reservation = creer_reservation_en_base(db_session)

    # Deuxième réservation : même période, autre chambre
    creer_reservation_en_base(
        db_session,
        client_id="client_B",
        chambre_id=11,
        date_debut=date(2026, 12, 10),
        date_fin=date(2026, 12, 13),
    )

    # On tente de déplacer la première réservation vers la chambre 11
    response = client.put(
        f"/reservations/{reservation.idReservation}",
        json={"chambre_id": 11},
    )

    assert response.status_code == 409



def test_refuser_modification_si_reservation_confirmee(client, db_session):
    reservation = creer_reservation_en_base(
        db_session,
        statut=StatutReservation.CONFIRMEE,
    )

    response = client.put(
        f"/reservations/{reservation.idReservation}",
        json={"nombrePersonnes": 3},
    )

    assert response.status_code == 400


def test_supprimer_reservation(client, db_session):
    reservation = creer_reservation_en_base(db_session)

    response = client.delete(
        f"/reservations/{reservation.idReservation}"
    )

    assert response.status_code == 200
    assert response.json()["idReservation"] == reservation.idReservation

    get_response = client.get(
        f"/reservations/{reservation.idReservation}"
    )
    assert get_response.status_code == 404


def test_verifier_chambre_disponible(client):
    response = client.get(
        "/reservations/disponibilite/10",
        params={
            "dateDebut": "2026-12-10",
            "dateFin": "2026-12-13",
        },
    )

    assert response.status_code == 200
    assert response.json()["disponible"] is True


def test_verifier_chambre_non_disponible(client):
    client.post("/reservations/", json=donnees_reservation())

    response = client.get(
        "/reservations/disponibilite/10",
        params={
            "dateDebut": "2026-12-11",
            "dateFin": "2026-12-14",
        },
    )

    assert response.status_code == 200
    assert response.json()["disponible"] is False


def test_confirmer_demarrer_terminer_sejour(client, db_session):
    reservation = creer_reservation_en_base(db_session)
    url = f"/reservations/{reservation.idReservation}"

    confirmer = client.patch(f"{url}/confirmer")
    assert confirmer.status_code == 200
    assert confirmer.json()["statut"] == "CONFIRMEE"

    demarrer = client.patch(f"{url}/demarrer")
    assert demarrer.status_code == 200
    assert demarrer.json()["statut"] == "EN_COURS"

    terminer = client.patch(f"{url}/terminer")
    assert terminer.status_code == 200
    assert terminer.json()["statut"] == "TERMINEE"


def test_annuler_reservation(client, db_session):
    reservation = creer_reservation_en_base(db_session)

    response = client.patch(
        f"/reservations/{reservation.idReservation}/annuler"
    )

    assert response.status_code == 200
    assert response.json()["statut"] == "ANNULEE"


def test_refuser_annulation_sejour_en_cours(client, db_session):
    reservation = creer_reservation_en_base(
        db_session,
        statut=StatutReservation.EN_COURS,
    )

    response = client.patch(
        f"/reservations/{reservation.idReservation}/annuler"
    )

    assert response.status_code == 400
