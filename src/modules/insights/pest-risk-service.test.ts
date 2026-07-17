import { beforeEach, describe, expect, it, vi } from 'vitest';

const prisma = vi.hoisted(() => ({
  plantingCycle: { findUnique: vi.fn() },
}));

vi.mock('@/lib/prisma', () => ({ prisma }));

import type { PestRiskResponse } from '@/types/pest-risk';
import { fetchNasaPowerHistory, PestRiskService } from './pest-risk-service';

const prediction: PestRiskResponse = {
  crop: 'chili_red',
  province: 'DI Yogyakarta',
  prediction_date: '2026-07-16',
  overall_flag: 'HIGH',
  overall_score: 0.82,
  disease_risks: [],
  data_window_days: 90,
  disclaimer: 'Risiko kondisi kondusif, bukan diagnosis penyakit.',
};

describe('PestRiskService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PEST_RISK_PROVINCE = 'DI Yogyakarta';
  });

  it('sends real weather history and the planting crop to the pest-risk API', async () => {
    prisma.plantingCycle.findUnique.mockResolvedValue({
      id: 'planting-1',
      dataPoints: { temp: 'api' },
      crop: { commodityKey: 'cabai-merah' },
      plot: { latitude: -7.8, longitude: 110.36 },
    });
    const history = vi.fn().mockResolvedValue([
      {
        date: '2026-07-16',
        temp_avg_c: 27,
        temp_max_c: 30,
        temp_min_c: 24,
        relative_humidity_pct: 82,
        rainfall_mm: 12,
        wind_speed_ms: 2,
      },
    ]);
    const predict = vi.fn().mockResolvedValue(prediction);

    const result = await new PestRiskService(history, predict).getRisk('planting-1');

    expect(result).toEqual(prediction);
    expect(history).toHaveBeenCalledWith(-7.8, 110.36, expect.any(Date), expect.any(Date));
    expect(predict).toHaveBeenCalledWith({
      crop: 'cabai_merah',
      province: 'DI Yogyakarta',
      prediction_date: '2026-07-16',
      weather_history: expect.arrayContaining([expect.objectContaining({ temp_avg_c: 27 })]),
    });
  });

  it('does not silently replace IoT weather sources with NASA POWER data', async () => {
    prisma.plantingCycle.findUnique.mockResolvedValue({
      id: 'planting-1',
      dataPoints: { temp: 'api', humidity: 'iot' },
      crop: { commodityKey: 'cabai-merah' },
      plot: { latitude: -7.8, longitude: 110.36 },
    });
    const history = vi.fn();

    await expect(new PestRiskService(history, vi.fn()).getRisk('planting-1')).rejects.toMatchObject(
      {
        code: 'BAD_REQUEST',
        statusCode: 400,
      },
    );
    expect(history).not.toHaveBeenCalled();
  });
});

describe('fetchNasaPowerHistory', () => {
  it('maps daily NASA POWER observations and removes sentinel values', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            properties: {
              parameter: {
                T2M: { '20260715': 27 },
                T2M_MAX: { '20260715': 30 },
                T2M_MIN: { '20260715': 24 },
                RH2M: { '20260715': 82 },
                PRECTOTCORR: { '20260715': -999 },
                WS2M: { '20260715': 2 },
              },
            },
          }),
        ),
      ),
    );

    const result = await fetchNasaPowerHistory(
      -7.8,
      110.36,
      new Date('2026-07-15T00:00:00.000Z'),
      new Date('2026-07-15T00:00:00.000Z'),
    );

    expect(result).toEqual([
      {
        date: '2026-07-15',
        temp_avg_c: 27,
        temp_max_c: 30,
        temp_min_c: 24,
        relative_humidity_pct: 82,
        rainfall_mm: null,
        wind_speed_ms: 2,
      },
    ]);
    vi.unstubAllGlobals();
  });
});
