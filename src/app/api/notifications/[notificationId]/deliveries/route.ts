import type { NextRequest } from 'next/server';
import { handleError, success } from '@/lib/api-response';
import { ValidationError } from '@/lib/errors';
import { deliverNotificationSchema } from '@/lib/schemas';
import { notificationService } from '@/modules/notifications';

export async function GET(
  _request: NextRequest,
  { params }: { readonly params: Promise<{ readonly notificationId: string }> },
) {
  try {
    const { notificationId } = await params;
    const deliveries = await notificationService.listDeliveries(notificationId);
    return success(deliveries);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { readonly params: Promise<{ readonly notificationId: string }> },
) {
  try {
    const { notificationId } = await params;
    const body: unknown = await request.json();
    const result = deliverNotificationSchema.safeParse(body);
    if (!result.success) {
      throw new ValidationError(
        'Data tidak valid',
        result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      );
    }

    const attempt = await notificationService.deliver(
      notificationId,
      result.data.channel,
      result.data.forceFail ?? false,
    );
    return success(attempt, 201);
  } catch (error) {
    return handleError(error);
  }
}
