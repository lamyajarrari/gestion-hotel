import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { statistiquesChambres } from "../api/chambres.js";
import { ETATS, TYPES } from "../constantes.js";

const COULEURS_ETATS = {
  disponible: "#5b7344",
  occupee: "#c2653c",
  a_nettoyer: "#b8a88a",
  maintenance: "#1f3a5f",
};

function jourIso(decalage = 0) {
  const d = new Date();
  d.setDate(d.getDate() + decalage);
  return d.toISOString().slice(0, 10);
}

function Kpi({ libelle, valeur }) {
  return (
    <div className="stats-kpi-carte">
      <span>{libelle}</span>
      <strong>{valeur}</strong>
    </div>
  );
}

export default function Statistiques({ token }) {
  const [debut, setDebut] = useState(jourIso(-30));
  const [fin, setFin] = useState(jourIso(0));
  const [donnees, setDonnees] = useState(null);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    setErreur("");
    statistiquesChambres(token, debut, fin)
      .then(setDonnees)
      .catch((e) => setErreur(e.message));
  }, [token, debut, fin]);

  if (erreur) return <p className="alerte">{erreur}</p>;
  if (!donnees) return <p className="vide">Chargement des statistiques…</p>;

  const dataEtats = donnees.par_etat.map((e) => ({
    name: ETATS[e.etat],
    value: e.total,
    couleur: COULEURS_ETATS[e.etat],
  }));

  const dataTypes = donnees.par_type.map((t) => ({
    name: TYPES[t.type],
    total: t.total,
  }));

  return (
    <div className="stats">
      <div className="stats-entete">
        <h3>Vue d'ensemble</h3>
        <div className="stats-periode">
          <label className="champ">
            Du
            <input type="date" value={debut} onChange={(e) => setDebut(e.target.value)} />
          </label>
          <label className="champ">
            Au
            <input type="date" value={fin} onChange={(e) => setFin(e.target.value)} />
          </label>
        </div>
      </div>

      <div className="stats-kpi">
        <Kpi libelle="Chambres actives" valeur={donnees.actives} />
        <Kpi libelle="Chambres inactives" valeur={donnees.total - donnees.actives} />
        <Kpi libelle="Taux d'indisponibilité" valeur={`${donnees.taux_indisponibilite} %`} />
        <Kpi libelle="Nuits bloquées" valeur={donnees.nuits_bloquees} />
      </div>

      <div className="stats-grille">
        <div className="stats-carte">
          <h4>Répartition par état</h4>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={dataEtats}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
              >
                {dataEtats.map((e) => (
                  <Cell key={e.name} fill={e.couleur} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="stats-carte">
          <h4>Chambres par type</h4>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dataTypes}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e0d3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="total" fill="#1f3a5f" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}