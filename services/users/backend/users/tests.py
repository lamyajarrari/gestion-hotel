import jwt
from django.conf import settings
from django.test import TestCase, override_settings
from django.urls import reverse

from .models import Utilisateur

JETON = "jeton-de-test-interne"


@override_settings(INTERNAL_API_TOKEN=JETON)
class RouteInterneTests(TestCase):
    """Route appelée par les autres services : GET /api/users/<id>/"""

    def setUp(self):
        self.agent = Utilisateur.objects.create_user(
            "agent@riad.ma", "Motdepasse123", nom="A", prenom="Agent",
            role=Utilisateur.Role.AGENT_MENAGE,
        )

    def url(self, pk=None):
        return reverse("utilisateur-interne", args=[pk or self.agent.pk])

    def test_sans_jeton_interne_refuse(self):
        self.assertEqual(self.client.get(self.url()).status_code, 401)

    def test_mauvais_jeton_interne_refuse(self):
        r = self.client.get(self.url(), HTTP_X_INTERNAL_TOKEN="autre")
        self.assertEqual(r.status_code, 401)

    def test_renvoie_role_et_statut_sans_donnees_sensibles(self):
        r = self.client.get(self.url(), HTTP_X_INTERNAL_TOKEN=JETON)
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertEqual(data["role"], "agent_menage")
        self.assertEqual(data["statut"], "actif")
        for interdit in ("email", "password", "telephone"):
            self.assertNotIn(interdit, data)

    def test_utilisateur_inconnu(self):
        r = self.client.get(self.url(99999), HTTP_X_INTERNAL_TOKEN=JETON)
        self.assertEqual(r.status_code, 404)

    @override_settings(INTERNAL_API_TOKEN="")
    def test_route_fermee_si_jeton_interne_non_configure(self):
        r = self.client.get(self.url(), HTTP_X_INTERNAL_TOKEN="")
        self.assertEqual(r.status_code, 401)


MDP = "Motdepasse123!"


def creer(email, role=Utilisateur.Role.CLIENT, statut=Utilisateur.Statut.ACTIF):
    return Utilisateur.objects.create_user(
        email, MDP, nom="Nom", prenom="Prenom", role=role, statut=statut
    )


class ComptesBase(TestCase):
    def jeton(self, email):
        r = self.client.post(
            reverse("connexion"), {"email": email, "mot_de_passe": MDP},
            content_type="application/json",
        )
        self.assertEqual(r.status_code, 200)
        return r.json()["jeton"]

    def appeler(self, methode, url, email=None, corps=None):
        extra = {"HTTP_AUTHORIZATION": f"Bearer {self.jeton(email)}"} if email else {}
        return getattr(self.client, methode)(
            url, corps, content_type="application/json", **extra
        ) if corps is not None else getattr(self.client, methode)(url, **extra)


class ProfilTests(ComptesBase):
    def setUp(self):
        creer("c@riad.ma")

    def test_profil_sans_jeton_refuse(self):
        self.assertEqual(self.client.get(reverse("profil")).status_code, 401)

    def test_modifier_son_profil(self):
        r = self.appeler("patch", reverse("profil"), "c@riad.ma", {"nom": "Alami", "telephone": "0600000000"})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(Utilisateur.objects.get(email="c@riad.ma").nom, "Alami")

    def test_role_non_modifiable_par_le_profil(self):
        self.appeler("patch", reverse("profil"), "c@riad.ma", {"role": "admin"})
        self.assertEqual(Utilisateur.objects.get(email="c@riad.ma").role, "client")

    def test_changer_mot_de_passe(self):
        url = reverse("profil")
        refuse = self.appeler("patch", url, "c@riad.ma", {"nouveau_mot_de_passe": "Nouveau123!", "mot_de_passe_actuel": "faux"})
        self.assertEqual(refuse.status_code, 400)
        ok = self.appeler("patch", url, "c@riad.ma", {"nouveau_mot_de_passe": "Nouveau123!", "mot_de_passe_actuel": MDP})
        self.assertEqual(ok.status_code, 200)
        self.assertTrue(Utilisateur.objects.get(email="c@riad.ma").check_password("Nouveau123!"))


class GestionUtilisateursTests(ComptesBase):
    def setUp(self):
        self.gest = creer("g@riad.ma", Utilisateur.Role.GESTIONNAIRE)
        self.admin = creer("a@riad.ma", Utilisateur.Role.ADMIN)
        self.client_u = creer("c@riad.ma")
        self.agent = creer("ag@riad.ma", Utilisateur.Role.AGENT_MENAGE)

    def test_client_ne_peut_pas_lister(self):
        r = self.appeler("get", reverse("utilisateurs"), "c@riad.ma")
        self.assertEqual(r.status_code, 403)

    def test_liste_avec_filtre_par_role(self):
        r = self.appeler("get", reverse("utilisateurs") + "?role=agent_menage", "g@riad.ma")
        self.assertEqual([u["email"] for u in r.json()["results"]], ["ag@riad.ma"])

    def test_creer_un_agent_de_menage(self):
        corps = {"email": "nouveau@riad.ma", "nom": "N", "prenom": "P", "mot_de_passe": MDP, "role": "agent_menage"}
        r = self.appeler("post", reverse("utilisateurs"), "g@riad.ma", corps)
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.json()["role"], "agent_menage")
        self.assertNotIn("password", r.json())

    def test_creation_refusee_pour_admin_doublon_ou_mot_de_passe_faible(self):
        base = {"email": "x@riad.ma", "nom": "N", "prenom": "P", "mot_de_passe": MDP}
        url = reverse("utilisateurs")
        self.assertEqual(self.appeler("post", url, "g@riad.ma", {**base, "role": "admin"}).status_code, 400)
        self.assertEqual(self.appeler("post", url, "g@riad.ma", {**base, "mot_de_passe": "faible"}).status_code, 400)
        self.assertEqual(self.appeler("post", url, "g@riad.ma", {**base, "email": "c@riad.ma"}).status_code, 409)

    def test_desactiver_empeche_la_connexion_et_l_acces(self):
        jeton = self.jeton("c@riad.ma")
        r = self.appeler("patch", reverse("utilisateur-detail", args=[self.client_u.pk]), "g@riad.ma", {"statut": "inactif"})
        self.assertEqual(r.status_code, 200)
        connexion = self.client.post(reverse("connexion"), {"email": "c@riad.ma", "mot_de_passe": MDP}, content_type="application/json")
        self.assertEqual(connexion.status_code, 403)
        ancien = self.client.get(reverse("profil"), HTTP_AUTHORIZATION=f"Bearer {jeton}")
        self.assertEqual(ancien.status_code, 401)
        self.assertTrue(Utilisateur.objects.filter(pk=self.client_u.pk).exists())  # jamais supprimé

    def test_reactiver_un_compte(self):
        self.client_u.statut = "inactif"
        self.client_u.save()
        r = self.appeler("patch", reverse("utilisateur-detail", args=[self.client_u.pk]), "g@riad.ma", {"statut": "actif"})
        self.assertEqual(r.json()["statut"], "actif")

    def test_on_ne_peut_pas_se_desactiver_soi_meme(self):
        r = self.appeler("patch", reverse("utilisateur-detail", args=[self.gest.pk]), "g@riad.ma", {"statut": "inactif"})
        self.assertEqual(r.status_code, 409)

    def test_gestionnaire_ne_peut_pas_toucher_un_admin(self):
        r = self.appeler("patch", reverse("utilisateur-detail", args=[self.admin.pk]), "g@riad.ma", {"statut": "inactif"})
        self.assertEqual(r.status_code, 403)
        promotion = self.appeler("patch", reverse("utilisateur-detail", args=[self.client_u.pk]), "g@riad.ma", {"role": "admin"})
        self.assertEqual(promotion.status_code, 403)

    def test_changer_le_role_d_un_compte(self):
        r = self.appeler("patch", reverse("utilisateur-detail", args=[self.client_u.pk]), "a@riad.ma", {"role": "agent_menage"})
        self.assertEqual(r.json()["role"], "agent_menage")