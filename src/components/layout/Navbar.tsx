import Link from 'next/link';

const navLinks = [
  { href: '/kebunku', label: 'Kebunku' },
  { href: '/peringatan', label: 'Peringatan' },
  { href: '/harga', label: 'Harga' },
  { href: '/notifikasi', label: 'Notifikasi' },
] as const;

export function Navbar() {
  return (
    <header className="site-header">
      <nav aria-label="Navigasi utama" className="navbar">
        <Link href="/" className="brand">
          Tanigata
        </Link>
        <div className="nav-links">
          {navLinks.map((link) => (
            <Link href={{ pathname: link.href }} key={link.href} className="nav-link">
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
