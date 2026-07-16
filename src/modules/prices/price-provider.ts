export interface PriceReading {
  readonly commodityKey: string;
  readonly pricePerKg: number;
  readonly level: string;
  readonly observedAt: Date;
  readonly source: string;
}

export interface PriceProvider {
  fetch(commodityKey: string): Promise<PriceReading>;
}

// Deterministic dummy price fixtures — NOT real Bapanas data
const DUMMY_PRICES: Readonly<Record<string, number>> = {
  'cabai-merah': 45_000,
  'bawang-merah': 28_000,
};

export const dummyPriceProvider: PriceProvider = {
  async fetch(commodityKey: string): Promise<PriceReading> {
    const basePrice = DUMMY_PRICES[commodityKey] ?? 30_000;
    return {
      commodityKey,
      pricePerKg: basePrice,
      level: 'producer',
      observedAt: new Date(),
      source: 'Panel-Harga-Bapanas (demo)',
    };
  },
};
