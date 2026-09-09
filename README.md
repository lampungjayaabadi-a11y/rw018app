# Aplikasi Administrasi RW 018

Aplikasi PWA administrasi RW 018 Kampung Banten, Kelurahan Iringmulyo, Kecamatan Metro Timur, Kota Metro.

## Target publikasi

- Website publik: `https://lampungjayaabadi-a11y.github.io/rw018app/`
- Warga tidak membutuhkan akun GitHub atau akun developer untuk membuka website.
- PWA dapat dipasang dari Chrome setelah website berhasil dipublikasikan melalui HTTPS.
- Data aplikasi menggunakan Firebase/Cloud Firestore.

## Publikasi GitHub Pages

1. Upload seluruh isi repository ke branch `main`.
2. Buka **Settings → Pages**.
3. Pada **Build and deployment**, pilih **GitHub Actions**.
4. Push perubahan dan tunggu workflow **Deploy to GitHub Pages** selesai.
5. Buka URL project Pages di atas.

Workflow sudah menggunakan base `/rw018app/` agar asset Vite, manifest, dan service worker tidak mencari file dari root domain.

## Penting: keamanan database

File `firestore.rules` pada paket awal masih memberikan akses publik yang terlalu longgar pada beberapa koleksi. **Jangan menganggap login UI sebagai keamanan database.** Firebase Security Rules harus membatasi operasi berdasarkan Firebase Authentication/otorisasi server.

Data seperti NIK, KK, alamat, nomor HP, bansos, kas, dan iuran tidak boleh dibuka untuk publik tanpa kontrol akses yang benar.

## Penggunaan

```bash
npm install
npm run dev
```

Build produksi:

```bash
npm run build
```
