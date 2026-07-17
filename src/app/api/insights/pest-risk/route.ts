import type { NextRequest } from 'next/server';
import { errorResponse, handleError, success } from '@/lib/api-response';
import { PestRiskServiceError, pestRiskService } from '@/modules/insights/pest-risk-service';

export async function GET(request: NextRequest) {
  try {
    const plantingId = request.nextUrl.searchParams.get('plantingId');
    if (!plantingId) {
      return errorResponse('BAD_REQUEST', 'Parameter plantingId wajib diisi', 400);
    }
    return success(await pestRiskService.getRisk(plantingId));
  } catch (error) {
    if (error instanceof PestRiskServiceError) {
      return errorResponse('PEST_RISK_UNAVAILABLE', error.message, 503);
    }
    return handleError(error);
  }
}
