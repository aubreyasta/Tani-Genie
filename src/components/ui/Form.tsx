'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { ApiProblem } from '@/types/ui';

interface FormProps {
  action: string;
  method?: 'POST' | 'PATCH';
  children: React.ReactNode;
  submitLabel: string;
  transform?: (data: Record<string, FormDataEntryValue>) => Record<string, unknown>;
  onSuccess?: () => void;
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
}: FormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    try {
      setLoading(true);
      setError('');
      const entries = Object.fromEntries(new FormData(form).entries());
      const response = await fetch(action, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transform(entries)),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as ApiProblem;
        const details = payload.error?.details?.map((detail) => detail.message).join('. ');
        setError(details ?? payload.error?.message ?? payload.message ?? 'Form gagal disimpan');
        return;
      }
      form.reset();
      onSuccess?.();
      router.refresh();
    } catch {
      setError('Tidak dapat terhubung ke server');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="form-grid">
      {children}
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={loading} className="button button-primary">
        {loading ? 'Menyimpan...' : submitLabel}
      </button>
    </form>
  );
}
