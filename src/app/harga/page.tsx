import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { apiGet, formatDate, formatRupiah } from '@/lib/ui-data';
import type { PlantingDto, PriceForecastDto } from '@/types/api';

export default async function HargaPage() {
  const plantings = (await apiGet<ReadonlyArray<PlantingDto>>('/api/plantings')).filter(
    (planting) => planting.status === 'active',
  );
  const forecastResults = await Promise.allSettled(
    plantings.map(async (planting) => ({
      planting,
      forecast: await apiGet<PriceForecastDto>(`/api/forecasts/prices?plantingId=${planting.id}`),
    })),
  );
  const forecasts = forecastResults.flatMap((result) =>
    result.status === 'fulfilled' ? [result.value] : [],
  );
  const unavailableCount = forecastResults.length - forecasts.length;
  const nearest = forecasts
    .flatMap((item) => item.forecast.points.filter((point) => point.isBestSell))
    .sort((a, b) => a.horizonDays - b.horizonDays)[0];

  return (
    <div className="page-shell stack">
      <section className="verdict-card hero-verdict verdict-safe">
        <p className="eyebrow">Harga</p>
        <h1 className="hero-title">
          {nearest
            ? `Peluang jual terbaik ${formatDate(nearest.targetDate)}`
            : 'Pantau harga sebelum jual'}
        </h1>
        <p className="hero-copy">Prediksi dari model ML Tani Genie berdasarkan data harga tim.</p>
      </section>

      {forecasts.length === 0 ? (
        <EmptyState
          message={
            plantings.length === 0
              ? 'Belum ada tanaman aktif untuk dibuat prakiraan harga.'
              : 'Model harga belum tersedia atau service price prediction sedang tidak aktif.'
          }
        />
      ) : null}

      {unavailableCount > 0 && forecasts.length > 0 ? (
        <p className="muted">Prediksi belum tersedia untuk {unavailableCount} tanaman.</p>
      ) : null}

      <section className="forecast-grid" aria-label="Daftar prediksi harga">
        {forecasts.map(({ planting, forecast }) => (
          <Card key={planting.id} className="forecast-card">
            <div className="stack">
              <div>
                <h2 className="flush">{planting.cropName}</h2>
                <p className="price-kicker">Harga terakhir</p>
                <p className="price-value">
                  {formatRupiah(forecast.lastKnownPrice)}
                  <small>/kg</small>
                </p>
                <p className="muted flush">
                  {formatDate(forecast.lastKnownDate)} · {forecast.market.replaceAll('_', ' ')},{' '}
                  {forecast.province}
                </p>
              </div>
              <div className="scroll-table">
                <table>
                  <thead>
                    <tr>
                      <th>Tanggal</th>
                      <th>Horizon</th>
                      <th>Prediksi Harga</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecast.points.map((point) => (
                      <tr
                        key={point.targetDate}
                        className={point.isBestSell ? 'best-sell-row' : undefined}
                      >
                        <td>{formatDate(point.targetDate)}</td>
                        <td>{point.horizonDays} hari</td>
                        <td>{formatRupiah(point.predictedPrice)}</td>
                        <td>
                          {point.isBestSell ? (
                            <StatusBadge status="safe" label="Waktu Jual" />
                          ) : (
                            <StatusBadge status="watch" label="Pantau" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="muted flush">
                Sumber: {forecast.source}. Prediksi, bukan harga transaksi langsung.
              </p>
              <Button
                endpoint={`/api/forecasts/prices/refresh?plantingId=${planting.id}`}
                variant="secondary"
              >
                Segarkan
              </Button>
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}
