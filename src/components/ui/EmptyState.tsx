import type { ReactNode } from 'react';
import { Card } from './Card';

export function EmptyState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <Card>
      <div className="empty-state">
        <span aria-hidden="true" className="empty-state-icon">
          🌱
        </span>
        <p className="muted flush">{message}</p>
        {action}
      </div>
    </Card>
  );
}
