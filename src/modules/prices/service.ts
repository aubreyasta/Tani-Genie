import { AsyncTtlCache, envTimeout } from '@/lib/async-cache';
import { NotFoundError, ServiceUnavailableError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import type { MlPricePredictionDto, PriceForecastDto } from '@/types/api';

const FORECAST_HORIZONS = [7, 14, 21, 30] as const;

export class PriceService {
  private readonly cache = new AsyncTtlCache<PriceForecastDto>(5 * 60 * 1000);

  constructor(private readonly request = postPrediction) {}

  async getForecast(plantingId: string): Promise<PriceForecastDto> {
    return this.cache.get(plantingId, () => this.loadForecast(plantingId));
  }

  private async loadForecast(plantingId: string): Promise<PriceForecastDto> {
    const planting = await prisma.plantingCycle.findUnique({
      where: { id: plantingId },
      include: { crop: true },
    });
    if (!planting) {
      throw new NotFoundError('Tanaman', plantingId);
    }

    const commodity = planting.crop.commodityKey.replaceAll('-', '_');
    const market = process.env.PRICE_PREDICTION_MARKET ?? 'pasar_tradisional';
    const province = process.env.PRICE_PREDICTION_PROVINCE ?? 'DI Yogyakarta';
    const baseUrl = requiredPriceApiUrl();
    const predictions = await Promise.all(
      FORECAST_HORIZONS.map((horizonDays) =>
        this.request(`${baseUrl}/predict`, {
          commodity,
          market,
          province,
          target_date: addUtcDays(new Date(), horizonDays),
        }),
      ),
    );
    const best = predictions.reduce((current, prediction) =>
      prediction.predicted_price > current.predicted_price ? prediction : current,
    );
    const latestObservation = predictions[0];
    if (!latestObservation) {
      throw new Error('Price prediction service returned no predictions');
    }

    return {
      plantingId,
      commodityKey: planting.crop.commodityKey,
      market,
      province,
      lastKnownDate: latestObservation.last_known_date,
      lastKnownPrice: latestObservation.last_known_price,
      points: predictions.map((prediction) => ({
        targetDate: prediction.target_date,
        horizonDays: prediction.horizon_days,
        predictedPrice: prediction.predicted_price,
        isBestSell: prediction.target_date === best.target_date,
      })),
      bestSellTargetDate: best.target_date,
      source: 'Tani Genie Price Prediction ML',
    };
  }

  async refreshForecast(plantingId: string): Promise<PriceForecastDto> {
    return this.cache.get(plantingId, () => this.loadForecast(plantingId), true);
  }
}

function requiredPriceApiUrl(): string {
  const value = process.env.PRICE_PREDICTION_API_URL;
  if (!value) {
    throw new Error('PRICE_PREDICTION_API_URL is not configured');
  }
  return value.replace(/\/$/, '');
}

function addUtcDays(value: Date, days: number): string {
  const target = new Date(value);
  target.setUTCDate(target.getUTCDate() + days);
  return target.toISOString().slice(0, 10);
}

async function postPrediction(
  url: string,
  body: Record<string, string>,
): Promise<MlPricePredictionDto> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(envTimeout('PRICE_API_TIMEOUT_MS', 5_000)),
      cache: 'no-store',
    });
  } catch (error) {
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      throw new ServiceUnavailableError('Model prediksi harga membutuhkan waktu terlalu lama');
    }
    throw new ServiceUnavailableError('Model prediksi harga sedang tidak tersedia');
  }
  if (!response.ok) {
    throw new ServiceUnavailableError('Model prediksi harga sedang tidak tersedia');
  }
  return (await response.json()) as MlPricePredictionDto;
}

export const priceService = new PriceService();
