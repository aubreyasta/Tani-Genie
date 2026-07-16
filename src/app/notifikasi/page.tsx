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

export default async function NotifikasiPage(): Promise<React.JSX.Element> {
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
      <section className="verdict-card verdict-watch">
        <p style={{ margin: 0, color: 'var(--accent-primary)', fontWeight: 800 }}>Notifikasi</p>
        <h1 style={{ margin: 'var(--space-2) 0 0', fontSize: '2rem', lineHeight: 1.1 }}>
          {notifications.filter((item) => !item.isRead).length} belum dibaca
        </h1>
        <p style={{ margin: 'var(--space-2) 0 0', color: 'var(--text-secondary)' }}>
          Buat pengingat cuaca dan harga untuk {farmer.name}.
        </p>
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
            style={{
              borderColor: notification.isRead ? 'var(--border-default)' : 'var(--accent-primary)',
            }}
          >
            <div className="stack">
              <div
                style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)' }}
              >
                <StatusBadge
                  status={priorityStatus(notification.priority)}
                  label={notification.priority.toUpperCase()}
                />
                <span style={{ color: 'var(--text-muted)' }}>
                  {notification.isRead ? 'Sudah dibaca' : 'Belum dibaca'}
                </span>
              </div>
              <div>
                <h2 style={{ margin: 0 }}>{notification.title}</h2>
                <p style={{ margin: 'var(--space-2) 0 0', color: 'var(--text-secondary)' }}>
                  {notification.body}
                </p>
                <p style={{ margin: 'var(--space-2) 0 0', color: 'var(--text-muted)' }}>
                  {formatDateTime(notification.createdAt)}
                </p>
              </div>
              <NotificationActions id={notification.id} />
              <div>
                <h3 style={{ margin: '0 0 var(--space-2)' }}>Riwayat kirim</h3>
                {itemDeliveries.length === 0 ? (
                  <p style={{ margin: 0, color: 'var(--text-muted)' }}>Belum pernah dikirim.</p>
                ) : null}
                {itemDeliveries.map((attempt) => (
                  <p
                    key={attempt.id}
                    style={{ margin: '0 0 var(--space-1)', color: 'var(--text-secondary)' }}
                  >
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
