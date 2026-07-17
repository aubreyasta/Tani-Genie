import { NotificationActions } from '@/components/features/NotificationActions';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { apiGet, formatDateTime } from '@/lib/ui-data';
import { catalogService } from '@/modules/catalog';
import type { DeliveryAttemptDto, NotificationDto } from '@/types/api';

function priorityStatus(priority: NotificationDto['priority']) {
  if (priority === 'high') {
    return 'danger' as const;
  }
  if (priority === 'medium') {
    return 'watch' as const;
  }
  return 'safe' as const;
}

export default async function NotifikasiPage() {
  const farmer = await catalogService.getDefaultFarmer();
  const notifications = await apiGet<ReadonlyArray<NotificationDto>>('/api/notifications');
  const deliveries = await Promise.all(
    notifications.map(async (notification) => ({
      id: notification.id,
      attempts: await apiGet<ReadonlyArray<DeliveryAttemptDto>>(
        `/api/notifications/${notification.id}/deliveries`,
      ),
    })),
  );

  return (
    <div className="page-shell stack">
      <section className="verdict-card hero-verdict verdict-watch">
        <p className="eyebrow">Notifikasi</p>
        <h1 className="hero-title">
          {notifications.filter((item) => !item.isRead).length} belum dibaca
        </h1>
        <p className="hero-copy">Buat pengingat cuaca dan harga untuk {farmer.name}.</p>
      </section>

      <Button endpoint="/api/notifications/generate" body={{ farmerId: farmer.id }}>
        Buat Notifikasi
      </Button>

      {notifications.length === 0 ? (
        <EmptyState message="Belum ada notifikasi. Tekan tombol buat notifikasi dulu." />
      ) : null}

      {notifications.map((notification) => {
        const itemDeliveries =
          deliveries.find((item) => item.id === notification.id)?.attempts ?? [];
        return (
          <Card
            key={notification.id}
            className={`notification-card ${notification.isRead ? '' : 'card-unread'}`}
          >
            <div className="stack">
              <div className="row-between">
                <StatusBadge
                  status={priorityStatus(notification.priority)}
                  label={notification.priority.toUpperCase()}
                />
                <span className="subtle">
                  {notification.isRead ? 'Sudah dibaca' : 'Belum dibaca'}
                </span>
              </div>
              <div>
                <h2 className="flush">{notification.title}</h2>
                <p className="muted meta-block">{notification.body}</p>
                <p className="subtle meta-block">{formatDateTime(notification.createdAt)}</p>
              </div>
              <NotificationActions id={notification.id} />
              <div>
                <h3 className="history-title">Riwayat kirim</h3>
                {itemDeliveries.length === 0 ? (
                  <p className="subtle flush">Belum pernah dikirim.</p>
                ) : null}
                {itemDeliveries.map((attempt) => (
                  <p key={attempt.id} className="delivery-row">
                    {attempt.channel.toUpperCase()} · {attempt.status} ·{' '}
                    {formatDateTime(attempt.attemptedAt)}{' '}
                    {attempt.errorMessage ? `· ${attempt.errorMessage}` : ''}
                  </p>
                ))}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
