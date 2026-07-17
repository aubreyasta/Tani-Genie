export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: readonly FieldError[];
  };
}

export interface FieldError {
  field: string;
  message: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface FarmerDto {
  id: string;
  name: string;
  phone: string | null;
}

export interface CropDto {
  id: string;
  slug: string;
  name: string;
  commodityKey: string;
  minTempC: number;
  maxTempC: number;
  minHumidity: number;
  maxHumidity: number;
  waterNeedMm: number;
  gddBaseC: number;
  gddTargetC: number;
  pestRiskHumidity: number;
  pestRiskTempC: number;
}

export interface PlotDto {
  id: string;
  farmerId: string;
  name: string;
  areaM2: number;
  latitude: number;
  longitude: number;
}

export interface PlantingDto {
  id: string;
  plotId: string;
  cropId: string;
  cropName: string;
  seedName: string;
  targetYieldKg: number;
  plantedAt: string;
  expectedHarvestAt: string;
  status: 'active' | 'finished' | 'planned';
  dataPoints: DataPointMapping;
}

export type DataPointSource = 'api' | 'iot';

export interface DataPointMapping {
  temp?: DataPointSource | undefined;
  humidity?: DataPointSource | undefined;
  rainfall?: DataPointSource | undefined;
  soil_moisture?: DataPointSource | undefined;
  nutrients_ph?: DataPointSource | undefined;
}

export interface PlantingCalendarDto {
  crop: string;
  planting_date: string;
  harvest_date: string;
  stages: Array<{ name: string; start_date: string; end_date: string }>;
  tasks: Array<{ label: string; date: string; day: number }>;
  status: {
    day_n: number;
    total_days: number;
    progress_pct: number;
    current_stage: string;
    days_to_harvest: number;
    next_task: { label: string; date: string; days_until: number } | null;
  };
}

export interface MlPricePredictionDto {
  commodity: string;
  market: string;
  province: string;
  target_date: string;
  predicted_price: number;
  horizon_days: number;
  last_known_date: string;
  last_known_price: number;
}

export interface PlantingIntegrationDto {
  calendar: PlantingCalendarDto | null;
  pricePrediction: MlPricePredictionDto | null;
  unavailable: string[];
}

export interface WeatherSnapshotDto {
  id: string;
  plantingId: string;
  observedAt: string;
  temperatureC: number;
  rainfallMm: number;
  humidityPct: number;
  windSpeedKmh: number;
  source: string;
}

export interface VerdictDto {
  status: 'safe' | 'watch' | 'danger';
  action: string;
  reason: string;
  details: VerdictDetail[];
}

export interface VerdictDetail {
  label: string;
  value: string;
  status: 'safe' | 'watch' | 'danger';
}

export interface PestAlertDto {
  id: string;
  plantingId: string;
  alertType: string;
  severity: 'safe' | 'watch' | 'danger';
  verdict: string;
  action: string;
  reason: string;
  observedAt: string;
}

export interface PriceForecastPointDto {
  targetDate: string;
  horizonDays: number;
  predictedPrice: number;
  isBestSell: boolean;
}

export interface PriceForecastDto {
  plantingId: string;
  commodityKey: string;
  market: string;
  province: string;
  lastKnownDate: string;
  lastKnownPrice: number;
  points: PriceForecastPointDto[];
  bestSellTargetDate: string;
  source: string;
}

export interface NotificationDto {
  id: string;
  farmerId: string;
  plantingId: string | null;
  type: string;
  priority: 'low' | 'medium' | 'high';
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
}

export interface DeliveryAttemptDto {
  id: string;
  notificationId: string;
  channel: 'whatsapp' | 'sms';
  status: 'queued' | 'sent' | 'failed';
  payloadPreview: string;
  attemptedAt: string;
  deliveredAt: string | null;
  errorMessage: string | null;
}
