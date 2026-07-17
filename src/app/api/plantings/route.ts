import type { NextRequest } from 'next/server';
import { handleError, success } from '@/lib/api-response';
import { ValidationError } from '@/lib/errors';
import { createPlantingSchema } from '@/lib/schemas';
import { catalogService } from '@/modules/catalog';

function toFieldErrors(error: {
  readonly issues: ReadonlyArray<{ readonly path: PropertyKey[]; readonly message: string }>;
}) {
  return error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }));
}

export async function GET(request: NextRequest) {
  try {
    const plotId = request.nextUrl.searchParams.get('plotId');

    if (plotId) {
      const plantings = await catalogService.listPlantings(plotId);
      return success(plantings);
    }

    const farmer = await catalogService.getDefaultFarmer();
    const plots = await catalogService.listPlots(farmer.id);
    const plantingsByPlot = await Promise.all(
      plots.map((plot) => catalogService.listPlantings(plot.id)),
    );
    const plantings = plantingsByPlot.flat();

    return success(plantings);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = createPlantingSchema.safeParse(body);

    if (!result.success) {
      throw new ValidationError('Data tidak valid', toFieldErrors(result.error));
    }

    const planting = await catalogService.createPlanting({
      ...result.data,
      plantedAt: new Date(result.data.plantedAt),
      expectedHarvestAt: new Date(result.data.expectedHarvestAt),
      dataPoints: result.data.dataPoints,
    });
    return success(planting, 201);
  } catch (error) {
    return handleError(error);
  }
}
