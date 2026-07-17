import type { PestRiskRequest, PestRiskResponse } from '@/types/pest-risk';

const DEFAULT_TIMEOUT_MS = 15_000;

export class PestRiskServiceError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'PestRiskServiceError';
  }
}

export async function fetchPestRisk(
  request: PestRiskRequest,
  options: { timeoutMs?: number; baseUrl?: string } = {},
): Promise<PestRiskResponse> {
  const baseUrl = options.baseUrl ?? process.env.PEST_RISK_API_URL ?? 'http://localhost:8002';
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}/v1/risk/predict`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(request),
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new PestRiskServiceError(`Pest-risk service failed: ${detail}`, response.status);
    }
    return (await response.json()) as PestRiskResponse;
  } catch (error) {
    if (error instanceof PestRiskServiceError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new PestRiskServiceError('Pest-risk service timed out');
    }
    throw new PestRiskServiceError(error instanceof Error ? error.message : 'Unknown service error');
  } finally {
    clearTimeout(timeout);
  }
}
