import type { CropDto, FarmerDto, PlantingDto, PlotDto } from '@/types/api';

export interface FarmerRepository {
  readonly findById: (id: string) => Promise<FarmerDto | null>;
  readonly findDefault: () => Promise<FarmerDto | null>;
}

export interface CropRepository {
  readonly findAll: () => Promise<ReadonlyArray<CropDto>>;
  readonly findById: (id: string) => Promise<CropDto | null>;
  readonly findByCommodityKey: (key: string) => Promise<CropDto | null>;
}

export interface PlotRepository {
  readonly findByFarmerId: (farmerId: string) => Promise<ReadonlyArray<PlotDto>>;
  readonly findById: (id: string) => Promise<PlotDto | null>;
  readonly create: (data: {
    readonly farmerId: string;
    readonly name: string;
    readonly areaM2: number;
    readonly latitude: number;
    readonly longitude: number;
  }) => Promise<PlotDto>;
  readonly update: (
    id: string,
    data: Partial<{
      readonly name: string;
      readonly areaM2: number;
      readonly latitude: number;
      readonly longitude: number;
    }>,
  ) => Promise<PlotDto>;
  readonly delete: (id: string) => Promise<void>;
  readonly hasActivePlantings: (id: string) => Promise<boolean>;
}

export interface PlantingRepository {
  readonly findByPlotId: (plotId: string) => Promise<ReadonlyArray<PlantingDto>>;
  readonly findById: (id: string) => Promise<PlantingDto | null>;
  readonly create: (data: {
    readonly plotId: string;
    readonly cropId: string;
    readonly seedName: string;
    readonly targetYieldKg: number;
    readonly plantedAt: Date;
    readonly expectedHarvestAt: Date;
  }) => Promise<PlantingDto>;
  readonly update: (
    id: string,
    data: Partial<{
      readonly plotId: string;
      readonly cropId: string;
      readonly seedName: string;
      readonly targetYieldKg: number;
      readonly plantedAt: Date;
      readonly expectedHarvestAt: Date;
      readonly status: 'active' | 'finished' | 'planned';
    }>,
  ) => Promise<PlantingDto>;
  readonly hasOverlappingActive: (plotId: string) => Promise<boolean>;
}
