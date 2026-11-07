import { useMemo, useState } from "react";
import { urlMedia } from "../api/client.js";
import { TYPES } from "../constantes.js";

export default function FormulaireChambre({ chambre, onEnregistrer, onAnnuler }) {
  const [forme, setForme] = useState({
    numero: chambre?.numero ?? "",
    type: chambre?.type ?? "simple",
    capacite: chambre?.capacite ?? 2,
    tarif: chambre?.tarif ?? "",
  });
  const [fichier, setFichier] = useState(null);
  const [erreur, setErreur] = useState("");
  const [enCours, setEnCours] = useState(false);

  const apercu = useMemo(
    () => (fichier ? URL.createObjectURL(fichier) : urlMedia(chambre?.image)),
    [fichier, chambre]
  );

  const majChamp = (cle) => (e) =>
    setForme((f) => ({ ...f, [cle]: e.target.value }));

  async function soumettre(e) {
    e.preventDefault();
    setErreur("");
    setEnCours(true);

    const donnees = new FormData();
    Object.entries(forme).forEach(([cle, valeur]) => donnees.append(cle, valeur));
    if (fichier) donnees.append("image", fichier);

    try {
      await onEnregistrer(donnees);
    } catch (err) {
      setErreur(err.message);
      setEnCours(false);
    }
  }

  return (
    <form className="formulaire-grille" onSubmit={soumettre}>
      {erreur && <p className="alerte champ-pleine">{erreur}</p>}

      <label className="champ">
        Numéro
        <input required maxLength={10} placeholder="102" value={forme.numero} onChange={majChamp("numero")} />
      </label>

      <label className="champ">
        Type
        <select value={forme.type} onChange={majChamp("type")}>
          {Object.entries(TYPES).map(([valeur, libelle]) => (
            <option key={valeur} value={valeur}>{libelle}</option>
          ))}
        </select>
      </label>

      <label className="champ">
        Capacité
        <input type="number" min={1} required value={forme.capacite} onChange={majChamp("capacite")} />
      </label>

      <label className="champ">
        Tarif (MAD / nuit)
        <input type="number" min={0} step="0.01" required value={forme.tarif} onChange={majChamp("tarif")} />
      </label>

      <div className="champ champ-pleine champ-fichier">
        <span>Photo de la chambre</span>
        {apercu && <img className="apercu-image" src={apercu} alt="Aperçu" />}
        <input type="file" accept="image/*" onChange={(e) => setFichier(e.target.files?.[0] ?? null)} />
      </div>

      <div className="formulaire-actions champ-pleine">
        <button type="button" className="btn btn-secondaire" onClick={onAnnuler}>Annuler</button>
        <button type="submit" className="btn btn-primaire" disabled={enCours}>
          {enCours ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}