'use client';

export function RetryButton(): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      style={{
        minHeight: 44,
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--surface-secondary)',
        color: 'var(--text-primary)',
        padding: '0 var(--space-4)',
        fontWeight: 800,
      }}
    >
      Coba lagi
    </button>
  );
}
