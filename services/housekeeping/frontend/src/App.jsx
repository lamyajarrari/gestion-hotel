import { useCallback, useEffect, useState } from "react";
import { CHAMBRES_ACCUEIL, URL_DECONNEXION, currentRole, getToken, lienChambres, lienReservations, lienUsers, recupererJetonDansURL, setToken } from "./api.js";
import Login from "./components/Login.jsx";
import ChambresANettoyer from "./components/ChambresANettoyer.jsx";
import AssignModal from "./components/AssignModal.jsx";
import TachesBoard from "./components/TachesBoard.jsx";
import DemandesAdmin from "./components/DemandesAdmin.jsx";
import { DemandeForm, MesDemandes } from "./components/DemandesClient.jsx";

recupererJetonDansURL(); // jeton reçu depuis la page de connexion du service users

const ADMIN_TABS = [
  ["chambres", "Chambres à nettoyer", "Chambres libérées en attente d'un ménage de départ."],
  ["taches", "Tâches de ménage", "Consultez, modifiez ou supprimez les tâches de ménage."],
  ["statuts", "Statuts", "Consultez et modifiez les statuts d'entretien des chambres."],
  ["priorites", "Priorités", "Consultez et modifiez les niveaux de priorité des tâches."],
  ["demandes", "Demandes clients", "Demandes de nettoyage à prendre en charge."],
];
const CLIENT_TABS = [
  ["demander", "Demander un nettoyage", "Décrivez votre besoin, l'équipe s'en occupe."],
  ["suivi", "Suivre mes demandes", "Consultez l'état de vos demandes de nettoyage."],
];

const LIEN_SERVICE = "rounded-full px-4 py-2 text-sm text-muted transition hover:text-navy";

export default function App() {
  const [token, setTok] = useState(getToken());
  const role = token ? currentRole(token) : null;
  const [tab, setTab] = useState(null);
  const [assignFor, setAssignFor] = useState(null); // {chambre_id, type} ou {} (formulaire libre)
  const [version, setVersion] = useState(0); // incrémenté pour recharger les listes
  const [toast, setToast] = useState(null);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);
  // Session expirée ou refusée : on efface le jeton, la page de connexion (service users) prend le relais.
  const logout = useCallback(() => {
    setToken("");
    setTok("");
    setTab(null);
  }, []);
  // Bouton « Déconnexion » : on vide notre jeton, puis users et chambres vident le leur
  // et on arrive sur la première page, déconnecté.
  const deconnecter = useCallback(() => {
    setToken("");
    window.location.replace(URL_DECONNEXION);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  if (!token) {
    return <Login />;
  }

  if (role === "autre") {
    // Pas d'interface housekeeping pour l'agent de ménage (ni pour un rôle inconnu).
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <img src="/images/logo.png" alt="" className="h-12 w-auto" />
        <h1 className="text-2xl font-bold">Pas d'interface pour votre rôle</h1>
        <p className="max-w-md text-sm text-muted">
          Cette interface est réservée aux clients et aux gestionnaires.
        </p>
        <button onClick={deconnecter} className="btn btn-primary px-6 py-3">Retour à l'accueil</button>
      </div>
    );
  }

  const tabs = role === "client" ? CLIENT_TABS : ADMIN_TABS;
  const current = tabs.find(([k]) => k === tab) || tabs[0];
  const [key, title, subtitle] = current;
  const common = { version, onChanged: refresh, onToast: setToast, onAuthError: logout };

  return (
    <div className="min-h-screen">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <a href={CHAMBRES_ACCUEIL} className="flex items-center gap-3" title="Retour à l'accueil des chambres">
            <img src="/images/logo.png" alt="" className="h-11 w-auto" />
            <span className="font-serif text-2xl font-bold text-navy">Riad Souss</span>
          </a>
          <nav className="flex flex-wrap items-center gap-1" aria-label="Services">
            <a href={lienChambres(role)} className={LIEN_SERVICE}>Chambres</a>
            <a href={lienReservations(role)} className={LIEN_SERVICE}>Réservations</a>
            <span className="rounded-full bg-[#ece9e4] px-4 py-2 text-sm font-medium text-navy" aria-current="page">
              Housekeeping
            </span>
            {role === "admin" && (
              <a href={lienUsers("utilisateurs", role)} className={LIEN_SERVICE}>Personnel</a>
            )}
            <a href={lienUsers("compte", role)} className={LIEN_SERVICE}>Mon profil</a>
            <button onClick={deconnecter} className="btn btn-outline ml-2 px-4 py-2">
              Déconnexion
            </button>
          </nav>
        </div>
        <div className="border-t border-line">
          <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 px-6 py-2" aria-label="Housekeeping">
            {tabs.map(([k, label]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  k === key ? "bg-[#ece9e4] font-medium text-navy" : "text-muted hover:text-navy"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{title}</h1>
            <p className="mt-1 text-sm text-muted">{subtitle}</p>
          </div>
          {role !== "client" && (key === "chambres" || key === "taches") && (
            <button onClick={() => setAssignFor({})} className="btn btn-primary px-6 py-3 text-base">
              + Créer une tâche
            </button>
          )}
        </div>

        {key === "chambres" && (
          <ChambresANettoyer
            version={version}
            onAssign={(chambre) => setAssignFor({ chambre_id: String(chambre.numero ?? chambre.id), type: "DEPART" })}
            onAuthError={logout}
          />
        )}
        {["taches", "statuts", "priorites"].includes(key) && <TachesBoard key={key} mode={key} {...common} />}
        {key === "demandes" && <DemandesAdmin {...common} />}
        {key === "demander" && (
          <DemandeForm
            onAuthError={logout}
            onCancel={() => setTab("suivi")}
            onDone={() => {
              setToast({ ok: true, text: "Demande envoyée." });
              refresh();
              setTab("suivi");
            }}
          />
        )}
        {key === "suivi" && <MesDemandes {...common} />}
      </main>

      {assignFor && (
        <AssignModal
          initial={assignFor}
          onClose={() => setAssignFor(null)}
          onDone={() => {
            setAssignFor(null);
            setToast({ ok: true, text: "Tâche de ménage créée." });
            refresh();
            setTab("taches");
          }}
          onAuthError={logout}
        />
      )}

      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 max-w-sm rounded-2xl px-5 py-3 text-sm text-white shadow-lg ${
            toast.ok ? "bg-navy" : "bg-[#a8472a]"
          }`}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}