import { AsyncTtlCache, envTimeout } from '@/lib/async-cache';
import { NotFoundError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import type {
  MlPricePredictionDto,
  PlantingCalendarDto,
  PlantingIntegrationDto,
} from '@/types/api';

export class IntegrationService {
  private readonly cache = new AsyncTtlCache<PlantingIntegrationDto>(5 * 60 * 1000);

  constructor(private readonly request = postJson) {}

  async getPlantingData(plantingId: string): Promise<PlantingIntegrationDto> {
    return this.cache.get(plantingId, () => this.loadPlantingData(plantingId));
  }

  private async loadPlantingData(plantingId: string): Promise<PlantingIntegrationDto> {
    const planting = await prisma.plantingCycle.findUnique({
      where: { id: plantingId },
      include: { crop: true },
    });
    if (!planting) {
      throw new NotFoundError('Tanaman', plantingId);
    }

    const [calendarResult, priceResult] = await Promise.allSettled([
      this.getCalendar(planting.crop.commodityKey, planting.plantedAt),
      this.getPricePrediction(planting.crop.commodityKey, planting.expectedHarvestAt),
    ]);
    const unavailable: string[] = [];

    if (calendarResult.status === 'rejected') {
      unavailable.push('planting-calendar');
    }
    if (priceResult.status === 'rejected') {
      unavailable.push('price-prediction');
    }

    return {
      calendar: calendarResult.status === 'fulfilled' ? calendarResult.value : null,
      pricePrediction: priceResult.status === 'fulfilled' ? priceResult.value : null,
      unavailable,
    };
  }

  private async getCalendar(commodityKey: string, plantedAt: Date): Promise<PlantingCalendarDto> {
    const baseUrl = requiredUrl('PLANTING_CALENDAR_API_URL');
    return this.request<PlantingCalendarDto>(`${baseUrl}/calendar`, {
      crop: commodityKey.replaceAll('-', '_'),
      planting_date: dateOnly(plantedAt),
    });
  }

  private async getPricePrediction(
    commodityKey: string,
    targetDate: Date,
  ): Promise<MlPricePredictionDto> {
    const baseUrl = requiredUrl('PRICE_PREDICTION_API_URL');
    const maxTargetDate = new Date();
    maxTargetDate.setUTCDate(maxTargetDate.getUTCDate() + 30);
    const predictionDate = targetDate < maxTargetDate ? targetDate : maxTargetDate;
    return this.request<MlPricePredictionDto>(`${baseUrl}/predict`, {
      commodity: commodityKey.replaceAll('-', '_'),
      market: process.env['PRICE_PREDICTION_MARKET'] ?? 'pasar_tradisional',
      province: process.env['PRICE_PREDICTION_PROVINCE'] ?? 'DI Yogyakarta',
      target_date: dateOnly(predictionDate),
    });
  }
}

function requiredUrl(name: 'PLANTING_CALENDAR_API_URL' | 'PRICE_PREDICTION_API_URL'): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value.replace(/\/$/, '');
}

async function postJson<T>(url: string, body: Record<string, string>): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(envTimeout('INTEGRATION_API_TIMEOUT_MS', 2_000)),
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Integration request failed with status ${response.status}`);
  }
  return (await response.json()) as T;
}

function dateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export const integrationService = new IntegrationService();
