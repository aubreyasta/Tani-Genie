import { handleError, success } from '@/lib/api-response';
import { catalogService } from '@/modules/catalog';
import { notificationService } from '@/modules/notifications';

export async function GET() {
  try {
    const farmer = await catalogService.getDefaultFarmer();
    const notifications = await notificationService.listForFarmer(farmer.id);
    return success(notifications);
  } catch (error) {
    return handleError(error);
  }
}
