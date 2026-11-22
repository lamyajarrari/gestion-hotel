// Petits éléments d'interface partagés (badges de statut et de priorité).

// Couleurs reprises des badges de l'interface Chambres : vert, saumon, lavande.
const VERT = "bg-[#e3ecd8] text-[#46662b]";
const SAUMON = "bg-[#f7ddd0] text-[#a8472a]";
const LAVANDE = "bg-[#e4e6f4] text-[#2f3d8f]";
const AMBRE = "bg-[#f8ebc8] text-[#8a6414]";

export const STATUTS = {
  ASSIGNE: ["Assigné", LAVANDE],
  EN_COURS: ["En cours", AMBRE],
  TERMINE: ["Terminé", VERT],
};
export const PRIORITES = {
  BASSE: ["Basse", VERT],
  NORMALE: ["Normale", LAVANDE],
  HAUTE: ["Haute", SAUMON],
};
export const STATUTS_DEMANDE = {
  DEMANDE: ["Demandée", LAVANDE],
  EN_COURS: ["En cours", AMBRE],
  TERMINEE: ["Terminée", VERT],
  ANNULEE: ["Annulée", SAUMON],
};
export const TYPES = { DEPART: "Départ", QUOTIDIEN: "Quotidien" };

export function Badge({ table, value }) {
  const [label, cls] = table[value] || [value, LAVANDE];
  return <span className={`badge ${cls}`}>{label}</span>;
}

export function ErrorBox({ children }) {
  return <p className="rounded-xl border border-[#f1c9b8] bg-[#fdf0ea] p-4 text-sm text-[#a8472a]">{children}</p>;
}

export function Empty({ children }) {
  return <p className="card p-10 text-center text-sm text-muted">{children}</p>;
}

// Fenêtre modale (même style que l'interface Chambres : coins arrondis, fond flou).
export function Modal({ title, onClose, children, wide }) {
  return (
    <div
      className="fixed inset-0 z-10 flex items-center justify-center bg-slate-600/50 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`max-h-[92vh] w-full overflow-y-auto rounded-3xl bg-white shadow-2xl ${wide ? "max-w-2xl" : "max-w-xl"}`}
      >
        <div className="flex items-center justify-between border-b border-line px-8 py-6">
          <h2 className="text-2xl font-bold">{title}</h2>
          <button onClick={onClose} aria-label="Fermer" className="text-2xl leading-none text-muted hover:text-navy">
            ×
          </button>
        </div>
        <div className="px-8 py-6">{children}</div>
      </div>
    </div>
  );
}

// Filtre par boutons (« À faire / En cours / Terminé / Tous » des maquettes).
export function Pills({ value, onChange, options }) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-full border border-line bg-white p-1">
      {options.map(([k, label]) => (
        <button
          key={k}
          onClick={() => onChange(k)}
          className={`rounded-full px-4 py-1.5 text-sm transition ${
            value === k ? "bg-[#ece9e4] font-medium text-navy" : "text-muted hover:text-navy"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export const jour = (iso) => (iso ? new Date(iso).toLocaleDateString("fr-FR") : "—");
export const dateHeure = (iso) =>
  iso ? new Date(iso).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "—";

export function Detail({ rows }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt className="text-xs uppercase tracking-wider text-muted">{k}</dt>
          <dd className="mt-0.5 text-ink">{v ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
