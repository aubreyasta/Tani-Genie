import Link from 'next/link';

const navLinks = [
  { href: '/kebunku', label: 'Kebunku' },
  { href: '/peringatan', label: 'Peringatan' },
  { href: '/harga', label: 'Harga' },
  { href: '/notifikasi', label: 'Notifikasi' },
] as const;

export function Navbar(): React.JSX.Element {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        borderBottom: '1px solid var(--border-default)',
        background: 'var(--surface-primary)',
      }}
    >
      <nav
        aria-label="Navigasi utama"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          maxWidth: '72rem',
          margin: '0 auto',
          padding: 'var(--space-3) var(--space-4)',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <Link
          href="/"
          style={{
            minHeight: 44,
            display: 'inline-flex',
            alignItems: 'center',
            flex: '0 0 auto',
            padding: '0 var(--space-2)',
            color: 'var(--accent-primary)',
            fontSize: '1.125rem',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            textDecoration: 'none',
          }}
        >
          Tanigata
        </Link>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            flex: '0 0 auto',
          }}
        >
          {navLinks.map((link) => (
            <Link
              href={{ pathname: link.href }}
              key={link.href}
              style={{
                minHeight: 44,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 var(--space-3)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '999px',
                color: 'var(--text-secondary)',
                fontSize: '0.9375rem',
                fontWeight: 700,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
