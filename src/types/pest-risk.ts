export type PestRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface PestRiskEvidence {
  readonly rule_id: string;
  readonly vote: 'positive' | 'negative';
  readonly weight: number;
  readonly rationale: string;
}

export interface DiseaseRisk {
  readonly disease_id: string;
  readonly disease_name: string;
  readonly pathogen: string;
  readonly risk_score: number;
  readonly risk_level: PestRiskLevel;
  readonly confidence: number;
  readonly forecast_horizon_days: number;
  readonly prediction_method: 'machine_learning' | 'rule_fallback';
  readonly positive_evidence: ReadonlyArray<PestRiskEvidence>;
}

export interface PestRiskResponse {
  readonly crop: string;
  readonly province: string;
  readonly prediction_date: string;
  readonly overall_flag: PestRiskLevel;
  readonly overall_score: number;
  readonly disease_risks: ReadonlyArray<DiseaseRisk>;
  readonly data_window_days: number;
  readonly disclaimer: string;
}

export interface DailyEnvironmentalRecord {
  readonly date: string;
  readonly temp_avg_c: number | null;
  readonly temp_max_c: number | null;
  readonly temp_min_c: number | null;
  readonly relative_humidity_pct: number | null;
  readonly rainfall_mm: number | null;
  readonly wind_speed_ms: number | null;
}

export interface PestRiskRequest {
  readonly crop: string;
  readonly province: string;
  readonly prediction_date: string;
  readonly weather_history: ReadonlyArray<DailyEnvironmentalRecord>;
}
