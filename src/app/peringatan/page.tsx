import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { VerdictCard } from '@/components/ui/VerdictCard';
import { apiGet, formatDateTime } from '@/lib/ui-data';
import type { PlantingDto } from '@/types/api';
import type { WeatherInsightDto } from '@/types/ui';

export default async function PeringatanPage(): Promise<React.JSX.Element> {
  const plantings = (await apiGet<ReadonlyArray<PlantingDto>>('/api/plantings')).filter(
    (planting) => planting.status === 'active',
  );
  const insights = await Promise.all(
    plantings.map((planting) =>
      apiGet<WeatherInsightDto>(`/api/insights/weather?plantingId=${planting.id}`),
    ),
  );
  const top =
    insights.find((item) => item.verdict.status === 'danger') ??
    insights.find((item) => item.verdict.status === 'watch') ??
    insights[0];

  return (
    <div className="page-shell stack">
      <section className={`verdict-card verdict-${top?.verdict.status ?? 'safe'}`}>
        <p style={{ margin: 0, color: 'var(--accent-primary)', fontWeight: 800 }}>Peringatan</p>
        <h1 style={{ margin: 'var(--space-2) 0 0', fontSize: '2rem', lineHeight: 1.1 }}>
          {top ? top.verdict.action : 'Belum ada tanaman aktif'}
        </h1>
        <p style={{ margin: 'var(--space-2) 0 0', color: 'var(--text-secondary)' }}>
          {top
            ? top.verdict.reason
            : 'Tambahkan tanaman di Kebunku agar risiko cuaca bisa dihitung.'}
        </p>
        <div
          style={{
            marginTop: 'var(--space-3)',
            display: 'flex',
            gap: 'var(--space-2)',
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              border: '1px solid var(--border-default)',
              borderRadius: '999px',
              padding: 'var(--space-1) var(--space-2)',
              color: 'var(--text-secondary)',
            }}
          >
            Data: BMKG
          </span>
          <span
            style={{
              border: '1px solid var(--border-default)',
              borderRadius: '999px',
              padding: 'var(--space-1) var(--space-2)',
              color: 'var(--text-secondary)',
            }}
          >
            Data demo — bukan data BMKG langsung
          </span>
        </div>
      </section>

      {insights.length === 0 ? (
        <EmptyState message="Belum ada peringatan. Buat tanaman aktif dulu, gng." />
      ) : null}

      {insights.map((insight) => (
        <article className="stack" key={insight.planting.id}>
          <div>
            <h2 style={{ margin: 0 }}>{insight.planting.cropName}</h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
              Update {formatDateTime(insight.weather.observedAt)} · {insight.weather.source}
            </p>
          </div>
          <VerdictCard verdict={insight.verdict} />
          <Button
            endpoint={`/api/insights/weather/refresh?plantingId=${insight.planting.id}`}
            variant="secondary"
          >
            Segarkan Data
          </Button>
        </article>
      ))}
    </div>
  );
}
