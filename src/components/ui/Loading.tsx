export function Loading() {
  return (
    <section className="page-shell app-loading" aria-live="polite" aria-busy="true">
      <div className="loading-hero">
        <div className="loading-brand" aria-hidden="true">
          <span>T</span>
        </div>
        <p className="eyebrow">Tanigata sedang menyiapkan lahanmu</p>
        <h1>Merangkai data menjadi langkah yang sederhana.</h1>
        <p className="loading-label">Mengambil cuaca, tanaman, harga, dan peringatan terbaru…</p>
        <div className="loading-progress" aria-hidden="true">
          <span />
        </div>
      </div>
      <div className="loading-grid" aria-hidden="true">
        <div className="loading-card">
          <span className="skeleton-line skeleton-short" />
          <span className="skeleton-line" />
        </div>
        <div className="loading-card">
          <span className="skeleton-line skeleton-medium" />
          <span className="skeleton-line" />
        </div>
        <div className="loading-card">
          <span className="skeleton-line skeleton-short" />
          <span className="skeleton-line" />
        </div>
        <div className="loading-card">
          <span className="skeleton-line skeleton-medium" />
          <span className="skeleton-line" />
        </div>
      </div>
    </section>
  );
}
