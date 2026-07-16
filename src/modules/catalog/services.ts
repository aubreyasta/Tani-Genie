import { ConflictError, NotFoundError, ValidationError } from '@/lib/errors';
import type { CropDto, FarmerDto, PlantingDto, PlotDto } from '@/types/api';
import type {
  CropRepository,
  FarmerRepository,
  PlantingRepository,
  PlotRepository,
} from './repository';

export class CatalogService {
  constructor(
    private readonly farmers: FarmerRepository,
    private readonly crops: CropRepository,
    private readonly plots: PlotRepository,
    private readonly plantings: PlantingRepository,
  ) {}

  async getDefaultFarmer(): Promise<FarmerDto> {
    const farmer = await this.farmers.findDefault();
    if (!farmer) {
      throw new NotFoundError('Petani', 'default');
    }
    return farmer;
  }

  async listCrops(): Promise<ReadonlyArray<CropDto>> {
    return this.crops.findAll();
  }

  async getCrop(id: string): Promise<CropDto> {
    const crop = await this.crops.findById(id);
    if (!crop) {
      throw new NotFoundError('Komoditas', id);
    }
    return crop;
  }

  async listPlots(farmerId: string): Promise<ReadonlyArray<PlotDto>> {
    return this.plots.findByFarmerId(farmerId);
  }

  async getPlot(id: string): Promise<PlotDto> {
    const plot = await this.plots.findById(id);
    if (!plot) {
      throw new NotFoundError('Lahan', id);
    }
    return plot;
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
    return this.plots.create(data);
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
    return this.plots.update(id, data);
  }

  async deletePlot(id: string): Promise<void> {
    const hasActive = await this.plots.hasActivePlantings(id);
    if (hasActive) {
      throw new ConflictError(
        'Lahan masih memiliki tanaman aktif. Selesaikan tanaman saat ini terlebih dahulu.',
      );
    }
    await this.plots.delete(id);
  }

  async listPlantings(plotId: string): Promise<ReadonlyArray<PlantingDto>> {
    return this.plantings.findByPlotId(plotId);
  }

  async getPlanting(id: string): Promise<PlantingDto> {
    const planting = await this.plantings.findById(id);
    if (!planting) {
      throw new NotFoundError('Tanaman', id);
    }
    return planting;
  }

  async createPlanting(data: {
    readonly plotId: string;
    readonly cropId: string;
    readonly seedName: string;
    readonly targetYieldKg: number;
    readonly plantedAt: Date;
    readonly expectedHarvestAt: Date;
  }): Promise<PlantingDto> {
    if (data.expectedHarvestAt <= data.plantedAt) {
      throw new ValidationError('Tanggal panen tidak valid', [
        { field: 'expectedHarvestAt', message: 'Tanggal panen harus setelah tanggal tanam' },
      ]);
    }
    await this.plantings.hasOverlappingActive(data.plotId);
    return this.plantings.create(data);
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
    }>,
  ): Promise<PlantingDto> {
    const current = await this.getPlanting(id);
    const plantedAt = data.plantedAt ?? new Date(current.plantedAt);
    const expectedHarvestAt = data.expectedHarvestAt ?? new Date(current.expectedHarvestAt);

    if (expectedHarvestAt <= plantedAt) {
      throw new ValidationError('Tanggal panen tidak valid', [
        { field: 'expectedHarvestAt', message: 'Tanggal panen harus setelah tanggal tanam' },
      ]);
    }

    return this.plantings.update(id, data);
  }

  async finishPlanting(id: string): Promise<PlantingDto> {
    return this.plantings.update(id, { status: 'finished' });
  }
}
