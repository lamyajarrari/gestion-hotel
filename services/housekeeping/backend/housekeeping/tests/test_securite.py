"""Tests unitaires de la sécurité (HKP-16 à HKP-17) : cahier des charges, sections 4.3 et 7.2."""
import datetime

import jwt
from django.conf import settings
from django.test import SimpleTestCase
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.test import APIRequestFactory

from housekeeping.auth import JWTAuthentication, TokenUser
from housekeeping.permissions import IsGestionnaire


def requete(jeton):
    return APIRequestFactory().get("/", HTTP_AUTHORIZATION=f"Bearer {jeton}")


def fabriquer(secret=None, **claims):
    claims.setdefault("user_id", "1")
    claims.setdefault("role", "GESTIONNAIRE")
    return jwt.encode(claims, secret or settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


class SecuriteTests(SimpleTestCase):
    def test_seul_le_gestionnaire_est_autorise(self):
        """HKP-16 Autoriser le gestionnaire, refuser le client et l'agent de ménage"""
        def autorise(role):
            request = type("R", (), {"user": TokenUser("1", role)})()
            return IsGestionnaire().has_permission(request, None)

        self.assertTrue(autorise("GESTIONNAIRE"))
        self.assertFalse(autorise("CLIENT"))
        self.assertFalse(autorise("AGENT_MENAGE"))

    def test_jetons_jwt(self):
        """HKP-17 Accepter un jeton valide (user_id ou sub) ; refuser un jeton expiré, mal signé ou incomplet"""
        auth = JWTAuthentication()
        user, _ = auth.authenticate(requete(fabriquer(user_id="5", role="CLIENT")))
        self.assertEqual((user.id, user.role), ("5", "CLIENT"))

        # même format que le service chambres : identifiant dans « sub », rôle « admin »
        sub = jwt.encode({"sub": "9", "role": "admin"}, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
        user, _ = auth.authenticate(requete(sub))
        self.assertEqual((user.id, user.role), ("9", "GESTIONNAIRE"))

        passe = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=1)
        refuses = {
            "expiré": fabriquer(exp=passe),
            "mauvaise signature": fabriquer(secret="autre-secret-different-0123456789"),
            "claims manquants": jwt.encode({"foo": "bar"}, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM),
        }
        for cas, jeton in refuses.items():
            with self.subTest(cas=cas):
                with self.assertRaises(AuthenticationFailed):
                    auth.authenticate(requete(jeton))


class NotificationChambresTests(SimpleTestCase):
    """HKP-22 : la route appelée par le service chambres exige le jeton interne."""

    URL = "/api/internal/taches/"

    def test_notification_avec_et_sans_jeton_interne(self):
        """HKP-22 Accepter la notification de chambres seulement avec le jeton interne"""
        from rest_framework.test import APIClient

        c = APIClient()
        corps = {"chambre_id": 3, "type": "menage"}
        self.assertEqual(c.post(self.URL, corps, format="json").status_code, 401)
        ok = c.post(self.URL, corps, format="json", HTTP_X_INTERNAL_TOKEN=settings.INTERNAL_API_TOKEN)
        self.assertEqual(ok.status_code, 202)
        vide = c.post(self.URL, {}, format="json", HTTP_X_INTERNAL_TOKEN=settings.INTERNAL_API_TOKEN)
        self.assertEqual(vide.status_code, 400)


class VerifierChambreTests(SimpleTestCase):
    def test_verification_par_numero(self):
        """HKP-25 Le formulaire vérifie la chambre par son numéro (réservé client/gestionnaire, 404 clair si inconnue)"""
        from unittest.mock import patch
        from rest_framework.exceptions import NotFound
        from rest_framework.test import APIClient

        def appeler(role, numero="102"):
            c = APIClient()
            c.credentials(HTTP_AUTHORIZATION=f"Bearer {fabriquer(role=role)}")
            return c.get("/api/housekeeping/chambres/verifier/", {"numero": numero})

        chambre = {"id": 2, "numero": "102", "type": "Suite", "statut": "OCCUPEE"}
        with patch("housekeeping.views.clients.get_chambre", return_value=chambre):
            r = appeler("CLIENT")
            self.assertEqual(r.status_code, 200)
            self.assertEqual(r.json(), {"numero": "102", "type": "Suite", "statut": "OCCUPEE", "demande_possible": True})
            self.assertNotIn("id", r.json())
            self.assertEqual(appeler("AGENT_MENAGE").status_code, 403)
        with patch("housekeeping.views.clients.get_chambre", side_effect=NotFound("Chambre introuvable")):
            self.assertEqual(appeler("CLIENT", "999").status_code, 404)


class ListeAgentsTests(SimpleTestCase):
    def test_liste_des_agents_reservee_au_gestionnaire(self):
        """HKP-27 La liste des agents de ménage (choix par nom) est réservée au gestionnaire"""
        from unittest.mock import patch
        from rest_framework.test import APIClient

        def appeler(role):
            c = APIClient()
            c.credentials(HTTP_AUTHORIZATION=f"Bearer {fabriquer(role=role)}")
            return c.get("/api/housekeeping/agents/")

        liste = [{"id": "7", "nom": "Alami", "prenom": "Youssef"}]
        with patch("housekeeping.views.clients.list_agents", return_value=liste) as appel:
            r = appeler("GESTIONNAIRE")
            self.assertEqual(r.status_code, 200)
            self.assertEqual(r.json(), liste)
            appel.assert_called_once()
            self.assertEqual(appeler("CLIENT").status_code, 403)
            self.assertEqual(appeler("AGENT_MENAGE").status_code, 403)