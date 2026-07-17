import type { NextRequest } from 'next/server';
import { handleError, success } from '@/lib/api-response';
import { ValidationError } from '@/lib/errors';
import { createCropSchema } from '@/lib/schemas';
import { catalogService } from '@/modules/catalog';
import { CROP_PRESETS } from '@/modules/catalog/crop-presets';

export async function GET(_request: NextRequest) {
  try {
    const crops = await catalogService.listCrops();
    return success(crops);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const name = typeof body['name'] === 'string' ? body['name'].trim() : '';
    const identifier = toIdentifier(name);
    const preset = CROP_PRESETS[identifier as keyof typeof CROP_PRESETS];
    if (!preset) {
      throw new ValidationError('Komoditas belum didukung', [
        { field: 'name', message: 'Pilih komoditas yang tersedia' },
      ]);
    }
    const result = createCropSchema.safeParse({
      ...preset,
      slug: identifier,
      commodityKey: identifier,
    });
    if (!result.success) {
      throw new ValidationError(
        'Data komoditas tidak valid',
        result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      );
    }
    return success(await catalogService.createCrop(result.data), 201);
  } catch (error) {
    return handleError(error);
  }
}

function toIdentifier(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
