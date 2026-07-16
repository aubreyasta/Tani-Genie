import type { ReactNode } from 'react';
import { Card } from './Card';

export function EmptyState({
  message,
  action,
}: {
  readonly message: string;
  readonly action?: ReactNode;
}) {
  return (
    <Card>
      <div style={{ display: 'grid', gap: 'var(--space-3)', justifyItems: 'start' }}>
        <span aria-hidden="true" style={{ fontSize: '2rem' }}>
          🌱
        </span>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{message}</p>
        {action}
      </div>
    </Card>
  );
}
