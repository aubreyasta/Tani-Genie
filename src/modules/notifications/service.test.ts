import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  prisma: {
    farmer: { findUnique: vi.fn() },
    plantingCycle: { findMany: vi.fn() },
    notification: {
      findFirst: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    deliveryAttempt: { create: vi.fn(), findMany: vi.fn() },
  },
  getWeatherInsight: vi.fn(),
  getForecast: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }));
vi.mock('@/modules/insights', () => ({
  insightService: { getWeatherInsight: mocks.getWeatherInsight },
}));
vi.mock('@/modules/prices', () => ({ priceService: { getForecast: mocks.getForecast } }));

import { NotificationService } from './service';

const planting = {
  id: 'planting-1',
  crop: { name: 'Cabai Merah' },
  plot: { id: 'plot-1' },
};

const weatherInsight = {
  verdict: { status: 'watch', action: 'Pantau hujan', reason: 'Hujan tinggi', details: [] },
};

const forecast = {
  points: [{ weekNumber: 3, expectedPrice: 50_000, isBestSell: true }],
};

function notification(id: string, type: string) {
  return {
    id,
    farmerId: 'farmer-1',
    plantingId: 'planting-1',
    type,
    priority: 'medium',
    title: 'Title',
    body: 'Body',
    isRead: false,
    createdAt: new Date('2026-07-16T00:00:00.000Z'),
    readAt: null,
  };
}

describe('NotificationService.generateForFarmer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.prisma.farmer.findUnique.mockResolvedValue({ id: 'farmer-1' });
    mocks.prisma.plantingCycle.findMany.mockResolvedValue([planting]);
    mocks.getWeatherInsight.mockResolvedValue(weatherInsight);
    mocks.getForecast.mockResolvedValue(forecast);
  });

  it('creates weather and price notifications for actionable planting data', async () => {
    mocks.prisma.notification.findFirst.mockResolvedValue(null);
    mocks.prisma.notification.create
      .mockResolvedValueOnce(notification('notification-weather', 'weather'))
      .mockResolvedValueOnce(notification('notification-price', 'price'));

    const result = await new NotificationService().generateForFarmer('farmer-1');

    expect(result.map((item) => item.id)).toEqual(['notification-weather', 'notification-price']);
    expect(mocks.prisma.notification.create).toHaveBeenCalledTimes(2);
  });

  it('does not create duplicates when a recent notification already exists', async () => {
    mocks.prisma.notification.findFirst.mockResolvedValue(notification('existing', 'weather'));

    const result = await new NotificationService().generateForFarmer('farmer-1');

    expect(result).toEqual([]);
    expect(mocks.prisma.notification.create).not.toHaveBeenCalled();
  });

  it('rejects an unknown farmer before loading plantings', async () => {
    mocks.prisma.farmer.findUnique.mockResolvedValue(null);

    await expect(new NotificationService().generateForFarmer('missing')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
    expect(mocks.prisma.plantingCycle.findMany).not.toHaveBeenCalled();
  });
});
