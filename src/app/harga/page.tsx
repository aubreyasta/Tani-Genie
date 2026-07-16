import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { apiGet, formatDateTime, formatRupiah } from '@/lib/ui-data';
import type { PlantingDto, PriceForecastDto } from '@/types/api';

export default async function HargaPage() {
  const plantings = (await apiGet<ReadonlyArray<PlantingDto>>('/api/plantings')).filter(
    (planting) => planting.status === 'active',
  );
  const forecasts = await Promise.all(
    plantings.map(async (planting) => ({
      planting,
      forecast: await apiGet<PriceForecastDto>(`/api/forecasts/prices?plantingId=${planting.id}`),
    })),
  );
  const nearest = forecasts
    .flatMap((item) => item.forecast.points.filter((point) => point.isBestSell))
    .sort((a, b) => a.weekNumber - b.weekNumber)[0];

  return (
    <div className="page-shell stack">
      <section className="verdict-card verdict-safe">
        <p className="eyebrow">Harga</p>
        <h1 className="hero-title">
          {nearest
            ? `Peluang jual terdekat minggu ${nearest.weekNumber}`
            : 'Pantau harga sebelum jual'}
        </h1>
        <p className="hero-copy">Data demo. Ketidakpastian meningkat setelah minggu 4.</p>
      </section>

      {forecasts.length === 0 ? (
        <EmptyState message="Belum ada tanaman aktif untuk dibuat prakiraan harga." />
      ) : null}

      {forecasts.map(({ planting, forecast }) => (
        <Card key={planting.id}>
          <div className="stack">
            <div>
              <h2 className="flush">{planting.cropName}</h2>
              <p className="muted flush">
                Harga sekarang: <strong>{formatRupiah(forecast.currentPrice)}/kg</strong> ·{' '}
                {formatDateTime(forecast.generatedAt)}
              </p>
            </div>
            <div className="scroll-table">
              <table>
                <thead>
                  <tr>
                    <th>Minggu</th>
                    <th>Harga (Rp)</th>
                    <th>Batas Bawah</th>
                    <th>Batas Atas</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {forecast.points.map((point) => (
                    <tr
                      key={point.weekNumber}
                      className={point.isBestSell ? 'best-sell-row' : undefined}
                    >
                      <td>Minggu {point.weekNumber}</td>
                      <td>{formatRupiah(point.expectedPrice)}</td>
                      <td>{formatRupiah(point.lowerBound)}</td>
                      <td>{formatRupiah(point.upperBound)}</td>
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
              Sumber: {forecast.source}. Data demo — bukan harga pasar langsung.
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
    </div>
  );
}
