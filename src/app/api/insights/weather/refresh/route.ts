import type { NextRequest } from 'next/server';
import { handleError, success } from '@/lib/api-response';
import { insightService } from '@/modules/insights';

export async function POST(request: NextRequest) {
  try {
    const plantingId = request.nextUrl.searchParams.get('plantingId');
    if (!plantingId) {
      return success({ error: 'Parameter plantingId wajib diisi' }, 400);
    }

    const insight = await insightService.refreshWeather(plantingId);
    return success(insight);
  } catch (error) {
    return handleError(error);
  }
}
