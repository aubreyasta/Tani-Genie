export function BmkgAttribution(): React.JSX.Element {
  return (
    <aside
      aria-label="Sumber data BMKG"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        minHeight: 32,
        padding: '0 var(--space-3)',
        border: '1px solid var(--border-default)',
        borderRadius: '999px',
        background: 'var(--surface-attribution)',
        color: 'var(--text-secondary)',
        fontSize: '0.8125rem',
        fontWeight: 700,
      }}
    >
      Data: BMKG
    </aside>
  );
}
