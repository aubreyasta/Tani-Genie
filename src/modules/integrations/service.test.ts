import { beforeEach, describe, expect, it, vi } from 'vitest';

const prisma = vi.hoisted(() => ({
  plantingCycle: { findUnique: vi.fn() },
}));

vi.mock('@/lib/prisma', () => ({ prisma }));

import { IntegrationService } from './service';

describe('IntegrationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env['PLANTING_CALENDAR_API_URL'] = 'http://calendar.test';
    process.env['PRICE_PREDICTION_API_URL'] = 'http://price.test';
    prisma.plantingCycle.findUnique.mockResolvedValue({
      id: 'planting-1',
      plantedAt: new Date('2026-07-01T00:00:00.000Z'),
      expectedHarvestAt: new Date('2026-08-01T00:00:00.000Z'),
      crop: { commodityKey: 'cabai-merah' },
    });
  });

  it('maps the database commodity key to both Python service contracts', async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce({ crop: 'Cabai Merah' })
      .mockResolvedValueOnce({ predicted_price: 48_000 });

    const result = await new IntegrationService(request).getPlantingData('planting-1');

    expect(request).toHaveBeenNthCalledWith(1, 'http://calendar.test/calendar', {
      crop: 'cabai_merah',
      planting_date: '2026-07-01',
    });
    expect(request).toHaveBeenNthCalledWith(2, 'http://price.test/predict', {
      commodity: 'cabai_merah',
      market: 'pasar_tradisional',
      province: 'DI Yogyakarta',
      target_date: '2026-08-01',
    });
    expect(result.unavailable).toEqual([]);
  });

  it('keeps available results when one integration is down', async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce({ crop: 'Cabai Merah' })
      .mockRejectedValueOnce(new Error('service down'));

    const result = await new IntegrationService(request).getPlantingData('planting-1');

    expect(result.calendar).toEqual({ crop: 'Cabai Merah' });
    expect(result.pricePrediction).toBeNull();
    expect(result.unavailable).toEqual(['price-prediction']);
  });
});
