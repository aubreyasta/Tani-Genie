import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { VerdictCard } from '@/components/ui/VerdictCard';
import { apiGet, formatDateTime } from '@/lib/ui-data';
import type { PlantingDto } from '@/types/api';
import type { WeatherInsightDto } from '@/types/ui';

export default async function PeringatanPage() {
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
        <p className="eyebrow">Peringatan</p>
        <h1 className="hero-title">{top ? top.verdict.action : 'Belum ada tanaman aktif'}</h1>
        <p className="hero-copy">
          {top
            ? top.verdict.reason
            : 'Tambahkan tanaman di Kebunku agar risiko cuaca bisa dihitung.'}
        </p>
        <div className="source-tags">
          <span className="source-tag">Data: BMKG</span>
          <span className="source-tag">Data demo — bukan data BMKG langsung</span>
        </div>
      </section>

      {insights.length === 0 ? (
        <EmptyState message="Belum ada peringatan. Tambahkan tanaman aktif terlebih dahulu." />
      ) : null}

      {insights.map((insight) => (
        <article className="stack" key={insight.planting.id}>
          <div>
            <h2 className="flush">{insight.planting.cropName}</h2>
            <p className="muted flush">
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
