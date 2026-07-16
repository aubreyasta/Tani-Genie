export function Loading() {
  return (
    <section className="page-shell" aria-live="polite">
      <p className="loading-label">Memuat...</p>
      <div className="stack">
        <div className="skeleton-line skeleton-short" />
        <div className="skeleton-line" />
        <div className="skeleton-line skeleton-medium" />
      </div>
    </section>
  );
}
