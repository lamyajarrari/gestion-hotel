import { useEffect, useState } from "react";
import { annulerDemande, creerDemande, listDemandes, verifierChambre } from "../api.js";
import { Badge, Detail, Empty, ErrorBox, Modal, PRIORITES, STATUTS, STATUTS_DEMANDE, dateHeure, jour } from "./ui.jsx";

// Interface du client : H007 (demander un nettoyage) et H008 (suivre une demande).

export function DemandeForm({ onDone, onCancel, onAuthError }) {
  const [form, setForm] = useState({ chambre_id: "", description: "", priorite: "NORMALE" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  // Vérification en direct du numéro saisi : la chambre est retrouvée par son numéro.
  const [chambre, setChambre] = useState(null); // {numero, type, statut, demande_possible} | {erreur}
  useEffect(() => {
    const numero = form.chambre_id.trim();
    if (!numero) {
      setChambre(null);
      return undefined;
    }
    let annule = false;
    const minuterie = setTimeout(() => {
      verifierChambre(numero)
        .then((c) => !annule && setChambre(c))
        .catch((err) => {
          if (annule) return;
          if (err.status === 401) return onAuthError();
          setChambre({ erreur: err.message });
        });
    }, 350);
    return () => {
      annule = true;
      clearTimeout(minuterie);
    };
  }, [form.chambre_id]); // eslint-disable-line react-hooks/exhaustive-deps

  const numeroSaisi = form.chambre_id.trim() !== "";
  const verification = !numeroSaisi ? null : !chambre ? "attente" : chambre.erreur ? "inconnue" : chambre.demande_possible ? "ok" : "non_occupee";

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await creerDemande(form);
      onDone();
    } catch (err) {
      if (err.status === 401) return onAuthError();
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="card max-w-2xl space-y-4 p-8">
      <label className="block text-sm text-muted">
        Numéro de la chambre
        <input
          required
          inputMode="numeric"
          autoComplete="off"
          placeholder="Ex. 102"
          value={form.chambre_id}
          onChange={set("chambre_id")}
          className="field mt-1"
        />
        {verification === "attente" && <span className="mt-1 block text-xs text-muted">Recherche de la chambre…</span>}
        {verification === "ok" && (
          <span className="mt-1 block text-xs text-green-700" role="status">
            ✓ Chambre {chambre.numero}{chambre.type ? ` · ${chambre.type}` : ""} : occupée, la demande est possible.
          </span>
        )}
        {verification === "non_occupee" && (
          <span className="mt-1 block text-xs text-amber-700" role="status">
            Chambre {chambre.numero} trouvée, mais elle n'est pas occupée : un nettoyage ne peut pas être demandé.
          </span>
        )}
        {verification === "inconnue" && <span className="mt-1 block text-xs text-red-700" role="status">{chambre.erreur}</span>}
      </label>
      <label className="block text-sm text-muted">
        Description du besoin
        <textarea
          required
          rows={4}
          maxLength={500}
          value={form.description}
          onChange={set("description")}
          placeholder="Serviettes propres, ménage de la salle de bain..."
          className="field mt-1"
        />
      </label>
      <label className="block text-sm text-muted">
        Priorité
        <select value={form.priorite} onChange={set("priorite")} className="field mt-1">
          {Object.entries(PRIORITES).map(([k, [l]]) => (
            <option key={k} value={k}>{l}</option>
          ))}
        </select>
      </label>
      {error && <ErrorBox>{error}</ErrorBox>}
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn btn-outline">Annuler</button>
        <button disabled={loading || verification !== "ok"} className="btn btn-primary disabled:opacity-50">{loading ? "Envoi..." : "Envoyer la demande"}</button>
      </div>
    </form>
  );
}

export function MesDemandes({ version, onChanged, onToast, onAuthError }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setError("");
    listDemandes({})
      .then((d) => !cancelled && setRows(d.results ?? d))
      .catch((e) => {
        if (cancelled) return;
        if (e.status === 401) return onAuthError();
        setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [version, onAuthError]);

  async function annuler(d) {
    try {
      await annulerDemande(d.id);
      onToast({ ok: true, text: "Demande annulée." });
      setDetail(null);
      onChanged();
    } catch (e) {
      if (e.status === 401) return onAuthError();
      onToast({ ok: false, text: e.message });
    }
  }

  if (error) return <ErrorBox>{error}</ErrorBox>;
  if (!rows) return <p className="text-sm text-muted">Chargement...</p>;
  if (rows.length === 0) return <Empty>Vous n'avez fait aucune demande de nettoyage.</Empty>;

  return (
    <>
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-line">
            <tr>
              {["Référence", "Chambre", "Description", "Statut", "Date de demande", "Action"].map((h) => (
                <th key={h} className="th">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.id} className="border-t border-line first:border-t-0">
                <td className="td font-mono text-xs">{d.id.slice(0, 8)}</td>
                <td className="td font-medium">{d.chambre_numero || d.chambre_id}</td>
                <td className="td max-w-64 text-muted">{d.description}</td>
                <td className="td"><Badge table={STATUTS_DEMANDE} value={d.statut} /></td>
                <td className="td whitespace-nowrap">{dateHeure(d.date_demande)}</td>
                <td className="td">
                  <button onClick={() => setDetail(d)} className="btn btn-outline btn-sm">Consulter</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {detail && (
        <Modal title="Suivi de la demande" onClose={() => setDetail(null)} wide>
          <Detail
            rows={[
              ["Référence", detail.id],
              ["Chambre", detail.chambre_numero || detail.chambre_id],
              ["Date de demande", dateHeure(detail.date_demande)],
              ["Statut", <Badge key="s" table={STATUTS_DEMANDE} value={detail.statut} />],
              ["Priorité", <Badge key="p" table={PRIORITES} value={detail.priorite} />],
              ["Prise en charge", detail.service ? `${detail.service.agent_nom || `Agent ${detail.service.agent_id}`}, prévu le ${jour(detail.service.date_prevue)}` : "En attente"],
              ["Ménage", detail.service ? <Badge key="m" table={STATUTS} value={detail.service.statut} /> : "—"],
              ["Terminé le", dateHeure(detail.service?.date_fin)],
            ]}
          />
          <div className="mt-4 text-sm">
            <p className="text-xs uppercase tracking-wider text-muted">Description</p>
            <p className="mt-0.5">{detail.description}</p>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            {detail.statut === "DEMANDE" && (
              <button onClick={() => annuler(detail)} className="btn btn-outline">Annuler la demande</button>
            )}
            <button onClick={() => setDetail(null)} className="btn btn-primary">Fermer</button>
          </div>
        </Modal>
      )}
    </>
  );
}