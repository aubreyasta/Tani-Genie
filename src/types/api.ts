export interface ApiSuccess<T> {
  readonly success: true;
  readonly data: T;
}

export interface ApiError {
  readonly success: false;
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details?: ReadonlyArray<FieldError>;
  };
}

export interface FieldError {
  readonly field: string;
  readonly message: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface PaginationMeta {
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly totalPages: number;
}

export interface PaginatedResponse<T> {
  readonly success: true;
  readonly data: ReadonlyArray<T>;
  readonly meta: PaginationMeta;
}

export interface FarmerDto {
  readonly id: string;
  readonly name: string;
  readonly phone: string | null;
}

export interface CropDto {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly commodityKey: string;
  readonly minTempC: number;
  readonly maxTempC: number;
  readonly minHumidity: number;
  readonly maxHumidity: number;
  readonly waterNeedMm: number;
  readonly gddBaseC: number;
  readonly gddTargetC: number;
  readonly pestRiskHumidity: number;
  readonly pestRiskTempC: number;
}

export interface PlotDto {
  readonly id: string;
  readonly farmerId: string;
  readonly name: string;
  readonly areaM2: number;
  readonly latitude: number;
  readonly longitude: number;
}

export interface PlantingDto {
  readonly id: string;
  readonly plotId: string;
  readonly cropId: string;
  readonly cropName: string;
  readonly seedName: string;
  readonly targetYieldKg: number;
  readonly plantedAt: string;
  readonly expectedHarvestAt: string;
  readonly status: 'active' | 'finished' | 'planned';
}

export interface WeatherSnapshotDto {
  readonly id: string;
  readonly plantingId: string;
  readonly observedAt: string;
  readonly temperatureC: number;
  readonly rainfallMm: number;
  readonly humidityPct: number;
  readonly windSpeedKmh: number;
  readonly source: string;
}

export interface VerdictDto {
  readonly status: 'safe' | 'watch' | 'danger';
  readonly action: string;
  readonly reason: string;
  readonly details: ReadonlyArray<VerdictDetail>;
}

export interface VerdictDetail {
  readonly label: string;
  readonly value: string;
  readonly status: 'safe' | 'watch' | 'danger';
}

export interface PestAlertDto {
  readonly id: string;
  readonly plantingId: string;
  readonly alertType: string;
  readonly severity: 'safe' | 'watch' | 'danger';
  readonly verdict: string;
  readonly action: string;
  readonly reason: string;
  readonly observedAt: string;
}

export interface PriceForecastPointDto {
  readonly weekNumber: number;
  readonly expectedPrice: number;
  readonly lowerBound: number;
  readonly upperBound: number;
  readonly isBestSell: boolean;
}

export interface PriceForecastDto {
  readonly plantingId: string;
  readonly commodityKey: string;
  readonly currentPrice: number;
  readonly points: ReadonlyArray<PriceForecastPointDto>;
  readonly bestSellWindow: {
    readonly startWeek: number;
    readonly endWeek: number;
  };
  readonly generatedAt: string;
  readonly source: string;
  readonly isDemo: boolean;
}

export interface NotificationDto {
  readonly id: string;
  readonly farmerId: string;
  readonly plantingId: string | null;
  readonly type: string;
  readonly priority: 'low' | 'medium' | 'high';
  readonly title: string;
  readonly body: string;
  readonly isRead: boolean;
  readonly createdAt: string;
  readonly readAt: string | null;
}

export interface DeliveryAttemptDto {
  readonly id: string;
  readonly notificationId: string;
  readonly channel: 'whatsapp' | 'sms';
  readonly status: 'queued' | 'sent' | 'failed';
  readonly payloadPreview: string;
  readonly attemptedAt: string;
  readonly deliveredAt: string | null;
  readonly errorMessage: string | null;
}
