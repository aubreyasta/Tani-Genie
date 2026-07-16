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

export const dummyWeatherProvider: WeatherProvider = {
  async fetch(latitude: number, longitude: number): Promise<WeatherReading> {
    // Deterministic dummy data based on coordinates.
    // Not real BMKG data — demo fixture only.
    const tempBase = 25 + Math.round(latitude * 10) / 10;
    const humidity = 70 + (Math.round(longitude * 10) % 20);
    const rainfall = Math.round(latitude * 100) % 15;

    return {
      temperatureC: tempBase,
      rainfallMm: rainfall,
      humidityPct: humidity,
      windSpeedKmh: 5 + (Math.round(longitude * 10) % 10),
      observedAt: new Date(),
      source: 'BMKG-village-forecast (demo)',
    };
  },
};
