export default function NotFound(): React.JSX.Element {
  return (
    <div style={{ padding: '2rem', maxWidth: '65ch' }}>
      <h1>Halaman tidak ditemukan</h1>
      <p>Maaf, halaman yang Anda cari tidak tersedia.</p>
      <a href="/" style={{ color: 'var(--accent-primary)' }}>
        Kembali ke beranda
      </a>
    </div>
  );
}
