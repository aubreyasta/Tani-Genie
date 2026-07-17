export type PestRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface PestRiskEvidence {
  rule_id: string;
  vote: 'positive' | 'negative';
  weight: number;
  rationale: string;
}

export interface PestRiskFeatureSnapshot {
  feature: string;
  label: string;
  value: number;
}

export interface DiseaseRisk {
  disease_id: string;
  disease_name: string;
  pathogen: string;
  category: string;
  risk_score: number;
  risk_level: PestRiskLevel;
  confidence: number;
  confidence_tier: 'low' | 'medium' | 'high';
  forecast_horizon_days: number;
  prediction_method: 'machine_learning' | 'rule_fallback';
  model_version: string | null;
  rule_version: string;
  data_completeness: number;
  positive_evidence: PestRiskEvidence[];
  negative_evidence: PestRiskEvidence[];
  feature_snapshot: PestRiskFeatureSnapshot[];
}

export interface PestRiskResponse {
  crop: string;
  province: string;
  prediction_date: string;
  overall_flag: PestRiskLevel;
  overall_score: number;
  disease_risks: DiseaseRisk[];
  data_window_days: number;
  rule_version: string;
  disclaimer: string;
}

export interface DailyEnvironmentalRecord {
  date: string;
  temp_avg_c?: number | null;
  temp_max_c?: number | null;
  temp_min_c?: number | null;
  relative_humidity_pct?: number | null;
  rainfall_mm?: number | null;
  wind_speed_ms?: number | null;
  estimated_wet_hours?: number | null;
  root_zone_soil_moisture_raw?: number | null;
  surface_soil_moisture_raw?: number | null;
  ndvi?: number | null;
}

export interface PestRiskRequest {
  crop: string;
  province: string;
  prediction_date?: string;
  weather_history: DailyEnvironmentalRecord[];
}
