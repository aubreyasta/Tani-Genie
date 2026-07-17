import { Suspense } from 'react';
import { PestRiskLoading, PestRiskSection } from '@/components/features/PestRiskSection';
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
  const apiPlantings = plantings.filter((planting) => planting.dataPoints.temp === 'api');
  const iotPlantings = plantings.filter((planting) => planting.dataPoints.temp === 'iot');
  const insightResults = await Promise.allSettled(
    apiPlantings.map((planting) =>
      apiGet<WeatherInsightDto>(`/api/insights/weather?plantingId=${planting.id}`),
    ),
  );
  const insights = insightResults.flatMap((result) =>
    result.status === 'fulfilled' ? [result.value] : [],
  );
  const unavailableCount = insightResults.length - insights.length;
  const top =
    insights.find((item) => item.verdict.status === 'danger') ??
    insights.find((item) => item.verdict.status === 'watch') ??
    insights[0];

  return (
    <div className="page-shell stack">
      <section className={`verdict-card hero-verdict verdict-${top?.verdict.status ?? 'safe'}`}>
        <p className="eyebrow">Peringatan</p>
        <h1 className="hero-title">
          {top
            ? top.verdict.action
            : iotPlantings.length > 0
              ? 'Menunggu data sensor IoT'
              : 'Belum ada tanaman aktif'}
        </h1>
        <p className="hero-copy">
          {top
            ? top.verdict.reason
            : iotPlantings.length > 0
              ? 'Peringatan akan dihitung setelah sensor mengirimkan pembacaan nyata.'
              : 'Tambahkan tanaman di Kebunku agar risiko cuaca bisa dihitung.'}
        </p>
        <div className="source-tags">
          <span className="source-tag">Data: NASA POWER</span>
          <span className="source-tag">Ringkasan cuaca 7 hari terakhir</span>
        </div>
      </section>

      {insights.length === 0 && iotPlantings.length === 0 ? (
        <EmptyState
          message={
            plantings.length === 0
              ? 'Belum ada peringatan. Tambahkan tanaman aktif terlebih dahulu.'
              : 'Data NASA POWER sedang tidak tersedia.'
          }
        />
      ) : null}

      {unavailableCount > 0 && insights.length > 0 ? (
        <p className="muted">Data cuaca belum tersedia untuk {unavailableCount} tanaman.</p>
      ) : null}

      {iotPlantings.map((planting) => (
        <article className="stack" key={planting.id}>
          <div>
            <h2 className="flush">{planting.cropName}</h2>
            <p className="muted flush">Suhu: menunggu data sensor IoT.</p>
          </div>
        </article>
      ))}

      {insights.map((insight) => (
        <article className="stack" key={insight.planting.id}>
          <div>
            <h2 className="flush">{insight.planting.cropName}</h2>
            <p className="muted flush">
              Update {formatDateTime(insight.weather.observedAt)} · {insight.weather.source}
            </p>
          </div>
          <dl className="integration-summary">
            <div>
              <dt>Suhu</dt>
              <dd>
                {insight.weather.temperatureC.toLocaleString('id-ID', {
                  maximumFractionDigits: 1,
                })}
                °C
              </dd>
            </div>
            <div>
              <dt>Kelembapan</dt>
              <dd>
                {insight.weather.humidityPct.toLocaleString('id-ID', {
                  maximumFractionDigits: 1,
                })}
                %
              </dd>
            </div>
            <div>
              <dt>Curah hujan</dt>
              <dd>
                {insight.weather.rainfallMm.toLocaleString('id-ID', {
                  maximumFractionDigits: 1,
                })}{' '}
                mm
              </dd>
            </div>
            <div>
              <dt>Kecepatan angin</dt>
              <dd>
                {insight.weather.windSpeedKmh.toLocaleString('id-ID', {
                  maximumFractionDigits: 1,
                })}{' '}
                km/jam
              </dd>
            </div>
          </dl>
          <VerdictCard verdict={insight.verdict} />
          {(() => {
            const planting = apiPlantings.find((item) => item.id === insight.planting.id);
            return planting ? (
              <Suspense fallback={<PestRiskLoading cropName={planting.cropName} />}>
                <PestRiskSection planting={planting} />
              </Suspense>
            ) : null;
          })()}
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
