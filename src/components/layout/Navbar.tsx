'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/', label: 'Beranda', mobileLabel: 'Beranda', icon: 'home' },
  { href: '/kebunku', label: 'Kebunku', mobileLabel: 'Kebun', icon: 'leaf' },
  { href: '/peringatan', label: 'Peringatan', mobileLabel: 'Waspada', icon: 'shield' },
  { href: '/harga', label: 'Harga', mobileLabel: 'Harga', icon: 'chart' },
  { href: '/notifikasi', label: 'Notifikasi', mobileLabel: 'Pesan', icon: 'bell' },
] as const;

function NavIcon({ name }: { name: (typeof navLinks)[number]['icon'] }) {
  const paths = {
    home: (
      <>
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M5.5 10v10h13V10M9 20v-6h6v6" />
      </>
    ),
    leaf: (
      <>
        <path d="M20 4C11 4 5 8.5 5 15c0 2.8 2.2 5 5 5 6.5 0 10-7 10-16Z" />
        <path d="M4 21c2.8-5.2 7-8.5 12-11" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 4.5 6v5.4c0 4.7 3.2 8.1 7.5 9.6 4.3-1.5 7.5-4.9 7.5-9.6V6L12 3Z" />
        <path d="M12 8v4M12 16h.01" />
      </>
    ),
    chart: (
      <>
        <path d="M4 19V9M10 19V5M16 19v-7M22 19H2" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
      </>
    ),
  };
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

export function Navbar() {
  const pathname = usePathname();
  return (
    <>
      <header className="site-header">
        <nav aria-label="Navigasi utama" className="navbar">
          <Link href="/" className="brand" aria-label="Tanigata, beranda">
            <span className="brand-mark" aria-hidden="true">
              T
            </span>
            <span>Tanigata</span>
          </Link>
          <div className="nav-context">
            <strong>Teman tani digital</strong>
            <span>Data nyata, keputusan sederhana</span>
          </div>
          <div className="nav-links">
            {navLinks.map((link) => {
              const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
              return (
                <Link
                  href={link.href}
                  key={link.href}
                  className="nav-link"
                  aria-current={active ? 'page' : undefined}
                >
                  <NavIcon name={link.icon} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </header>
      <nav className="mobile-nav" aria-label="Navigasi aplikasi">
        {navLinks.map((link) => {
          const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
          return (
            <Link
              href={link.href}
              key={link.href}
              className="mobile-nav-link"
              aria-current={active ? 'page' : undefined}
            >
              <NavIcon name={link.icon} />
              <span>{link.mobileLabel}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
