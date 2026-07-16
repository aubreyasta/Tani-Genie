'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { ApiProblem } from '@/types/ui';

interface FormProps {
  readonly action: string;
  readonly method?: 'POST' | 'PATCH';
  readonly children: React.ReactNode;
  readonly submitLabel: string;
  readonly transform?: (data: Record<string, FormDataEntryValue>) => Record<string, unknown>;
  readonly onSuccess?: () => void;
}

function defaultTransform(data: Record<string, FormDataEntryValue>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    const text = String(value);
    const numeric = Number(text);
    result[key] =
      text !== '' && Number.isFinite(numeric) && key !== 'cropId' && key !== 'plotId'
        ? numeric
        : text;
  }
  return result;
}

export function Form({
  action,
  method = 'POST',
  children,
  submitLabel,
  transform = defaultTransform,
  onSuccess,
}: FormProps): React.JSX.Element {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    const entries = Object.fromEntries(new FormData(event.currentTarget).entries());
    const response = await fetch(action, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transform(entries)),
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as ApiProblem;
      setError(payload.error?.message ?? payload.message ?? 'Form gagal disimpan');
      setLoading(false);
      return;
    }
    event.currentTarget.reset();
    onSuccess?.();
    router.refresh();
    setLoading(false);
  }

  return (
    <form onSubmit={submit} className="form-grid">
      {children}
      {error ? <p style={{ margin: 0, color: 'var(--status-danger)' }}>{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        style={{
          minHeight: 44,
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--accent-primary)',
          color: 'var(--accent-primary-contrast)',
          fontWeight: 800,
          padding: '0 var(--space-4)',
        }}
      >
        {loading ? 'Menyimpan...' : submitLabel}
      </button>
    </form>
  );
}
