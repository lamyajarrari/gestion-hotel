import { useEffect, useState } from "react";
import { listAgents } from "../api.js";

/** Choix de l'agent de ménage par son NOM (liste lue dans le service users).
 *  Si la liste est indisponible (service users injoignable), on retombe sur la saisie
 *  de l'identifiant pour ne pas bloquer le travail du gestionnaire. */
export default function ChoixAgent({ value, onChange, onAuthError }) {
  const [agents, setAgents] = useState(null);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    let annule = false;
    listAgents()
      .then((d) => {
        if (!annule) setAgents(d.results ?? d);
      })
      .catch((e) => {
        if (annule) return;
        if (e.status === 401) return onAuthError?.();
        setErreur(e.message);
        setAgents([]);
      });
    return () => {
      annule = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const label = "block text-sm text-muted";

  if (agents === null) {
    return (
      <label className={label}>
        Agent de ménage
        <select disabled className="field mt-1">
          <option>Chargement des agents…</option>
        </select>
      </label>
    );
  }

  if (agents.length === 0) {
    return (
      <label className={label}>
        Agent de ménage (identifiant)
        <input required value={value} onChange={(e) => onChange(e.target.value)} className="field mt-1" />
        <span className="mt-1 block text-xs text-amber-700">
          {erreur || "Aucun agent de ménage actif : créez-en un dans « Personnel »."}
        </span>
      </label>
    );
  }

  return (
    <label className={label}>
      Agent de ménage
      <select required value={value} onChange={(e) => onChange(e.target.value)} className="field mt-1">
        <option value="">Choisir un agent…</option>
        {agents.map((a) => (
          <option key={a.id} value={a.id}>
            {`${a.prenom} ${a.nom}`.trim() || `Agent ${a.id}`}
          </option>
        ))}
      </select>
    </label>
  );
}