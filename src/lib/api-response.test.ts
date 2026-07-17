import { describe, expect, it, vi } from 'vitest';
import { handleError, success } from './api-response';
import { NotFoundError, ServiceUnavailableError, ValidationError } from './errors';

describe('API responses', () => {
  it('wraps successful data in the shared response envelope', async () => {
    const response = success({ id: 'plot-1' }, 201);

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ success: true, data: { id: 'plot-1' } });
  });

  it('preserves field errors for validation failures', async () => {
    const response = handleError(
      new ValidationError('Data tidak valid', [{ field: 'name', message: 'Nama wajib diisi' }]),
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        details: [{ field: 'name', message: 'Nama wajib diisi' }],
      },
    });
  });

  it('maps domain errors without exposing internals', async () => {
    const response = handleError(new NotFoundError('Lahan', 'plot-1'));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: { code: 'NOT_FOUND' },
    });
  });

  it('returns 503 for unavailable upstream services without logging internals', async () => {
    const response = handleError(new ServiceUnavailableError('Model harga sedang tidak tersedia'));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: { code: 'SERVICE_UNAVAILABLE', message: 'Model harga sedang tidak tersedia' },
    });
  });

  it('logs unknown errors and returns a generic 500 response', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const response = handleError(new Error('database password leaked here'));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Terjadi kesalahan internal' },
    });
    expect(log).toHaveBeenCalledOnce();
    log.mockRestore();
  });
});
