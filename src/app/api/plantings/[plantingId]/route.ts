import type { NextRequest } from 'next/server';
import { handleError, success } from '@/lib/api-response';
import { ValidationError } from '@/lib/errors';
import { updatePlantingSchema } from '@/lib/schemas';
import { catalogService } from '@/modules/catalog';

function toFieldErrors(error: {
  readonly issues: ReadonlyArray<{ readonly path: PropertyKey[]; readonly message: string }>;
}) {
  return error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }));
}

function toPlantingUpdateData(data: {
  readonly plotId?: string | undefined;
  readonly cropId?: string | undefined;
  readonly seedName?: string | undefined;
  readonly targetYieldKg?: number | undefined;
  readonly plantedAt?: string | undefined;
  readonly expectedHarvestAt?: string | undefined;
  readonly status?: 'active' | 'finished' | 'planned' | undefined;
  readonly dataPoints?: import('@/types/api').DataPointMapping | undefined;
}) {
  return {
    ...(data.plotId !== undefined ? { plotId: data.plotId } : {}),
    ...(data.cropId !== undefined ? { cropId: data.cropId } : {}),
    ...(data.seedName !== undefined ? { seedName: data.seedName } : {}),
    ...(data.targetYieldKg !== undefined ? { targetYieldKg: data.targetYieldKg } : {}),
    ...(data.plantedAt !== undefined ? { plantedAt: new Date(data.plantedAt) } : {}),
    ...(data.expectedHarvestAt !== undefined
      ? { expectedHarvestAt: new Date(data.expectedHarvestAt) }
      : {}),
    ...(data.status !== undefined ? { status: data.status } : {}),
    ...(data.dataPoints !== undefined ? { dataPoints: data.dataPoints } : {}),
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { readonly params: Promise<{ readonly plantingId: string }> },
) {
  try {
    const { plantingId } = await params;
    const planting = await catalogService.getPlanting(plantingId);
    return success(planting);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { readonly params: Promise<{ readonly plantingId: string }> },
) {
  try {
    const { plantingId } = await params;
    const body = await request.json();
    const result = updatePlantingSchema.safeParse(body);

    if (!result.success) {
      throw new ValidationError('Data tidak valid', toFieldErrors(result.error));
    }

    const planting = await catalogService.updatePlanting(
      plantingId,
      toPlantingUpdateData(result.data),
    );
    return success(planting);
  } catch (error) {
    return handleError(error);
  }
}
