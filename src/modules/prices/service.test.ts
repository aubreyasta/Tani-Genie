import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const prisma = vi.hoisted(() => ({
  plantingCycle: { findUnique: vi.fn() },
}));

vi.mock('@/lib/prisma', () => ({ prisma }));

import { PriceService } from './service';

describe('PriceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-17T00:00:00.000Z'));
    process.env['PRICE_PREDICTION_API_URL'] = 'http://price.test/';
    process.env['PRICE_PREDICTION_MARKET'] = 'pasar_tradisional';
    process.env['PRICE_PREDICTION_PROVINCE'] = 'DI Yogyakarta';
    prisma.plantingCycle.findUnique.mockResolvedValue({
      id: 'planting-1',
      crop: { commodityKey: 'cabai-merah' },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('builds the forecast entirely from model API responses', async () => {
    const prices = [45_000, 48_000, 47_000, 46_000];
    let responseIndex = 0;
    const request = vi.fn().mockImplementation((_url: string, body: { target_date: string }) => {
      const index = responseIndex++;
      return Promise.resolve({
        commodity: 'cabai_merah',
        market: 'pasar_tradisional',
        province: 'DI Yogyakarta',
        target_date: body.target_date,
        predicted_price: prices[index],
        horizon_days: [7, 14, 21, 30][index],
        last_known_date: '2026-07-17',
        last_known_price: 44_000,
      });
    });

    const result = await new PriceService(request).getForecast('planting-1');

    expect(request).toHaveBeenCalledTimes(4);
    expect(request).toHaveBeenNthCalledWith(1, 'http://price.test/predict', {
      commodity: 'cabai_merah',
      market: 'pasar_tradisional',
      province: 'DI Yogyakarta',
      target_date: '2026-07-24',
    });
    expect(result.lastKnownPrice).toBe(44_000);
    expect(result.bestSellTargetDate).toBe('2026-07-31');
    expect(result.points.map((point) => point.predictedPrice)).toEqual(prices);
    expect(result.points.filter((point) => point.isBestSell)).toHaveLength(1);
  });

  it('does not fabricate a fallback when the model service fails', async () => {
    const request = vi.fn().mockRejectedValue(new Error('service unavailable'));

    await expect(new PriceService(request).getForecast('planting-1')).rejects.toThrow(
      'service unavailable',
    );
  });
});
