import type { NextRequest } from 'next/server';
import { handleError, success } from '@/lib/api-response';
import { ValidationError } from '@/lib/errors';
import { generateNotificationSchema } from '@/lib/schemas';
import { catalogService } from '@/modules/catalog';
import { notificationService } from '@/modules/notifications';

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json().catch(() => ({}));
    const result = generateNotificationSchema.partial().safeParse(body);
    if (!result.success) {
      throw new ValidationError(
        'Data tidak valid',
        result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      );
    }

    const farmer = result.data.farmerId
      ? { id: result.data.farmerId }
      : await catalogService.getDefaultFarmer();
    const created = await notificationService.generateForFarmer(farmer.id);
    return success(created, 201);
  } catch (error) {
    return handleError(error);
  }
}
