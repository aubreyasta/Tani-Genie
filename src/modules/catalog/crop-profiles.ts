export interface CropProfile {
  readonly slug: string;
  readonly name: string;
  readonly commodityKey: string;
  readonly minTempC: number;
  readonly maxTempC: number;
  readonly optimalTempC: number;
  readonly minHumidity: number;
  readonly maxHumidity: number;
  readonly waterNeedMmPerWeek: number;
  readonly gddBaseC: number;
  readonly gddTargetC: number;
  readonly pestRiskHumidity: number;
  readonly pestRiskTempC: number;
  readonly growingSeasonDays: number;
}

export const CROP_PROFILES = {
  'cabai-merah': {
    slug: 'cabai-merah',
    name: 'Cabai Merah',
    commodityKey: 'cabai-merah',
    minTempC: 20,
    maxTempC: 30,
    optimalTempC: 25,
    minHumidity: 60,
    maxHumidity: 80,
    waterNeedMmPerWeek: 25,
    gddBaseC: 10,
    gddTargetC: 1200,
    pestRiskHumidity: 85,
    pestRiskTempC: 28,
    growingSeasonDays: 90,
  },
  'bawang-merah': {
    slug: 'bawang-merah',
    name: 'Bawang Merah',
    commodityKey: 'bawang-merah',
    minTempC: 25,
    maxTempC: 32,
    optimalTempC: 28,
    minHumidity: 50,
    maxHumidity: 70,
    waterNeedMmPerWeek: 15,
    gddBaseC: 5,
    gddTargetC: 1000,
    pestRiskHumidity: 80,
    pestRiskTempC: 30,
    growingSeasonDays: 70,
  },
} as const satisfies Record<string, CropProfile>;

export function getCropProfile(slug: string): CropProfile | null {
  return CROP_PROFILES[slug as keyof typeof CROP_PROFILES] ?? null;
}

export function getCropProfileByCommodityKey(key: string): CropProfile | null {
  for (const profile of Object.values(CROP_PROFILES)) {
    if (profile.commodityKey === key) {
      return profile;
    }
  }
  return null;
}
