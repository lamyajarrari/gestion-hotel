import { useCallback, useEffect, useState } from "react";
import { currentRole, getToken, setToken } from "./api.js";
import Login from "./components/Login.jsx";
import ChambresANettoyer from "./components/ChambresANettoyer.jsx";
import AssignModal from "./components/AssignModal.jsx";
import TachesBoard from "./components/TachesBoard.jsx";
import DemandesAdmin from "./components/DemandesAdmin.jsx";
import { DemandeForm, MesDemandes } from "./components/DemandesClient.jsx";

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

export default function App() {
  const [token, setTok] = useState(getToken());
  const role = token ? currentRole(token) : null;
  const [tab, setTab] = useState(null);
  const [assignFor, setAssignFor] = useState(null); // {chambre_id, type} ou {} (formulaire libre)
  const [version, setVersion] = useState(0); // incrémenté pour recharger les listes
  const [toast, setToast] = useState(null);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);
  const logout = useCallback(() => {
    setToken("");
    setTok("");
    setTab(null);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  if (!token) {
    return (
      <Login
        onLogin={(t) => {
          setToken(t);
          setTok(t);
          setTab(null);
        }}
      />
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
          <p className="font-serif text-2xl font-bold text-navy">Riad Souss</p>
          <nav className="flex flex-wrap items-center gap-1">
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
            <button onClick={logout} className="btn btn-outline ml-2 px-4 py-2">
              Déconnexion
            </button>
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
            onAssign={(chambre) => setAssignFor({ chambre_id: String(chambre.id), type: "DEPART" })}
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
