import { useEffect, useState } from "react";
import { demarrer, listServices, modifier, supprimer, terminer } from "../api.js";
import { Badge, Detail, Empty, ErrorBox, Modal, Pills, PRIORITES, STATUTS, TYPES, dateHeure, jour } from "./ui.jsx";

// Un seul tableau, trois écrans des spécifications :
//   « taches »    : consulter, modifier, supprimer (H002, H003, H004)
//   « statuts »   : gérer les statuts (H005)
//   « priorites » : gérer les priorités (H006)
export default function TachesBoard({ mode, version, onChanged, onToast, onAuthError }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ q: "", statut: "", type: "", priorite: "" });
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(null);
  const [modal, setModal] = useState(null); // { kind: "detail" | "edit" | "delete", s }

  useEffect(() => {
    let cancelled = false;
    setError("");
    const t = setTimeout(() => {
      listServices({ ...filters, page: page > 1 ? String(page) : "" })
        .then((d) => !cancelled && setData(d))
        .catch((e) => {
          if (cancelled) return;
          if (e.status === 401) return onAuthError();
          setError(e.message);
        });
    }, filters.q ? 250 : 0); // petite attente pendant la saisie de la recherche
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [filters, page, version, onAuthError]);

  const rows = data ? data.results ?? data : null;
  const setFilter = (k, v) => {
    setPage(1);
    setFilters({ ...filters, [k]: v });
  };

  async function act(fn, id, okText) {
    setBusy(id);
    try {
      await fn();
      onToast({ ok: true, text: okText });
      onChanged();
      return true;
    } catch (e) {
      if (e.status === 401) onAuthError();
      else onToast({ ok: false, text: e.message });
      return false;
    } finally {
      setBusy(null);
    }
  }

  const colonnes = {
    taches: ["Chambre", "Type", "Agent", "Description", "Priorité", "Statut", "Demande", "Actions"],
    statuts: ["Chambre", "Tâche", "Priorité", "Agent", "Statut actuel", "Action"],
    priorites: ["Chambre", "Tâche", "Agent", "Statut", "Niveau de priorité", "Action"],
  }[mode];

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        {mode === "statuts" && (
          <Pills
            value={filters.statut}
            onChange={(v) => setFilter("statut", v)}
            options={[["", "Tous"], ...Object.entries(STATUTS).map(([k, [l]]) => [k, l])]}
          />
        )}
        {mode === "priorites" && (
          <Pills
            value={filters.priorite}
            onChange={(v) => setFilter("priorite", v)}
            options={[["", "Toutes"], ...Object.entries(PRIORITES).map(([k, [l]]) => [k, l])]}
          />
        )}
        {mode === "taches" && (
          <>
            <input
              type="search"
              placeholder="Rechercher (chambre, agent, description)"
              value={filters.q}
              onChange={(e) => setFilter("q", e.target.value)}
              className="field w-72"
            />
            <select value={filters.statut} onChange={(e) => setFilter("statut", e.target.value)} className="field w-auto">
              <option value="">Tous les statuts</option>
              {Object.entries(STATUTS).map(([k, [l]]) => (
                <option key={k} value={k}>{l}</option>
              ))}
            </select>
            <select value={filters.type} onChange={(e) => setFilter("type", e.target.value)} className="field w-auto">
              <option value="">Tous les types</option>
              {Object.entries(TYPES).map(([k, l]) => (
                <option key={k} value={k}>{l}</option>
              ))}
            </select>
            <select value={filters.priorite} onChange={(e) => setFilter("priorite", e.target.value)} className="field w-auto">
              <option value="">Toutes les priorités</option>
              {Object.entries(PRIORITES).map(([k, [l]]) => (
                <option key={k} value={k}>{l}</option>
              ))}
            </select>
          </>
        )}
      </div>

      {error && <ErrorBox>{error}</ErrorBox>}
      {!rows && !error && <p className="text-sm text-muted">Chargement...</p>}
      {rows && rows.length === 0 && <Empty>Aucune tâche de ménage.</Empty>}

      {rows && rows.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-line">
              <tr>
                {colonnes.map((h) => (
                  <th key={h} className="th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className="border-t border-line align-top first:border-t-0">
                  <td className="td font-medium">{s.chambre_numero || s.chambre_id}</td>

                  {mode === "taches" && (
                    <>
                      <td className="td">{TYPES[s.type]}</td>
                      <td className="td">{s.agent_nom || s.agent_id}</td>
                      <td className="td max-w-56 text-muted">{s.description || "—"}</td>
                      <td className="td"><Badge table={PRIORITES} value={s.priorite} /></td>
                      <td className="td"><Badge table={STATUTS} value={s.statut} /></td>
                      <td className="td whitespace-nowrap">{jour(s.date_creation)}</td>
                      <td className="td">
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => setModal({ kind: "detail", s })} className="btn btn-outline btn-sm">
                            Consulter
                          </button>
                          <button
                            disabled={s.statut === "TERMINE"}
                            onClick={() => setModal({ kind: "edit", s })}
                            className="btn btn-outline btn-sm"
                          >
                            Modifier
                          </button>
                          <button
                            disabled={s.statut !== "ASSIGNE"}
                            title={s.statut !== "ASSIGNE" ? "Seul un service assigné peut être supprimé" : ""}
                            onClick={() => setModal({ kind: "delete", s })}
                            className="btn btn-sm border border-[#e3b3a0] bg-white text-[#a8472a] hover:bg-[#fdf0ea]"
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </>
                  )}

                  {mode === "statuts" && (
                    <>
                      <td className="td max-w-56 text-muted">{s.description || TYPES[s.type]}</td>
                      <td className="td"><Badge table={PRIORITES} value={s.priorite} /></td>
                      <td className="td">{s.agent_nom || s.agent_id}</td>
                      <td className="td">
                        <Badge table={STATUTS} value={s.statut} />
                        {(s.date_debut || s.date_fin) && (
                          <p className="mt-1 text-xs text-muted">
                            {s.date_debut && <>Début {dateHeure(s.date_debut)}</>}
                            {s.date_fin && <><br />Fin {dateHeure(s.date_fin)}</>}
                          </p>
                        )}
                      </td>
                      <td className="td">
                        {s.statut === "ASSIGNE" && (
                          <button
                            disabled={busy === s.id}
                            onClick={() => act(() => demarrer(s.id), s.id, "Ménage démarré.")}
                            className="btn btn-outline btn-sm"
                          >
                            Passer à « En cours »
                          </button>
                        )}
                        {s.statut === "EN_COURS" && (
                          <button
                            disabled={busy === s.id}
                            onClick={() => act(() => terminer(s.id), s.id, "Ménage terminé.")}
                            className="btn btn-primary btn-sm"
                          >
                            Passer à « Terminé »
                          </button>
                        )}
                      </td>
                    </>
                  )}

                  {mode === "priorites" && (
                    <>
                      <td className="td max-w-56 text-muted">{s.description || TYPES[s.type]}</td>
                      <td className="td">{s.agent_nom || s.agent_id}</td>
                      <td className="td"><Badge table={STATUTS} value={s.statut} /></td>
                      <td className="td"><Badge table={PRIORITES} value={s.priorite} /></td>
                      <td className="td">
                        <select
                          aria-label="Modifier la priorité"
                          value={s.priorite}
                          disabled={busy === s.id || s.statut === "TERMINE"}
                          onChange={(e) =>
                            act(() => modifier(s.id, { priorite: e.target.value }), s.id, "Priorité modifiée.")
                          }
                          className="field w-auto py-1.5 pr-8"
                        >
                          {Object.entries(PRIORITES).map(([k, [l]]) => (
                            <option key={k} value={k}>{l}</option>
                          ))}
                        </select>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && (data.next || data.previous) && (
        <div className="mt-5 flex items-center justify-center gap-4 text-sm">
          <button disabled={!data.previous} onClick={() => setPage(page - 1)} className="btn btn-outline btn-sm">
            ← Précédent
          </button>
          <span className="text-muted">Page {page}</span>
          <button disabled={!data.next} onClick={() => setPage(page + 1)} className="btn btn-outline btn-sm">
            Suivant →
          </button>
        </div>
      )}

      {modal?.kind === "detail" && <DetailModal s={modal.s} onClose={() => setModal(null)} />}
      {modal?.kind === "edit" && (
        <EditModal
          s={modal.s}
          onClose={() => setModal(null)}
          onSave={async (payload) => {
            const ok = await act(() => modifier(modal.s.id, payload), modal.s.id, "Tâche modifiée.");
            if (ok) setModal(null);
          }}
        />
      )}
      {modal?.kind === "delete" && (
        <Modal title="Supprimer la tâche" onClose={() => setModal(null)}>
          <p className="text-sm">
            Supprimer le ménage de la chambre <b>{modal.s.chambre_numero || modal.s.chambre_id}</b>
            {modal.s.description ? <> (« {modal.s.description} »)</> : null} ? Cette action est définitive.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => setModal(null)} className="btn btn-outline">Annuler</button>
            <button
              disabled={busy === modal.s.id}
              onClick={async () => {
                const ok = await act(() => supprimer(modal.s.id), modal.s.id, "Tâche supprimée.");
                if (ok) setModal(null);
              }}
              className="btn btn-primary"
            >
              Supprimer
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function DetailModal({ s, onClose }) {
  return (
    <Modal title="Détail de la tâche" onClose={onClose} wide>
      <Detail
        rows={[
          ["Identifiant", s.id],
          ["Chambre", s.chambre_numero || s.chambre_id],
          ["Type", TYPES[s.type]],
          ["Agent de ménage", s.agent_nom || s.agent_id],
          ["Statut", <Badge key="st" table={STATUTS} value={s.statut} />],
          ["Priorité", <Badge key="pr" table={PRIORITES} value={s.priorite} />],
          ["Date de demande", dateHeure(s.date_creation)],
          ["Date prévue", jour(s.date_prevue)],
          ["Date de début", dateHeure(s.date_debut)],
          ["Date de fin", dateHeure(s.date_fin)],
          ["Assigné par", s.assigne_par],
          ["Demande client", s.demande ? "Oui" : "Non"],
        ]}
      />
      <div className="mt-4 text-sm">
        <p className="text-xs uppercase tracking-wider text-muted">Description</p>
        <p className="mt-0.5">{s.description || "—"}</p>
      </div>
      <div className="mt-6 flex justify-end">
        <button onClick={onClose} className="btn btn-outline">Fermer</button>
      </div>
    </Modal>
  );
}

function EditModal({ s, onClose, onSave }) {
  const [form, setForm] = useState({
    description: s.description || "",
    priorite: s.priorite,
    date_prevue: s.date_prevue,
  });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  return (
    <Modal title="Modifier la tâche" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(form);
        }}
        className="space-y-4"
      >
        <p className="text-sm text-muted">
          Chambre {s.chambre_numero || s.chambre_id} · {s.agent_nom || `agent ${s.agent_id}`} · <Badge table={STATUTS} value={s.statut} />
          <span className="block pt-1 text-xs">Le statut change avec les boutons de l'écran « Statuts ».</span>
        </p>
        <label className="block text-sm text-muted">
          Description
          <textarea rows={3} maxLength={500} value={form.description} onChange={set("description")} className="field mt-1" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm text-muted">
            Priorité
            <select value={form.priorite} onChange={set("priorite")} className="field mt-1">
              {Object.entries(PRIORITES).map(([k, [l]]) => (
                <option key={k} value={k}>{l}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-muted">
            Date prévue
            <input type="date" required value={form.date_prevue} onChange={set("date_prevue")} className="field mt-1" />
          </label>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn btn-outline">Annuler</button>
          <button className="btn btn-primary">Modifier</button>
        </div>
      </form>
    </Modal>
  );
}