"""Tests unitaires de la communication avec les autres services (HKP-18).

Aucun appel réseau : requests.request est simulé.
"""
from unittest.mock import MagicMock, patch

import requests
from django.conf import settings
from django.test import SimpleTestCase
from rest_framework.exceptions import NotFound

from housekeeping import clients
from housekeeping.exceptions import ExternalServiceError


def reponse(status, data=None):
    r = MagicMock()
    r.status_code = status
    r.json.return_value = data if data is not None else {}
    return r


class ClientsTests(SimpleTestCase):
    @patch("housekeeping.clients.requests.request")
    def test_erreurs_du_service_distant(self, req):
        """HKP-18 Convertir les erreurs d'un autre service (404, 500, délai dépassé) en erreurs claires"""
        cas = [
            ("404", dict(return_value=reponse(404)), NotFound),
            ("500", dict(return_value=reponse(500)), ExternalServiceError),
            ("délai dépassé", dict(side_effect=requests.Timeout()), ExternalServiceError),
        ]
        for nom, config, attendu in cas:
            with self.subTest(cas=nom):
                req.reset_mock(return_value=True, side_effect=True)
                req.configure_mock(**config)
                with self.assertRaises(attendu):
                    clients.get_chambre("12")
        # le jeton interne et le délai maximal sont bien envoyés à chaque appel
        _, kwargs = req.call_args
        self.assertEqual(kwargs["headers"], {"X-Internal-Token": settings.INTERNAL_API_TOKEN})
        self.assertEqual(kwargs["timeout"], settings.EXTERNAL_TIMEOUT)
