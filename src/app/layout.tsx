import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { OfflineBanner } from '@/components/layout/OfflineBanner';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tanigata — Teman Tani Indonesia',
  description: 'Pendamping keputusan iklim dan harga untuk petani kecil Indonesia.',
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export default function RootLayout({
  children,
}: {
  readonly children: ReactNode;
}): React.JSX.Element {
  return (
    <html lang="id">
      <body>
        <a href="#main-content" className="skip-link">
          Lewati ke konten utama
        </a>
        <OfflineBanner />
        <Navbar />
        <main id="main-content">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
