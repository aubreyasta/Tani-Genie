import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="not-found">
      <h1>Halaman tidak ditemukan</h1>
      <p>Maaf, halaman yang Anda cari tidak tersedia.</p>
      <Link href="/" className="text-link">
        Kembali ke beranda
      </Link>
    </div>
  );
}
