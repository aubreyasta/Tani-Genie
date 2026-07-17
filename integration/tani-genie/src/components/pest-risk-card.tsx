import type { DiseaseRisk, PestRiskResponse } from '@/types/pest-risk';

const levelStyle = {
  LOW: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  MEDIUM: 'border-amber-200 bg-amber-50 text-amber-900',
  HIGH: 'border-red-200 bg-red-50 text-red-900',
} as const;

function DiseaseCard({ risk }: { risk: DiseaseRisk }) {
  return (
    <article className={`rounded-xl border p-4 ${levelStyle[risk.risk_level]}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold">{risk.disease_name}</h3>
          <p className="text-sm opacity-80">{risk.pathogen}</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold">{Math.round(risk.risk_score * 100)}%</div>
          <div className="text-xs">{risk.risk_level}</div>
        </div>
      </div>

      {risk.positive_evidence.length > 0 && (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
          {risk.positive_evidence.map((evidence) => (
            <li key={evidence.rule_id}>{evidence.rationale}</li>
          ))}
        </ul>
      )}

      <div className="mt-3 text-xs opacity-75">
        Confidence {Math.round(risk.confidence * 100)}% · {risk.prediction_method} · horizon{' '}
        {risk.forecast_horizon_days} hari
      </div>
    </article>
  );
}

export function PestRiskCard({ result }: { result: PestRiskResponse }) {
  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-xl font-semibold">Risiko Hama &amp; Penyakit</h2>
        <p className="text-sm text-neutral-600">
          {result.province} · {result.prediction_date} · status {result.overall_flag}
        </p>
      </header>
      <div className="grid gap-3 md:grid-cols-2">
        {result.disease_risks.map((risk) => (
          <DiseaseCard key={risk.disease_id} risk={risk} />
        ))}
      </div>
      <p className="text-xs text-neutral-500">{result.disclaimer}</p>
    </section>
  );
}
