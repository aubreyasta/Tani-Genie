import { headers } from 'next/headers';
import type { ApiResponse } from '@/types/api';

export async function apiGet<T>(path: string): Promise<T> {
  const headerStore = await headers();
  const host = headerStore.get('host') ?? 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const response = await fetch(`${protocol}://${host}${path}`, { cache: 'no-store' });
  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.success) {
    throw new Error(payload.success ? 'Gagal memuat data' : payload.error.message);
  }

  return payload.data;
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(value));
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  );
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value);
}

export function formatRupiah(value: number): string {
  return `Rp ${formatNumber(value)}`;
}
