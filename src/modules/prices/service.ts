import { NotFoundError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { getCropProfileByCommodityKey } from '@/modules/catalog/crop-profiles';
import type { PriceForecastDto } from '@/types/api';
import { generateForecast, validateForecast } from './forecast-engine';
import { dummyPriceProvider } from './price-provider';

export class PriceService {
  async getForecast(plantingId: string): Promise<PriceForecastDto> {
    const planting = await prisma.plantingCycle.findUnique({
      where: { id: plantingId },
      include: { crop: true },
    });
    if (!planting) {
      throw new NotFoundError('Tanaman', plantingId);
    }

    const profile = getCropProfileByCommodityKey(planting.crop.commodityKey);
    if (!profile) {
      throw new NotFoundError('Profil komoditas', planting.crop.commodityKey);
    }

    let observation = await prisma.priceObservation.findFirst({
      where: { commodityKey: profile.commodityKey },
      orderBy: { observedAt: 'desc' },
    });

    if (!observation) {
      const reading = await dummyPriceProvider.fetch(profile.commodityKey);
      observation = await prisma.priceObservation.create({
        data: {
          commodityKey: reading.commodityKey,
          pricePerKg: reading.pricePerKg,
          level: reading.level,
          observedAt: reading.observedAt,
          source: reading.source,
        },
      });
    }

    const currentPrice = Number(observation.pricePerKg);
    const forecast = generateForecast(profile.commodityKey, currentPrice, plantingId, new Date());

    validateForecast(forecast);

    return forecast;
  }

  async refreshForecast(plantingId: string): Promise<PriceForecastDto> {
    const planting = await prisma.plantingCycle.findUnique({
      where: { id: plantingId },
      include: { crop: true },
    });
    if (!planting) {
      throw new NotFoundError('Tanaman', plantingId);
    }

    const profile = getCropProfileByCommodityKey(planting.crop.commodityKey);
    if (!profile) {
      throw new NotFoundError('Profil komoditas', planting.crop.commodityKey);
    }

    const reading = await dummyPriceProvider.fetch(profile.commodityKey);
    const observationId = `price-${profile.commodityKey}-${reading.observedAt.toISOString().split('T')[0]}`;

    const observation = await prisma.priceObservation.upsert({
      where: {
        id: observationId,
      },
      update: {},
      create: {
        id: observationId,
        commodityKey: reading.commodityKey,
        pricePerKg: reading.pricePerKg,
        level: reading.level,
        observedAt: reading.observedAt,
        source: reading.source,
      },
    });

    const currentPrice = Number(observation.pricePerKg);
    const forecast = generateForecast(profile.commodityKey, currentPrice, plantingId, new Date());
    validateForecast(forecast);

    return forecast;
  }
}

export const priceService = new PriceService();
