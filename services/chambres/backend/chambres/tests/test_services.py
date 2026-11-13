from datetime import date
from decimal import Decimal

from django.test import TestCase

from chambres import services
from chambres.models import Chambre, Indisponibilite

E = Chambre.Etat


class ChangerEtatTests(TestCase):
    def setUp(self):
        self.chambre = Chambre.objects.create(
            numero="101", type="double", capacite=2, tarif=Decimal("450.00")
        )

    def test_cycle_complet_check_in_check_out_menage(self):
        services.changer_etat(self.chambre.pk, E.OCCUPEE)
        services.changer_etat(self.chambre.pk, E.A_NETTOYER)
        services.changer_etat(self.chambre.pk, E.DISPONIBLE)
        self.chambre.refresh_from_db()
        self.assertEqual(self.chambre.etat, E.DISPONIBLE)

    def test_disponible_vers_a_nettoyer_refuse(self):
        with self.assertRaises(services.TransitionInvalide):
            services.changer_etat(self.chambre.pk, E.A_NETTOYER)

    def test_occupee_vers_disponible_refuse(self):
        services.changer_etat(self.chambre.pk, E.OCCUPEE)
        with self.assertRaises(services.TransitionInvalide):
            services.changer_etat(self.chambre.pk, E.DISPONIBLE)

    def test_maintenance_puis_retour_disponible(self):
        services.changer_etat(self.chambre.pk, E.MAINTENANCE)
        services.changer_etat(self.chambre.pk, E.DISPONIBLE)
        self.chambre.refresh_from_db()
        self.assertEqual(self.chambre.etat, E.DISPONIBLE)

    def test_meme_etat_ne_leve_rien(self):
        services.changer_etat(self.chambre.pk, E.DISPONIBLE)


class EstLibreSurPeriodeTests(TestCase):
    def setUp(self):
        self.chambre = Chambre.objects.create(
            numero="102", type="simple", capacite=1, tarif=Decimal("300.00")
        )
        self.aujourdhui = date(2026, 11, 10)

    def test_libre_pour_une_periode_future(self):
        self.assertTrue(services.est_libre_sur_periode(
            self.chambre, date(2026, 12, 1), date(2026, 12, 5), self.aujourdhui))

    def test_maintenance_jamais_proposee(self):
        services.changer_etat(self.chambre.pk, E.MAINTENANCE)
        self.chambre.refresh_from_db()
        self.assertFalse(services.est_libre_sur_periode(
            self.chambre, date(2026, 12, 1), date(2026, 12, 5), self.aujourdhui))

    def test_inactive_jamais_proposee(self):
        self.chambre.actif = False
        self.chambre.save()
        self.assertFalse(services.est_libre_sur_periode(
            self.chambre, date(2026, 12, 1), date(2026, 12, 5), self.aujourdhui))

    def test_a_nettoyer_non_proposee_pour_une_arrivee_immediate(self):
        services.changer_etat(self.chambre.pk, E.OCCUPEE)
        services.changer_etat(self.chambre.pk, E.A_NETTOYER)
        self.chambre.refresh_from_db()
        self.assertFalse(services.est_libre_sur_periode(
            self.chambre, date(2026, 11, 10), date(2026, 11, 12), self.aujourdhui))

    def test_indisponibilite_qui_chevauche_bloque(self):
        chambre = Chambre.objects.create(
            numero="301", type=Chambre.Type.DOUBLE, capacite=2, tarif=Decimal("800.00"),
        )
        Indisponibilite.objects.create(
            chambre=chambre, date_debut=date(2026, 12, 10), date_fin=date(2026, 12, 15),
        )
        self.assertFalse(services.est_libre_sur_periode(
            chambre, date(2026, 12, 12), date(2026, 12, 14), date(2026, 11, 1)))

    def test_periode_voisine_reste_libre(self):
        chambre = Chambre.objects.create(
            numero="302", type=Chambre.Type.DOUBLE, capacite=2, tarif=Decimal("800.00"),
        )
        Indisponibilite.objects.create(
            chambre=chambre, date_debut=date(2026, 12, 10), date_fin=date(2026, 12, 15),
        )
        self.assertTrue(services.est_libre_sur_periode(
            chambre, date(2026, 12, 15), date(2026, 12, 18), date(2026, 11, 1)))


class ValiderPeriodeTests(TestCase):
    def test_periode_valide(self):
        self.assertEqual(
            services.valider_periode(date(2026, 12, 1), date(2026, 12, 5)),
            (date(2026, 12, 1), date(2026, 12, 5)),
        )

    def test_fin_egale_au_debut_refusee(self):
        with self.assertRaises(ValueError):
            services.valider_periode(date(2026, 12, 5), date(2026, 12, 5))

    def test_fin_avant_debut_refusee(self):
        with self.assertRaises(ValueError):
            services.valider_periode(date(2026, 12, 5), date(2026, 12, 1))