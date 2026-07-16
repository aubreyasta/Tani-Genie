import type { CropProfile } from '@/modules/catalog/crop-profiles';
import type { VerdictDetail, VerdictDto } from '@/types/api';
import type { WeatherReading } from './weather-provider';

export function computeWeatherVerdict(crop: CropProfile, weather: WeatherReading): VerdictDto {
  const details: VerdictDetail[] = [];

  const tempStatus =
    weather.temperatureC < crop.minTempC || weather.temperatureC > crop.maxTempC
      ? 'danger'
      : Math.abs(weather.temperatureC - crop.optimalTempC) > 3
        ? 'watch'
        : 'safe';
  details.push({
    label: 'Suhu',
    value: `${weather.temperatureC.toFixed(1)}°C (ideal ${crop.minTempC}-${crop.maxTempC}°C)`,
    status: tempStatus,
  });

  const waterDeficit = crop.waterNeedMmPerWeek - weather.rainfallMm;
  const waterStatus = waterDeficit > 15 ? 'danger' : waterDeficit > 5 ? 'watch' : 'safe';
  details.push({
    label: 'Air',
    value:
      waterDeficit > 0
        ? `Perlu siram ${waterDeficit.toFixed(0)}mm/minggu`
        : `Cukup dari hujan (${weather.rainfallMm.toFixed(0)}mm)`,
    status: waterStatus,
  });

  const pestRisk =
    weather.humidityPct >= crop.pestRiskHumidity || weather.temperatureC >= crop.pestRiskTempC;
  const pestStatus = pestRisk ? 'danger' : 'safe';
  details.push({
    label: 'Risiko Hama',
    value: pestRisk ? `Tinggi — kelembapan ${weather.humidityPct.toFixed(0)}%` : 'Rendah',
    status: pestStatus,
  });

  const sprayOk = weather.rainfallMm < 5 && weather.windSpeedKmh < 15;
  details.push({
    label: 'Jendela Semprot',
    value: sprayOk ? 'Cocok untuk menyemprot' : 'Tunggu cuaca lebih baik',
    status: sprayOk ? 'safe' : 'watch',
  });

  const hasDanger = details.some((detail) => detail.status === 'danger');
  const hasWatch = details.some((detail) => detail.status === 'watch');
  const overallStatus = hasDanger ? 'danger' : hasWatch ? 'watch' : 'safe';

  const actions: Record<'safe' | 'watch' | 'danger', string> = {
    safe: 'Kondisi tanaman baik. Lanjutkan rutinitas.',
    watch: 'Perhatikan perubahan cuaca minggu ini.',
    danger: 'Tindakan diperlukan segera. Lihat detail.',
  };

  const reasons: Record<'safe' | 'watch' | 'danger', string> = {
    safe: 'Semua parameter dalam batas aman untuk tanaman ini.',
    watch: 'Beberapa parameter mendekati batas. Pantau berkala.',
    danger: 'Ada parameter di luar batas aman. Bertindak sekarang.',
  };

  return {
    status: overallStatus,
    action: actions[overallStatus],
    reason: reasons[overallStatus],
    details,
  };
}
