"""Tests unitaires de la logique métier du housekeeping (HKP-01 à HKP-15 et HKP-19 à HKP-21).

Règles testées : cahier des charges, section 4.3 (et 7.3 pour HKP-15).
Les services chambres et users sont simulés : seul le module housekeeping est testé.
"""
import datetime
from unittest.mock import patch

from django.db import IntegrityError, transaction
from django.test import TestCase
from rest_framework.exceptions import ValidationError

from housekeeping import services
from housekeeping.exceptions import ConflictError, ExternalServiceError
from housekeeping.models import (
    DemandeNettoyage, Priorite, ServiceMenage, StatutDemande, StatutService, TypeService,
)

AGENT_OK = {"id": "7", "role": "AGENT_MENAGE", "statut": "ACTIF"}
DEMAIN = datetime.date.today() + datetime.timedelta(days=1)


def assigner(chambre_statut="A_NETTOYER", agent=AGENT_OK, **kw):
    """Appelle services.assigner avec les services chambres et users simulés."""
    params = dict(
        chambre_id="12", agent_id="7", type_service=TypeService.DEPART,
        date_prevue=DEMAIN, gestionnaire_id="1",
    )
    params.update(kw)
    with patch("housekeeping.services.clients.get_chambre", return_value={"statut": chambre_statut}), \
            patch("housekeeping.services.clients.get_user", return_value=agent):
        return services.assigner(**params)


def creer(**kw):
    defaults = dict(
        chambre_id="12", agent_id="7", type=TypeService.DEPART,
        date_prevue=DEMAIN, assigne_par="1",
    )
    defaults.update(kw)
    return ServiceMenage.objects.create(**defaults)


class AssignerTests(TestCase):
    def test_depart_sur_chambre_a_nettoyer(self):
        """HKP-01 Assigner un ménage de départ sur une chambre à nettoyer"""
        s = assigner()
        self.assertEqual((s.type, s.statut), (TypeService.DEPART, StatutService.ASSIGNE))

    def test_quotidien_sur_chambre_occupee(self):
        """HKP-02 Assigner un ménage quotidien sur une chambre occupée"""
        s = assigner(chambre_statut="OCCUPEE", type_service=TypeService.QUOTIDIEN)
        self.assertEqual((s.type, s.statut), (TypeService.QUOTIDIEN, StatutService.ASSIGNE))

    def test_depart_refuse_si_chambre_pas_a_nettoyer(self):
        """HKP-03 Refuser un ménage de départ si la chambre n'est pas à nettoyer"""
        with self.assertRaises(ConflictError):
            assigner(chambre_statut="OCCUPEE")
        self.assertEqual(ServiceMenage.objects.count(), 0)

    def test_quotidien_refuse_si_chambre_pas_occupee(self):
        """HKP-04 Refuser un ménage quotidien si la chambre n'est pas occupée"""
        with self.assertRaises(ConflictError):
            assigner(chambre_statut="A_NETTOYER", type_service=TypeService.QUOTIDIEN)
        self.assertEqual(ServiceMenage.objects.count(), 0)

    def test_agent_inactif_refuse(self):
        """HKP-05 Refuser un agent dont le compte est inactif"""
        with self.assertRaises(ConflictError):
            assigner(agent={**AGENT_OK, "statut": "INACTIF"})

    def test_utilisateur_non_agent_refuse(self):
        """HKP-06 Refuser un utilisateur qui n'est pas membre du personnel de ménage"""
        with self.assertRaises(ValidationError):
            assigner(agent={**AGENT_OK, "role": "CLIENT"})

    def test_un_seul_service_non_termine_par_chambre(self):
        """HKP-07 Refuser un second service tant que le premier n'est pas terminé"""
        creer(statut=StatutService.EN_COURS)
        with self.assertRaises(ConflictError):
            assigner()
        self.assertEqual(ServiceMenage.objects.count(), 1)

    def test_nouvelle_assignation_apres_terminaison(self):
        """HKP-08 Autoriser une nouvelle assignation une fois le service terminé (historique conservé)"""
        creer(statut=StatutService.TERMINE)
        assigner()
        self.assertEqual(ServiceMenage.objects.filter(chambre_id="12").count(), 2)


class CycleDeVieTests(TestCase):
    def test_demarrer_service_assigne(self):
        """HKP-09 Démarrer un service assigné (ASSIGNE vers EN_COURS)"""
        s = creer()
        resultat = services.demarrer(s.pk)
        self.assertEqual(resultat.statut, StatutService.EN_COURS)
        self.assertIsNotNone(resultat.date_debut)

    def test_demarrer_refuse_si_pas_assigne(self):
        """HKP-10 Refuser de démarrer un service déjà en cours ou terminé"""
        for statut in (StatutService.EN_COURS, StatutService.TERMINE):
            with self.subTest(statut=statut):
                s = creer(chambre_id=f"c-{statut}", statut=statut)
                with self.assertRaises(ConflictError):
                    services.demarrer(s.pk)

    def test_terminer_refuse_si_pas_en_cours(self):
        """HKP-11 Refuser de terminer un service non démarré ou déjà terminé (aucune étape sautée)"""
        for statut in (StatutService.ASSIGNE, StatutService.TERMINE):
            with self.subTest(statut=statut):
                s = creer(chambre_id=f"c-{statut}", statut=statut)
                with self.assertRaises(ConflictError):
                    services.terminer(s.pk)
                s.refresh_from_db()
                self.assertEqual(s.statut, statut)

    def test_terminer_depart_libere_la_chambre(self):
        """HKP-12 Terminer un ménage de départ remet la chambre à « disponible »"""
        s = creer(statut=StatutService.EN_COURS)
        with patch("housekeeping.services.clients.set_chambre_statut") as appel:
            resultat = services.terminer(s.pk)
        self.assertEqual(resultat.statut, StatutService.TERMINE)
        self.assertIsNotNone(resultat.date_fin)
        appel.assert_called_once_with("12", "LIBRE")

    def test_terminer_quotidien_ne_touche_pas_la_chambre(self):
        """HKP-13 Terminer un ménage quotidien laisse la chambre « occupée »"""
        s = creer(type=TypeService.QUOTIDIEN, statut=StatutService.EN_COURS)
        with patch("housekeeping.services.clients.set_chambre_statut") as appel:
            services.terminer(s.pk)
        appel.assert_not_called()

    def test_echec_service_chambres_annule_la_terminaison(self):
        """HKP-14 Annuler la terminaison si le service chambres échoue (cohérence des deux états)"""
        s = creer(statut=StatutService.EN_COURS)
        with patch("housekeeping.services.clients.set_chambre_statut", side_effect=ExternalServiceError()):
            with self.assertRaises(ExternalServiceError):
                services.terminer(s.pk)
        s.refresh_from_db()
        self.assertEqual(s.statut, StatutService.EN_COURS)
        self.assertIsNone(s.date_fin)


class ModificationTests(TestCase):
    def test_modifier_description_et_priorite(self):
        """HKP-19 Modifier la description et la priorité d'un service ; refusé s'il est terminé"""
        s = assigner(description="Draps à changer", priorite=Priorite.HAUTE)
        self.assertEqual((s.description, s.priorite), ("Draps à changer", Priorite.HAUTE))

        modifie = services.modifier(s.pk, priorite=Priorite.BASSE)
        self.assertEqual((modifie.priorite, modifie.description), (Priorite.BASSE, "Draps à changer"))
        self.assertEqual(modifie.statut, StatutService.ASSIGNE)  # le statut ne change pas

        termine = creer(chambre_id="13", statut=StatutService.TERMINE)
        with self.assertRaises(ConflictError):
            services.modifier(termine.pk, priorite=Priorite.HAUTE)


class SuppressionTests(TestCase):
    def test_supprimer_seulement_un_service_non_demarre(self):
        """HKP-20 Supprimer un service assigné ; refuser la suppression d'un service en cours ou terminé"""
        s = creer(chambre_id="20")
        services.supprimer(s.pk)
        self.assertFalse(ServiceMenage.objects.filter(pk=s.pk).exists())

        for statut in (StatutService.EN_COURS, StatutService.TERMINE):
            with self.subTest(statut=statut):
                garde = creer(chambre_id=f"s-{statut}", statut=statut)
                with self.assertRaises(ConflictError):
                    services.supprimer(garde.pk)
                self.assertTrue(ServiceMenage.objects.filter(pk=garde.pk).exists())


class DemandeTests(TestCase):
    def demander(self, chambre_statut="OCCUPEE", **kw):
        params = dict(client_id="9", chambre_id="12", description="Serviettes propres")
        params.update(kw)
        with patch("housekeeping.services.clients.get_chambre", return_value={"statut": chambre_statut}):
            return services.creer_demande(**params)

    def test_cycle_de_la_demande_du_client(self):
        """HKP-21 Demande de nettoyage : chambre occupée exigée, traitement par le gestionnaire, suivi, annulation"""
        with self.assertRaises(ConflictError):  # chambre non occupée
            self.demander(chambre_statut="DISPONIBLE")
        demande = self.demander()
        self.assertEqual(demande.statut, StatutDemande.DEMANDE)
        with self.assertRaises(ConflictError):  # une seule demande ouverte par client et chambre
            self.demander()

        # le gestionnaire la traite : un service quotidien est créé et lié
        with patch("housekeeping.services.clients.get_chambre", return_value={"statut": "OCCUPEE"}), \
                patch("housekeeping.services.clients.get_user", return_value=AGENT_OK):
            services.traiter_demande(demande.pk, agent_id="7", date_prevue=DEMAIN, gestionnaire_id="1")
        demande.refresh_from_db()
        service = demande.services.get()
        self.assertEqual((demande.statut, service.type), (StatutDemande.EN_COURS, TypeService.QUOTIDIEN))
        with self.assertRaises(ConflictError):  # plus annulable une fois traitée
            services.annuler_demande(demande.pk)

        # la demande suit le service jusqu'à sa fin
        services.demarrer(service.pk)
        services.terminer(service.pk)
        demande.refresh_from_db()
        self.assertEqual(demande.statut, StatutDemande.TERMINEE)

        # une demande non traitée peut être annulée
        autre = self.demander(chambre_id="13")
        self.assertEqual(services.annuler_demande(autre.pk).statut, StatutDemande.ANNULEE)


class ContrainteBaseTests(TestCase):
    def test_base_interdit_deux_services_non_termines_par_chambre(self):
        """HKP-15 La base refuse deux services non terminés sur la même chambre (demandes simultanées)"""
        creer()
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                creer()
        creer(chambre_id="13")  # une autre chambre reste possible
        self.assertEqual(ServiceMenage.objects.count(), 2)


class IdentifiantChambreTests(TestCase):
    def test_on_enregistre_l_identifiant_et_le_numero(self):
        """HKP-24 Numéro saisi → identifiant enregistré (stable) + numéro (affichage) ; une valeur déjà enregistrée
        est lue par identifiant, jamais par numéro"""
        chambre = {"id": 2, "numero": "102", "statut": "OCCUPEE"}
        with patch("housekeeping.services.clients.get_chambre", return_value=chambre) as get, \
                patch("housekeeping.services.clients.get_user", return_value=AGENT_OK):
            service = services.assigner(
                chambre_id="102", agent_id="7", type_service=TypeService.QUOTIDIEN,
                date_prevue=DEMAIN, gestionnaire_id="1",
            )
            self.assertEqual((service.chambre_id, service.chambre_numero), ("2", "102"))
            get.assert_called_with("102", par_id=False)

        autre = {"id": 3, "numero": "103", "statut": "OCCUPEE"}
        demande = DemandeNettoyage.objects.create(chambre_id="3", client_id="9", description="x")
        with patch("housekeeping.services.clients.get_chambre", return_value=autre) as get, \
                patch("housekeeping.services.clients.get_user", return_value=AGENT_OK):
            services.traiter_demande(demande.pk, agent_id="7", date_prevue=DEMAIN, gestionnaire_id="1")
        get.assert_called_with("3", par_id=True)
class NomAgentTests(TestCase):
        def test_le_nom_de_l_agent_est_enregistre(self):
            """HKP-26 Le nom de l'agent est enregistré avec la tâche (l'interface l'affiche au lieu de l'identifiant)"""
            agent = {"id": "7", "role": "AGENT_MENAGE", "statut": "ACTIF", "nom": "Alami", "prenom": "Youssef"}
            with patch("housekeeping.services.clients.get_chambre", return_value={"id": 2, "numero": "102", "statut": "A_NETTOYER"}), \
                    patch("housekeeping.services.clients.get_user", return_value=agent):
                service = services.assigner(
                    chambre_id="102", agent_id="7", type_service=TypeService.DEPART,
                    date_prevue=DEMAIN, gestionnaire_id="1",
                )
            self.assertEqual((service.agent_id, service.agent_nom), ("7", "Youssef Alami"))