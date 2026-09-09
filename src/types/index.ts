export type Gender = 'L' | 'P';
export type Religion = 'Islam' | 'Kristen' | 'Katolik' | 'Hindu' | 'Buddha' | 'Konghucu';
export type MaritalStatus = 'Belum Kawin' | 'Kawin' | 'Cerai Hidup' | 'Cerai Mati';
export type FamilyRole = 'Kepala Keluarga' | 'Istri' | 'Anak' | 'Orang Tua' | 'Famili Lain';
export type BloodType = 'A' | 'B' | 'AB' | 'O' | 'Tidak Tahu';
export type EconomicStatus = 'Mampu' | 'Menengah' | 'Prasejahtera';

export type NavTab = 
  | 'dashboard'
  | 'warga'
  | 'kk'
  | 'rkm'
  | 'keamanan'
  | 'laporan_kejadian'
  | 'bansos'
  | 'kas'
  | 'pbb'
  | 'surat'
  | 'umkm'
  | 'kegiatan'
  | 'pengaduan'
  | 'peta'
  | 'menu';

export interface RTInfo {
  rt: string; // '039', '040', '041', '042'
  ketuaRt: string;
  noHp: string;
  jumlahKk?: number;
  jumlahWarga?: number;
}

export interface Warga {
  id: string;
  nik: string; // 16 digit
  noKk: string; // 16 digit
  nama: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: Gender;
  agama: Religion;
  pekerjaan: string;
  statusKawin: MaritalStatus;
  statusKeluarga: FamilyRole;
  rt: string; // '039', '040', '041', '042'
  alamat: string;
  noHp: string;
  golDarah: BloodType;
  pendidikan: string;
  isDisabilitas: boolean;
  isLansia: boolean;
  isDudaJanda?: boolean; // Status Duda atau Janda
  statusDomisili: 'Tetap' | 'Kontrak / Kost' | 'Pindah';
  foto?: string; // Data URL Base64 atau URL Foto Warga
  fotoUrl?: string; // Opsional alias
  createdAt: string;
}

export interface KartuKeluarga {
  id: string;
  noKk: string;
  kepalaKeluarga: string;
  nikKepala: string;
  rt: string; // '039', '040', '041', '042'
  alamat: string;
  telepon: string;
  statusEkonomi: EconomicStatus;
  desil?: string; // Tingkat Kesejahteraan (Desil 1 s/d Desil 10 / Non-Desil)
  jumlahAnggota: number;
  anggotaIds: string[]; // NIKs or IDs
  createdAt: string;
  // Detail Kepala Keluarga terintegrasi otomatis dari Data Induk Warga
  fotoKepala?: string;
  pekerjaanKepala?: string;
  agamaKepala?: Religion;
  pendidikanKepala?: string;
  tempatLahirKepala?: string;
  tanggalLahirKepala?: string;
  golDarahKepala?: BloodType;
  jenisKelaminKepala?: Gender;
  statusKawinKepala?: MaritalStatus;
}

// RUKUN KEMATIAN MASYARAKAT (RKM)
export interface BulanIuranItem {
  bulan: number; // 1 to 12
  namaBulan: string; // 'Januari' s/d 'Desember'
  nominal: number;
  bayar: boolean; // Checkbox ☑ Bayar
  tanggalBayar?: string; // YYYY-MM-DD
  status: 'Lunas' | 'Belum Lunas' | 'Bebas Iuran (Dhuafa)' | 'Titip RT';
  keterangan?: string;
  kolektor?: string;
}

export interface IuranRkmRecord {
  id: string;
  noKk: string;
  nik?: string; // NIK Kepala Keluarga / Warga
  namaKepala: string;
  rt: string; // '039', '040', '041', '042'
  bulanTahun: string; // e.g. "2026-08" or "2026"
  nominal: number;
  status: 'Lunas' | 'Belum Lunas';
  tanggalBayar?: string;
  penerima?: string;
  kuitansiNo?: string;
  noRekening?: string; // Kartu / Rekening iuran RKM e.g. "RKM-187202-039-0012"
  tahun?: number; // Tahun periode iuran misal 2026
  rincian12Bulan?: BulanIuranItem[]; // Rincian 12 Bulan Januari - Desember
}

export interface WargaMeninggalRecord {
  id: string;
  nik: string;
  nama: string;
  jenisKelamin: Gender;
  usia: number;
  rt: string;
  alamat: string;
  tanggalMeninggal: string;
  waktuMeninggal?: string;
  tempatMeninggal?: string; // e.g. 'Rumah Duka', 'RSUD Jend. Ahmad Yani Metro'
  penyebab?: string;
  lokasiPemakaman: string; // e.g. 'TPU Iringmulyo'
  santunanRkm: number;
  statusSantunan: 'Diserahkan' | 'Proses Administrasi';
  namaAhliWaris: string;
  hubunganWaris: string;
  noHpWaris?: string;
  keterangan?: string;
}

export interface PerlengkapanRkmItem {
  id: string;
  namaBarang: string;
  kategori: 'Perawatan Jenazah' | 'Tenda & Kursi' | 'Sound & Kelistrikan' | 'Kendaraan Jenazah' | 'Lainnya';
  jumlah: number;
  satuan: string;
  kondisi: 'Baik' | 'Perlu Perbaikan' | 'Rusak';
  status: 'Tersedia di Gudang' | 'Dipinjam Warga';
  lokasiSimpan: string;
  peminjamSaatIni?: string;
  kontakPeminjam?: string;
  tanggalPinjam?: string;
  penanggungJawab: string;
}

// KEAMANAN & PEMBANGUNAN FISIK INFRASTRUKTUR
export type KeamananCategory = 
  | 'CCTV & Keamanan' 
  | 'Pos Ronda & Siskamling' 
  | 'Drainase & Saluran Air' 
  | 'Paving & Jalan Lingkungan' 
  | 'Infrastruktur Lainnya';

export type KeamananStatus = 'Perencanaan' | 'Sedang Berjalan' | 'Selesai' | 'Tertunda';

export interface KeamananProgramItem {
  id: string;
  namaProgram: string;
  kategori: KeamananCategory;
  lokasi: string;
  targetWaktu: string;
  anggaran: number;
  sumberDana: 'Kas RW' | 'Swadaya Warga' | 'Dana Kelurahan Iringmulyo' | 'Bantuan Aspirasi / Donatur';
  penanggungJawab: string;
  progressPercent: number;
  status: KeamananStatus;
  deskripsi: string;
  realisasiBiaya: number;
  titikCctvCount?: number;
}

// Backward compatibility alias for RkmItem
export type RkmItem = KeamananProgramItem;
export type RkmCategory = KeamananCategory;
export type RkmStatus = KeamananStatus;

// RONDA MALAM & SISKAMLING (Jadwal 23:00 - 04:00, Ketua Grup & Anggota per RT, Absensi)
export type HariRonda = 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Minggu';

export interface AnggotaRonda {
  id: string;
  wargaId?: string;
  nik?: string;
  nama: string;
  rt: string; // '039', '040', '041', '042'
  noHp?: string;
  alamat?: string;
}

export interface JadwalRonda {
  id: string;
  hari: HariRonda;
  rt: string; // '039', '040', '041', '042'
  posKamling: string;
  jamMulai: string; // default '23:00'
  jamSelesai: string; // default '04:00'
  namaGrup: string; // misal 'Regu 1 (Senin)' atau 'Regu Elang'
  ketuaGrup: {
    wargaId?: string;
    nik?: string;
    nama: string;
    rt: string;
    noHp?: string;
    alamat?: string;
  };
  anggota: AnggotaRonda[];
  keterangan?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type StatusKehadiranRonda = 'Hadir' | 'Tidak Hadir' | 'Izin' | 'Sakit' | 'Digantikan';

export interface ItemPresensiRonda {
  anggotaId: string;
  nama: string;
  nik?: string;
  rt: string;
  peran: 'Ketua' | 'Anggota';
  status: StatusKehadiranRonda;
  jamHadir?: string; // e.g. '23:05'
  keterangan?: string; // Alasan jika tidak hadir / izin / pengganti
}

export interface AbsensiRondaRecord {
  id: string;
  jadwalId: string;
  hari: HariRonda;
  tanggal: string; // YYYY-MM-DD
  rt: string;
  posKamling: string;
  jamTugas: string; // '23:00 - 04:00'
  namaGrup: string;
  daftarKehadiran: ItemPresensiRonda[];
  catatanPetugas?: string; // Situasi malam (Aman, tertib, dll)
  dicatatOleh: string; // Nama petugas pencatat
  diperiksaOlehRt?: string; // Nama Ketua RT yang memeriksa
  diperiksaOlehRw?: string; // Nama Ketua RW yang memeriksa
  tanggalDiperiksaRt?: string;
  tanggalDiperiksaRw?: string;
  createdAt: string;
}

export type BansosType = 'PKH' | 'BPNT (Sembako)' | 'BLT Dana Desa' | 'Beras CBP 10kg' | 'KIS / PBI' | 'PIP Sekolah' | 'Santunan Kas RW' | 'Santunan Yatim/Piatu';
export type BansosStatus = 'Disalurkan' | 'Menunggu Verifikasi' | 'Belum Diambil' | 'Dibatalkan';

export interface BansosItem {
  id: string;
  nik: string;
  namaPenerima: string;
  noKk: string;
  rt: string;
  jenisBansos: BansosType;
  periode: string;
  status: BansosStatus;
  nominalOrPaket: string;
  tanggalPenyaluran?: string;
  keterangan: string;
  petugasPenyalur: string;
}

export type PrioritasCadangan = 'Prioritas 1 (Mendesak / Sangat Layak)' | 'Prioritas 2 (Layak)' | 'Cadangan Reguler';
export type StatusCadanganBansos = 'Menunggu Kuota' | 'Telah Dipromosikan' | 'Dalam Proses Usulan';
export type KategoriCadanganBansos = 'Lansia' | 'Disabilitas' | 'Duda / Janda' | 'Prasejahtera' | 'Yatim / Piatu' | 'Umum';

export interface CadanganBansosItem {
  id: string;
  nik: string;
  nama: string;
  noKk?: string;
  rt: string; // '039', '040', '041', '042'
  alamat: string;
  kategori: KategoriCadanganBansos;
  targetJenisBansos?: BansosType | string;
  prioritas: PrioritasCadangan;
  status: StatusCadanganBansos;
  alasanKelayakan: string;
  tanggalDaftar: string;
  petugasPencatat?: string;
}

export type UmkmCategory = 
  | 'Kuliner & Makanan' 
  | 'Jasa & Servis' 
  | 'Jasa & Reparasi'
  | 'Toko Kelontong & Sembako'
  | 'Sembako & Toko' 
  | 'Fashion & Kerajinan' 
  | 'Fashion & Konveksi'
  | 'Kerajinan & Seni'
  | 'Pertanian & Peternakan Urban'
  | 'Pertanian & Ternak' 
  | 'Lainnya';

export interface UmkmFotoItem {
  id: string;
  url: string; // Base64 or URL
  caption?: string;
  isUtama?: boolean;
  uploadedAt?: string;
}

export interface UmkmItem {
  id: string;
  namaUsaha: string;
  pemilik?: string;
  namaPemilik?: string;
  nikPemilik: string;
  rt: string;
  kategori: UmkmCategory;
  noWa?: string;
  kontakHp?: string;
  alamatUsaha: string;
  deskripsi?: string;
  deskripsiProduk?: string;
  jamBuka?: string;
  kisaranHarga?: string;
  isBinaanRw?: boolean;
  izinUsaha?: string;
  omsetBulanan?: number;
  jumlahKaryawan?: number;
  statusAktif?: boolean;
  foto?: string; // Foto utama / sampul usaha
  fotoList?: UmkmFotoItem[]; // Album foto / galeri usaha
  fotoUrls?: string[]; // Array of image URLs for backwards compatibility
}

export type TransaksiType = 'Pemasukan' | 'Pengeluaran';
export type KasCategory = 
  | 'Iuran Warga Bulanan'
  | 'Iuran RKM (Kematian)'
  | 'Iuran Sampah & Kebersihan'
  | 'Iuran Keamanan / Siskamling'
  | 'Dana Sosial / Kematian'
  | 'Donasi / Sumbangan'
  | 'Operasional Kantor RW'
  | 'Kegiatan / Acara Warga'
  | 'Pemeliharaan Fasum'
  | 'Lain-lain';

export interface TransaksiKas {
  id: string;
  kode: string;
  tipe: TransaksiType;
  kategori: KasCategory;
  jumlah: number;
  tanggal: string;
  keterangan: string;
  rt?: string;
  penanggungJawab: string;
  buktiRef?: string;
}

export interface IuranWargaRecord {
  id: string;
  noKk: string;
  namaKepala: string;
  rt: string;
  bulanTahun: string;
  nominal: number;
  status: 'Lunas' | 'Belum Lunas';
  tanggalBayar?: string;
  penerima?: string;
  kuitansiNo?: string;
}

export type KegiatanCategory = 
  | 'Rapat RW / RT' 
  | 'Rapat Pengurus & Warga'
  | 'Gotong Royong' 
  | 'Gotong Royong & Kerja Bakti'
  | 'Posyandu' 
  | 'Posyandu Balita & Lansia'
  | 'Peringatan Hari Besar' 
  | 'Peringatan Hari Besar Nasional (PHBN)'
  | 'Pengajian & Keagamaan'
  | 'Siskamling / Ronda' 
  | 'Siskamling & Ronda'
  | 'Olahraga & Senam'
  | 'Olahraga & Seni';

export type KegiatanStatus = 'Akan Datang' | 'Sedang Berlangsung' | 'Selesai' | 'Dibatalkan';

export interface MediaDokumentasi {
  id: string;
  url: string;
  tipe: 'foto' | 'video';
  judul?: string;
  keterangan?: string;
  thumbnail?: string;
}

export interface KegiatanRw {
  id: string;
  judul: string;
  kategori: KegiatanCategory;
  tanggal: string;
  waktu: string;
  lokasi: string;
  penanggungJawab: string;
  pesertaSasaran?: string;
  pesertaPerkiraan?: number;
  wargaHadir?: number;
  anggaran?: number;
  deskripsi: string;
  status: KegiatanStatus;
  catatanHasil?: string;
  hasilNotulen?: string;
  fotoUrls?: string[];
  videoUrl?: string;
  videoThumbnail?: string;
  dokumentasi?: MediaDokumentasi[];
}

export type KegiatanItem = KegiatanRw;

export type PengaduanCategory = 
  | 'Keamanan' 
  | 'Keamanan & Ketertiban'
  | 'Kebersihan & Sampah' 
  | 'Lampu & Fasilitas Rusak' 
  | 'Fasilitas Umum & Jalan'
  | 'Saluran Air & Drainase'
  | 'Ketertiban & Kebisingan' 
  | 'Sosial & Tetangga'
  | 'Sosial & Bantuan' 
  | 'Lainnya';

export type PengaduanKategori = PengaduanCategory;
export type PengaduanStatus = 'Masuk' | 'Menunggu Verifikasi' | 'Diproses' | 'Sedang Ditindaklanjuti' | 'Selesai' | 'Ditolak';
export type PengaduanPrioritas = 'Biasa' | 'Penting' | 'Sedang' | 'Rendah' | 'Tinggi / Darurat' | 'Darurat';

export interface PengaduanWarga {
  id: string;
  noAduan?: string;
  namaPelapor: string;
  nikPelapor?: string;
  noWa?: string;
  noHpPelapor?: string;
  rt: string;
  kategori: PengaduanCategory;
  judul: string;
  deskripsi?: string;
  isiPengaduan?: string;
  lokasiKejadian?: string;
  lokasiSpesifik?: string;
  tanggalLapor: string;
  status: PengaduanStatus;
  urgensi?: 'Biasa' | 'Penting' | 'Darurat';
  prioritas?: PengaduanPrioritas;
  tanggapanRw?: string;
  tindakLanjut?: string;
  petugasTindakLanjut?: string;
  tanggalSelesai?: string;
}

export type PengaduanItem = PengaduanWarga;

export type SuratType = 
  | 'Surat Pengantar KTP / KK'
  | 'Surat Pengantar SKCK'
  | 'Surat Keterangan Domisili'
  | 'Surat Keterangan Tidak Mampu (SKTM)'
  | 'Surat Keterangan Usaha (SKU)'
  | 'Surat Keterangan Kematian'
  | 'Surat Pengantar Pindah / Datang'
  | 'Surat Keterangan Izin Keramaian'
  | 'Surat Keterangan Kelakuan Baik'
  | 'Surat Keterangan Belum Menikah'
  | 'Surat Pengaduan & Aspirasi Warga'
  | 'Surat Aduan Lingkungan Warga';

export interface SuratItem {
  id: string;
  noSurat: string;
  jenisSurat: SuratType;
  nikPemohon: string;
  namaPemohon: string;
  tempatTglLahir: string;
  pekerjaan: string;
  agama: string;
  rt: string;
  alamat: string;
  keperluan: string;
  tanggalSurat: string;
  berlakuHingga?: string;
  namaKetuaRw: string;
  status: 'Diterbitkan' | 'Menunggu Tandatangan' | 'Selesai';
  catatan?: string;
}

export interface PetugasPenarikRkm {
  rt: string;
  namaPetugas: string;
  jabatan: string;
  noHp?: string;
}

export interface PengurusRkm {
  ketua: string;
  sekretaris: string;
  bendahara: string;
  seksiPengurusanPemakaman: string;
  seksiPenggaliKubur: string;
  seksiPerlengkapan: string;
  seksiHumas: string;
  seksiPenarikIuran: string;
  petugasPenarik: PetugasPenarikRkm[];
}

export interface KontakDarurat {
  id: string;
  namaInstansi: string;
  petugas?: string;
  nomorTelepon: string;
  kategori: 'Keamanan Polisi' | 'TNI Koramil' | 'Kesehatan & Ambulan' | 'Pemadam Kebakaran' | 'PLN & Kelistrikan' | 'Lainnya';
  deskripsi?: string;
}

// PAJAK BUMI DAN BANGUNAN (PBB) & DATA SERTIFIKAT SHM
export type StatusHakTanah = 'SHM (Hak Milik)' | 'HGB' | 'Letter C / Girik' | 'AJB' | 'Hak Pakai';
export type StatusBayarPbb = 'Lunas' | 'Belum Lunas';
export type MetodeBayarPbb = 'Tunai Kolektif RW' | 'Bank Lampung' | 'QRIS / Mobile Banking' | 'Kantor Pos' | 'Indomaret / Alfamart' | 'Bapenda Metro';

export interface TunggakanPbbItem {
  tahun: number;
  pokok: number;
  denda: number;
  total: number;
  status: StatusBayarPbb;
  tanggalBayar?: string;
  metodeBayar?: MetodeBayarPbb;
  kuitansiNo?: string;
}

export interface PbbRecord {
  id: string;
  nop: string; // Nomor Objek Pajak, e.g. "18.72.030.004.018-0021.0"
  namaWajibPajak: string; // Sesuai SPPT
  nikWajibPajak?: string;
  noKk?: string;
  rt: string; // '039', '040', '041', '042'
  alamatObjek: string;
  
  // Rincian Data Kepemilikan & Sertifikat SHM
  namaPemilikShm: string;
  nikPemilikShm?: string;
  noShm: string; // e.g. "SHM No. 01842/Iringmulyo"
  noSuratUkur?: string; // e.g. "SU No. 00412/Iringmulyo/2018"
  statusHak: StatusHakTanah;
  atasNamaSertifikat: string;
  tahunTerbitSertifikat?: number;

  // Rincian Objek Bumi & Bangunan
  luasTanah: number; // m²
  luasBangunan: number; // m²
  njopTanahPerMeter?: number; // Rp/m²
  njopBangunanPerMeter?: number; // Rp/m²
  totalNjop?: number;
  penggunaanBangunan?: 'Rumah Tinggal' | 'Tempat Usaha / Toko' | 'Tanah Kosong / Kebun' | 'Kos-kosan / Kontrakan' | 'Fasilitas Umum / Musholla';

  // Tagihan PBB Tahun Berjalan (2026)
  tahunPajak: number;
  tagihanPokok: number;
  denda: number;
  totalTagihan: number; // Pokok + Denda
  jatuhTempo?: string;
  statusPembayaran: StatusBayarPbb;
  tanggalBayar?: string;
  metodeBayar?: MetodeBayarPbb;
  buktiBayarNo?: string;
  namaPenyetor?: string;
  petugasKolektor?: string;

  // Rincian Tunggakan Tahun-Tahun Sebelumnya
  tunggakanTahunLalu: TunggakanPbbItem[];
  totalTunggakan?: number;

  catatan?: string;
  createdAt: string;
}

export interface RWProfile {
  id?: string;
  namaRw: string;
  nomorRw?: string;
  kelurahan: string;
  kecamatan: string;
  kotaKab: string;
  provinsi: string;
  kodePos: string;
  namaKetuaRw: string;
  nikKetuaRw: string;
  noHpKetuaRw: string;
  namaSekretarisRw?: string;
  noHpSekretarisRw?: string;
  namaBendaharaRw?: string;
  noHpBendaharaRw?: string;
  namaSeksiKeagamaan?: string;
  noHpSeksiKeagamaan?: string;
  namaSeksiKebersihan?: string;
  noHpSeksiKebersihan?: string;
  alamatKantor: string;
  logoUrl?: string;
  daftarRt: string[]; // ["039", "040", "041", "042"]
  daftarRtInfo: RTInfo[];
  pengurusRkm?: PengurusRkm;
  kontakDarurat?: KontakDarurat[];
  periodeJabatan: string;
  semboyan: string;
}

export interface AppDatabase {
  appName: string;
  exportedAt: string;
  version: string;
  profile: RWProfile;
  warga: Warga[];
  kk: KartuKeluarga[];
  iuranRkm: IuranRkmRecord[];
  wargaMeninggal: WargaMeninggalRecord[];
  perlengkapanRkm: PerlengkapanRkmItem[];
  keamanan: KeamananProgramItem[];
  jadwalRonda?: JadwalRonda[];
  absensiRonda?: AbsensiRondaRecord[];
  bansos: BansosItem[];
  umkm: UmkmItem[];
  kas: TransaksiKas[];
  iuran: IuranWargaRecord[];
  pbb?: PbbRecord[];
  kegiatan: KegiatanRw[];
  pengaduan: PengaduanWarga[];
  surat: SuratItem[];
  laporanKejadian?: LaporanKejadian[];
  users?: AppUser[];
}

export type JenisKejadian =
  | 'Kebakaran'
  | 'Pencurian'
  | 'Kecelakaan'
  | 'Keributan/Gangguan Kamtibmas'
  | 'Bencana Alam'
  | 'Orang Hilang'
  | 'Kematian/Musibah'
  | 'Kerusakan Fasilitas'
  | 'Kejadian Lainnya';

export type StatusLaporanKejadian =
  | 'Draft'
  | 'Sudah Dibuat'
  | 'Sudah Dicetak'
  | 'Sudah Dilaporkan'
  | 'Selesai';

export interface KorbanPihakTerkait {
  id: string;
  nama: string;
  nik?: string;
  alamat: string;
  rtRw: string;
  noHp?: string;
  status: 'Korban' | 'Saksi' | 'Pemilik Rumah/Barang' | 'Pihak Terkait' | 'Lainnya';
}

export interface SaksiKejadian {
  id: string;
  nama: string;
  alamat: string;
  noHp: string;
}

export interface DokumentasiKejadian {
  id: string;
  namaFile: string;
  jenisFile: 'foto' | 'video' | 'dokumen';
  waktuUpload: string;
  url: string;
  size?: number;
}

export interface LaporanKejadian {
  id: string;
  nomorLaporan: string; // e.g. '001/RW.018/IX/2026'
  tanggalLaporan: string;
  pelaporNama: string;
  pelaporJabatan: string;
  wilayah: string;
  kelurahan: string;
  kecamatan: string;
  kota: string;
  tujuanLaporan: string[]; // e.g. ['Lurah Iringmulyo', 'Camat Metro Timur', 'Kapolsek Metro Timur']
  jenisKejadian: JenisKejadian;
  jenisKejadianLainnya?: string;
  hariKejadian: string;
  tanggalKejadian: string;
  waktuKejadian: string;
  lokasiKejadian: string;
  rt: '039' | '040' | '041' | '042';
  rw: string;
  alamatLengkap: string;
  korban: KorbanPihakTerkait[];
  kronologi: string;
  korbanJiwa: 'Tidak ada' | 'Ada';
  jumlahKorbanJiwa: number;
  korbanLuka: 'Tidak ada' | 'Ada';
  jumlahKorbanLuka: number;
  kerugianMateri: 'Tidak ada' | 'Ada';
  nilaiKerugian: number;
  kerusakan: string;
  tindakan: string[];
  tindakanLainnya?: string;
  uraianTindakan: string;
  saksi: SaksiKejadian[];
  dokumentasi: DokumentasiKejadian[];
  keteranganTambahan?: string;
  status: StatusLaporanKejadian;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export type UserRole = 
  | 'super_admin'
  | 'ketua_rw'
  | 'admin_rw' 
  | 'sekretaris' 
  | 'bendahara' 
  | 'ketua_rt' 
  | 'keamanan' 
  | 'rkm'
  | 'pengurus_rkm' 
  | 'pengurus_dkm'
  | 'warga';

export interface AppUser {
  id: string;
  username: string;
  password: string;
  nama: string;
  role: UserRole;
  roleLabel: string;
  rtAccess?: string; // '039', '040', '041', '042', or 'ALL'
  noHp?: string;
  email?: string;
  avatarIcon?: string;
  avatarUrl?: string;
  isActive: boolean;
  lastLogin?: string;
  description?: string;
  wargaNik?: string; // 16 digit NIK warga terdaftar jika login sebagai warga
  // Biometrics Authentication
  fingerprintEnabled?: boolean;
  faceRecognitionEnabled?: boolean;
  biometricRegisteredAt?: string;
  biometricSecretToken?: string;
}

export interface RolePermission {
  role: UserRole;
  roleLabel: string;
  roleColor: string;
  badgeBg: string;
  iconName: string;
  description: string;
  allowedTabs: NavTab[];
  canEditWarga: boolean;
  canDeleteWarga: boolean;
  canManageKas: boolean;
  canManageSurat: boolean;
  canManageBansos: boolean;
  canManageRkm: boolean;
  canManageKeamanan: boolean;
  canManageSettings: boolean;
  scopeRtOnly?: boolean;
}
