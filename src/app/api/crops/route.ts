import type { NextRequest } from 'next/server';
import { handleError, success } from '@/lib/api-response';
import { catalogService } from '@/modules/catalog';

export async function GET(_request: NextRequest) {
  try {
    const crops = await catalogService.listCrops();
    return success(crops);
  } catch (error) {
    return handleError(error);
  }
}
