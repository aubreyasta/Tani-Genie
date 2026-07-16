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

export default async function HomePage() {
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
        <p className="eyebrow">Tanigata</p>
        <h1 className="home-title">Selamat datang, {farmer.name}</h1>
        <p className="home-copy">
          {topWeather
            ? topWeather.verdict.reason
            : 'Tambahkan tanaman agar Tanigata bisa memberi keputusan hari ini.'}
        </p>
      </section>

      <section className="dashboard-grid" aria-label="Ringkasan dashboard">
        <Card>
          <strong>{activePlantings.length}</strong>
          <p className="muted flush">Tanaman aktif</p>
        </Card>
        <Card>
          {topWeather ? (
            <StatusBadge status={topWeather.verdict.status} />
          ) : (
            <StatusBadge status="safe" label="Kosong" />
          )}
          <p className="hero-copy">Status cuaca tertinggi</p>
        </Card>
        <Card>
          <strong>
            {bestPrice
              ? `${formatRupiah(bestPrice.expectedPrice)} · minggu ${bestPrice.weekNumber}`
              : 'Belum ada'}
          </strong>
          <p className="muted flush">Jendela harga terbaik</p>
        </Card>
        <Card>
          <strong>{notifications.filter((item) => !item.isRead).length}</strong>
          <p className="muted flush">Notifikasi belum dibaca</p>
        </Card>
      </section>

      <section className="dashboard-grid" aria-label="Fitur Tanigata">
        {featureCards.map((card) => (
          <Link key={card.href} href={card.href} className="feature-link">
            <strong>{card.title}</strong>
            <span>{card.description}</span>
          </Link>
        ))}
      </section>

      <Card>
        <h2 className="flush">Aksi Cepat</h2>
        <p className="quick-copy">
          {topNotification
            ? `${topNotification.title}: ${topNotification.body}`
            : (topWeather?.verdict.action ?? 'Semua tenang. Cek Kebunku untuk mulai.')}
        </p>
        <Link href={topNotification ? '/notifikasi' : '/peringatan'} className="quick-link">
          Buka sekarang
        </Link>
      </Card>
    </div>
  );
}
