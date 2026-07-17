import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const catalog = vi.hoisted(() => ({ createCrop: vi.fn() }));
vi.mock('@/modules/catalog', () => ({ catalogService: catalog }));

import { POST } from './route';

const crop = {
  name: 'Cabai Rawit',
};

const expectedCrop = {
  slug: 'cabai-rawit',
  name: 'Cabai Rawit',
  commodityKey: 'cabai-rawit',
  minTempC: 20,
  maxTempC: 30,
  minHumidity: 60,
  maxHumidity: 80,
  waterNeedMm: 25,
  gddBaseC: 10,
  gddTargetC: 1485,
  pestRiskHumidity: 85,
  pestRiskTempC: 28,
};

describe('POST /api/crops', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a valid crop definition', async () => {
    catalog.createCrop.mockResolvedValue({ id: 'crop-1', ...expectedCrop });
    const request = new NextRequest('http://localhost/api/crops', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(crop),
    });

    const response = await POST(request);

    expect(response.status).toBe(201);
    expect(catalog.createCrop).toHaveBeenCalledWith(expectedCrop);
  });

  it('rejects a commodity outside the farmer-facing catalog', async () => {
    const request = new NextRequest('http://localhost/api/crops', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Jagung' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(422);
    expect(catalog.createCrop).not.toHaveBeenCalled();
  });
});
