import { describe, expect, it } from 'vitest';
import { CROP_PROFILES } from '@/modules/catalog/crop-profiles';
import { computeWeatherVerdict } from './verdict-engine';
import type { WeatherReading } from './weather-provider';

const observedAt = new Date('2026-07-16T00:00:00.000Z');

function weather(overrides: Partial<WeatherReading> = {}): WeatherReading {
  return {
    temperatureC: 25,
    rainfallMm: 25,
    humidityPct: 70,
    windSpeedKmh: 5,
    observedAt,
    source: 'test',
    ...overrides,
  };
}

describe('computeWeatherVerdict', () => {
  const crop = CROP_PROFILES['cabai-merah'];

  it('returns watch when crop needs are met but rain closes the spray window', () => {
    const verdict = computeWeatherVerdict(crop, weather());

    expect(verdict.status).toBe('watch');
    expect(verdict.details).toHaveLength(4);
    expect(verdict.details.find((detail) => detail.label === 'Jendela Semprot')?.status).toBe(
      'watch',
    );
  });

  it('returns watch when temperature is suboptimal but still within the safe range', () => {
    const verdict = computeWeatherVerdict(crop, weather({ temperatureC: 21 }));

    expect(verdict.status).toBe('watch');
    expect(verdict.details.find((detail) => detail.label === 'Suhu')?.status).toBe('watch');
  });

  it('gives danger precedence over watch conditions', () => {
    const verdict = computeWeatherVerdict(
      crop,
      weather({ temperatureC: 31, rainfallMm: 0, windSpeedKmh: 20 }),
    );

    expect(verdict.status).toBe('danger');
    expect(verdict.action).toContain('segera');
  });
});
