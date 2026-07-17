import type { NextRequest } from 'next/server';
import { handleError, success } from '@/lib/api-response';
import { integrationService } from '@/modules/integrations';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ plantingId: string }> },
) {
  try {
    const { plantingId } = await params;
    return success(await integrationService.getPlantingData(plantingId));
  } catch (error) {
    return handleError(error);
  }
}
