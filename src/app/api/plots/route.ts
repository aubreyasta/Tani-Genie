import type { NextRequest } from 'next/server';
import { handleError, success } from '@/lib/api-response';
import { ValidationError } from '@/lib/errors';
import { createPlotSchema } from '@/lib/schemas';
import { catalogService } from '@/modules/catalog';

function toFieldErrors(error: {
  readonly issues: ReadonlyArray<{ readonly path: PropertyKey[]; readonly message: string }>;
}) {
  return error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }));
}

export async function GET(_request: NextRequest) {
  try {
    const farmer = await catalogService.getDefaultFarmer();
    const plots = await catalogService.listPlots(farmer.id);
    return success(plots);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const farmer = await catalogService.getDefaultFarmer();
    const body = await request.json();
    const result = createPlotSchema.safeParse({ ...body, farmerId: farmer.id });

    if (!result.success) {
      throw new ValidationError('Data tidak valid', toFieldErrors(result.error));
    }

    const plot = await catalogService.createPlot({ ...result.data, farmerId: farmer.id });
    return success(plot, 201);
  } catch (error) {
    return handleError(error);
  }
}
