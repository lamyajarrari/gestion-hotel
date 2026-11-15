import { useEffect, useState } from "react";
import { listChambresANettoyer } from "../api.js";
import { Empty, ErrorBox } from "./ui.jsx";

const money = (v) => (v == null ? "—" : `${Number(v).toLocaleString("fr-FR")} MAD`);

export default function ChambresANettoyer({ version, onAssign, onAuthError }) {
  const [chambres, setChambres] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setError("");
    listChambresANettoyer()
      .then((d) => !cancelled && setChambres(d))
      .catch((e) => {
        if (cancelled) return;
        if (e.status === 401) return onAuthError();
        setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [version, onAuthError]);

  if (error) return <ErrorBox>{error}</ErrorBox>;
  if (!chambres) return <p className="text-sm text-muted">Chargement...</p>;
  if (chambres.length === 0) return <Empty>Aucune chambre à nettoyer.</Empty>;

  return (
    <div className="card overflow-x-auto">
      <table className="w-full">
        <thead className="border-b border-line">
          <tr>
            {["Numéro", "Type", "Capacité", "Tarif", "État", "Action"].map((h) => (
              <th key={h} className="th">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {chambres.map((c) => (
            <tr key={c.id} className="border-t border-line first:border-t-0">
              <td className="td font-medium">{c.numero ?? c.id}</td>
              <td className="td capitalize">{c.type ?? "—"}</td>
              <td className="td">{c.capacite ?? "—"}</td>
              <td className="td">{money(c.tarif)}</td>
              <td className="td">
                <span className="badge bg-[#f8ebc8] text-[#8a6414]">À nettoyer</span>
              </td>
              <td className="td">
                <button onClick={() => onAssign(c)} className="btn btn-primary btn-sm">
                  Assigner
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
