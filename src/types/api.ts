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
  weekNumber: number;
  expectedPrice: number;
  lowerBound: number;
  upperBound: number;
  isBestSell: boolean;
}

export interface PriceForecastDto {
  plantingId: string;
  commodityKey: string;
  currentPrice: number;
  points: PriceForecastPointDto[];
  bestSellWindow: {
    startWeek: number;
    endWeek: number;
  };
  generatedAt: string;
  source: string;
  isDemo: boolean;
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
