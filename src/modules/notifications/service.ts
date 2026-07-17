import { NotFoundError, ValidationError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { insightService } from '@/modules/insights';
import { priceService } from '@/modules/prices';
import type { DeliveryAttemptDto, NotificationDto } from '@/types/api';

export class NotificationService {
  async generateForFarmer(farmerId: string): Promise<ReadonlyArray<NotificationDto>> {
    const farmer = await prisma.farmer.findUnique({ where: { id: farmerId } });
    if (!farmer) {
      throw new NotFoundError('Petani', farmerId);
    }

    const plantings = await prisma.plantingCycle.findMany({
      where: { status: 'active' },
      include: { crop: true, plot: true },
    });

    const created: NotificationDto[] = [];
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    for (const planting of plantings) {
      try {
        const insight = await insightService.getWeatherInsight(planting.id);
        if (insight.verdict.status === 'danger' || insight.verdict.status === 'watch') {
          const existing = await prisma.notification.findFirst({
            where: {
              farmerId,
              plantingId: planting.id,
              type: 'weather',
              createdAt: { gte: since },
            },
          });

          if (!existing) {
            const notification = await prisma.notification.create({
              data: {
                farmerId,
                plantingId: planting.id,
                type: 'weather',
                priority: insight.verdict.status === 'danger' ? 'high' : 'medium',
                title: `Peringatan cuaca: ${planting.crop.name}`,
                body: insight.verdict.action,
              },
            });
            created.push(this.toDto(notification));
          }
        }
      } catch {
        // Demo generator should continue when one insight source is unavailable.
      }

      try {
        const forecast = await priceService.getForecast(planting.id);
        const bestSellPoints = forecast.points.filter((point) => point.isBestSell);
        if (bestSellPoints.length > 0) {
          const firstPoint = bestSellPoints[0];
          if (!firstPoint) {
            continue;
          }

          const existing = await prisma.notification.findFirst({
            where: {
              farmerId,
              plantingId: planting.id,
              type: 'price',
              createdAt: { gte: since },
            },
          });

          if (!existing) {
            const notification = await prisma.notification.create({
              data: {
                farmerId,
                plantingId: planting.id,
                type: 'price',
                priority: 'medium',
                title: `Jendela jual terbaik: ${planting.crop.name}`,
                body: `${firstPoint.targetDate}: prediksi Rp ${firstPoint.predictedPrice.toLocaleString('id-ID')}/kg dari model ML`,
              },
            });
            created.push(this.toDto(notification));
          }
        }
      } catch {
        // Notification generation continues when the external prediction service is unavailable.
      }
    }

    return created;
  }

  async listForFarmer(farmerId: string): Promise<ReadonlyArray<NotificationDto>> {
    const notifications = await prisma.notification.findMany({
      where: { farmerId },
      orderBy: { createdAt: 'desc' },
    });
    return notifications.map((notification) => this.toDto(notification));
  }

  async markAsRead(notificationId: string): Promise<NotificationDto> {
    const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
    if (!notification) {
      throw new NotFoundError('Notifikasi', notificationId);
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });
    return this.toDto(updated);
  }

  async deliver(
    notificationId: string,
    channel: 'whatsapp' | 'sms',
    forceFail = false,
  ): Promise<DeliveryAttemptDto> {
    const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
    if (!notification) {
      throw new NotFoundError('Notifikasi', notificationId);
    }

    const farmer = await prisma.farmer.findUnique({ where: { id: notification.farmerId } });
    if (!farmer?.phone) {
      throw new ValidationError('Petani tidak memiliki nomor telepon', [
        { field: 'phone', message: 'Nomor telepon wajib diisi untuk pengiriman' },
      ]);
    }

    const maskedPhone = farmer.phone.replace(/\d(?=\d{2})/g, '*');
    const payloadPreview = JSON.stringify({
      to: maskedPhone,
      channel,
      title: notification.title,
      body: notification.body,
    });

    const now = new Date();
    if (forceFail) {
      const attempt = await prisma.deliveryAttempt.create({
        data: {
          notificationId,
          channel,
          status: 'failed',
          payloadPreview,
          attemptedAt: now,
          errorMessage: 'Demo: gagal kirim (forceFail=true)',
        },
      });
      return this.toDeliveryDto(attempt);
    }

    const attempt = await prisma.deliveryAttempt.create({
      data: {
        notificationId,
        channel,
        status: 'sent',
        payloadPreview,
        attemptedAt: now,
        deliveredAt: now,
      },
    });
    return this.toDeliveryDto(attempt);
  }

  async listDeliveries(notificationId: string): Promise<ReadonlyArray<DeliveryAttemptDto>> {
    const deliveries = await prisma.deliveryAttempt.findMany({
      where: { notificationId },
      orderBy: { attemptedAt: 'desc' },
    });
    return deliveries.map((delivery) => this.toDeliveryDto(delivery));
  }

  private toDto(notification: {
    readonly id: string;
    readonly farmerId: string;
    readonly plantingId: string | null;
    readonly type: string;
    readonly priority: string;
    readonly title: string;
    readonly body: string;
    readonly isRead: boolean;
    readonly createdAt: Date;
    readonly readAt: Date | null;
  }): NotificationDto {
    return {
      id: notification.id,
      farmerId: notification.farmerId,
      plantingId: notification.plantingId,
      type: notification.type,
      priority: notification.priority as 'low' | 'medium' | 'high',
      title: notification.title,
      body: notification.body,
      isRead: notification.isRead,
      createdAt: notification.createdAt.toISOString(),
      readAt: notification.readAt?.toISOString() ?? null,
    };
  }

  private toDeliveryDto(delivery: {
    readonly id: string;
    readonly notificationId: string;
    readonly channel: string;
    readonly status: string;
    readonly payloadPreview: string;
    readonly attemptedAt: Date;
    readonly deliveredAt: Date | null;
    readonly errorMessage: string | null;
  }): DeliveryAttemptDto {
    return {
      id: delivery.id,
      notificationId: delivery.notificationId,
      channel: delivery.channel as 'whatsapp' | 'sms',
      status: delivery.status as 'queued' | 'sent' | 'failed',
      payloadPreview: delivery.payloadPreview,
      attemptedAt: delivery.attemptedAt.toISOString(),
      deliveredAt: delivery.deliveredAt?.toISOString() ?? null,
      errorMessage: delivery.errorMessage,
    };
  }
}

export const notificationService = new NotificationService();
