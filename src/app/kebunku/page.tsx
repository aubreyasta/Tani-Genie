import { AddPlantingPanel, AddPlotPanel } from '@/components/features/KebunkuForms';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { apiGet, formatDate, formatNumber } from '@/lib/ui-data';
import type { CropDto, PlantingDto, PlotDto } from '@/types/api';

export default async function KebunkuPage() {
  const [plots, plantings, crops] = await Promise.all([
    apiGet<ReadonlyArray<PlotDto>>('/api/plots'),
    apiGet<ReadonlyArray<PlantingDto>>('/api/plantings'),
    apiGet<ReadonlyArray<CropDto>>('/api/crops'),
  ]);
  const activeCount = plantings.filter((planting) => planting.status === 'active').length;

  return (
    <div className="page-shell stack">
      <section className="verdict-card verdict-safe">
        <p className="eyebrow">Kebunku</p>
        <h1 className="hero-title">
          {activeCount > 0 ? `${activeCount} tanaman aktif dipantau` : 'Tambahkan tanaman pertama'}
        </h1>
        <p className="hero-copy">
          Daftar lahan dipakai untuk menghitung cuaca, hama, dan jendela harga.
        </p>
      </section>

      <AddPlotPanel />

      {plots.length === 0 ? (
        <EmptyState message="Belum ada lahan. Mulai dengan menambah petak kebun." />
      ) : null}

      <section className="stack" aria-label="Daftar lahan">
        {plots.map((plot) => {
          const plotPlantings = plantings.filter((planting) => planting.plotId === plot.id);
          const activePlanting = plotPlantings.find((planting) => planting.status === 'active');
          return (
            <Card key={plot.id}>
              <div className="stack">
                <div>
                  <h2 className="flush">{plot.name}</h2>
                  <p className="muted meta">
                    {formatNumber(plot.areaM2)} m² · {plot.latitude.toFixed(3)},{' '}
                    {plot.longitude.toFixed(3)}
                  </p>
                </div>

                {activePlanting ? (
                  <div className="card-section">
                    <StatusBadge status="safe" label="Aktif" />
                    <h3 className="subheading">{activePlanting.cropName}</h3>
                    <p className="muted flush">
                      Benih {activePlanting.seedName} · Tanam {formatDate(activePlanting.plantedAt)}{' '}
                      · Panen {formatDate(activePlanting.expectedHarvestAt)}
                    </p>
                    <div className="action-top">
                      <Button
                        endpoint={`/api/plantings/${activePlanting.id}`}
                        method="PATCH"
                        body={{ status: 'finished' }}
                        variant="secondary"
                      >
                        Selesai
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="subtle flush">Belum ada tanaman aktif.</p>
                )}

                <div className="actions">
                  {!activePlanting ? <AddPlantingPanel plotId={plot.id} crops={crops} /> : null}
                  {!activePlanting ? (
                    <Button endpoint={`/api/plots/${plot.id}`} method="DELETE" variant="danger">
                      Hapus
                    </Button>
                  ) : null}
                </div>
              </div>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
