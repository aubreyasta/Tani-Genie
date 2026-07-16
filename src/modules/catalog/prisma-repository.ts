import { ConflictError, NotFoundError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import type { CropDto, FarmerDto, PlantingDto, PlotDto } from '@/types/api';
import type {
  CropRepository,
  FarmerRepository,
  PlantingRepository,
  PlotRepository,
} from './repository';

function toFarmerDto(row: {
  readonly id: string;
  readonly name: string;
  readonly phone: string | null;
}): FarmerDto {
  return { id: row.id, name: row.name, phone: row.phone };
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
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    commodityKey: row.commodityKey,
    minTempC: row.minTempC,
    maxTempC: row.maxTempC,
    minHumidity: row.minHumidity,
    maxHumidity: row.maxHumidity,
    waterNeedMm: row.waterNeedMm,
    gddBaseC: row.gddBaseC,
    gddTargetC: row.gddTargetC,
    pestRiskHumidity: row.pestRiskHumidity,
    pestRiskTempC: row.pestRiskTempC,
  };
}

function toPlotDto(row: {
  readonly id: string;
  readonly farmerId: string;
  readonly name: string;
  readonly areaM2: number;
  readonly latitude: number;
  readonly longitude: number;
}): PlotDto {
  return {
    id: row.id,
    farmerId: row.farmerId,
    name: row.name,
    areaM2: row.areaM2,
    latitude: row.latitude,
    longitude: row.longitude,
  };
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
  readonly crop?: { readonly name: string };
}): PlantingDto {
  return {
    id: row.id,
    plotId: row.plotId,
    cropId: row.cropId,
    cropName: row.crop?.name ?? '',
    seedName: row.seedName,
    targetYieldKg: row.targetYieldKg,
    plantedAt: row.plantedAt.toISOString(),
    expectedHarvestAt: row.expectedHarvestAt.toISOString(),
    status: row.status as 'active' | 'finished' | 'planned',
  };
}

export const prismaFarmerRepository: FarmerRepository = {
  async findById(id) {
    const row = await prisma.farmer.findUnique({ where: { id } });
    return row ? toFarmerDto(row) : null;
  },
  async findDefault() {
    const row = await prisma.farmer.findFirst({ orderBy: { createdAt: 'asc' } });
    return row ? toFarmerDto(row) : null;
  },
};

export const prismaCropRepository: CropRepository = {
  async findAll() {
    const rows = await prisma.cropDefinition.findMany({ orderBy: { name: 'asc' } });
    return rows.map(toCropDto);
  },
  async findById(id) {
    const row = await prisma.cropDefinition.findUnique({ where: { id } });
    return row ? toCropDto(row) : null;
  },
  async findByCommodityKey(key) {
    const row = await prisma.cropDefinition.findUnique({ where: { commodityKey: key } });
    return row ? toCropDto(row) : null;
  },
};

export const prismaPlotRepository: PlotRepository = {
  async findByFarmerId(farmerId) {
    const rows = await prisma.plot.findMany({
      where: { farmerId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toPlotDto);
  },
  async findById(id) {
    const row = await prisma.plot.findUnique({ where: { id } });
    return row ? toPlotDto(row) : null;
  },
  async create(data) {
    const row = await prisma.plot.create({ data });
    return toPlotDto(row);
  },
  async update(id, data) {
    try {
      const row = await prisma.plot.update({ where: { id }, data });
      return toPlotDto(row);
    } catch {
      throw new NotFoundError('Lahan', id);
    }
  },
  async delete(id) {
    try {
      await prisma.plot.delete({ where: { id } });
    } catch {
      throw new NotFoundError('Lahan', id);
    }
  },
  async hasActivePlantings(id) {
    const count = await prisma.plantingCycle.count({ where: { plotId: id, status: 'active' } });
    return count > 0;
  },
};

export const prismaPlantingRepository: PlantingRepository = {
  async findByPlotId(plotId) {
    const rows = await prisma.plantingCycle.findMany({
      where: { plotId },
      include: { crop: { select: { name: true } } },
      orderBy: { plantedAt: 'desc' },
    });
    return rows.map(toPlantingDto);
  },
  async findById(id) {
    const row = await prisma.plantingCycle.findUnique({
      where: { id },
      include: { crop: { select: { name: true } } },
    });
    return row ? toPlantingDto(row) : null;
  },
  async create(data) {
    const row = await prisma.plantingCycle.create({
      data,
      include: { crop: { select: { name: true } } },
    });
    return toPlantingDto(row);
  },
  async update(id, data) {
    try {
      const row = await prisma.plantingCycle.update({
        where: { id },
        data,
        include: { crop: { select: { name: true } } },
      });
      return toPlantingDto(row);
    } catch {
      throw new NotFoundError('Tanaman', id);
    }
  },
  async hasOverlappingActive(plotId) {
    const count = await prisma.plantingCycle.count({ where: { plotId, status: 'active' } });
    if (count > 0) {
      throw new ConflictError(
        'Lahan masih memiliki tanaman aktif. Selesaikan tanaman saat ini terlebih dahulu.',
      );
    }
    return false;
  },
};
