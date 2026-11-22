import { useEffect } from "react";

export default function Modal({ titre, onFermer, children }) {
  useEffect(() => {
    const touche = (e) => e.key === "Escape" && onFermer();
    document.addEventListener("keydown", touche);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", touche);
      document.body.style.overflow = "";
    };
  }, [onFermer]);

  return (
    <div
      className="modal-fond"
      onMouseDown={(e) => e.target === e.currentTarget && onFermer()}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-label={titre}>
        <header className="modal-entete">
          <h2>{titre}</h2>
          <button className="modal-fermer" onClick={onFermer} aria-label="Fermer">
            ×
          </button>
        </header>
        <div className="modal-corps">{children}</div>
      </div>
    </div>
  );
}