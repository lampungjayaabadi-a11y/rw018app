import { UserRole } from '../types';

export interface HakAksesRoleConfig {
  number: number;
  role: UserRole;
  code: string;
  name: string;
  alias: string;
  badge: string;
  badgeColor: string;
  desc: string;
}

export const HAK_AKSES_ROLES: HakAksesRoleConfig[] = [
  {
    number: 1,
    role: 'super_admin',
    code: 'SA',
    name: 'Super Admin / SA',
    alias: 'Super Admin',
    badge: 'Tingkat Tertinggi (SA)',
    badgeColor: 'bg-amber-500 text-slate-950 font-black',
    desc: 'Pemegang wewenang tertinggi sistem RW 018. Satu-satunya user yang dapat membuka dan mengatur Hak Akses Level User serta Pengaturan Sistem.',
  },
  {
    number: 2,
    role: 'ketua_rw',
    code: 'RW',
    name: 'Ketua RW',
    alias: 'Ketua RW',
    badge: 'Pimpinan Wilayah RW',
    badgeColor: 'bg-emerald-700 text-white font-bold',
    desc: 'Pimpinan eksekutif tertinggi RW 018. Akses penuh kependudukan, pengumuman, persuratan, dan monitoring seluruh bidang.',
  },
  {
    number: 3,
    role: 'sekretaris',
    code: 'SEK',
    name: 'Sekretaris RW / SEK',
    alias: 'Sekretaris RW',
    badge: 'Administrasi & Surat',
    badgeColor: 'bg-blue-700 text-white font-bold',
    desc: 'Pengelola administrasi persuratan resmi, pengumuman, notulensi kegiatan, dan verifikasi kependudukan.',
  },
  {
    number: 4,
    role: 'bendahara',
    code: 'BEN',
    name: 'Bendahara RW / BEN',
    alias: 'Bendahara RW',
    badge: 'Keuangan & Kas',
    badgeColor: 'bg-teal-700 text-white font-bold',
    desc: 'Pengelola buku kas keuangan RW, penerimaan iuran bulanan RT, laporan keuangan, dan PBB.',
  },
  {
    number: 5,
    role: 'ketua_rt',
    code: 'RT',
    name: 'Ketua RT / RT',
    alias: 'Ketua RT (039-042)',
    badge: 'Wilayah RT Setempat',
    badgeColor: 'bg-purple-700 text-white font-bold',
    desc: 'Ketua RT 039 s.d. RT 042. Memiliki wewenang terbatas khusus pada cakupan data dan warga di lingkungan RT-nya.',
  },
  {
    number: 6,
    role: 'keamanan',
    code: 'KAM',
    name: 'Petugas Keamanan / KAM',
    alias: 'Kamtibmas / Hansip',
    badge: 'Ketertiban & Ronda',
    badgeColor: 'bg-slate-800 text-cyan-300 font-bold',
    desc: 'Petugas keamanan lingkungan & koordinator ronda siskamling, pemantau CCTV, dan penanganan laporan kejadian.',
  },
  {
    number: 7,
    role: 'rkm',
    code: 'RKM',
    name: 'Petugas RKM / RKM',
    alias: 'Pengurus RKM & DKM',
    badge: 'Sosial & Kematian',
    badgeColor: 'bg-rose-700 text-white font-bold',
    desc: 'Pengurus Rukun Kematian Masyarakat (RKM): pencatatan iuran kematian, santunan duka cita, dan perlengkapan jenazah.',
  },
  {
    number: 8,
    role: 'warga',
    code: 'WARGA',
    name: 'Warga / WARGA',
    alias: 'Warga Masyarakat',
    badge: 'Layanan Mandiri',
    badgeColor: 'bg-slate-600 text-white font-bold',
    desc: 'Warga masyarakat RW 018: layanan surat pengantar mandiri, penyampaian aspirasi/laporan, dan cek status iuran pribadi.',
  },
];

export type AccessStatus =
  | 'full' // ✅ Akses penuh
  | 'view_only' // 👁️ Lihat saja
  | 'edit_limited' // ✏️ Input/Edit terbatas
  | 'none' // ❌ Tidak ada akses
  | 'rt_only' // RT (hanya data RT sendiri)
  | 'self_only' // Sendiri (hanya data milik akun sendiri)
  | 'self_request' // Sendiri* (warga dapat mengajukan perubahan)
  | 'create_only' // Buat (hanya buat laporan)
  | 'status_only' // Status (lihat status)
  | 'report_only' // Lapor (lapor data)
  | 'edit_rt' // ✏️ RT (input/edit data RT)
  | 'edit_rkm' // ✏️ RKM (input/edit RKM)
  | 'view_rt' // 👁️ RT (lihat data RT)
  | 'view_rkm'; // 👁️ RKM (lihat data RKM)

export interface HakAksesItem {
  id: string;
  name: string;
  category: 'Utama' | 'Kependudukan' | 'Persuratan' | 'Keuangan' | 'Keamanan' | 'RKM (Kematian)' | 'Sistem & User';
  desc: string;
  access: Record<UserRole | 'super_admin' | 'ketua_rw' | 'rkm', AccessStatus>;
}

export const HAK_AKSES_CHECKLIST: HakAksesItem[] = [
  // 1. Dashboard
  {
    id: 'dashboard',
    name: 'Dashboard',
    category: 'Utama',
    desc: 'Tampilan ringkasan statistik kependudukan, grafik, dan informasi utama RW 018',
    access: {
      super_admin: 'full',
      admin_rw: 'full',
      ketua_rw: 'full',
      sekretaris: 'full',
      bendahara: 'full',
      ketua_rt: 'full',
      keamanan: 'full',
      rkm: 'full',
      pengurus_rkm: 'full',
      pengurus_dkm: 'full',
      warga: 'full',
    },
  },

  // 2. Data Warga
  {
    id: 'data_warga',
    name: 'Data Warga',
    category: 'Kependudukan',
    desc: 'Melihat dan menelusuri data induk kependudukan warga',
    access: {
      super_admin: 'full',
      admin_rw: 'full',
      ketua_rw: 'full',
      sekretaris: 'edit_limited',
      bendahara: 'view_only',
      ketua_rt: 'rt_only',
      keamanan: 'view_only',
      rkm: 'view_only',
      pengurus_rkm: 'view_only',
      pengurus_dkm: 'view_only',
      warga: 'self_only',
    },
  },

  // 3. Tambah Warga
  {
    id: 'tambah_warga',
    name: 'Tambah Warga',
    category: 'Kependudukan',
    desc: 'Menambahkan data penduduk baru ke sistem database',
    access: {
      super_admin: 'full',
      admin_rw: 'full',
      ketua_rw: 'full',
      sekretaris: 'edit_limited',
      bendahara: 'none',
      ketua_rt: 'rt_only',
      keamanan: 'none',
      rkm: 'none',
      pengurus_rkm: 'none',
      pengurus_dkm: 'none',
      warga: 'none',
    },
  },

  // 4. Edit Warga
  {
    id: 'edit_warga',
    name: 'Edit Warga',
    category: 'Kependudukan',
    desc: 'Mengubah biodata, alamat, foto, atau informasi kependudukan warga',
    access: {
      super_admin: 'full',
      admin_rw: 'full',
      ketua_rw: 'full',
      sekretaris: 'edit_limited',
      bendahara: 'none',
      ketua_rt: 'rt_only',
      keamanan: 'none',
      rkm: 'none',
      pengurus_rkm: 'none',
      pengurus_dkm: 'none',
      warga: 'self_request',
    },
  },

  // 5. Hapus Warga
  {
    id: 'hapus_warga',
    name: 'Hapus Warga',
    category: 'Kependudukan',
    desc: 'Menghapus permanen data penduduk dari database RW 018',
    access: {
      super_admin: 'full',
      admin_rw: 'full',
      ketua_rw: 'full',
      sekretaris: 'none',
      bendahara: 'none',
      ketua_rt: 'none',
      keamanan: 'none',
      rkm: 'none',
      pengurus_rkm: 'none',
      pengurus_dkm: 'none',
      warga: 'none',
    },
  },

  // 6. Data RT
  {
    id: 'data_rt',
    name: 'Data RT',
    category: 'Kependudukan',
    desc: 'Informasi dan pengelolaan wilayah RT 039 s.d. RT 042',
    access: {
      super_admin: 'full',
      admin_rw: 'full',
      ketua_rw: 'full',
      sekretaris: 'edit_limited',
      bendahara: 'view_only',
      ketua_rt: 'self_only',
      keamanan: 'view_only',
      rkm: 'view_only',
      pengurus_rkm: 'view_only',
      pengurus_dkm: 'view_only',
      warga: 'none',
    },
  },

  // 7. Pengumuman
  {
    id: 'pengumuman',
    name: 'Pengumuman',
    category: 'Persuratan',
    desc: 'Publikasi maklumat warga, agenda kerja bakti, dan informasi umum',
    access: {
      super_admin: 'full',
      admin_rw: 'full',
      ketua_rw: 'full',
      sekretaris: 'edit_limited',
      bendahara: 'view_only',
      ketua_rt: 'edit_limited',
      keamanan: 'view_only',
      rkm: 'view_only',
      pengurus_rkm: 'view_only',
      pengurus_dkm: 'view_only',
      warga: 'view_only',
    },
  },

  // 8. Surat Masuk
  {
    id: 'surat_masuk',
    name: 'Surat Masuk',
    category: 'Persuratan',
    desc: 'Pencatatan dan arsip surat dinas atau instansi yang masuk ke RW 018',
    access: {
      super_admin: 'full',
      admin_rw: 'full',
      ketua_rw: 'full',
      sekretaris: 'edit_limited',
      bendahara: 'view_only',
      ketua_rt: 'view_only',
      keamanan: 'none',
      rkm: 'none',
      pengurus_rkm: 'none',
      pengurus_dkm: 'none',
      warga: 'none',
    },
  },

  // 9. Surat Keluar
  {
    id: 'surat_keluar',
    name: 'Surat Keluar',
    category: 'Persuratan',
    desc: 'Penerbitan nomor surat dinas keluar dan disposisi pengurus RW',
    access: {
      super_admin: 'full',
      admin_rw: 'full',
      ketua_rw: 'full',
      sekretaris: 'edit_limited',
      bendahara: 'none',
      ketua_rt: 'none',
      keamanan: 'none',
      rkm: 'none',
      pengurus_rkm: 'none',
      pengurus_dkm: 'none',
      warga: 'none',
    },
  },

  // 10. Arsip Surat
  {
    id: 'arsip_surat',
    name: 'Arsip Surat',
    category: 'Persuratan',
    desc: 'Dokumen arsip surat pengantar warga (SKCK, KTP, Domisili, SKTM, SKU)',
    access: {
      super_admin: 'full',
      admin_rw: 'full',
      ketua_rw: 'full',
      sekretaris: 'full',
      bendahara: 'view_only',
      ketua_rt: 'rt_only',
      keamanan: 'none',
      rkm: 'none',
      pengurus_rkm: 'none',
      pengurus_dkm: 'none',
      warga: 'none',
    },
  },

  // 11. Keuangan RW
  {
    id: 'keuangan_rw',
    name: 'Keuangan RW',
    category: 'Keuangan',
    desc: 'Buku kas besar, saldo umum, dan ringkasan kas perbankan/tunai RW 018',
    access: {
      super_admin: 'full',
      admin_rw: 'full',
      ketua_rw: 'view_only',
      sekretaris: 'view_only',
      bendahara: 'full',
      ketua_rt: 'none',
      keamanan: 'none',
      rkm: 'view_rkm',
      pengurus_rkm: 'view_rkm',
      pengurus_dkm: 'view_rkm',
      warga: 'none',
    },
  },

  // 12. Pemasukan
  {
    id: 'pemasukan',
    name: 'Pemasukan',
    category: 'Keuangan',
    desc: 'Pencatatan kas masuk: iuran bulanan RT, donasi, hibah, dan pendapatan',
    access: {
      super_admin: 'full',
      admin_rw: 'full',
      ketua_rw: 'view_only',
      sekretaris: 'view_only',
      bendahara: 'full',
      ketua_rt: 'edit_rt',
      keamanan: 'none',
      rkm: 'edit_rkm',
      pengurus_rkm: 'edit_rkm',
      pengurus_dkm: 'edit_rkm',
      warga: 'none',
    },
  },

  // 13. Pengeluaran
  {
    id: 'pengeluaran',
    name: 'Pengeluaran',
    category: 'Keuangan',
    desc: 'Pencatatan kas keluar operasional, pembangunan fisik, dan belanja RW',
    access: {
      super_admin: 'full',
      admin_rw: 'full',
      ketua_rw: 'view_only',
      sekretaris: 'view_only',
      bendahara: 'full',
      ketua_rt: 'none',
      keamanan: 'none',
      rkm: 'edit_rkm',
      pengurus_rkm: 'edit_rkm',
      pengurus_dkm: 'edit_rkm',
      warga: 'none',
    },
  },

  // 14. Laporan Keuangan
  {
    id: 'laporan_keuangan',
    name: 'Laporan Keuangan',
    category: 'Keuangan',
    desc: 'Rekapitulasi pembukuan kas bulanan/tahunan, arus kas, dan audit',
    access: {
      super_admin: 'full',
      admin_rw: 'full',
      ketua_rw: 'view_only',
      sekretaris: 'view_only',
      bendahara: 'full',
      ketua_rt: 'view_rt',
      keamanan: 'none',
      rkm: 'view_rkm',
      pengurus_rkm: 'view_rkm',
      pengurus_dkm: 'view_rkm',
      warga: 'none',
    },
  },

  // 15. Data Keamanan
  {
    id: 'data_keamanan',
    name: 'Data Keamanan',
    category: 'Keamanan',
    desc: 'Pemantauan titik pos ronda, peta CCTV 16 titik, dan log kamtibmas',
    access: {
      super_admin: 'full',
      admin_rw: 'full',
      ketua_rw: 'view_only',
      sekretaris: 'view_only',
      bendahara: 'none',
      ketua_rt: 'rt_only',
      keamanan: 'full',
      rkm: 'none',
      pengurus_rkm: 'none',
      pengurus_dkm: 'none',
      warga: 'view_only',
    },
  },

  // 16. Jadwal Ronda
  {
    id: 'jadwal_ronda',
    name: 'Jadwal Ronda',
    category: 'Keamanan',
    desc: 'Pengaturan jadwal jaga malam (Senin-Minggu 23:00-04:00) dan absensi',
    access: {
      super_admin: 'full',
      admin_rw: 'full',
      ketua_rw: 'view_only',
      sekretaris: 'edit_limited',
      bendahara: 'none',
      ketua_rt: 'rt_only',
      keamanan: 'full',
      rkm: 'none',
      pengurus_rkm: 'none',
      pengurus_dkm: 'none',
      warga: 'view_only',
    },
  },

  // 17. Laporan Kejadian
  {
    id: 'laporan_kejadian',
    name: 'Laporan Kejadian',
    category: 'Keamanan',
    desc: 'Pencatatan insiden ketertiban, aduan darurat, dan penanganan siskamling',
    access: {
      super_admin: 'full',
      admin_rw: 'full',
      ketua_rw: 'view_only',
      sekretaris: 'view_only',
      bendahara: 'none',
      ketua_rt: 'edit_limited',
      keamanan: 'full',
      rkm: 'none',
      pengurus_rkm: 'none',
      pengurus_dkm: 'none',
      warga: 'create_only',
    },
  },

  // 18. Data RKM
  {
    id: 'data_rkm',
    name: 'Data RKM',
    category: 'RKM (Kematian)',
    desc: 'Data kepesertaan Rukun Kematian Masyarakat dan inventaris peralatan',
    access: {
      super_admin: 'full',
      admin_rw: 'full',
      ketua_rw: 'view_only',
      sekretaris: 'view_only',
      bendahara: 'view_only',
      ketua_rt: 'rt_only',
      keamanan: 'none',
      rkm: 'full',
      pengurus_rkm: 'full',
      pengurus_dkm: 'full',
      warga: 'status_only',
    },
  },

  // 19. Iuran RKM
  {
    id: 'iuran_rkm',
    name: 'Iuran RKM',
    category: 'RKM (Kematian)',
    desc: 'Catatan tagihan dan rekapitulasi iuran rukun kematian warga per KK',
    access: {
      super_admin: 'full',
      admin_rw: 'full',
      ketua_rw: 'view_only',
      sekretaris: 'view_only',
      bendahara: 'view_only',
      ketua_rt: 'rt_only',
      keamanan: 'none',
      rkm: 'full',
      pengurus_rkm: 'full',
      pengurus_dkm: 'full',
      warga: 'status_only',
    },
  },

  // 20. Pembayaran RKM
  {
    id: 'pembayaran_rkm',
    name: 'Pembayaran RKM',
    category: 'RKM (Kematian)',
    desc: 'Penerimaan pembayaran iuran duka dan penerbitan kuitansi resmi RKM',
    access: {
      super_admin: 'full',
      admin_rw: 'full',
      ketua_rw: 'view_only',
      sekretaris: 'none',
      bendahara: 'view_only',
      ketua_rt: 'edit_rt',
      keamanan: 'none',
      rkm: 'full',
      pengurus_rkm: 'full',
      pengurus_dkm: 'full',
      warga: 'none',
    },
  },

  // 21. Data Kematian
  {
    id: 'data_kematian',
    name: 'Data Kematian',
    category: 'RKM (Kematian)',
    desc: 'Pencatatan data warga meninggal dunia, waktu pemakaman, dan santunan',
    access: {
      super_admin: 'full',
      admin_rw: 'full',
      ketua_rw: 'full',
      sekretaris: 'edit_limited',
      bendahara: 'none',
      ketua_rt: 'edit_rt',
      keamanan: 'none',
      rkm: 'full',
      pengurus_rkm: 'full',
      pengurus_dkm: 'full',
      warga: 'report_only',
    },
  },

  // 22. Laporan RKM
  {
    id: 'laporan_rkm',
    name: 'Laporan RKM',
    category: 'RKM (Kematian)',
    desc: 'Laporan pertanggungjawaban dana sosial kematian & inventaris jenazah',
    access: {
      super_admin: 'full',
      admin_rw: 'full',
      ketua_rw: 'view_only',
      sekretaris: 'view_only',
      bendahara: 'view_only',
      ketua_rt: 'view_only',
      keamanan: 'none',
      rkm: 'full',
      pengurus_rkm: 'full',
      pengurus_dkm: 'full',
      warga: 'view_only',
    },
  },

  // 23. Kelola User
  {
    id: 'kelola_user',
    name: 'Kelola User',
    category: 'Sistem & User',
    desc: 'Manajemen akun pengguna, reset sandi, aktivasi akun pengurus dan warga',
    access: {
      super_admin: 'full',
      admin_rw: 'full',
      ketua_rw: 'edit_limited',
      sekretaris: 'none',
      bendahara: 'none',
      ketua_rt: 'none',
      keamanan: 'none',
      rkm: 'none',
      pengurus_rkm: 'none',
      pengurus_dkm: 'none',
      warga: 'none',
    },
  },

  // 24. Pengaturan Sistem
  {
    id: 'pengaturan_sistem',
    name: 'Pengaturan Sistem',
    category: 'Sistem & User',
    desc: 'Konfigurasi hak akses level user, backup database, Firestore, dan sistem inti',
    access: {
      super_admin: 'full',
      admin_rw: 'full',
      ketua_rw: 'none',
      sekretaris: 'none',
      bendahara: 'none',
      ketua_rt: 'none',
      keamanan: 'none',
      rkm: 'none',
      pengurus_rkm: 'none',
      pengurus_dkm: 'none',
      warga: 'none',
    },
  },
];

export function getStatusBadge(status: AccessStatus): {
  symbol: string;
  label: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
} {
  switch (status) {
    case 'full':
      return {
        symbol: '✅',
        label: 'Akses Penuh',
        colorClass: 'text-emerald-800 dark:text-emerald-200',
        bgClass: 'bg-emerald-100 dark:bg-emerald-950/80',
        borderClass: 'border-emerald-300 dark:border-emerald-800',
      };
    case 'view_only':
      return {
        symbol: '👁️',
        label: 'Lihat Saja',
        colorClass: 'text-blue-800 dark:text-blue-200',
        bgClass: 'bg-blue-100 dark:bg-blue-950/80',
        borderClass: 'border-blue-300 dark:border-blue-800',
      };
    case 'edit_limited':
      return {
        symbol: '✏️',
        label: 'Input / Edit Terbatas',
        colorClass: 'text-amber-800 dark:text-amber-200',
        bgClass: 'bg-amber-100 dark:bg-amber-950/80',
        borderClass: 'border-amber-300 dark:border-amber-800',
      };
    case 'none':
      return {
        symbol: '❌',
        label: 'Tidak Ada Akses',
        colorClass: 'text-rose-800 dark:text-rose-300',
        bgClass: 'bg-rose-50 dark:bg-rose-950/50',
        borderClass: 'border-rose-200 dark:border-rose-900/60',
      };
    case 'rt_only':
      return {
        symbol: 'RT',
        label: 'RT (Hanya Data RT Sendiri)',
        colorClass: 'text-purple-800 dark:text-purple-200 font-bold',
        bgClass: 'bg-purple-100 dark:bg-purple-950/80',
        borderClass: 'border-purple-300 dark:border-purple-800',
      };
    case 'self_only':
      return {
        symbol: 'Sendiri',
        label: 'Sendiri (Hanya Akun Sendiri)',
        colorClass: 'text-indigo-800 dark:text-indigo-200 font-bold',
        bgClass: 'bg-indigo-100 dark:bg-indigo-950/80',
        borderClass: 'border-indigo-300 dark:border-indigo-800',
      };
    case 'self_request':
      return {
        symbol: 'Sendiri*',
        label: 'Sendiri* (Ajukan Perubahan)',
        colorClass: 'text-amber-900 dark:text-amber-300 font-bold',
        bgClass: 'bg-amber-100 dark:bg-amber-950/80',
        borderClass: 'border-amber-400 dark:border-amber-700',
      };
    case 'create_only':
      return {
        symbol: 'Buat',
        label: 'Buat Laporan',
        colorClass: 'text-cyan-800 dark:text-cyan-200 font-bold',
        bgClass: 'bg-cyan-100 dark:bg-cyan-950/80',
        borderClass: 'border-cyan-300 dark:border-cyan-800',
      };
    case 'status_only':
      return {
        symbol: 'Status',
        label: 'Lihat Status',
        colorClass: 'text-teal-800 dark:text-teal-200 font-bold',
        bgClass: 'bg-teal-100 dark:bg-teal-950/80',
        borderClass: 'border-teal-300 dark:border-teal-800',
      };
    case 'report_only':
      return {
        symbol: 'Lapor',
        label: 'Lapor Kematian',
        colorClass: 'text-rose-800 dark:text-rose-200 font-bold',
        bgClass: 'bg-rose-100 dark:bg-rose-950/80',
        borderClass: 'border-rose-300 dark:border-rose-800',
      };
    case 'edit_rt':
      return {
        symbol: '✏️ RT',
        label: 'Input Data RT',
        colorClass: 'text-purple-800 dark:text-purple-200 font-bold',
        bgClass: 'bg-purple-100 dark:bg-purple-950/80',
        borderClass: 'border-purple-300 dark:border-purple-800',
      };
    case 'edit_rkm':
      return {
        symbol: '✏️ RKM',
        label: 'Input RKM',
        colorClass: 'text-rose-800 dark:text-rose-200 font-bold',
        bgClass: 'bg-rose-100 dark:bg-rose-950/80',
        borderClass: 'border-rose-300 dark:border-rose-800',
      };
    case 'view_rt':
      return {
        symbol: '👁️ RT',
        label: 'Lihat Data RT',
        colorClass: 'text-purple-800 dark:text-purple-200 font-bold',
        bgClass: 'bg-purple-50 dark:bg-purple-950/60',
        borderClass: 'border-purple-200 dark:border-purple-900',
      };
    case 'view_rkm':
      return {
        symbol: '👁️ RKM',
        label: 'Lihat RKM',
        colorClass: 'text-rose-800 dark:text-rose-200 font-bold',
        bgClass: 'bg-rose-50 dark:bg-rose-950/60',
        borderClass: 'border-rose-200 dark:border-rose-900',
      };
    default:
      return {
        symbol: '—',
        label: 'Tidak Diketahui',
        colorClass: 'text-slate-600',
        bgClass: 'bg-slate-100',
        borderClass: 'border-slate-200',
      };
  }
}
