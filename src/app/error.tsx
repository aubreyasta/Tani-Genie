'use client';

export default function ErrorPage({ reset }: { readonly reset: () => void }): React.JSX.Element {
  return (
    <section className="page-shell">
      <div className="verdict-card verdict-danger">
        <p style={{ margin: 0, color: 'var(--status-danger)', fontWeight: 800 }}>Gagal memuat</p>
        <h1 style={{ margin: 'var(--space-2) 0 0' }}>Dashboard sedang rewel</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Coba ulang. Kalau masih gagal, backend atau database perlu dicek.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            minHeight: 44,
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--surface-secondary)',
            color: 'var(--text-primary)',
            padding: '0 var(--space-4)',
            fontWeight: 800,
          }}
        >
          Coba lagi
        </button>
      </div>
    </section>
  );
}
