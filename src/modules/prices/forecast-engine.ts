import type { PriceForecastDto, PriceForecastPointDto } from '@/types/api';

export function generateForecast(
  commodityKey: string,
  currentPrice: number,
  plantingId: string,
  generatedAt: Date,
): PriceForecastDto {
  const points: PriceForecastPointDto[] = [];

  // Deterministic weekly multipliers — NOT a real model, just demo fixtures
  // Slight upward trend for cabai, slight downward for bawang
  const trendDirection = commodityKey === 'cabai-merah' ? 1.02 : 0.98;

  let expectedPrice = currentPrice;
  let bestSellWeek = 1;
  let bestSellPrice = currentPrice;

  for (let week = 1; week <= 8; week += 1) {
    // Apply deterministic trend
    expectedPrice = Math.round(currentPrice * trendDirection ** week);

    // Confidence widens after week 4
    const baseSpread = week <= 4 ? 0.05 : 0.05 + (week - 4) * 0.03;
    const spread = expectedPrice * baseSpread;

    const lowerBound = Math.round(expectedPrice - spread);
    const upperBound = Math.round(expectedPrice + spread);

    if (expectedPrice > bestSellPrice) {
      bestSellPrice = expectedPrice;
      bestSellWeek = week;
    }

    points.push({
      weekNumber: week,
      expectedPrice,
      lowerBound,
      upperBound,
      isBestSell: week === bestSellWeek,
    });
  }

  // Mark the best sell window (bestSellWeek and adjacent week)
  const bestSellStart = Math.max(1, bestSellWeek - 1);
  const bestSellEnd = Math.min(8, bestSellWeek + 1);

  // Re-mark isBestSell for the window
  const finalPoints = points.map((point) => ({
    ...point,
    isBestSell: point.weekNumber >= bestSellStart && point.weekNumber <= bestSellEnd,
  }));

  return {
    plantingId,
    commodityKey,
    currentPrice,
    points: finalPoints,
    bestSellWindow: {
      startWeek: bestSellStart,
      endWeek: bestSellEnd,
    },
    generatedAt: generatedAt.toISOString(),
    source: 'tanigata-deterministic (demo)',
    isDemo: true,
  };
}

// Verify forecast invariants — used by tests
export function validateForecast(forecast: PriceForecastDto): void {
  if (forecast.points.length !== 8) {
    throw new Error(`Expected 8 forecast points, got ${forecast.points.length}`);
  }

  for (const point of forecast.points) {
    if (point.lowerBound > point.expectedPrice || point.expectedPrice > point.upperBound) {
      throw new Error(
        `Week ${point.weekNumber}: bounds violated (lower=${point.lowerBound}, expected=${point.expectedPrice}, upper=${point.upperBound})`,
      );
    }
  }

  // Confidence must widen after week 4
  for (let i = 4; i < 8; i += 1) {
    const prev = forecast.points[i - 1];
    const curr = forecast.points[i];
    if (!prev || !curr) {
      throw new Error(`Missing forecast point around index ${i}`);
    }

    const prevSpread = prev.upperBound - prev.lowerBound;
    const currSpread = curr.upperBound - curr.lowerBound;
    if (currSpread < prevSpread) {
      throw new Error(
        `Confidence narrowed after week 4: week ${prev.weekNumber} spread=${prevSpread}, week ${curr.weekNumber} spread=${currSpread}`,
      );
    }
  }
}
