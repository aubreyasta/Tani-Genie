import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { apiGet, formatRupiah } from '@/lib/ui-data';
import { catalogService } from '@/modules/catalog';
import type { NotificationDto, PlantingDto, PriceForecastDto } from '@/types/api';
import type { WeatherInsightDto } from '@/types/ui';

const featureCards = [
  { href: '/kebunku', title: 'Kebunku', description: 'Kelola lahan dan tanaman aktif.' },
  { href: '/peringatan', title: 'Peringatan', description: 'Cek risiko cuaca dan hama.' },
  { href: '/harga', title: 'Harga', description: 'Lihat jendela jual terbaik.' },
  { href: '/notifikasi', title: 'Notifikasi', description: 'Kirim pengingat ke WhatsApp/SMS.' },
] as const;

function priority(status: 'safe' | 'watch' | 'danger'): number {
  return status === 'danger' ? 3 : status === 'watch' ? 2 : 1;
}

export default async function HomePage(): Promise<React.JSX.Element> {
  const farmer = await catalogService.getDefaultFarmer();
  const [plantings, notifications] = await Promise.all([
    apiGet<ReadonlyArray<PlantingDto>>('/api/plantings'),
    apiGet<ReadonlyArray<NotificationDto>>('/api/notifications'),
  ]);
  const activePlantings = plantings.filter((planting) => planting.status === 'active');
  const weather = await Promise.all(
    activePlantings.map((planting) =>
      apiGet<WeatherInsightDto>(`/api/insights/weather?plantingId=${planting.id}`),
    ),
  );
  const prices = await Promise.all(
    activePlantings.map((planting) =>
      apiGet<PriceForecastDto>(`/api/forecasts/prices?plantingId=${planting.id}`),
    ),
  );
  const topWeather = weather.sort(
    (a, b) => priority(b.verdict.status) - priority(a.verdict.status),
  )[0];
  const bestPrice = prices
    .flatMap((forecast) => forecast.points.filter((point) => point.isBestSell))
    .sort((a, b) => a.weekNumber - b.weekNumber)[0];
  const topNotification =
    notifications.find((notification) => !notification.isRead) ?? notifications[0];

  return (
    <div className="page-shell stack">
      <section className={`verdict-card verdict-${topWeather?.verdict.status ?? 'safe'}`}>
        <p style={{ margin: 0, color: 'var(--accent-primary)', fontWeight: 800 }}>Tanigata</p>
        <h1
          style={{
            margin: 'var(--space-2) 0 0',
            fontSize: 'clamp(2rem, 8vw, 4rem)',
            lineHeight: 1,
          }}
        >
          Selamat datang, {farmer.name}
        </h1>
        <p
          style={{
            margin: 'var(--space-3) 0 0',
            color: 'var(--text-secondary)',
            fontSize: '1.125rem',
          }}
        >
          {topWeather
            ? topWeather.verdict.reason
            : 'Tambahkan tanaman agar Tanigata bisa memberi keputusan hari ini.'}
        </p>
      </section>

      <section className="dashboard-grid" aria-label="Ringkasan dashboard">
        <Card>
          <strong>{activePlantings.length}</strong>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Tanaman aktif</p>
        </Card>
        <Card>
          {topWeather ? (
            <StatusBadge status={topWeather.verdict.status} />
          ) : (
            <StatusBadge status="safe" label="Kosong" />
          )}
          <p style={{ margin: 'var(--space-2) 0 0', color: 'var(--text-secondary)' }}>
            Status cuaca tertinggi
          </p>
        </Card>
        <Card>
          <strong>
            {bestPrice
              ? `${formatRupiah(bestPrice.expectedPrice)} · minggu ${bestPrice.weekNumber}`
              : 'Belum ada'}
          </strong>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Jendela harga terbaik</p>
        </Card>
        <Card>
          <strong>{notifications.filter((item) => !item.isRead).length}</strong>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Notifikasi belum dibaca</p>
        </Card>
      </section>

      <section className="dashboard-grid" aria-label="Fitur Tanigata">
        {featureCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            style={{
              minHeight: 132,
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--surface-primary)',
              color: 'var(--text-primary)',
              display: 'grid',
              alignContent: 'space-between',
              padding: 'var(--space-4)',
              textDecoration: 'none',
            }}
          >
            <strong style={{ fontSize: '1.25rem' }}>{card.title}</strong>
            <span style={{ color: 'var(--text-secondary)' }}>{card.description}</span>
          </Link>
        ))}
      </section>

      <Card>
        <h2 style={{ margin: 0 }}>Aksi Cepat</h2>
        <p style={{ margin: 'var(--space-2) 0', color: 'var(--text-secondary)' }}>
          {topNotification
            ? `${topNotification.title}: ${topNotification.body}`
            : (topWeather?.verdict.action ?? 'Semua tenang. Cek Kebunku untuk mulai.')}
        </p>
        <Link
          href={topNotification ? '/notifikasi' : '/peringatan'}
          style={{
            minHeight: 44,
            display: 'inline-flex',
            alignItems: 'center',
            color: 'var(--accent-primary)',
            fontWeight: 800,
          }}
        >
          Buka sekarang
        </Link>
      </Card>
    </div>
  );
}
