export interface WeatherReading {
  readonly temperatureC: number;
  readonly rainfallMm: number;
  readonly humidityPct: number;
  readonly windSpeedKmh: number;
  readonly observedAt: Date;
  readonly source: string;
}

export interface WeatherProvider {
  fetch(latitude: number, longitude: number): Promise<WeatherReading>;
}

interface WeatherApiResponse {
  readonly observed_at: string;
  readonly temperature_c: number;
  readonly rainfall_mm: number;
  readonly humidity_pct: number;
  readonly wind_speed_kmh: number;
  readonly source: string;
}

export class PlantingCalendarWeatherProvider implements WeatherProvider {
  constructor(private readonly request = postWeather) {}

  async fetch(latitude: number, longitude: number): Promise<WeatherReading> {
    const baseUrl = process.env.PLANTING_CALENDAR_API_URL;
    if (!baseUrl) {
      throw new Error('PLANTING_CALENDAR_API_URL is not configured');
    }
    const reading = await this.request(`${baseUrl.replace(/\/$/, '')}/weather`, {
      latitude,
      longitude,
      days: 7,
    });

    return {
      temperatureC: reading.temperature_c,
      rainfallMm: reading.rainfall_mm,
      humidityPct: reading.humidity_pct,
      windSpeedKmh: reading.wind_speed_kmh,
      observedAt: new Date(`${reading.observed_at}T00:00:00.000Z`),
      source: reading.source,
    };
  }
}

async function postWeather(
  url: string,
  body: { latitude: number; longitude: number; days: number },
): Promise<WeatherApiResponse> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(65_000),
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Weather request failed with status ${response.status}`);
  }
  return (await response.json()) as WeatherApiResponse;
}

export const plantingCalendarWeatherProvider = new PlantingCalendarWeatherProvider();
