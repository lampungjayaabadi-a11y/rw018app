# 🏢 Aplikasi Manajemen Rukun Warga (RW 018) — `rw018app`

Aplikasi Sistem Informasi Manajemen Lingkungan dan Kependudukan Digital untuk Rukun Warga (RW 018), berbasis web modern (React + TypeScript + Vite + Tailwind CSS) dan terintegrasi langsung dengan **Google Cloud Firebase (Firestore Real-time & Authentication)**.

---

## 🚀 Fitur Utama

- **👥 Administrasi Warga & Kartu Keluarga (KK)**
  - Pencatatan data kependudukan lengkap (NIK, No KK, status keluarga, profesi, agama, golongan darah).
  - Sinkronisasi otomatis Kepala Keluarga langsung ke modul Kartu Keluarga.
  - Scanner e-KTP dengan pengenalan gambar dan auto-enhancement.
- **💰 Buku Kas & Keuangan RW Digital**
  - Transaksi Pemasukan, Pengeluaran, dan Mutasi Kas dengan nomor bukti otomatis.
  - Laporan Lengkap & Rincian Buku Kas dengan fitur ekspor Excel (.xlsx), CSV, dan Cetak / PDF.
- **🤝 Program Bantuan Sosial (Bansos) & Cadangan Bansos**
  - Pencatatan penyaluran bansos: PKH, BPNT, BLT, Beras CBP 10kg, KIS/PBI, PIP, Santunan Kas RW, Santunan Yatim/Piatu, dan **Bedah Rumah**.
  - Sistem antrean warga cadangan berhak (*waitlist*) dari data induk kependudukan.
- **🛡️ Keamanan Lingkungan & Pos Ronda**
  - Jadwal piket ronda harian untuk RT 039 s/d RT 042.
  - Absensi kehadiran ronda digital & pelaporan kejadian darurat seketika.
- **🗺️ Peta Digital & Pemantauan Wilayah**
  - Peta spasial wilayah RW 018 dan pemantauan CCTV lingkungan.
- **🔐 Multi-Level Role & Hak Akses Pengguna**
  - Super Admin (Ketua RW 018), Sekretaris, Bendahara, Ketua RT (RT 039 - RT 042), Pengurus RKM, Tim Keamanan, dan Akun Warga.
  - Matriks perizinan (*Role Permission Matrix*) fleksibel dan tersimpan di Cloud Firestore.
- **⚡ Offline-First & Realtime Cloud Sync**
  - Didukung teknologi PWA (*Progressive Web App*) dengan Service Worker untuk pengoperasian saat sinyal internet tidak stabil.
  - Sinkronisasi instan dua arah dengan Cloud Firestore begitu koneksi online terhubung.

---

## 🛠️ Persyaratan Sistem & Teknologi

- **Node.js**: v18.0.0 atau lebih baru (direkomendasikan v20.x)
- **Framework**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS
- **Database & Cloud**: Google Cloud Firestore & Firebase Auth
- **PWA**: vite-plugin-pwa

---

## 💻 Cara Menjalankan di Komputer Lokal

1. **Clone Repositori**:
   ```bash
   git clone https://github.com/<username-github-anda>/rw018app.git
   cd rw018app
   ```

2. **Instal Dependensi**:
   ```bash
   npm install
   ```

3. **Jalankan Mode Pengembangan (Dev Server)**:
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan di `http://localhost:3000`.

4. **Kompilasi untuk Produksi (Build)**:
   ```bash
   npm run build
   ```
   Hasil build siap saji akan berada di folder `dist/`.

---

## 🌐 Publikasi Otomatis ke GitHub Pages

Repositori ini sudah dilengkapi alur kerja otomatis **GitHub Actions** pada `.github/workflows/deploy.yml`.

### Langkah Mengaktifkan GitHub Pages di Repositori `rw018app`:
1. Buat repositori baru di GitHub dengan nama: **`rw018app`** (pilih visibilitas **Public**).
2. Hubungkan dan kirimkan (*push*) kode dari komputer ke repositori GitHub:
   ```bash
   git remote add origin https://github.com/<username-github-anda>/rw018app.git
   git branch -M main
   git push -u origin main
   ```
3. Buka repositori `rw018app` di GitHub, lalu masuk ke menu:
   **Settings** ➡️ **Pages** (pada bilah navigasi kiri).
4. Pada bagian **Build and deployment** ➡️ **Source**, pilih:
   👉 **GitHub Actions**
5. Alur kerja (*workflow*) `.github/workflows/deploy.yml` akan otomatis mendeteksi setiap kali Anda melakukan push ke branch `main` dan mempublikasikan aplikasi ke alamat publik:
   ```text
   https://<username-github-anda>.github.io/rw018app/
   ```

---

## 📁 Struktur Direktori

```text
rw018app/
├── .github/
│   └── workflows/
│       └── deploy.yml          # Otomasi build & deploy ke GitHub Pages
├── public/
│   ├── 404.html                # Penangan rute fallback SPA untuk GitHub Pages
│   ├── .nojekyll               # Mencegah Jekyll mengabaikan berkas berawalan _
│   ├── favicon.ico
│   ├── logo-rw-018.png
│   └── manifest.json           # Manifest PWA
├── src/
│   ├── components/             # Komponen UI modul RW
│   ├── data/                   # Data master dan inisialisasi awal
│   ├── services/
│   │   ├── auth.ts             # Manajemen akun & hak akses multi-role
│   │   ├── firebase.ts         # Inisialisasi Firebase & konektor Firestore
│   │   ├── storage.ts          # Sinkronisasi dua arah (Lokal + Cloud Firestore)
│   │   └── storageFiles.ts     # Penanganan berkas & lampiran
│   ├── types/                  # Definisi antarmuka TypeScript
│   ├── App.tsx                 # Root komponen aplikasi
│   └── main.tsx                # Titik masuk utama
├── firebase-applet-config.json # Konfigurasi klien Firebase Web
├── firestore.rules             # Aturan keamanan database Firestore
├── index.html                  # HTML entrypoint dengan PWA & SPA router script
├── package.json
├── tsconfig.json
└── vite.config.ts              # Konfigurasi Vite & PWA
```

---

## 📄 Lisensi & Hak Cipta
Hak Cipta © 2026 Pengurus Rukun Warga 018. Dikelola untuk kemaslahatan dan transparansi pelayanan warga.

## Production security / deployment

This build uses Firebase Authentication for login and no longer stores passwords in client storage or Firestore. See `FIREBASE_SETUP.md` for the required one-time Firebase account migration and named Firestore database rules deployment.

GitHub Pages is configured for the project path `/rw018app/` and deploys through `.github/workflows/deploy.yml`.
