import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const catalog = vi.hoisted(() => ({
  getDefaultFarmer: vi.fn(),
  listPlots: vi.fn(),
  createPlot: vi.fn(),
}));

vi.mock('@/modules/catalog', () => ({ catalogService: catalog }));

import { GET, POST } from './route';

describe('/api/plots', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    catalog.getDefaultFarmer.mockResolvedValue({ id: '11111111-1111-4111-8111-111111111111' });
  });

  it('lists plots for the default farmer', async () => {
    catalog.listPlots.mockResolvedValue([{ id: 'plot-1', name: 'Utara' }]);

    const response = await GET(new NextRequest('http://localhost/api/plots'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: [{ id: 'plot-1', name: 'Utara' }],
    });
    expect(catalog.listPlots).toHaveBeenCalledWith('11111111-1111-4111-8111-111111111111');
  });

  it('returns field details and does not write an invalid payload', async () => {
    const request = new NextRequest('http://localhost/api/plots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '', areaM2: 0, latitude: -6.2, longitude: 106.8 }),
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(422);
    expect(payload).toMatchObject({ success: false, error: { code: 'VALIDATION_ERROR' } });
    expect(payload.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'name' }),
        expect.objectContaining({ field: 'areaM2' }),
      ]),
    );
    expect(catalog.createPlot).not.toHaveBeenCalled();
  });
});
