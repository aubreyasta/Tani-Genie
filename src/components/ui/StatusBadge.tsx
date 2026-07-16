import type { Status } from '@/types/ui';

const labels: Record<Status, string> = {
  safe: 'Aman',
  watch: 'Pantau',
  danger: 'Bahaya',
};

export function StatusBadge({
  status,
  label,
}: {
  readonly status: Status;
  readonly label?: string;
}) {
  const color = `var(--status-${status === 'watch' ? 'warning' : status === 'safe' ? 'success' : 'danger'})`;
  const surface = `var(--status-${status === 'watch' ? 'warning' : status === 'safe' ? 'success' : 'danger'}-surface)`;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        minHeight: 28,
        border: '1px solid currentColor',
        borderRadius: '999px',
        background: surface,
        color,
        padding: '0 var(--space-2)',
        fontSize: '0.8125rem',
        fontWeight: 800,
      }}
    >
      {label ?? labels[status]}
    </span>
  );
}
