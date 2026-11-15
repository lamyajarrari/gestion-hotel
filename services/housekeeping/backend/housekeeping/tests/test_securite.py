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
