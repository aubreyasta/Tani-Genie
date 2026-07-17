import { StatusBadge } from '@/components/ui/StatusBadge';
import type { DiseaseRisk, PestRiskLevel, PestRiskResponse } from '@/types/pest-risk';
import type { Status } from '@/types/ui';

const statusByLevel: Record<PestRiskLevel, Status> = {
  LOW: 'safe',
  MEDIUM: 'watch',
  HIGH: 'danger',
};

function DiseaseRiskItem({ risk }: { risk: DiseaseRisk }) {
  const status = statusByLevel[risk.risk_level];
  return (
    <article className={`verdict-card verdict-${status}`}>
      <div className="row-between">
        <div>
          <h3 className="flush">{risk.disease_name}</h3>
          <p className="muted flush">{risk.pathogen}</p>
        </div>
        <StatusBadge status={status} label={risk.risk_level} />
      </div>
      <dl className="integration-summary">
        <div>
          <dt>Skor risiko</dt>
          <dd>{Math.round(risk.risk_score * 100)}%</dd>
        </div>
        <div>
          <dt>Keyakinan data</dt>
          <dd>{Math.round(risk.confidence * 100)}%</dd>
        </div>
        <div>
          <dt>Horizon</dt>
          <dd>{risk.forecast_horizon_days} hari</dd>
        </div>
      </dl>
      {risk.positive_evidence.length > 0 ? (
        <div className="pest-evidence">
          <h4>Kenapa perlu diperhatikan?</h4>
          <ul>
            {risk.positive_evidence.map((evidence) => (
              <li key={evidence.rule_id}>{evidence.rationale}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}

export function PestRiskCard({ result }: { result: PestRiskResponse }) {
  const isSafe = result.overall_flag === 'LOW';
  return (
    <section
      className={`stack pest-result pest-result-${isSafe ? 'safe' : 'alert'}`}
      aria-labelledby={`pest-risk-${result.crop}`}
    >
      <div>
        <p className="section-label">Prediksi penyakit</p>
        <h2 className="flush" id={`pest-risk-${result.crop}`}>
          {isSafe
            ? 'Kondisi aman — tidak ada risiko penyakit yang terdeteksi'
            : `Risiko lingkungan ${result.overall_flag}`}
        </h2>
        <p className="muted flush">
          {isSafe
            ? 'Berdasarkan data yang tersedia saat ini. Tetap lakukan inspeksi rutin. · '
            : ''}
          {result.province} · histori cuaca nyata {result.data_window_days} hari
        </p>
      </div>
      <div className="dashboard-grid">
        {result.disease_risks.map((risk) => (
          <DiseaseRiskItem key={risk.disease_id} risk={risk} />
        ))}
      </div>
      <p className="pest-disclaimer">{result.disclaimer}</p>
    </section>
  );
}
