import { useEffect, useState } from "react";
import { annulerDemande, listDemandes, traiterDemande } from "../api.js";
import { Badge, Empty, ErrorBox, Modal, Pills, PRIORITES, STATUTS_DEMANDE, dateHeure, jour } from "./ui.jsx";
import ChoixAgent from "./ChoixAgent.jsx";

// Vue du gestionnaire sur les demandes de nettoyage des clients : prendre en charge ou refuser.
export default function DemandesAdmin({ version, onChanged, onToast, onAuthError }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [statut, setStatut] = useState("");
  const [traiter, setTraiter] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setError("");
    listDemandes({ statut })
      .then((d) => !cancelled && setRows(d.results ?? d))
      .catch((e) => {
        if (cancelled) return;
        if (e.status === 401) return onAuthError();
        setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [statut, version, onAuthError]);

  async function refuser(d) {
    try {
      await annulerDemande(d.id);
      onToast({ ok: true, text: "Demande refusée." });
      onChanged();
    } catch (e) {
      if (e.status === 401) return onAuthError();
      onToast({ ok: false, text: e.message });
    }
  }

  return (
    <div>
      <div className="mb-5">
        <Pills
          value={statut}
          onChange={setStatut}
          options={[["", "Toutes"], ...Object.entries(STATUTS_DEMANDE).map(([k, [l]]) => [k, l])]}
        />
      </div>
      {error && <ErrorBox>{error}</ErrorBox>}
      {!rows && !error && <p className="text-sm text-muted">Chargement...</p>}
      {rows && rows.length === 0 && <Empty>Aucune demande de nettoyage.</Empty>}
      {rows && rows.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-line">
              <tr>
                {["Référence", "Chambre", "Client", "Description", "Priorité", "Statut", "Demande", "Action"].map((h) => (
                  <th key={h} className="th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id} className="border-t border-line align-top first:border-t-0">
                  <td className="td font-mono text-xs">{d.id.slice(0, 8)}</td>
                  <td className="td font-medium">{d.chambre_numero || d.chambre_id}</td>
                  <td className="td">{d.client_id}</td>
                  <td className="td max-w-56 text-muted">{d.description}</td>
                  <td className="td"><Badge table={PRIORITES} value={d.priorite} /></td>
                  <td className="td">
                    <Badge table={STATUTS_DEMANDE} value={d.statut} />
                    {d.service && (
                      <p className="mt-1 text-xs text-muted">
                        {d.service.agent_nom || `Agent ${d.service.agent_id}`} · prévu {jour(d.service.date_prevue)}
                      </p>
                    )}
                  </td>
                  <td className="td whitespace-nowrap">{dateHeure(d.date_demande)}</td>
                  <td className="td">
                    {d.statut === "DEMANDE" && (
                      <div className="flex gap-2">
                        <button onClick={() => setTraiter(d)} className="btn btn-primary btn-sm">Traiter</button>
                        <button onClick={() => refuser(d)} className="btn btn-outline btn-sm">Refuser</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {traiter && (
        <TraiterModal
          demande={traiter}
          onClose={() => setTraiter(null)}
          onAuthError={onAuthError}
          onDone={() => {
            setTraiter(null);
            onToast({ ok: true, text: "Demande prise en charge : ménage assigné." });
            onChanged();
          }}
        />
      )}
    </div>
  );
}

function TraiterModal({ demande, onClose, onDone, onAuthError }) {
  const [agent, setAgent] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      await traiterDemande(demande.id, { agent_id: agent, date_prevue: date });
      onDone();
    } catch (err) {
      if (err.status === 401) return onAuthError();
      setError(err.message);
    }
  }
  return (
    <Modal title={`Traiter la demande · chambre ${demande.chambre_numero || demande.chambre_id}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-muted">« {demande.description} »</p>
        <ChoixAgent value={agent} onChange={setAgent} onAuthError={onAuthError} />
        <label className="block text-sm text-muted">
          Date prévue
          <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="field mt-1" />
        </label>
        {error && <ErrorBox>{error}</ErrorBox>}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn btn-outline">Annuler</button>
          <button className="btn btn-primary">Assigner</button>
        </div>
      </form>
    </Modal>
  );
}