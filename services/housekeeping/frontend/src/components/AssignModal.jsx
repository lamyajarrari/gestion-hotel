import { useState } from "react";
import { assigner } from "../api.js";

const today = () => new Date().toISOString().slice(0, 10);

export default function AssignModal({ initial, onClose, onDone, onAuthError }) {
  const [form, setForm] = useState({
    chambre_id: initial.chambre_id || "",
    agent_id: "",
    type: initial.type || "DEPART",
    date_prevue: today(),
    description: "",
    priorite: "NORMALE",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await assigner(form);
      onDone();
    } catch (err) {
      if (err.status === 401) return onAuthError();
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const label = "block text-sm text-muted";

  return (
    <div
      className="fixed inset-0 z-10 flex items-center justify-center bg-slate-600/50 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-line px-8 py-6">
          <h2 className="text-2xl font-bold">Créer une tâche de ménage</h2>
          <button type="button" onClick={onClose} aria-label="Fermer" className="text-2xl leading-none text-muted hover:text-navy">
            ×
          </button>
        </div>
        <div className="space-y-4 px-8 py-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={label}>
              Chambre (identifiant)
              <input required value={form.chambre_id} onChange={set("chambre_id")} className="field mt-1" />
            </label>
            <label className={label}>
              Agent de ménage (identifiant)
              <input required value={form.agent_id} onChange={set("agent_id")} className="field mt-1" />
            </label>
            <label className={label}>
              Type
              <select value={form.type} onChange={set("type")} className="field mt-1">
                <option value="DEPART">Départ (chambre à nettoyer)</option>
                <option value="QUOTIDIEN">Quotidien (chambre occupée)</option>
              </select>
            </label>
            <label className={label}>
              Priorité
              <select value={form.priorite} onChange={set("priorite")} className="field mt-1">
                <option value="BASSE">Basse</option>
                <option value="NORMALE">Normale</option>
                <option value="HAUTE">Haute</option>
              </select>
            </label>
          </div>
          <label className={label}>
            Date prévue
            <input type="date" required value={form.date_prevue} onChange={set("date_prevue")} className="field mt-1" />
          </label>
          <label className={label}>
            Description
            <textarea
              rows={3}
              maxLength={500}
              value={form.description}
              onChange={set("description")}
              placeholder="Draps à changer, salle de bain..."
              className="field mt-1"
            />
          </label>
          {error && (
            <p className="rounded-xl border border-[#f1c9b8] bg-[#fdf0ea] p-3 text-sm text-[#a8472a]">{error}</p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-outline">
              Annuler
            </button>
            <button disabled={loading} className="btn btn-primary">
              {loading ? "Envoi..." : "Enregistrer"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
