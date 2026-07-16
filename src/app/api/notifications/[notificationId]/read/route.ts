import type { NextRequest } from 'next/server';
import { handleError, success } from '@/lib/api-response';
import { notificationService } from '@/modules/notifications';

export async function PATCH(
  _request: NextRequest,
  { params }: { readonly params: Promise<{ readonly notificationId: string }> },
) {
  try {
    const { notificationId } = await params;
    const notification = await notificationService.markAsRead(notificationId);
    return success(notification);
  } catch (error) {
    return handleError(error);
  }
}
