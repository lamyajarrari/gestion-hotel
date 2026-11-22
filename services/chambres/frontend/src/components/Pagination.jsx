export default function Pagination({ page, hasPrev, hasNext, onChange }) {
  if (!hasPrev && !hasNext) return null;

  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        className="btn btn-secondaire btn-petit"
        disabled={!hasPrev}
        onClick={() => onChange(page - 1)}
      >
        ← Précédent
      </button>
      <span className="pagination-info">Page {page}</span>
      <button
        className="btn btn-secondaire btn-petit"
        disabled={!hasNext}
        onClick={() => onChange(page + 1)}
      >
        Suivant →
      </button>
    </nav>
  );
}