import { StatusBadge } from '@/components/ui/StatusBadge';
import type { VerdictDto } from '@/types/api';

export function VerdictCard({ verdict }: { readonly verdict: VerdictDto }): React.JSX.Element {
  return (
    <section className={`verdict-card verdict-${verdict.status}`} aria-label="Ringkasan keputusan">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontWeight: 800 }}>Keputusan</p>
        <StatusBadge status={verdict.status} />
      </div>
      <h2 style={{ margin: 'var(--space-3) 0 0', fontSize: '1.5rem', lineHeight: 1.15 }}>
        {verdict.action}
      </h2>
      <p style={{ margin: 'var(--space-2) 0 0', color: 'var(--text-secondary)' }}>
        {verdict.reason}
      </p>
      <dl className="dashboard-grid" style={{ margin: 'var(--space-4) 0 0' }}>
        {verdict.details.map((detail) => (
          <div
            key={detail.label}
            style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-3)' }}
          >
            <dt style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 700 }}>
              {detail.label}
            </dt>
            <dd
              style={{
                margin: 'var(--space-1) 0 0',
                display: 'flex',
                justifyContent: 'space-between',
                gap: 'var(--space-3)',
              }}
            >
              <span>{detail.value}</span>
              <StatusBadge status={detail.status} />
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
