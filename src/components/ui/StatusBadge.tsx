import type { Status } from '@/types/ui';

const labels: Record<Status, string> = {
  safe: 'Aman',
  watch: 'Pantau',
  danger: 'Bahaya',
};

export function StatusBadge({ status, label }: { status: Status; label?: string }) {
  return <span className={`status-badge status-${status}`}>{label ?? labels[status]}</span>;
}
