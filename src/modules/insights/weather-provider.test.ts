import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlantingCalendarWeatherProvider } from './weather-provider';

describe('PlantingCalendarWeatherProvider', () => {
  beforeEach(() => {
    process.env.PLANTING_CALENDAR_API_URL = 'http://calendar.test/';
  });

  it('maps actual planting-calendar weather data without a fallback', async () => {
    const request = vi.fn().mockResolvedValue({
      observed_at: '2026-07-16',
      temperature_c: 27,
      rainfall_mm: 12,
      humidity_pct: 78,
      wind_speed_kmh: 9,
      source: 'NASA POWER',
    });

    const result = await new PlantingCalendarWeatherProvider(request).fetch(-7.8, 110.36);

    expect(request).toHaveBeenCalledWith('http://calendar.test/weather', {
      latitude: -7.8,
      longitude: 110.36,
      days: 7,
    });
    expect(result).toEqual({
      temperatureC: 27,
      rainfallMm: 12,
      humidityPct: 78,
      windSpeedKmh: 9,
      observedAt: new Date('2026-07-16T00:00:00.000Z'),
      source: 'NASA POWER',
    });
  });

  it('propagates service failures instead of generating synthetic weather', async () => {
    const request = vi.fn().mockRejectedValue(new Error('NASA unavailable'));

    await expect(new PlantingCalendarWeatherProvider(request).fetch(-7.8, 110.36)).rejects.toThrow(
      'NASA unavailable',
    );
  });
});
