'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { ApiProblem } from '@/types/ui';

type Variant = 'primary' | 'secondary' | 'danger';

interface ButtonProps {
  readonly children: React.ReactNode;
  readonly variant?: Variant;
  readonly endpoint?: string;
  readonly method?: 'POST' | 'PATCH' | 'DELETE';
  readonly body?: Record<string, unknown>;
  readonly disabled?: boolean;
  readonly onDone?: () => void;
  readonly type?: 'button' | 'submit';
}

const variantStyles: Record<Variant, React.CSSProperties> = {
  primary: { background: 'var(--accent-primary)', color: 'var(--accent-primary-contrast)' },
  secondary: { background: 'var(--surface-secondary)', color: 'var(--text-primary)' },
  danger: { background: 'var(--status-danger-surface)', color: 'var(--status-danger)' },
};

export function Button({
  children,
  variant = 'primary',
  endpoint,
  method = 'POST',
  body,
  disabled,
  onDone,
  type = 'button',
}: ButtonProps): React.JSX.Element {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function runAction() {
    if (!endpoint) {
      return;
    }
    setLoading(true);
    setError('');
    const init: RequestInit =
      method === 'DELETE'
        ? { method }
        : {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body ?? {}),
          };
    const response = await fetch(endpoint, init);
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as ApiProblem;
      setError(payload.error?.message ?? payload.message ?? 'Aksi gagal');
      setLoading(false);
      return;
    }
    onDone?.();
    router.refresh();
    setLoading(false);
  }

  return (
    <span style={{ display: 'inline-grid', gap: 'var(--space-1)' }}>
      <button
        type={type}
        disabled={disabled || loading}
        onClick={endpoint ? runAction : onDone}
        style={{
          minHeight: 44,
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-sm)',
          cursor: disabled || loading ? 'not-allowed' : 'pointer',
          fontWeight: 800,
          opacity: disabled || loading ? 0.65 : 1,
          padding: '0 var(--space-4)',
          ...variantStyles[variant],
        }}
      >
        {loading ? 'Memproses...' : children}
      </button>
      {error ? <small style={{ color: 'var(--status-danger)' }}>{error}</small> : null}
    </span>
  );
}
