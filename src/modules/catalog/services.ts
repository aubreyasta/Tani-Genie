import { ConflictError, NotFoundError, ValidationError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import type { CropDto, DataPointMapping, FarmerDto, PlantingDto, PlotDto } from '@/types/api';
import { CROP_PRESETS } from './crop-presets';

export class CatalogService {
  async getDefaultFarmer(): Promise<FarmerDto> {
    const farmer =
      (await prisma.farmer.findFirst({ orderBy: { createdAt: 'asc' } })) ??
      (await prisma.farmer.upsert({
        where: { id: 'default-farmer' },
        update: {},
        create: { id: 'default-farmer', name: 'Petani' },
      }));
    return { id: farmer.id, name: farmer.name, phone: farmer.phone };
  }

  async listCrops(): Promise<ReadonlyArray<CropDto>> {
    await Promise.all(
      Object.entries(CROP_PRESETS).map(([slug, preset]) =>
        prisma.cropDefinition.upsert({
          where: { slug },
          update: { ...preset, commodityKey: slug },
          create: { ...preset, slug, commodityKey: slug },
        }),
      ),
    );
    const crops = await prisma.cropDefinition.findMany({ orderBy: { name: 'asc' } });
    return crops.map(toCropDto);
  }

  async getCrop(id: string): Promise<CropDto> {
    const crop = await prisma.cropDefinition.findUnique({ where: { id } });
    if (!crop) {
      throw new NotFoundError('Komoditas', id);
    }
    return toCropDto(crop);
  }

  async createCrop(data: Omit<CropDto, 'id'>): Promise<CropDto> {
    const existing = await prisma.cropDefinition.findFirst({
      where: { OR: [{ slug: data.slug }, { commodityKey: data.commodityKey }] },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictError(`Komoditas ${data.name} sudah tersedia`);
    }
    const crop = await prisma.cropDefinition.create({ data });
    return toCropDto(crop);
  }

  async listPlots(farmerId: string): Promise<ReadonlyArray<PlotDto>> {
    const plots = await prisma.plot.findMany({
      where: { farmerId },
      orderBy: { createdAt: 'desc' },
    });
    return plots.map(toPlotDto);
  }

  async getPlot(id: string): Promise<PlotDto> {
    const plot = await prisma.plot.findUnique({ where: { id } });
    if (!plot) {
      throw new NotFoundError('Lahan', id);
    }
    return toPlotDto(plot);
  }

  async createPlot(data: {
    readonly farmerId: string;
    readonly name: string;
    readonly areaM2: number;
    readonly latitude: number;
    readonly longitude: number;
  }): Promise<PlotDto> {
    if (data.areaM2 <= 0) {
      throw new ValidationError('Luas lahan tidak valid', [
        { field: 'areaM2', message: 'Luas lahan harus lebih besar dari 0' },
      ]);
    }
    return toPlotDto(await prisma.plot.create({ data }));
  }

  async updatePlot(
    id: string,
    data: Partial<{
      readonly name: string;
      readonly areaM2: number;
      readonly latitude: number;
      readonly longitude: number;
    }>,
  ): Promise<PlotDto> {
    const existing = await prisma.plot.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      throw new NotFoundError('Lahan', id);
    }
    return toPlotDto(await prisma.plot.update({ where: { id }, data }));
  }

  async deletePlot(id: string): Promise<void> {
    const plot = await prisma.plot.findUnique({ where: { id }, select: { id: true } });
    if (!plot) {
      throw new NotFoundError('Lahan', id);
    }
    const activePlantings = await prisma.plantingCycle.count({
      where: { plotId: id, status: 'active' },
    });
    if (activePlantings > 0) {
      throw new ConflictError(
        'Lahan masih memiliki tanaman aktif. Selesaikan tanaman saat ini terlebih dahulu.',
      );
    }
    await prisma.plot.delete({ where: { id } });
  }

  async listPlantings(plotId: string): Promise<ReadonlyArray<PlantingDto>> {
    const plantings = await prisma.plantingCycle.findMany({
      where: { plotId },
      include: { crop: { select: { name: true } } },
      orderBy: { plantedAt: 'desc' },
    });
    return plantings.map(toPlantingDto);
  }

  async getPlanting(id: string): Promise<PlantingDto> {
    const planting = await prisma.plantingCycle.findUnique({
      where: { id },
      include: { crop: { select: { name: true } } },
    });
    if (!planting) {
      throw new NotFoundError('Tanaman', id);
    }
    return toPlantingDto(planting);
  }

  async createPlanting(data: {
    readonly plotId: string;
    readonly cropId: string;
    readonly seedName: string;
    readonly targetYieldKg: number;
    readonly plantedAt: Date;
    readonly expectedHarvestAt: Date;
    readonly dataPoints: DataPointMapping;
  }): Promise<PlantingDto> {
    validateHarvestDates(data.plantedAt, data.expectedHarvestAt);
    const activePlantings = await prisma.plantingCycle.count({
      where: { plotId: data.plotId, status: 'active' },
    });
    if (activePlantings > 0) {
      throw new ConflictError(
        'Lahan masih memiliki tanaman aktif. Selesaikan tanaman saat ini terlebih dahulu.',
      );
    }
    const dataPoints = { temp: 'api' as const, ...data.dataPoints };
    const planting = await prisma.plantingCycle.create({
      data: { ...data, dataPoints },
      include: { crop: { select: { name: true } } },
    });
    return toPlantingDto(planting);
  }

  async updatePlanting(
    id: string,
    data: Partial<{
      readonly plotId: string;
      readonly cropId: string;
      readonly seedName: string;
      readonly targetYieldKg: number;
      readonly plantedAt: Date;
      readonly expectedHarvestAt: Date;
      readonly status: 'active' | 'finished' | 'planned';
      readonly dataPoints: DataPointMapping;
    }>,
  ): Promise<PlantingDto> {
    const current = await this.getPlanting(id);
    validateHarvestDates(
      data.plantedAt ?? new Date(current.plantedAt),
      data.expectedHarvestAt ?? new Date(current.expectedHarvestAt),
    );
    const { dataPoints, ...fields } = data;
    const planting = await prisma.plantingCycle.update({
      where: { id },
      data: {
        ...fields,
        ...(dataPoints ? { dataPoints: { ...dataPoints } } : {}),
      },
      include: { crop: { select: { name: true } } },
    });
    return toPlantingDto(planting);
  }
}

function validateHarvestDates(plantedAt: Date, expectedHarvestAt: Date): void {
  if (expectedHarvestAt <= plantedAt) {
    throw new ValidationError('Tanggal panen tidak valid', [
      { field: 'expectedHarvestAt', message: 'Tanggal panen harus setelah tanggal tanam' },
    ]);
  }
}

function toCropDto(row: {
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
}): CropDto {
  return { ...row };
}

function toPlotDto(row: {
  readonly id: string;
  readonly farmerId: string;
  readonly name: string;
  readonly areaM2: number;
  readonly latitude: number;
  readonly longitude: number;
}): PlotDto {
  return { ...row };
}

function toPlantingDto(row: {
  readonly id: string;
  readonly plotId: string;
  readonly cropId: string;
  readonly seedName: string;
  readonly targetYieldKg: number;
  readonly plantedAt: Date;
  readonly expectedHarvestAt: Date;
  readonly status: string;
  readonly dataPoints: unknown;
  readonly crop: { readonly name: string };
}): PlantingDto {
  return {
    id: row.id,
    plotId: row.plotId,
    cropId: row.cropId,
    cropName: row.crop.name,
    seedName: row.seedName,
    targetYieldKg: row.targetYieldKg,
    plantedAt: row.plantedAt.toISOString(),
    expectedHarvestAt: row.expectedHarvestAt.toISOString(),
    status: row.status as PlantingDto['status'],
    dataPoints: toDataPointMapping(row.dataPoints),
  };
}

function toDataPointMapping(value: unknown): DataPointMapping {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  const mapping: DataPointMapping = {};
  for (const key of ['temp', 'humidity', 'rainfall', 'soil_moisture', 'nutrients_ph'] as const) {
    const source = Reflect.get(value, key);
    if (source === 'api' || source === 'iot') {
      mapping[key] = source;
    }
  }
  return mapping;
}
