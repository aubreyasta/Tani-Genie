import { beforeEach, describe, expect, it, vi } from 'vitest';

const prisma = vi.hoisted(() => ({
  plot: { create: vi.fn() },
  plantingCycle: { create: vi.fn(), count: vi.fn() },
}));

vi.mock('@/lib/prisma', () => ({ prisma }));

import { CatalogService } from './services';

describe('CatalogService validation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects a plot whose area is not positive before writing it', async () => {
    const service = new CatalogService();

    await expect(
      service.createPlot({
        farmerId: 'farmer-1',
        name: 'Utara',
        areaM2: 0,
        latitude: -6.2,
        longitude: 106.8,
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', statusCode: 422 });
    expect(prisma.plot.create).not.toHaveBeenCalled();
  });

  it('rejects a planting whose harvest date is not after its planting date', async () => {
    const service = new CatalogService();
    const plantedAt = new Date('2026-07-16T00:00:00.000Z');

    await expect(
      service.createPlanting({
        plotId: 'plot-1',
        cropId: 'crop-1',
        seedName: 'Lokal',
        targetYieldKg: 100,
        plantedAt,
        expectedHarvestAt: plantedAt,
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', statusCode: 422 });
    expect(prisma.plantingCycle.count).not.toHaveBeenCalled();
    expect(prisma.plantingCycle.create).not.toHaveBeenCalled();
  });

  it('rejects a second active planting on the same plot', async () => {
    prisma.plantingCycle.count.mockResolvedValue(1);
    const service = new CatalogService();

    await expect(
      service.createPlanting({
        plotId: 'plot-1',
        cropId: 'crop-1',
        seedName: 'Lokal',
        targetYieldKg: 100,
        plantedAt: new Date('2026-07-16T00:00:00.000Z'),
        expectedHarvestAt: new Date('2026-09-16T00:00:00.000Z'),
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT', statusCode: 409 });
    expect(prisma.plantingCycle.create).not.toHaveBeenCalled();
  });
});
