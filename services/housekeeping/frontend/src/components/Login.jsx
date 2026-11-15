import { useState } from "react";
import { verifierToken } from "../api.js";

// En attendant l'écran de connexion du service users : on colle un JWT de gestionnaire.
// Dev : python manage.py make_token --role GESTIONNAIRE
export default function Login({ onLogin }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    const token = value.trim();
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      await verifierToken(token); // 401 = jeton invalide, 403 = pas gestionnaire
      onLogin(token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={submit} className="card w-full max-w-md p-8">
        <p className="font-serif text-lg font-bold text-navy">Riad Souss</p>
        <h1 className="mt-4 text-2xl font-bold">Ménage et entretien</h1>
        <p className="mt-2 text-sm text-muted">
          Collez le jeton JWT du gestionnaire (émis par le service users).
        </p>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={5}
          placeholder="eyJhbGciOi..."
          className="field mt-5 font-mono text-xs"
        />
        {error && <p className="mt-3 text-sm text-[#a8472a]">{error}</p>}
        <button disabled={loading || !value.trim()} className="btn btn-primary mt-5 w-full">
          {loading ? "Vérification..." : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
