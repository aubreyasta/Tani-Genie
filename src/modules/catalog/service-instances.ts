import {
  prismaCropRepository,
  prismaFarmerRepository,
  prismaPlantingRepository,
  prismaPlotRepository,
} from './prisma-repository';
import { CatalogService } from './services';

export const catalogService = new CatalogService(
  prismaFarmerRepository,
  prismaCropRepository,
  prismaPlotRepository,
  prismaPlantingRepository,
);
