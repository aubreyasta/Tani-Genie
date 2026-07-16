import { describe, expect, it } from 'vitest';
import { generateForecast, validateForecast } from './forecast-engine';

const generatedAt = new Date('2026-07-16T00:00:00.000Z');

describe('generateForecast', () => {
  it('generates a deterministic eight-week rising forecast for cabai', () => {
    const forecast = generateForecast('cabai-merah', 45_000, 'planting-1', generatedAt);

    expect(forecast.points).toHaveLength(8);
    expect(forecast.points[0]?.expectedPrice).toBe(45_900);
    expect(forecast.bestSellWindow).toEqual({ startWeek: 7, endWeek: 8 });
    expect(
      forecast.points.filter((point) => point.isBestSell).map((point) => point.weekNumber),
    ).toEqual([7, 8]);
    expect(forecast.generatedAt).toBe(generatedAt.toISOString());
    expect(() => validateForecast(forecast)).not.toThrow();
  });

  it('keeps the earliest sell window for a falling bawang forecast', () => {
    const forecast = generateForecast('bawang-merah', 28_000, 'planting-2', generatedAt);

    expect(forecast.bestSellWindow).toEqual({ startWeek: 1, endWeek: 2 });
    expect(forecast.points[7]?.expectedPrice).toBeLessThan(forecast.points[0]?.expectedPrice ?? 0);
  });
});

describe('validateForecast', () => {
  it('rejects a forecast with the wrong number of points', () => {
    const forecast = generateForecast('cabai-merah', 45_000, 'planting-1', generatedAt);

    expect(() => validateForecast({ ...forecast, points: forecast.points.slice(0, 7) })).toThrow(
      'Expected 8 forecast points',
    );
  });

  it('rejects a forecast whose expected price is outside its bounds', () => {
    const forecast = generateForecast('cabai-merah', 45_000, 'planting-1', generatedAt);
    const points = forecast.points.map((point, index) =>
      index === 0 ? { ...point, lowerBound: point.expectedPrice + 1 } : point,
    );

    expect(() => validateForecast({ ...forecast, points })).toThrow('bounds violated');
  });
});
