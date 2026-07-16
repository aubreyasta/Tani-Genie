import type { NextRequest } from 'next/server';
import { handleError, success } from '@/lib/api-response';
import { priceService } from '@/modules/prices';

export async function POST(request: NextRequest) {
  try {
    const plantingId = request.nextUrl.searchParams.get('plantingId');
    if (!plantingId) {
      return success({ error: 'Parameter plantingId wajib diisi' }, 400);
    }

    const forecast = await priceService.refreshForecast(plantingId);
    return success(forecast);
  } catch (error) {
    return handleError(error);
  }
}
