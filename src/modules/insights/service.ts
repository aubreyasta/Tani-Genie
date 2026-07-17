import { NotFoundError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import type { PestAlertDto, VerdictDto, WeatherSnapshotDto } from '@/types/api';
import { computeWeatherVerdict } from './verdict-engine';
import { plantingCalendarWeatherProvider } from './weather-provider';

interface WeatherInsightDto {
  readonly verdict: VerdictDto;
  readonly weather: WeatherSnapshotDto;
  readonly pestAlerts: ReadonlyArray<PestAlertDto>;
  readonly planting: {
    readonly id: string;
    readonly cropName: string;
    readonly cropSlug: string;
  };
}

export class InsightService {
  async getWeatherInsight(plantingId: string): Promise<WeatherInsightDto> {
    const planting = await prisma.plantingCycle.findUnique({
      where: { id: plantingId },
      include: { crop: true },
    });
    if (!planting) {
      throw new NotFoundError('Tanaman', plantingId);
    }

    const profile = cropProfile(planting.crop);

    const plot = await prisma.plot.findUnique({ where: { id: planting.plotId } });
    if (!plot) {
      throw new NotFoundError('Lahan', planting.plotId);
    }
    const reading = await plantingCalendarWeatherProvider.fetch(plot.latitude, plot.longitude);
    const snapshot = await persistWeatherReading(plantingId, reading);

    const weatherDto = toWeatherSnapshotDto(snapshot);
    const verdict = computeWeatherVerdict(profile, {
      temperatureC: snapshot.temperatureC,
      rainfallMm: snapshot.rainfallMm,
      humidityPct: snapshot.humidityPct,
      windSpeedKmh: snapshot.windSpeedKmh,
      observedAt: snapshot.observedAt,
      source: snapshot.source,
    });
    const pestAlertDtos = await getPestAlertDtos(plantingId);

    return {
      verdict,
      weather: weatherDto,
      pestAlerts: pestAlertDtos,
      planting: {
        id: planting.id,
        cropName: planting.crop.name,
        cropSlug: planting.crop.slug,
      },
    };
  }

  async refreshWeather(plantingId: string): Promise<WeatherInsightDto> {
    const planting = await prisma.plantingCycle.findUnique({
      where: { id: plantingId },
      include: { crop: true, plot: true },
    });
    if (!planting) {
      throw new NotFoundError('Tanaman', plantingId);
    }

    const profile = cropProfile(planting.crop);

    const reading = await plantingCalendarWeatherProvider.fetch(
      planting.plot.latitude,
      planting.plot.longitude,
    );
    const snapshot = await persistWeatherReading(plantingId, reading);

    const weatherDto = toWeatherSnapshotDto(snapshot);
    const verdict = computeWeatherVerdict(profile, {
      temperatureC: snapshot.temperatureC,
      rainfallMm: snapshot.rainfallMm,
      humidityPct: snapshot.humidityPct,
      windSpeedKmh: snapshot.windSpeedKmh,
      observedAt: snapshot.observedAt,
      source: snapshot.source,
    });
    const pestAlertDtos = await getPestAlertDtos(plantingId);

    return {
      verdict,
      weather: weatherDto,
      pestAlerts: pestAlertDtos,
      planting: {
        id: planting.id,
        cropName: planting.crop.name,
        cropSlug: planting.crop.slug,
      },
    };
  }
}

function toWeatherSnapshotDto(snapshot: {
  readonly id: string;
  readonly plantingId: string;
  readonly observedAt: Date;
  readonly temperatureC: number;
  readonly rainfallMm: number;
  readonly humidityPct: number;
  readonly windSpeedKmh: number;
  readonly source: string;
}): WeatherSnapshotDto {
  return {
    id: snapshot.id,
    plantingId: snapshot.plantingId,
    observedAt: snapshot.observedAt.toISOString(),
    temperatureC: snapshot.temperatureC,
    rainfallMm: snapshot.rainfallMm,
    humidityPct: snapshot.humidityPct,
    windSpeedKmh: snapshot.windSpeedKmh,
    source: snapshot.source,
  };
}

async function getPestAlertDtos(plantingId: string): Promise<PestAlertDto[]> {
  const alerts = await prisma.pestAlert.findMany({
    where: { plantingId },
    orderBy: { observedAt: 'desc' },
    take: 5,
  });

  return alerts.map((alert) => ({
    id: alert.id,
    plantingId: alert.plantingId,
    alertType: alert.alertType,
    severity: alert.severity as 'safe' | 'watch' | 'danger',
    verdict: alert.verdict,
    action: alert.action,
    reason: alert.reason,
    observedAt: alert.observedAt.toISOString(),
  }));
}

export const insightService = new InsightService();

async function persistWeatherReading(
  plantingId: string,
  reading: {
    temperatureC: number;
    rainfallMm: number;
    humidityPct: number;
    windSpeedKmh: number;
    observedAt: Date;
    source: string;
  },
) {
  const existing = await prisma.weatherSnapshot.findFirst({
    where: { plantingId, observedAt: reading.observedAt, source: reading.source },
  });
  return (
    existing ??
    prisma.weatherSnapshot.create({
      data: { plantingId, ...reading },
    })
  );
}

function cropProfile(crop: {
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
}) {
  return {
    ...crop,
    optimalTempC: (crop.minTempC + crop.maxTempC) / 2,
    waterNeedMmPerWeek: crop.waterNeedMm,
    growingSeasonDays: 0,
  };
}
