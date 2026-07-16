'use client';

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="page-shell">
      <div className="verdict-card verdict-danger">
        <p className="error-label">Gagal memuat</p>
        <h1 className="page-title">Dashboard tidak dapat dimuat</h1>
        <p className="muted">Coba ulang. Kalau masih gagal, backend atau database perlu dicek.</p>
        <button type="button" onClick={reset} className="button button-secondary">
          Coba lagi
        </button>
      </div>
    </section>
  );
}
