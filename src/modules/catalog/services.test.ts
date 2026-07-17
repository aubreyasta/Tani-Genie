import { beforeEach, describe, expect, it, vi } from 'vitest';

const prisma = vi.hoisted(() => ({
  farmer: { findFirst: vi.fn(), upsert: vi.fn() },
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
        dataPoints: {},
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
        dataPoints: {},
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT', statusCode: 409 });
    expect(prisma.plantingCycle.create).not.toHaveBeenCalled();
  });

  it('uses the weather API for temperature when no source is selected', async () => {
    prisma.plantingCycle.count.mockResolvedValue(0);
    prisma.plantingCycle.create.mockImplementation(async ({ data }) => ({
      id: 'planting-1',
      status: 'active',
      ...data,
      crop: { name: 'Padi' },
    }));

    await new CatalogService().createPlanting({
      plotId: 'plot-1',
      cropId: 'crop-1',
      seedName: 'Lokal',
      targetYieldKg: 100,
      plantedAt: new Date('2026-07-16T00:00:00.000Z'),
      expectedHarvestAt: new Date('2026-09-16T00:00:00.000Z'),
      dataPoints: {},
    });

    expect(prisma.plantingCycle.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ dataPoints: { temp: 'api' } }),
      }),
    );
  });

  it('keeps an explicitly selected IoT temperature source', async () => {
    prisma.plantingCycle.count.mockResolvedValue(0);
    prisma.plantingCycle.create.mockImplementation(async ({ data }) => ({
      id: 'planting-1',
      status: 'active',
      ...data,
      crop: { name: 'Padi' },
    }));

    await new CatalogService().createPlanting({
      plotId: 'plot-1',
      cropId: 'crop-1',
      seedName: 'Lokal',
      targetYieldKg: 100,
      plantedAt: new Date('2026-07-16T00:00:00.000Z'),
      expectedHarvestAt: new Date('2026-09-16T00:00:00.000Z'),
      dataPoints: { temp: 'iot' },
    });

    expect(prisma.plantingCycle.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ dataPoints: { temp: 'iot' } }),
      }),
    );
  });
});

describe('CatalogService default farmer', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates one empty internal farmer without sample farm data', async () => {
    prisma.farmer.findFirst.mockResolvedValue(null);
    prisma.farmer.upsert.mockResolvedValue({
      id: 'default-farmer',
      name: 'Petani',
      phone: null,
    });

    const result = await new CatalogService().getDefaultFarmer();

    expect(result).toEqual({ id: 'default-farmer', name: 'Petani', phone: null });
    expect(prisma.farmer.upsert).toHaveBeenCalledWith({
      where: { id: 'default-farmer' },
      update: {},
      create: { id: 'default-farmer', name: 'Petani' },
    });
  });
});
