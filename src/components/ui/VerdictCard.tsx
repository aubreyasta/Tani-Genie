import { StatusBadge } from '@/components/ui/StatusBadge';
import type { VerdictDto } from '@/types/api';

export function VerdictCard({ verdict }: { verdict: VerdictDto }) {
  return (
    <section className={`verdict-card verdict-${verdict.status}`} aria-label="Ringkasan keputusan">
      <div className="row-between">
        <p className="section-label">Keputusan</p>
        <StatusBadge status={verdict.status} />
      </div>
      <h2 className="verdict-title">{verdict.action}</h2>
      <p className="muted verdict-reason">{verdict.reason}</p>
      <dl className="dashboard-grid verdict-details">
        {verdict.details.map((detail) => (
          <div key={detail.label} className="verdict-detail">
            <dt>{detail.label}</dt>
            <dd className="row-between">
              <span>{detail.value}</span>
              <StatusBadge status={detail.status} />
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
