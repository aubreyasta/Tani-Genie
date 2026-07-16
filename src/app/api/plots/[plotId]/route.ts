import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { handleError, success } from '@/lib/api-response';
import { ValidationError } from '@/lib/errors';
import { updatePlotSchema } from '@/lib/schemas';
import { catalogService } from '@/modules/catalog';

function toFieldErrors(error: {
  readonly issues: ReadonlyArray<{ readonly path: PropertyKey[]; readonly message: string }>;
}) {
  return error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }));
}

function toPlotUpdateData(data: {
  readonly name?: string | undefined;
  readonly areaM2?: number | undefined;
  readonly latitude?: number | undefined;
  readonly longitude?: number | undefined;
}) {
  return {
    ...(data.name !== undefined ? { name: data.name } : {}),
    ...(data.areaM2 !== undefined ? { areaM2: data.areaM2 } : {}),
    ...(data.latitude !== undefined ? { latitude: data.latitude } : {}),
    ...(data.longitude !== undefined ? { longitude: data.longitude } : {}),
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { readonly params: Promise<{ readonly plotId: string }> },
) {
  try {
    const { plotId } = await params;
    const plot = await catalogService.getPlot(plotId);
    return success(plot);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { readonly params: Promise<{ readonly plotId: string }> },
) {
  try {
    const { plotId } = await params;
    const body = await request.json();
    const result = updatePlotSchema.safeParse(body);

    if (!result.success) {
      throw new ValidationError('Data tidak valid', toFieldErrors(result.error));
    }

    const plot = await catalogService.updatePlot(plotId, toPlotUpdateData(result.data));
    return success(plot);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { readonly params: Promise<{ readonly plotId: string }> },
) {
  try {
    const { plotId } = await params;
    await catalogService.deletePlot(plotId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleError(error);
  }
}
