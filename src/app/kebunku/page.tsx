import { AddPlantingPanel, AddPlotPanel } from '@/components/features/KebunkuForms';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { apiGet, formatDate, formatNumber } from '@/lib/ui-data';
import type { CropDto, PlantingDto, PlotDto } from '@/types/api';

export default async function KebunkuPage(): Promise<React.JSX.Element> {
  const [plots, plantings, crops] = await Promise.all([
    apiGet<ReadonlyArray<PlotDto>>('/api/plots'),
    apiGet<ReadonlyArray<PlantingDto>>('/api/plantings'),
    apiGet<ReadonlyArray<CropDto>>('/api/crops'),
  ]);
  const activeCount = plantings.filter((planting) => planting.status === 'active').length;

  return (
    <div className="page-shell stack">
      <section className="verdict-card verdict-safe">
        <p style={{ margin: 0, color: 'var(--accent-primary)', fontWeight: 800 }}>Kebunku</p>
        <h1 style={{ margin: 'var(--space-2) 0 0', fontSize: '2rem', lineHeight: 1.1 }}>
          {activeCount > 0 ? `${activeCount} tanaman aktif dipantau` : 'Tambahkan tanaman pertama'}
        </h1>
        <p style={{ margin: 'var(--space-2) 0 0', color: 'var(--text-secondary)' }}>
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
                  <h2 style={{ margin: 0 }}>{plot.name}</h2>
                  <p style={{ margin: 'var(--space-1) 0 0', color: 'var(--text-secondary)' }}>
                    {formatNumber(plot.areaM2)} m² · {plot.latitude.toFixed(3)},{' '}
                    {plot.longitude.toFixed(3)}
                  </p>
                </div>

                {activePlanting ? (
                  <div
                    style={{
                      borderTop: '1px solid var(--border-subtle)',
                      paddingTop: 'var(--space-3)',
                    }}
                  >
                    <StatusBadge status="safe" label="Aktif" />
                    <h3 style={{ margin: 'var(--space-2) 0 0' }}>{activePlanting.cropName}</h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                      Benih {activePlanting.seedName} · Tanam {formatDate(activePlanting.plantedAt)}{' '}
                      · Panen {formatDate(activePlanting.expectedHarvestAt)}
                    </p>
                    <div style={{ marginTop: 'var(--space-3)' }}>
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
                  <p style={{ margin: 0, color: 'var(--text-muted)' }}>Belum ada tanaman aktif.</p>
                )}

                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
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
