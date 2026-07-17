import { z } from 'zod';
import { AsyncTtlCache, envTimeout } from '@/lib/async-cache';
import { BadRequestError, NotFoundError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import type {
  DailyEnvironmentalRecord,
  PestRiskRequest,
  PestRiskResponse,
} from '@/types/pest-risk';

const HISTORY_DAYS = 90;

const evidenceSchema = z.object({
  rule_id: z.string(),
  vote: z.enum(['positive', 'negative']),
  weight: z.number(),
  rationale: z.string(),
});

const pestRiskResponseSchema = z.object({
  crop: z.string(),
  province: z.string(),
  prediction_date: z.string(),
  overall_flag: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  overall_score: z.number().min(0).max(1),
  disease_risks: z.array(
    z.object({
      disease_id: z.string(),
      disease_name: z.string(),
      pathogen: z.string(),
      risk_score: z.number().min(0).max(1),
      risk_level: z.enum(['LOW', 'MEDIUM', 'HIGH']),
      confidence: z.number().min(0).max(1),
      forecast_horizon_days: z.number().int().positive(),
      prediction_method: z.enum(['machine_learning', 'rule_fallback']),
      positive_evidence: z.array(evidenceSchema),
    }),
  ),
  data_window_days: z.number().int().positive(),
  disclaimer: z.string().min(1),
});

interface NasaPowerResponse {
  readonly properties?: {
    readonly parameter?: {
      readonly T2M?: Record<string, number>;
      readonly T2M_MAX?: Record<string, number>;
      readonly T2M_MIN?: Record<string, number>;
      readonly PRECTOTCORR?: Record<string, number>;
      readonly RH2M?: Record<string, number>;
      readonly WS2M?: Record<string, number>;
    };
  };
}

export class PestRiskServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PestRiskServiceError';
  }
}

export class PestRiskService {
  private readonly cache = new AsyncTtlCache<PestRiskResponse>(15 * 60 * 1000);

  constructor(
    private readonly fetchHistory = fetchNasaPowerHistory,
    private readonly predict = requestPestRisk,
  ) {}

  async getRisk(plantingId: string): Promise<PestRiskResponse> {
    return this.cache.get(plantingId, () => this.loadRisk(plantingId));
  }

  private async loadRisk(plantingId: string): Promise<PestRiskResponse> {
    const planting = await prisma.plantingCycle.findUnique({
      where: { id: plantingId },
      include: { crop: true, plot: true },
    });
    if (!planting) {
      throw new NotFoundError('Tanaman', plantingId);
    }

    const dataPoints = planting.dataPoints;
    const iotWeatherFields =
      dataPoints && typeof dataPoints === 'object' && !Array.isArray(dataPoints)
        ? ['temp', 'humidity', 'rainfall'].filter(
            (field) => Reflect.get(dataPoints, field) === 'iot',
          )
        : [];
    if (iotWeatherFields.length > 0) {
      throw new BadRequestError(
        `Data historis sensor IoT belum tersedia untuk: ${iotWeatherFields.join(', ')}`,
      );
    }

    const endDate = yesterdayUtc();
    const startDate = addUtcDays(endDate, -(HISTORY_DAYS - 1));
    const weatherHistory = await this.fetchHistory(
      planting.plot.latitude,
      planting.plot.longitude,
      startDate,
      endDate,
    );
    if (weatherHistory.length === 0) {
      throw new PestRiskServiceError('NASA POWER tidak mengembalikan histori cuaca');
    }

    return this.predict({
      crop: planting.crop.commodityKey.replaceAll('-', '_'),
      province: process.env.PEST_RISK_PROVINCE ?? 'DI Yogyakarta',
      prediction_date: weatherHistory.at(-1)?.date ?? dateOnly(endDate),
      weather_history: weatherHistory,
    });
  }
}

export async function fetchNasaPowerHistory(
  latitude: number,
  longitude: number,
  startDate: Date,
  endDate: Date,
): Promise<DailyEnvironmentalRecord[]> {
  const url = new URL('https://power.larc.nasa.gov/api/temporal/daily/point');
  url.search = new URLSearchParams({
    parameters: 'T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,RH2M,WS2M',
    community: 'ag',
    latitude: String(latitude),
    longitude: String(longitude),
    start: compactDate(startDate),
    end: compactDate(endDate),
    format: 'JSON',
  }).toString();

  let response: Response;
  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(envTimeout('NASA_POWER_TIMEOUT_MS', 8_000)),
      next: { revalidate: 3_600 },
    });
  } catch (error) {
    throw new PestRiskServiceError(
      error instanceof Error
        ? `NASA POWER tidak tersedia: ${error.message}`
        : 'NASA POWER tidak tersedia',
    );
  }
  if (!response.ok) {
    throw new PestRiskServiceError(`NASA POWER gagal dengan status ${response.status}`);
  }

  const payload = (await response.json()) as NasaPowerResponse;
  const parameters = payload.properties?.parameter;
  if (!parameters) {
    throw new PestRiskServiceError('Respons NASA POWER tidak valid');
  }

  const dates = Object.keys(parameters.T2M ?? {}).sort();
  return dates.flatMap((date) => {
    const temperature = valueAt(parameters.T2M, date);
    const maximum = valueAt(parameters.T2M_MAX, date);
    const minimum = valueAt(parameters.T2M_MIN, date);
    const humidity = valueAt(parameters.RH2M, date);
    const rainfall = valueAt(parameters.PRECTOTCORR, date);
    const windSpeed = valueAt(parameters.WS2M, date);
    if ([temperature, maximum, minimum, humidity, rainfall, windSpeed].every(isMissing)) {
      return [];
    }
    return [
      {
        date: `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`,
        temp_avg_c: temperature,
        temp_max_c: maximum,
        temp_min_c: minimum,
        relative_humidity_pct: humidity,
        rainfall_mm: rainfall,
        wind_speed_ms: windSpeed,
      },
    ];
  });
}

async function requestPestRisk(request: PestRiskRequest): Promise<PestRiskResponse> {
  const baseUrl = process.env.PEST_RISK_API_URL;
  if (!baseUrl) {
    throw new PestRiskServiceError('PEST_RISK_API_URL belum dikonfigurasi');
  }
  let response: Response;
  try {
    response = await fetch(`${baseUrl.replace(/\/$/, '')}/v1/risk/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(envTimeout('PEST_RISK_API_TIMEOUT_MS', 3_000)),
      cache: 'no-store',
    });
  } catch (error) {
    throw new PestRiskServiceError(
      error instanceof Error
        ? `Pest-risk API tidak tersedia: ${error.message}`
        : 'Pest-risk API tidak tersedia',
    );
  }
  if (!response.ok) {
    throw new PestRiskServiceError(`Pest-risk API gagal dengan status ${response.status}`);
  }
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new PestRiskServiceError('Pest-risk API mengembalikan respons yang tidak dapat dibaca');
  }
  const parsed = pestRiskResponseSchema.safeParse(payload);
  if (!parsed.success) {
    throw new PestRiskServiceError('Respons pest-risk API tidak valid');
  }
  return parsed.data;
}

function valueAt(values: Record<string, number> | undefined, date: string): number | null {
  const value = values?.[date];
  return value === undefined || value === -999 ? null : value;
}

function isMissing(value: number | null): boolean {
  return value === null;
}

function yesterdayUtc(): Date {
  const value = new Date();
  value.setUTCHours(0, 0, 0, 0);
  value.setUTCDate(value.getUTCDate() - 1);
  return value;
}

function addUtcDays(value: Date, days: number): Date {
  const result = new Date(value);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function dateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function compactDate(value: Date): string {
  return dateOnly(value).replaceAll('-', '');
}

export const pestRiskService = new PestRiskService();
