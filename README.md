# Tanigata — Teman Tani Indonesia

Pendamping keputusan iklim dan harga untuk petani kecil Indonesia. MVP dengan data dummy deterministik, PostgreSQL/Prisma, dan dashboard mobile-first Bahasa Indonesia.

## Prasyarat

- Node.js 24+
- pnpm (aktifkan via `corepack enable pnpm`)
- PostgreSQL (Railway atau lokal)

## Setup

### 1. Clone dan install

```bash
pnpm install
```

### 2. Konfigurasi environment

Salin `.env.example` ke `.env` dan isi `DATABASE_URL`:

```bash
cp .env.example .env
# Edit .env dengan URL PostgreSQL Anda
```

### 3. Setup database

```bash
pnpm db:generate    # Generate Prisma Client
pnpm db:push        # Sinkronkan schema ke database
pnpm db:seed        # Isi data demo (1 petani, 2 komoditas, 2 lahan, 2 tanaman)
```

### 4. Jalankan aplikasi

```bash
pnpm dev            # Mode pengembangan
# atau
pnpm build && pnpm start  # Mode produksi
```

Buka http://localhost:3000

## Data Demo

Aplikasi menggunakan data dummy deterministik:

- **Komoditas**: Cabai Merah, Bawang Merah
- **Lahan**: 2 plot (Kebun Cabai, Lahan Bawang)
- **Cuaca**: Fixture berbasis koordinat (bukan data BMKG langsung)
- **Harga**: Rp 45.000/kg (cabai), Rp 28.000/kg (bawang)
- **Pengiriman**: Mock WhatsApp/SMS (tidak mengirim pesan nyata)

## Fitur MVP

1. **Kebunku** (/kebunku) — Manajemen lahan dan tanaman
2. **Peringatan** (/peringatan) — Verdict cuaca dan hama per tanaman
3. **Harga** (/harga) — Prakiraan harga 8 minggu dengan jendela jual terbaik
4. **Notifikasi** (/notifikasi) — Notifikasi + pengiriman mock WhatsApp/SMS

Kebunku juga dapat menyimpan sumber data point per tanaman (`api` atau `iot`) dan menampilkan
hasil dari service planting calendar serta price prediction bila kedua service Python aktif.

## Service Integrasi

Jalankan service Python di terminal terpisah:

```bash
# Price prediction
cd tani-genie-price-prediction
uvicorn api.main:app --port 8000

# Planting calendar
cd tani-genie-planting-calendar/backend
uvicorn app.main:app --port 8001
```

Atur URL service di `.env`:

```bash
PRICE_PREDICTION_API_URL=http://localhost:8000
PLANTING_CALENDAR_API_URL=http://localhost:8001
PRICE_PREDICTION_MARKET=pasar_tradisional
PRICE_PREDICTION_PROVINCE="DI Yogyakarta"
```

Jika service Python tidak aktif, CRUD tanaman tetap berjalan dan hasil integrasi ditampilkan sebagai
belum tersedia.

## API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | /api/health | Status aplikasi + database |
| GET | /api/crops | Daftar komoditas |
| POST | /api/crops | Tambah definisi komoditas |
| GET | /api/plots | Daftar lahan |
| POST | /api/plots | Tambah lahan |
| GET | /api/plots/[id] | Detail lahan |
| PATCH | /api/plots/[id] | Ubah lahan |
| DELETE | /api/plots/[id] | Hapus lahan |
| GET | /api/plantings | Daftar tanaman (?plotId=) |
| POST | /api/plantings | Tambah tanaman |
| GET | /api/plantings/[id]/integrations | Kalender tanam + prediksi harga eksternal |
| GET | /api/insights/weather | Verdict cuaca (?plantingId=) |
| POST | /api/insights/weather/refresh | Segarkan data cuaca |
| GET | /api/forecasts/prices | Prakiraan harga (?plantingId=) |
| POST | /api/forecasts/prices/refresh | Segarkan prakiraan |
| GET | /api/notifications | Daftar notifikasi |
| POST | /api/notifications/generate | Buat notifikasi |
| PATCH | /api/notifications/[id]/read | Tandai dibaca |
| GET | /api/notifications/[id]/deliveries | Riwayat pengiriman |
| POST | /api/notifications/[id]/deliveries | Kirim (body: {channel, forceFail?}) |

## Testing

```bash
pnpm typecheck        # TypeScript strict check
pnpm lint             # Biome lint + format
pnpm test             # Unit dan route tests (Vitest)
pnpm build            # Production build
```

## Stack Teknologi

- Next.js 16 (App Router, Turbopack)
- TypeScript 5 (strict mode)
- Prisma 7 + PostgreSQL
- Tailwind CSS 4
- Biome (linter + formatter)
- Vitest

## Atribusi Data

- Data cuaca: BMKG (badge ditampilkan di UI)
- Data harga: Panel Harga Bapanas
- Semua data dalam aplikasi ini adalah **dummy demo**, bukan data real-time.
