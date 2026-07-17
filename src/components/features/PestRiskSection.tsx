import { PestRiskCard } from '@/components/features/PestRiskCard';
import { apiGet } from '@/lib/ui-data';
import type { PlantingDto } from '@/types/api';
import type { PestRiskResponse } from '@/types/pest-risk';

function UnavailableRiskCard({ cropName }: { cropName: string }) {
  return (
    <section
      className="pest-state-card pest-state-pending"
      aria-label={`Pemeriksaan penyakit ${cropName}`}
    >
      <span className="pest-state-icon" aria-hidden="true">
        ⌁
      </span>
      <div>
        <p className="section-label">Pemeriksaan penyakit</p>
        <h3 className="flush">Belum dapat dipastikan</h3>
        <p className="muted flush">
          Data penyakit untuk {cropName} belum selesai diperiksa. Kondisi tidak ditandai aman atau
          berisiko sampai data nyata tersedia.
        </p>
      </div>
    </section>
  );
}

export function PestRiskLoading({ cropName }: { cropName?: string }) {
  return (
    <section className="pest-state-card pest-state-loading" aria-live="polite" aria-busy="true">
      <span className="pest-loader" aria-hidden="true" />
      <div>
        <p className="section-label">Pemeriksaan penyakit</p>
        <h3 className="flush">Menganalisis kondisi {cropName ?? 'tanaman'}…</h3>
        <p className="muted flush">Membaca histori cuaca nyata dan faktor risiko lingkungan.</p>
      </div>
    </section>
  );
}

export async function PestRiskSection({ planting }: { planting: PlantingDto }) {
  const result = await apiGet<PestRiskResponse>(
    `/api/insights/pest-risk?plantingId=${planting.id}`,
  ).catch(() => null);

  return result ? (
    <PestRiskCard result={result} />
  ) : (
    <UnavailableRiskCard cropName={planting.cropName} />
  );
}
