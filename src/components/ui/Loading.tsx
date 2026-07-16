export function Loading(): React.JSX.Element {
  return (
    <section className="page-shell" aria-live="polite">
      <p style={{ color: 'var(--text-secondary)', fontWeight: 800 }}>Memuat...</p>
      <div className="stack">
        <div className="skeleton-line" style={{ width: '70%' }} />
        <div className="skeleton-line" style={{ width: '100%' }} />
        <div className="skeleton-line" style={{ width: '85%' }} />
      </div>
    </section>
  );
}
