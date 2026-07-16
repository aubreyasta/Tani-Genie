'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { ApiProblem } from '@/types/ui';

type Variant = 'primary' | 'secondary' | 'danger';

interface ButtonProps {
  children: React.ReactNode;
  variant?: Variant;
  endpoint?: string;
  method?: 'POST' | 'PATCH' | 'DELETE';
  body?: Record<string, unknown>;
  disabled?: boolean;
  onDone?: () => void;
  type?: 'button' | 'submit';
}

export function Button({
  children,
  variant = 'primary',
  endpoint,
  method = 'POST',
  body,
  disabled,
  onDone,
  type = 'button',
}: ButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function runAction() {
    if (!endpoint) {
      return;
    }
    try {
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
        return;
      }
      onDone?.();
      router.refresh();
    } catch {
      setError('Tidak dapat terhubung ke server');
    } finally {
      setLoading(false);
    }
  }

  return (
    <span className="button-field">
      <button
        type={type}
        disabled={disabled || loading}
        onClick={endpoint ? runAction : onDone}
        className={`button button-${variant}`}
      >
        {loading ? 'Memproses...' : children}
      </button>
      {error ? (
        <small className="form-error" role="alert">
          {error}
        </small>
      ) : null}
    </span>
  );
}
