export function Footer(): React.JSX.Element {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--border-default)',
        background: 'var(--surface-primary)',
      }}
    >
      <div
        style={{
          maxWidth: '72rem',
          margin: '0 auto',
          padding: 'var(--space-6) var(--space-4)',
          color: 'var(--text-muted)',
          fontSize: '0.9375rem',
        }}
      >
        <p style={{ margin: 0 }}>Data cuaca dari BMKG. Data harga dari Panel Harga Bapanas.</p>
        <p style={{ margin: 'var(--space-2) 0 0' }}>Tanigata — demo MVP</p>
      </div>
    </footer>
  );
}
