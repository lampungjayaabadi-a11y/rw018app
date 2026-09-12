import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  FileText,
  Search,
  Plus,
  Printer,
  Share2,
  Trash2,
  Edit3,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Building,
  User,
  AlertTriangle,
  Flame,
  Shield,
  Upload,
  X,
  Sparkles,
  Send,
  Eye,
  RotateCcw,
  Check,
  Copy,
  ChevronRight,
  ExternalLink,
  Users,
  Info,
  Layers,
  ArrowLeft,
  FileCheck2,
  FilePlus,
  Download,
  FileDown,
  Loader2,
  Phone,
  Camera,
  HeartPulse,
  DollarSign,
  ShieldAlert,
  Lock,
  Mail,
  HardDrive,
  MessageCircle,
  Instagram,
  Filter,
  FileSearch,
  Tag,
  AlertCircle
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { formatLaporanPdfFilename } from '../utils/pdfExport';
import {
  LaporanKejadian,
  JenisKejadian,
  StatusLaporanKejadian,
  KorbanPihakTerkait,
  SaksiKejadian,
  DokumentasiKejadian,
  RWProfile,
  AppUser
} from '../types';
import {
  ROMAN_MONTHS,
  getHariIndonesia,
  formatTanggalIndonesia,
  generateNextNomorLaporan,
  buildKronologiWithAI
} from '../utils/laporanKejadianUtils';
import { uploadDokumentasiKejadian } from '../services/storageFiles';
import { generateId, formatRupiah } from '../utils/formatters';
import { LOGO_RW_018, handleLogoError } from '../constants/logo';

interface LaporanKejadianViewProps {
  profile: RWProfile;
  laporanList: LaporanKejadian[];
  onSaveLaporan: (item: LaporanKejadian) => void;
  onDeleteLaporan: (id: string) => void;
  currentUser?: AppUser | null;
  initialMode?: 'list' | 'create';
  onBackToKeamanan?: () => void;
}

const DAFTAR_JENIS_KEJADIAN: { label: JenisKejadian; icon: any; color: string }[] = [
  { label: 'Kebakaran', icon: Flame, color: 'text-red-600 bg-red-50 border-red-200' },
  { label: 'Pencurian', icon: Shield, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { label: 'Kecelakaan', icon: HeartPulse, color: 'text-rose-600 bg-rose-50 border-rose-200' },
  { label: 'Keributan/Gangguan Kamtibmas', icon: AlertTriangle, color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { label: 'Bencana Alam', icon: Flame, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { label: 'Orang Hilang', icon: User, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { label: 'Kematian/Musibah', icon: Users, color: 'text-slate-600 bg-slate-50 border-slate-200' },
  { label: 'Kerusakan Fasilitas', icon: Building, color: 'text-teal-600 bg-teal-50 border-teal-200' },
  { label: 'Kejadian Lainnya', icon: FileText, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
];

export interface KategoriLaporanItem {
  id: string;
  label: string;
  badgeColor: string;
  jenisList: JenisKejadian[];
}

export const DAFTAR_KATEGORI_LAPORAN: KategoriLaporanItem[] = [
  {
    id: 'all',
    label: 'Semua Kategori',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    jenisList: []
  },
  {
    id: 'keamanan',
    label: 'Keamanan & Kamtibmas',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    jenisList: ['Pencurian', 'Keributan/Gangguan Kamtibmas']
  },
  {
    id: 'kebersihan',
    label: 'Kebersihan & Lingkungan',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    jenisList: ['Bencana Alam']
  },
  {
    id: 'fasilitas',
    label: 'Fasilitas & Sarpras',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-300',
    jenisList: ['Kerusakan Fasilitas']
  },
  {
    id: 'kedaruratan',
    label: 'Kedaruratan & Kemanusiaan',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
    jenisList: ['Kebakaran', 'Kecelakaan', 'Orang Hilang', 'Kematian/Musibah']
  },
  {
    id: 'lainnya',
    label: 'Kejadian Lainnya',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    jenisList: ['Kejadian Lainnya']
  },
];

export const getKategoriFromJenis = (jenis: JenisKejadian): KategoriLaporanItem => {
  const found = DAFTAR_KATEGORI_LAPORAN.find(
    (k) => k.id !== 'all' && k.jenisList.includes(jenis)
  );
  return found || DAFTAR_KATEGORI_LAPORAN[DAFTAR_KATEGORI_LAPORAN.length - 1];
};

export interface StatusConfigItem {
  status: StatusLaporanKejadian;
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  badgeRing: string;
  dotColor: string;
  dotPulse: boolean;
  icon: any;
  description: string;
  cardBorder: string;
}

export const DAFTAR_STATUS_CONFIG: Record<StatusLaporanKejadian, StatusConfigItem> = {
  'Baru': {
    status: 'Baru',
    label: 'Baru',
    badgeBg: 'bg-blue-600',
    badgeText: 'text-white',
    badgeBorder: 'border-blue-700',
    badgeRing: 'ring-2 ring-blue-200 shadow-sm shadow-blue-500/25',
    dotColor: 'bg-white',
    dotPulse: true,
    icon: Sparkles,
    description: 'Laporan baru diterima & memerlukan penanganan segera',
    cardBorder: 'border-blue-300 ring-1 ring-blue-100/80 hover:border-blue-400',
  },
  'Diproses': {
    status: 'Diproses',
    label: 'Diproses',
    badgeBg: 'bg-amber-500',
    badgeText: 'text-slate-950 font-black',
    badgeBorder: 'border-amber-600',
    badgeRing: 'ring-2 ring-amber-200 shadow-sm shadow-amber-500/25',
    dotColor: 'bg-slate-950',
    dotPulse: true,
    icon: Loader2,
    description: 'Sedang dalam penanganan aparat keamanan / pengurus',
    cardBorder: 'border-amber-300 ring-1 ring-amber-100/80 hover:border-amber-400',
  },
  'Selesai': {
    status: 'Selesai',
    label: 'Selesai',
    badgeBg: 'bg-emerald-600',
    badgeText: 'text-white',
    badgeBorder: 'border-emerald-700',
    badgeRing: 'ring-2 ring-emerald-200 shadow-sm shadow-emerald-500/25',
    dotColor: 'bg-emerald-100',
    dotPulse: false,
    icon: CheckCircle2,
    description: 'Penanganan perkara telah tuntas dan selesai',
    cardBorder: 'border-emerald-300 ring-1 ring-emerald-100/80 hover:border-emerald-400',
  },
  'Sudah Dilaporkan': {
    status: 'Sudah Dilaporkan',
    label: 'Dilaporkan',
    badgeBg: 'bg-indigo-600',
    badgeText: 'text-white',
    badgeBorder: 'border-indigo-700',
    badgeRing: 'ring-2 ring-indigo-200 shadow-sm shadow-indigo-500/25',
    dotColor: 'bg-indigo-100',
    dotPulse: false,
    icon: Send,
    description: 'Telah dilaporkan resmi ke instansi terkait (Lurah / Kapolsek)',
    cardBorder: 'border-indigo-200 hover:border-indigo-300',
  },
  'Sudah Dicetak': {
    status: 'Sudah Dicetak',
    label: 'Dicetak',
    badgeBg: 'bg-purple-600',
    badgeText: 'text-white',
    badgeBorder: 'border-purple-700',
    badgeRing: 'ring-2 ring-purple-200 shadow-sm shadow-purple-500/25',
    dotColor: 'bg-purple-100',
    dotPulse: false,
    icon: Printer,
    description: 'Berkas fisik resmi format A4 telah dicetak / disimpan',
    cardBorder: 'border-purple-200 hover:border-purple-300',
  },
  'Sudah Dibuat': {
    status: 'Sudah Dibuat',
    label: 'Sudah Dibuat',
    badgeBg: 'bg-teal-700',
    badgeText: 'text-white',
    badgeBorder: 'border-teal-800',
    badgeRing: 'ring-2 ring-teal-200 shadow-sm shadow-teal-500/25',
    dotColor: 'bg-teal-100',
    dotPulse: false,
    icon: FileCheck2,
    description: 'Laporan resmi terdaftar dalam basis data RW 018',
    cardBorder: 'border-teal-200 hover:border-teal-300',
  },
  'Draft': {
    status: 'Draft',
    label: 'Draft',
    badgeBg: 'bg-slate-600',
    badgeText: 'text-white',
    badgeBorder: 'border-slate-700',
    badgeRing: 'ring-2 ring-slate-200 shadow-sm',
    dotColor: 'bg-slate-200',
    dotPulse: false,
    icon: FileText,
    description: 'Konsep laporan kejadian (belum final)',
    cardBorder: 'border-slate-200 hover:border-slate-300',
  },
};

export const getStatusConfig = (status: string): StatusConfigItem => {
  if (DAFTAR_STATUS_CONFIG[status as StatusLaporanKejadian]) {
    return DAFTAR_STATUS_CONFIG[status as StatusLaporanKejadian];
  }
  return {
    status: 'Baru',
    label: status || 'Baru',
    badgeBg: 'bg-slate-700',
    badgeText: 'text-white',
    badgeBorder: 'border-slate-800',
    badgeRing: 'ring-2 ring-slate-200 shadow-sm',
    dotColor: 'bg-white',
    dotPulse: false,
    icon: FileText,
    description: status,
    cardBorder: 'border-slate-200 hover:border-slate-300',
  };
};

const DAFTAR_TINDAKAN_DEFAULT = [
  'Menghubungi Ketua RT',
  'Menghubungi Lurah',
  'Menghubungi Kecamatan',
  'Menghubungi Kepolisian',
  'Menghubungi Pemadam Kebakaran',
  'Menghubungi BPBD',
  'Menghubungi Ambulans/Puskesmas',
  'Mengamankan lokasi',
  'Memberikan pertolongan kepada korban',
];

const DAFTAR_TUJUAN_DEFAULT = [
  'Lurah Iringmulyo',
  'Camat Metro Timur',
  'Kapolsek Metro Timur',
];

interface OfficialA4DocumentProps {
  laporan: LaporanKejadian;
  profile: RWProfile;
  namaBhabinkamtibmas: string;
  nrpBhabinkamtibmas: string;
  namaBabinsa: string;
  sertakanBabinsa: boolean;
  domId?: string;
}

const OfficialA4Document: React.FC<OfficialA4DocumentProps> = ({
  laporan,
  profile,
  namaBhabinkamtibmas,
  nrpBhabinkamtibmas,
  namaBabinsa,
  sertakanBabinsa,
  domId,
}) => {
  return (
    <div
      id={domId}
      className="p-8 sm:p-12 text-slate-900 space-y-6 print:p-6 print:text-black font-serif text-[13px] leading-relaxed bg-white"
    >
      {/* KOP SURAT RESMI */}
      <div className="flex items-center justify-between border-b-4 border-double border-black pb-4 text-slate-900">
        {/* Logo Kiri Resmi RW 018 (Diperbesar w-30 h-30) */}
        <div className="w-20 sm:w-28 md:w-30 shrink-0 flex items-center justify-center print:w-30">
          <img
            src={profile.logoUrl || LOGO_RW_018}
            alt="Logo Resmi RW 018"
            referrerPolicy="no-referrer"
            className="w-20 h-20 sm:w-28 sm:h-28 md:w-30 md:h-30 print:w-30 print:h-30 object-contain drop-shadow-xs"
            onError={handleLogoError}
          />
        </div>

        {/* Teks Kop Surat Tengah - Proporsional & Rapi */}
        <div className="flex-1 text-center px-1.5 sm:px-4 space-y-0.5 sm:space-y-1">
          <h2 className="text-base sm:text-xl md:text-2xl font-black tracking-wider uppercase m-0 font-sans text-slate-900 leading-tight">
            PEMERINTAH {profile.kotaKab?.toUpperCase() || 'KOTA METRO'}
          </h2>
          <h3 className="text-xs sm:text-base md:text-lg font-bold tracking-wider uppercase m-0 font-sans text-slate-800 leading-snug">
            KECAMATAN {profile.kecamatan?.toUpperCase() || 'METRO TIMUR'}
          </h3>
          <h3 className="text-xs sm:text-base md:text-lg font-bold tracking-wider uppercase m-0 font-sans text-slate-800 leading-snug">
            KELURAHAN {profile.kelurahan?.toUpperCase() || 'IRINGMULYO'}
          </h3>
          <h1 className="text-sm sm:text-lg md:text-xl font-black tracking-widest uppercase m-0 text-slate-900 font-sans leading-tight whitespace-nowrap">
            RW 018 KAMPUNG BANTEN
          </h1>
          <p className="text-[10px] sm:text-xs font-sans text-slate-700 tracking-normal m-0 italic pt-0.5 leading-snug">
            Sekretariat: Jl. Pala Nomor 1 RT 039 RW 018 Kampung Banten Kelurahan Iringmulyo, Metro Timur 34112
          </p>
        </div>

        {/* Balancer Kanan (Memastikan Proporsional Presisi Kanan-Kiri) */}
        <div
          className="w-20 sm:w-28 md:w-30 shrink-0 flex items-center justify-center opacity-0 pointer-events-none print:w-30"
          aria-hidden="true"
        >
          <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-30 md:h-30 print:w-30 print:h-30" />
        </div>
      </div>

      {/* JUDUL LAPORAN */}
      <div className="text-center space-y-1 pt-2">
        <h2 className="text-base font-bold uppercase tracking-wide underline underline-offset-4 m-0">
          LAPORAN KEJADIAN
        </h2>
        <p className="text-xs font-sans font-bold text-slate-800 m-0">
          Nomor: {laporan.nomorLaporan}
        </p>
      </div>

      {/* TUJUAN LAPORAN */}
      <div className="space-y-1 font-sans text-xs">
        <p className="m-0">Kepada Yth:</p>
        <div className="pl-4 font-bold space-y-0.5">
          {laporan.tujuanLaporan.map((t, i) => (
            <p key={t} className="m-0">
              {i + 1}. {t}
            </p>
          ))}
          <p className="m-0 font-normal">di Tempat</p>
        </div>
      </div>

      {/* I. IDENTITAS PELAPOR */}
      <div className="space-y-2">
        <h4 className="font-sans font-bold text-xs uppercase tracking-wide border-b border-slate-300 pb-1 m-0">
          I. IDENTITAS PELAPOR
        </h4>
        <div className="grid grid-cols-[140px_10px_1fr] text-xs font-sans gap-y-1">
          <span>Nama</span>
          <span>:</span>
          <span className="font-bold">{laporan.pelaporNama}</span>

          <span>Jabatan</span>
          <span>:</span>
          <span>{laporan.pelaporJabatan}</span>

          <span>Wilayah</span>
          <span>:</span>
          <span>{laporan.wilayah}</span>

          <span>Kelurahan / Kec.</span>
          <span>:</span>
          <span>
            {laporan.kelurahan}, {laporan.kecamatan}
          </span>

          <span>Kota</span>
          <span>:</span>
          <span>{laporan.kota}</span>
        </div>
      </div>

      {/* II. DATA KEJADIAN */}
      <div className="space-y-2">
        <h4 className="font-sans font-bold text-xs uppercase tracking-wide border-b border-slate-300 pb-1 m-0">
          II. DATA KEJADIAN
        </h4>
        <div className="grid grid-cols-[140px_10px_1fr] text-xs font-sans gap-y-1">
          <span>Jenis Kejadian</span>
          <span>:</span>
          <span className="font-bold uppercase">
            {laporan.jenisKejadian === 'Kejadian Lainnya'
              ? laporan.jenisKejadianLainnya || 'Kejadian Lainnya'
              : laporan.jenisKejadian}
          </span>

          <span>Hari / Tanggal</span>
          <span>:</span>
          <span>
            {laporan.hariKejadian}, {formatTanggalIndonesia(laporan.tanggalKejadian)}
          </span>

          <span>Waktu / Jam</span>
          <span>:</span>
          <span>{laporan.waktuKejadian}</span>

          <span>Lokasi Kejadian</span>
          <span>:</span>
          <span className="font-bold">
            {laporan.lokasiKejadian} (RT {laporan.rt} RW 018)
          </span>

          <span>Alamat Lengkap</span>
          <span>:</span>
          <span>{laporan.alamatLengkap}</span>
        </div>
      </div>

      {/* III. DATA KORBAN / PIHAK TERKAIT */}
      {laporan.korban && laporan.korban.length > 0 && laporan.korban[0].nama && (
        <div className="space-y-2">
          <h4 className="font-sans font-bold text-xs uppercase tracking-wide border-b border-slate-300 pb-1 m-0">
            III. DATA KORBAN / PIHAK TERKAIT
          </h4>
          <div className="space-y-2 font-sans text-xs">
            {laporan.korban.map((kb, idx) => (
              <div key={kb.id || idx} className="grid grid-cols-[140px_10px_1fr] gap-y-1">
                <span>Pihak #{idx + 1} ({kb.status})</span>
                <span>:</span>
                <span className="font-bold">
                  {kb.nama} {kb.nik ? `(NIK: ${kb.nik})` : ''} - Alamat: {kb.alamat} {kb.noHp ? `(HP: ${kb.noHp})` : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* IV. KRONOLOGIS KEJADIAN */}
      <div className="space-y-2">
        <h4 className="font-sans font-bold text-xs uppercase tracking-wide border-b border-slate-300 pb-1 m-0">
          IV. URAIAN KRONOLOGIS KEJADIAN
        </h4>
        <div className="text-xs font-sans leading-relaxed whitespace-pre-line text-justify bg-slate-50/60 p-3 rounded border border-slate-200">
          {laporan.kronologi}
        </div>
      </div>

      {/* V. DAMPAK DAN KERUGIAN */}
      <div className="space-y-2">
        <h4 className="font-sans font-bold text-xs uppercase tracking-wide border-b border-slate-300 pb-1 m-0">
          V. DAMPAK DAN KERUGIAN
        </h4>
        <div className="grid grid-cols-[140px_10px_1fr] text-xs font-sans gap-y-1">
          <span>Korban Jiwa</span>
          <span>:</span>
          <span>
            {laporan.korbanJiwa === 'Ada'
              ? `Ada (${laporan.jumlahKorbanJiwa} orang)`
              : 'Tidak ada'}
          </span>

          <span>Korban Luka</span>
          <span>:</span>
          <span>
            {laporan.korbanLuka === 'Ada'
              ? `Ada (${laporan.jumlahKorbanLuka} orang)`
              : 'Tidak ada'}
          </span>

          <span>Kerugian Materiil</span>
          <span>:</span>
          <span>
            {laporan.kerugianMateri === 'Ada'
              ? `Ada (Perkiraan Rp ${(laporan.nilaiKerugian || 0).toLocaleString('id-ID')})`
              : 'Tidak ada'}
          </span>

          {laporan.kerusakan && (
            <>
              <span>Kerusakan Fisik</span>
              <span>:</span>
              <span>{laporan.kerusakan}</span>
            </>
          )}
        </div>
      </div>

      {/* VI. TINDAKAN YANG TELAH DILAKUKAN */}
      <div className="space-y-2">
        <h4 className="font-sans font-bold text-xs uppercase tracking-wide border-b border-slate-300 pb-1 m-0">
          VI. TINDAKAN YANG TELAH DILAKUKAN
        </h4>
        <div className="text-xs font-sans space-y-1">
          <ul className="list-disc pl-5 m-0 space-y-0.5">
            {laporan.tindakan.map((td) => (
              <li key={td}>{td}</li>
            ))}
            {laporan.tindakanLainnya && <li>{laporan.tindakanLainnya}</li>}
          </ul>
          {laporan.uraianTindakan && (
            <p className="pt-1 m-0 italic text-slate-700">
              Catatan Penanganan: {laporan.uraianTindakan}
            </p>
          )}
        </div>
      </div>

      {/* VII. IDENTITAS SAKSI-SAKSI */}
      {laporan.saksi && laporan.saksi.length > 0 && laporan.saksi[0].nama && (
        <div className="space-y-2">
          <h4 className="font-sans font-bold text-xs uppercase tracking-wide border-b border-slate-300 pb-1 m-0">
            VII. IDENTITAS SAKSI-SAKSI
          </h4>
          <div className="font-sans text-xs space-y-1 pl-4">
            {laporan.saksi.map((sk, idx) => (
              <p key={sk.id || idx} className="m-0">
                {idx + 1}. <strong>{sk.nama}</strong> - Alamat: {sk.alamat} {sk.noHp ? `(HP: ${sk.noHp})` : ''}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* VIII. DOKUMENTASI LAMPIRAN */}
      {laporan.dokumentasi && laporan.dokumentasi.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-sans font-bold text-xs uppercase tracking-wide border-b border-slate-300 pb-1 m-0">
            VIII. LAMPIRAN DOKUMENTASI
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
            {laporan.dokumentasi.map((dok, idx) => (
              <div key={dok.id || idx} className="border border-slate-300 p-1.5 rounded text-center">
                {dok.jenisFile === 'foto' ? (
                  <img
                    src={dok.url}
                    alt={dok.namaFile}
                    className="w-full h-28 object-cover rounded mb-1"
                  />
                ) : (
                  <div className="w-full h-28 bg-slate-100 flex items-center justify-center text-slate-500 rounded mb-1 text-xs">
                    {dok.namaFile}
                  </div>
                )}
                <span className="text-[10px] font-sans text-slate-600 block truncate">
                  Foto #{idx + 1}: {dok.namaFile}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PENUTUP RESMI */}
      <div className="font-sans text-xs pt-2">
        <p className="m-0 leading-relaxed text-justify">
          Demikian laporan kejadian ini dibuat dengan sebenar-benarnya berdasarkan informasi yang diperoleh di lapangan untuk dapat diketahui dan ditindaklanjuti sebagaimana mestinya.
        </p>
      </div>

      {/* TANDA TANGAN RESMI */}
      {sertakanBabinsa ? (
        <div className="pt-8 grid grid-cols-3 gap-4 text-center font-sans text-xs">
          <div className="flex flex-col justify-between">
            <div>
              <p className="m-0">Mengetahui,</p>
              <p className="m-0 font-bold uppercase">BHABINKAMTIBMAS</p>
              <p className="m-0 text-[10px] text-slate-600">Kelurahan Iringmulyo</p>
            </div>
            <div className="h-20 my-1" />
            <div>
              <p className="m-0 font-bold underline uppercase">{namaBhabinkamtibmas || 'AIPDA EVODIUS'}</p>
              <p className="m-0 text-[10px] font-sans font-semibold text-slate-800">
                NRP. {nrpBhabinkamtibmas || '84050233'}
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-between">
            <div>
              <p className="m-0">Mengetahui,</p>
              <p className="m-0 font-bold uppercase">BABINSA KORAMIL</p>
              <p className="m-0 text-[10px] text-slate-600">Metro Timur</p>
            </div>
            <div className="h-20 my-1" />
            <div>
              <p className="m-0 font-bold underline uppercase">{namaBabinsa || 'SERDA RUSIDI'}</p>
              <p className="m-0 text-[10px] text-slate-500">Babinsa Koramil</p>
            </div>
          </div>

          <div className="flex flex-col justify-between">
            <div>
              <p className="m-0">Metro, {formatTanggalIndonesia(laporan.tanggalLaporan)}</p>
              <p className="m-0 font-bold uppercase">PELAPOR / KETUA RW 018</p>
              <p className="m-0 text-[10px] text-slate-600">Kampung Banten</p>
            </div>
            <div className="h-20 my-1" />
            <div>
              <p className="m-0 font-bold underline uppercase">EKO PURWANTO</p>
              <p className="m-0 text-[10px] text-slate-500">Ketua RW 018</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="pt-8 flex justify-between font-sans text-xs">
          <div className="text-center w-56">
            <p className="m-0">Mengetahui,</p>
            <p className="m-0 font-bold uppercase">BHABINKAMTIBMAS</p>
            <p className="m-0 text-[11px] text-slate-600">Kelurahan Iringmulyo</p>
            <div className="h-20" />
            <p className="m-0 font-bold underline uppercase">{namaBhabinkamtibmas || 'AIPDA EVODIUS'}</p>
            <p className="m-0 text-[10px] sm:text-[11px] font-sans font-semibold text-slate-800">
              NRP. {nrpBhabinkamtibmas || '84050233'}
            </p>
          </div>

          <div className="text-center w-56">
            <p className="m-0">Metro, {formatTanggalIndonesia(laporan.tanggalLaporan)}</p>
            <p className="m-0 font-bold uppercase">PELAPOR</p>
            <p className="m-0 font-bold">KETUA RW 018</p>
            <div className="h-20" />
            <p className="m-0 font-bold underline uppercase">EKO PURWANTO</p>
            <p className="m-0 text-[10px] text-slate-500 font-sans">Ketua RW 018</p>
          </div>
        </div>
      )}
    </div>
  );
};

export const LaporanKejadianView: React.FC<LaporanKejadianViewProps> = ({
  profile,
  laporanList = [],
  onSaveLaporan,
  onDeleteLaporan,
  currentUser,
  initialMode = 'list',
  onBackToKeamanan,
}) => {
  // Check authorization: ONLY user login Ketua RW / super admin and Eko Purwanto ketua RW / super admin
  const isAuthorized = currentUser ? (
    currentUser.role === 'ketua_rw' ||
    currentUser.role === 'admin_rw' ||
    currentUser.role === 'super_admin' ||
    currentUser.username.toLowerCase() === 'superadmin' ||
    currentUser.username.toLowerCase() === 'sa' ||
    currentUser.username.toLowerCase() === 'admin' ||
    currentUser.username.toLowerCase() === 'ketuarw' ||
    (currentUser.nama && currentUser.nama.toLowerCase().includes('eko purwanto'))
  ) : false;

  const [activeTab, setActiveTab] = useState<'list' | 'form'>(initialMode);
  const [editingLaporan, setEditingLaporan] = useState<LaporanKejadian | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKategori, setFilterKategori] = useState<string>('all');
  const [filterJenis, setFilterJenis] = useState<string>('all');
  const [filterRt, setFilterRt] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');

  // Modals
  const [previewLaporan, setPreviewLaporan] = useState<LaporanKejadian | null>(null);
  const [shareLaporan, setShareLaporan] = useState<LaporanKejadian | null>(null);
  const [namaBhabinkamtibmas, setNamaBhabinkamtibmas] = useState('Aipda Evodius');
  const [nrpBhabinkamtibmas, setNrpBhabinkamtibmas] = useState('84050233');
  const [namaBabinsa, setNamaBabinsa] = useState('Serda Rusidi');
  const [sertakanBabinsa, setSertakanBabinsa] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showConfirmSaveModal, setShowConfirmSaveModal] = useState(false);
  const [aiNotes, setAiNotes] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiGeneratedText, setAiGeneratedText] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfProgressMsg, setPdfProgressMsg] = useState('');
  const [pdfSuccessToast, setPdfSuccessToast] = useState<string | null>(null);
  const [pdfErrorToast, setPdfErrorToast] = useState<string | null>(null);
  const [generatingPdfTarget, setGeneratingPdfTarget] = useState<LaporanKejadian | null>(null);

  // State Modal Aksi Unduh / Simpan Berkas PDF Khusus HP & Perangkat
  interface DownloadReadyModalInfo {
    filename: string;
    blob: Blob;
    blobUrl: string;
    file: File;
    dataUri: string;
    laporan: LaporanKejadian;
    fileSizeBytes: number;
  }
  const [downloadReadyModal, setDownloadReadyModal] = useState<DownloadReadyModalInfo | null>(null);

  // Form State
  const defaultToday = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState<LaporanKejadian>({
    id: '',
    nomorLaporan: '',
    tanggalLaporan: defaultToday,
    pelaporNama: 'Eko Purwanto',
    pelaporJabatan: 'Ketua RW 018',
    wilayah: 'RW 018 Kampung Banten',
    kelurahan: 'Iringmulyo',
    kecamatan: 'Metro Timur',
    kota: 'Metro',
    tujuanLaporan: ['Lurah Iringmulyo', 'Kapolsek Metro Timur'],
    jenisKejadian: 'Pencurian',
    jenisKejadianLainnya: '',
    hariKejadian: getHariIndonesia(defaultToday),
    tanggalKejadian: defaultToday,
    waktuKejadian: '02:00 WIB',
    lokasiKejadian: '',
    rt: '040',
    rw: '018',
    alamatLengkap: '',
    korban: [
      {
        id: 'korban-1',
        nama: '',
        nik: '',
        alamat: '',
        rtRw: '040/018',
        noHp: '',
        status: 'Korban',
      },
    ],
    kronologi: '',
    korbanJiwa: 'Tidak ada',
    jumlahKorbanJiwa: 0,
    korbanLuka: 'Tidak ada',
    jumlahKorbanLuka: 0,
    kerugianMateri: 'Tidak ada',
    nilaiKerugian: 0,
    kerusakan: '',
    tindakan: ['Menghubungi Ketua RT', 'Mengamankan lokasi'],
    tindakanLainnya: '',
    uraianTindakan: '',
    saksi: [
      { id: 'saksi-1', nama: '', alamat: '', noHp: '' },
      { id: 'saksi-2', nama: '', alamat: '', noHp: '' },
    ],
    dokumentasi: [],
    keteranganTambahan: '',
    status: 'Sudah Dibuat',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'Eko Purwanto (Ketua RW 018)',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canCreateEdit = isAuthorized;
  const canDelete = isAuthorized;

  // Initialize new form
  const initNewForm = () => {
    const nextNomor = generateNextNomorLaporan(laporanList, defaultToday);
    setFormData({
      id: generateId('lap'),
      nomorLaporan: nextNomor,
      tanggalLaporan: defaultToday,
      pelaporNama: 'Eko Purwanto',
      pelaporJabatan: 'Ketua RW 018',
      wilayah: 'RW 018 Kampung Banten',
      kelurahan: 'Iringmulyo',
      kecamatan: 'Metro Timur',
      kota: 'Metro',
      tujuanLaporan: ['Lurah Iringmulyo', 'Kapolsek Metro Timur'],
      jenisKejadian: 'Pencurian',
      jenisKejadianLainnya: '',
      hariKejadian: getHariIndonesia(defaultToday),
      tanggalKejadian: defaultToday,
      waktuKejadian: '02:00 WIB',
      lokasiKejadian: '',
      rt: '040',
      rw: '018',
      alamatLengkap: '',
      korban: [
        {
          id: generateId('kb'),
          nama: '',
          nik: '',
          alamat: '',
          rtRw: '040/018',
          noHp: '',
          status: 'Korban',
        },
      ],
      kronologi: '',
      korbanJiwa: 'Tidak ada',
      jumlahKorbanJiwa: 0,
      korbanLuka: 'Tidak ada',
      jumlahKorbanLuka: 0,
      kerugianMateri: 'Tidak ada',
      nilaiKerugian: 0,
      kerusakan: '',
      tindakan: ['Menghubungi Ketua RT', 'Mengamankan lokasi'],
      tindakanLainnya: '',
      uraianTindakan: '',
      saksi: [
        { id: generateId('sk'), nama: '', alamat: '', noHp: '' },
        { id: generateId('sk'), nama: '', alamat: '', noHp: '' },
      ],
      dokumentasi: [],
      keteranganTambahan: '',
      status: 'Baru',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: currentUser ? `${currentUser.nama} (${currentUser.roleLabel})` : 'Eko Purwanto (Ketua RW 018)',
    });
    setEditingLaporan(null);
    setFormErrors({});
  };

  // Quick Status Change on Card
  const handleQuickStatusChange = (lap: LaporanKejadian, newStatus: StatusLaporanKejadian) => {
    if (lap.status === newStatus) return;
    const updated: LaporanKejadian = {
      ...lap,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };
    onSaveLaporan(updated);
    setPdfSuccessToast(`Status laporan ${lap.nomorLaporan} berhasil diubah menjadi "${newStatus}".`);
    setTimeout(() => setPdfSuccessToast(null), 3500);
  };

  // Open Edit
  const handleEdit = (lap: LaporanKejadian) => {
    setEditingLaporan(lap);
    setFormData({ ...lap });
    setFormErrors({});
    setActiveTab('form');
  };

  // Form Validation
  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.nomorLaporan?.trim()) {
      errs.nomorLaporan = 'Nomor laporan wajib diisi/dibuat otomatis.';
    }
    if (!formData.tujuanLaporan || formData.tujuanLaporan.length === 0) {
      errs.tujuanLaporan = 'Pilih minimal satu tujuan laporan (Lurah, Camat, atau Kapolsek).';
    }
    if (formData.jenisKejadian === 'Kejadian Lainnya' && !formData.jenisKejadianLainnya?.trim()) {
      errs.jenisKejadianLainnya = 'Sebutkan jenis kejadian secara spesifik.';
    }
    if (!formData.tanggalKejadian) {
      errs.tanggalKejadian = 'Tanggal kejadian wajib diisi.';
    }
    if (!formData.waktuKejadian?.trim()) {
      errs.waktuKejadian = 'Jam/waktu kejadian wajib diisi (misal: 02:30 WIB).';
    }
    if (!formData.lokasiKejadian?.trim()) {
      errs.lokasiKejadian = 'Lokasi kejadian (nama jalan / gang) wajib diisi.';
    }
    if (!formData.alamatLengkap?.trim()) {
      errs.alamatLengkap = 'Alamat lengkap lokasi kejadian wajib diisi.';
    }
    if (!formData.kronologi?.trim() || formData.kronologi.trim().length < 15) {
      errs.kronologi = 'Uraian kronologis kejadian wajib diisi minimal 15 karakter.';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Action: Save handler
  const handleConfirmSave = (shouldPrintAfter: boolean = false) => {
    if (!validateForm()) {
      setShowConfirmSaveModal(false);
      return;
    }
    const finalItem: LaporanKejadian = {
      ...formData,
      id: formData.id || generateId('lap'),
      updatedAt: new Date().toISOString(),
    };
    onSaveLaporan(finalItem);
    setShowConfirmSaveModal(false);

    if (shouldPrintAfter) {
      setPreviewLaporan(finalItem);
      // Pemicu otomatis pembuatan & dialog penyimpanan file PDF resmi ke HP/perangkat
      generateAndSharePdf(finalItem, 'download');
    } else {
      setActiveTab('list');
    }
  };

  // Checkbox Tujuan Toggle
  const toggleTujuan = (tujuan: string) => {
    setFormData((prev) => {
      const exists = prev.tujuanLaporan.includes(tujuan);
      const updated = exists
        ? prev.tujuanLaporan.filter((t) => t !== tujuan)
        : [...prev.tujuanLaporan, tujuan];
      return { ...prev, tujuanLaporan: updated };
    });
  };

  // Checkbox Tindakan Toggle
  const toggleTindakan = (tindakan: string) => {
    setFormData((prev) => {
      const exists = prev.tindakan.includes(tindakan);
      const updated = exists
        ? prev.tindakan.filter((t) => t !== tindakan)
        : [...prev.tindakan, tindakan];
      return { ...prev, tindakan: updated };
    });
  };

  // Pihak Terkait / Korban management
  const addKorbanRow = () => {
    setFormData((prev) => ({
      ...prev,
      korban: [
        ...prev.korban,
        {
          id: generateId('kb'),
          nama: '',
          nik: '',
          alamat: '',
          rtRw: `${prev.rt}/018`,
          noHp: '',
          status: 'Korban',
        },
      ],
    }));
  };

  const removeKorbanRow = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      korban: prev.korban.filter((_, i) => i !== idx),
    }));
  };

  const updateKorbanField = (idx: number, field: keyof KorbanPihakTerkait, val: any) => {
    setFormData((prev) => {
      const nextKorban = [...prev.korban];
      nextKorban[idx] = { ...nextKorban[idx], [field]: val };
      return { ...prev, korban: nextKorban };
    });
  };

  // Saksi management
  const addSaksiRow = () => {
    setFormData((prev) => ({
      ...prev,
      saksi: [
        ...prev.saksi,
        { id: generateId('sk'), nama: '', alamat: '', noHp: '' },
      ],
    }));
  };

  const removeSaksiRow = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      saksi: prev.saksi.filter((_, i) => i !== idx),
    }));
  };

  const updateSaksiField = (idx: number, field: keyof SaksiKejadian, val: string) => {
    setFormData((prev) => {
      const nextSaksi = [...prev.saksi];
      nextSaksi[idx] = { ...nextSaksi[idx], [field]: val };
      return { ...prev, saksi: nextSaksi };
    });
  };

  // File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const currentLapId = formData.id || 'temp';
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const dok = await uploadDokumentasiKejadian(file, currentLapId);
        setFormData((prev) => ({
          ...prev,
          dokumentasi: [...prev.dokumentasi, dok],
        }));
      }
    } catch (err) {
      console.error('File upload error:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeDokumentasi = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      dokumentasi: prev.dokumentasi.filter((_, i) => i !== idx),
    }));
  };

  // AI Chronology Generator Handler
  const handleGenerateAiChronology = async () => {
    if (!aiNotes.trim()) return;
    setIsAiProcessing(true);
    try {
      const generated = await buildKronologiWithAI(aiNotes, {
        jenisKejadian: formData.jenisKejadian === 'Kejadian Lainnya' ? formData.jenisKejadianLainnya : formData.jenisKejadian,
        lokasi: formData.lokasiKejadian,
        tanggal: formData.tanggalKejadian,
        waktu: formData.waktuKejadian,
        hari: formData.hariKejadian,
        rt: formData.rt,
      });
      setAiGeneratedText(generated);
    } catch (err) {
      console.error('AI error:', err);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const applyAiChronology = () => {
    if (aiGeneratedText) {
      setFormData((prev) => ({
        ...prev,
        kronologi: aiGeneratedText,
      }));
      setShowAiModal(false);
      setAiNotes('');
      setAiGeneratedText('');
    }
  };

  // Helper pengunduhan fisik file PDF ke penyimpanan HP / Perangkat dengan multi-tier fallback
  const downloadPdfFileToDevice = async (
    pdf: jsPDF,
    blob: Blob,
    file: File,
    filename: string,
    isMobile: boolean,
    lap: LaporanKejadian
  ) => {
    const blobUrl = URL.createObjectURL(blob);
    const dataUri = pdf.output('datauristring');

    // Selalu siapkan modal aksi unduh HP agar pengguna memiliki tombol fisik yang 100% aktif
    setDownloadReadyModal({
      filename,
      blob,
      blobUrl,
      file,
      dataUri,
      laporan: lap,
      fileSizeBytes: blob.size,
    });

    // 1. Eksekusi unduhan via elemen <a> HTML5 standar (browser desktop & modern mobile)
    try {
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = blobUrl;
      a.download = filename;
      a.setAttribute('download', filename);
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        try {
          document.body.removeChild(a);
        } catch {}
      }, 1500);
    } catch (anchorErr) {
      console.warn('Anchor download fallback error:', anchorErr);
    }

    // 2. Eksekusi pdf.save internal sebagai upaya tambahan
    try {
      pdf.save(filename);
    } catch (saveErr) {
      console.warn('pdf.save error:', saveErr);
    }

    // 3. Khusus di HP (Android / iOS): Panggil Web Share API jika didukung untuk menyimpan langsung ke memori HP
    // Pada Android: Pengguna bisa memilih "Simpan ke Perangkat / Files by Google / Download / Drive"
    // Pada iPhone: Pengguna bisa memilih "Simpan ke File (Save to Files)"
    if (isMobile && typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        setPdfProgressMsg('Membuka menu penyimpanan sistem HP...');
        await navigator.share({
          title: `Simpan Dokumen: ${filename}`,
          text: `Berkas resmi format kertas A4 Laporan Kejadian RW 018 Kampung Banten.`,
          files: [file],
        });
        setPdfSuccessToast(`Berkas PDF resmi (${filename}) siap di memori HP Anda.`);
      } catch (shareErr: any) {
        if (shareErr?.name !== 'AbortError') {
          console.warn('Native share error:', shareErr);
        }
      }
    }
  };

  // Helper untuk menyisipkan lapisan teks yang dapat dicari (Searchable PDF Text Layer)
  // Memungkinkan berkas PDF di HP/komputer dapat dicari (Ctrl+F / Search) nomor laporan, tanggal, nama, dan kronologinya.
  const injectSearchableTextToPdf = (pdf: jsPDF, lap: LaporanKejadian) => {
    try {
      const textLines: string[] = [
        'PEMERINTAH KOTA METRO',
        'KECAMATAN METRO TIMUR',
        'KELURAHAN IRINGMULYO',
        'RUKUN WARGA 018 KAMPUNG BANTEN',
        'SURAT LAPORAN KEJADIAN RESMI KEDINASAN',
        `Nomor Laporan: ${lap.nomorLaporan}`,
        `Sifat: PENTING / SEGERA`,
        `Lampiran: 1 (Satu) Berkas Dokumen Resmi Format Kertas A4`,
        `Perihal: Laporan Kejadian ${lap.jenisKejadian}`,
        `Tanggal Laporan: ${lap.tanggalLaporan}`,
        `Tujuan Laporan: ${(lap.tujuanLaporan || []).join(', ')}`,
        'I. DATA PELAPOR',
        `Nama Pelapor: ${lap.pelaporNama}`,
        `Jabatan Pelapor: ${lap.pelaporJabatan}`,
        `Wilayah Pelapor: ${lap.wilayah || 'RW 018 Kampung Banten'}, Kelurahan ${lap.kelurahan || 'Iringmulyo'}, Kecamatan ${lap.kecamatan || 'Metro Timur'}, Kota ${lap.kota || 'Metro'}`,
        'II. WAKTU DAN LOKASI KEJADIAN',
        `Hari / Tanggal Kejadian: ${lap.hariKejadian}, ${lap.tanggalKejadian}`,
        `Waktu / Jam Kejadian: ${lap.waktuKejadian}`,
        `Lokasi Tempat Kejadian: ${lap.lokasiKejadian}`,
        `Wilayah RT / RW: RT ${lap.rt} / RW ${lap.rw}`,
        `Alamat Lengkap Kejadian: ${lap.alamatLengkap || '-'}`,
        `Jenis Kejadian: ${lap.jenisKejadian} ${lap.jenisKejadianLainnya ? `(${lap.jenisKejadianLainnya})` : ''}`,
        'III. PIHAK TERKAIT / KORBAN / SAKSI',
        ...(lap.korban || []).map(
          (k, idx) =>
            `Korban ${idx + 1}: ${k.nama || '-'} | Status: ${k.status || '-'} | NIK: ${k.nik || '-'} | Kontak: ${k.noHp || '-'} | Alamat: ${k.alamat || '-'}`
        ),
        ...(lap.saksi || []).map(
          (s, idx) =>
            `Saksi ${idx + 1}: ${s.nama || '-'} | Kontak: ${s.noHp || '-'} | Alamat: ${s.alamat || '-'}`
        ),
        'IV. URAIAN KRONOLOGI KEJADIAN',
        lap.kronologi || '-',
        'V. AKIBAT KEJADIAN DAN KERUGIAN',
        `Korban Jiwa: ${lap.korbanJiwa} (${lap.jumlahKorbanJiwa || 0} orang)`,
        `Korban Luka: ${lap.korbanLuka} (${lap.jumlahKorbanLuka || 0} orang)`,
        `Kerugian Materiil: ${lap.kerugianMateri} (Nilai: Rp ${lap.nilaiKerugian ? lap.nilaiKerugian.toLocaleString('id-ID') : '0'})`,
        `Kerusakan Fasilitas / Bangunan: ${lap.kerusakan || '-'}`,
        'VI. TINDAKAN YANG TELAH DIAMBIL',
        ...(lap.tindakan || []).map((t) => `- Tindakan: ${t}`),
        `Uraian Tindakan: ${lap.uraianTindakan || '-'}`,
        'VII. KETERANGAN DAN CATATAN TAMBAHAN',
        lap.keteranganTambahan || '-',
        `Status Penanganan Laporan: ${lap.status}`,
        'LEMBAR PENGESAHAN DOKUMEN RESMI',
        'Ketua RW 018 Kampung Banten (Eko Purwanto)',
        `Bhabinkamtibmas Kelurahan Iringmulyo (${namaBhabinkamtibmas})`,
        sertakanBabinsa ? `Babinsa Kelurahan Iringmulyo (${namaBabinsa})` : '',
        `Pelapor (${lap.pelaporNama})`,
      ];

      pdf.setPage(1);
      pdf.setFontSize(8);
      let curY = 10;
      for (const section of textLines) {
        if (!section || !section.trim()) continue;
        const splitText = pdf.splitTextToSize(section, 185);
        for (const line of splitText) {
          pdf.text(line, 12, curY, { renderingMode: 'invisible' });
          curY += 3.8;
          if (curY > 285) {
            curY = 10;
          }
        }
      }
    } catch (textErr) {
      console.warn('Gagal menyisipkan lapisan teks pencarian PDF:', textErr);
    }
  };

  // PDF Generation & Sharing Handler: Unduh ke HP Dulu ➔ Lalu Teruskan Sesuai Opsi
  type ShareTarget = 'whatsapp' | 'instagram' | 'email' | 'telegram' | 'download' | 'share';

  const generateAndSharePdf = async (
    lap: LaporanKejadian,
    target: ShareTarget = 'download'
  ) => {
    setIsGeneratingPdf(true);
    setPdfProgressMsg('Membuat PDF...');
    setPdfErrorToast(null);

    try {
      // Always render offscreen element with exact fixed A4 width (794px)
      setGeneratingPdfTarget(lap);
      await new Promise((resolve) => setTimeout(resolve, 400));
      let targetEl = document.getElementById('laporan-a4-offscreen-document');
      if (!targetEl) {
        targetEl = document.getElementById('laporan-a4-official-document');
      }

      if (!targetEl) {
        throw new Error('Elemen dokumen cetak A4 tidak ditemukan.');
      }

      setPdfProgressMsg('Membuat PDF...');
      const canvas = await html2canvas(targetEl, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794,
        onclone: (clonedDoc) => {
          const clonedContainer = clonedDoc.getElementById('laporan-pdf-render-container');
          if (clonedContainer) {
            clonedContainer.style.opacity = '1';
            clonedContainer.style.zIndex = '1';
          }
        },
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const imgData = canvas.toDataURL('image/jpeg', 0.96);

      const totalPages = Math.max(1, Math.ceil(imgHeight / pageHeight));

      if (imgHeight <= pageHeight) {
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      } else {
        let heightLeft = imgHeight;
        let position = 0;
        let currentPage = 1;

        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);

        // Nomor halaman jika dokumen lebih dari satu halaman
        if (totalPages > 1) {
          pdf.setFontSize(8);
          pdf.setTextColor(100, 100, 100);
          pdf.text(`Halaman ${currentPage} dari ${totalPages}`, pageWidth - 25, pageHeight - 6, { align: 'right' });
        }

        heightLeft -= pageHeight;
        while (heightLeft > 0) {
          position = -(currentPage * pageHeight);
          pdf.addPage();
          currentPage++;
          pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);

          if (totalPages > 1) {
            pdf.setFontSize(8);
            pdf.setTextColor(100, 100, 100);
            pdf.text(`Halaman ${currentPage} dari ${totalPages}`, pageWidth - 25, pageHeight - 6, { align: 'right' });
          }

          heightLeft -= pageHeight;
        }
      }

      // Sisipkan lapisan teks yang dapat dicari (Searchable PDF OCR Text Layer)
      // Memastikan nomor laporan, nama warga, tanggal, dan kronologi dapat dicari via Ctrl+F / Search bar
      injectSearchableTextToPdf(pdf, lap);

      // Nama file PDF dibuat otomatis berdasarkan data laporan:
      // Contoh: Laporan-Kejadian-RW018-001-11-09-2026.pdf
      const filename = formatLaporanPdfFilename(lap.nomorLaporan, lap.tanggalKejadian || lap.tanggalLaporan);

      // Set Metadata Dokumen PDF agar mudah dicari & diindeks di File Manager HP/Laptop
      pdf.setProperties({
        title: `Laporan Kejadian RW 018 - ${lap.nomorLaporan}`,
        subject: `Laporan Resmi Insiden ${lap.jenisKejadian} RT ${lap.rt} RW 018 Kampung Banten`,
        author: `${lap.pelaporNama} (${lap.pelaporJabatan}) - RW 018 Kampung Banten`,
        keywords: `Laporan Kejadian, ${lap.nomorLaporan}, ${lap.jenisKejadian}, RT ${lap.rt}, RW 018, Iringmulyo, Metro Timur, ${lap.lokasiKejadian}, PDF Resmi Dapat Dicari`,
        creator: 'Sistem Administrasi Ketua RW 018 Kampung Banten',
      });

      const blob = pdf.output('blob');
      const file = new File([blob], filename, { type: 'application/pdf' });

      const isMobileDevice = typeof window !== 'undefined' && (
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        (navigator.maxTouchPoints && navigator.maxTouchPoints > 1) ||
        window.innerWidth < 768
      );

      // LANGKAH 1: SELALU UNDUH & SIMPAN KE PENYIMPANAN HP / PERANGKAT TERLEBIH DAHULU
      await downloadPdfFileToDevice(pdf, blob, file, filename, isMobileDevice, lap);

      // Jika opsi hanya unduh / simpan ke memori HP:
      if (target === 'download') {
        setPdfSuccessToast('✅ PDF berhasil dibuat dan di-download.');
        setTimeout(() => setPdfSuccessToast(null), 5000);
        return;
      }

      // Berikan jeda sejenak agar pengunduhan di HP diproses oleh browser
      await new Promise((resolve) => setTimeout(resolve, 400));

      // LANGKAH 2: TERUSKAN KE APLIKASI SESUAI OPSI YANG DIPILIH PENGGUNA

      // OPSI: WHATSAPP
      if (target === 'whatsapp') {
        setPdfProgressMsg('File PDF tersimpan di HP. Meneruskan ke WhatsApp...');
        let shareSuccess = false;
        if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: `Laporan Kejadian RW 018 - ${lap.nomorLaporan}`,
              files: [file],
            });
            shareSuccess = true;
            setPdfSuccessToast(`File PDF tersimpan di HP & berhasil diteruskan ke WhatsApp.`);
          } catch (e: any) {
            if (e?.name === 'AbortError') {
              setPdfSuccessToast(`File PDF telah tersimpan di HP (${filename}).`);
              return;
            }
          }
        }

        if (!shareSuccess) {
          if (isMobileDevice) {
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`*Laporan Kejadian Resmi RW 018 Kampung Banten*\nNomor: ${lap.nomorLaporan}\nJenis: ${lap.jenisKejadian}\n\n(Berkas fisik 1 file PDF resmi A4 telah tersimpan di HP, silakan lampirkan dokumen tersebut)`)}`, '_blank');
          } else {
            window.open('https://web.whatsapp.com/', '_blank');
          }
          setPdfSuccessToast(`File PDF telah tersimpan di HP/Perangkat. Silakan lampirkan file PDF dari folder Download ke chat WhatsApp.`);
        }
        setTimeout(() => setPdfSuccessToast(null), 5000);
        return;
      }

      // OPSI: INSTAGRAM (IG)
      if (target === 'instagram') {
        setPdfProgressMsg('File PDF tersimpan di HP. Meneruskan ke Instagram...');
        let shareSuccess = false;
        if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: `Laporan Kejadian RW 018 - ${lap.nomorLaporan}`,
              files: [file],
            });
            shareSuccess = true;
            setPdfSuccessToast(`File PDF tersimpan di HP & berhasil diteruskan ke Instagram.`);
          } catch (e: any) {
            if (e?.name === 'AbortError') {
              setPdfSuccessToast(`File PDF telah tersimpan di HP (${filename}).`);
              return;
            }
          }
        }

        if (!shareSuccess) {
          window.open('https://www.instagram.com/', '_blank');
          setPdfSuccessToast(`File PDF telah tersimpan di HP. Silakan buka Instagram dan lampirkan/unggah dokumen laporan.`);
        }
        setTimeout(() => setPdfSuccessToast(null), 5000);
        return;
      }

      // OPSI: EMAIL / GMAIL
      if (target === 'email') {
        setPdfProgressMsg('File PDF tersimpan di HP. Menyiapkan draf email...');
        let shareSuccess = false;
        if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: `Laporan Kejadian RW 018 - ${lap.nomorLaporan}`,
              files: [file],
            });
            shareSuccess = true;
            setPdfSuccessToast(`File PDF tersimpan di HP & berhasil diteruskan ke Email.`);
          } catch (e: any) {
            if (e?.name === 'AbortError') {
              setPdfSuccessToast(`File PDF telah tersimpan di HP (${filename}).`);
              return;
            }
          }
        }

        if (!shareSuccess) {
          const subject = encodeURIComponent(`Laporan Kejadian Resmi RW 018 - Nomor: ${lap.nomorLaporan}`);
          const body = encodeURIComponent(
            `Kepada Yth. Pihak Terkait,\n\nBersama ini kami lampirkan dokumen resmi Laporan Kejadian RW 018 format kertas A4.\nNomor: ${lap.nomorLaporan}\nJenis Kejadian: ${lap.jenisKejadian}\n\n(Berkas fisik 1 file PDF resmi telah tersimpan di HP/Perangkat. Silakan lampirkan file dari folder Download).\n\nHormat kami,\nPengurus RW 018 Kampung Banten`
          );
          window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
          setPdfSuccessToast(`File PDF telah tersimpan di HP. Silakan lampirkan berkas dari folder Download ke draf email.`);
        }
        setTimeout(() => setPdfSuccessToast(null), 5000);
        return;
      }

      // OPSI: TELEGRAM
      if (target === 'telegram') {
        setPdfProgressMsg('File PDF tersimpan di HP. Meneruskan ke Telegram...');
        let shareSuccess = false;
        if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: `Laporan Kejadian RW 018 - ${lap.nomorLaporan}`,
              files: [file],
            });
            shareSuccess = true;
            setPdfSuccessToast(`File PDF tersimpan di HP & berhasil diteruskan ke Telegram.`);
          } catch (e: any) {
            if (e?.name === 'AbortError') {
              setPdfSuccessToast(`File PDF telah tersimpan di HP (${filename}).`);
              return;
            }
          }
        }

        if (!shareSuccess) {
          if (isMobileDevice) {
            window.open(`https://t.me/share/url?text=${encodeURIComponent(`Laporan Kejadian Resmi RW 018 - Nomor: ${lap.nomorLaporan}`)}`, '_blank');
          } else {
            window.open('https://web.telegram.org/', '_blank');
          }
          setPdfSuccessToast(`File PDF telah tersimpan di HP. Silakan lampirkan berkas dari folder Download ke Telegram.`);
        }
        setTimeout(() => setPdfSuccessToast(null), 5000);
        return;
      }

      // OPSI: SHARE UMUM / WEB SHARE
      let shareCompleted = false;
      if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
        setPdfProgressMsg('File PDF tersimpan di HP. Membuka menu bagikan perangkat...');
        try {
          await navigator.share({
            title: `Laporan Kejadian RW 018 - ${lap.nomorLaporan}`,
            files: [file],
          });
          shareCompleted = true;
          setPdfSuccessToast('File PDF tersimpan di HP & berhasil dibagikan.');
          setTimeout(() => setPdfSuccessToast(null), 4500);
        } catch (shareErr: any) {
          if (shareErr?.name === 'AbortError') {
            setPdfSuccessToast(`File PDF telah tersimpan di HP (${filename}).`);
            return;
          }
          console.warn('Web Share API error:', shareErr);
        }
      }

      if (!shareCompleted) {
        setShareLaporan(lap);
        setPdfSuccessToast(`1 Berkas PDF resmi (${filename}) tersimpan di HP. Silakan pilih aplikasi pengiriman.`);
        setTimeout(() => setPdfSuccessToast(null), 5000);
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.warn('Share PDF error:', err);
        setPdfErrorToast('❌ PDF gagal dibuat. Silakan coba lagi.');
        setTimeout(() => setPdfErrorToast(null), 5000);
        setShareLaporan(lap);
      }
    } finally {
      setIsGeneratingPdf(false);
      setPdfProgressMsg('');
      setGeneratingPdfTarget(null);
    }
  };

  const handleShareToWhatsApp = (lap: LaporanKejadian) => generateAndSharePdf(lap, 'whatsapp');
  const handleShareToInstagram = (lap: LaporanKejadian) => generateAndSharePdf(lap, 'instagram');
  const handleShareToTelegram = (lap: LaporanKejadian) => generateAndSharePdf(lap, 'telegram');
  const handleShareToEmail = (lap: LaporanKejadian) => generateAndSharePdf(lap, 'email');
  const handleDownloadToDevice = (lap: LaporanKejadian) => generateAndSharePdf(lap, 'download');
  const handleWebShare = (lap: LaporanKejadian) => generateAndSharePdf(lap, 'share');

  // Filtered List dengan Pencarian Mendalam & Filter Tanggal / Kategori
  const filteredList = useMemo(() => {
    return laporanList.filter((lap) => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      const cleanNomor = (lap.nomorLaporan || '').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
      const filename = `laporan_kejadian_rw018_${cleanNomor}.pdf`;

      const matchQuery =
        !q ||
        lap.nomorLaporan.toLowerCase().includes(q) ||
        lap.jenisKejadian.toLowerCase().includes(q) ||
        (lap.jenisKejadianLainnya && lap.jenisKejadianLainnya.toLowerCase().includes(q)) ||
        lap.lokasiKejadian.toLowerCase().includes(q) ||
        lap.rt.includes(q) ||
        lap.tanggalKejadian.includes(q) ||
        lap.tanggalLaporan.includes(q) ||
        (lap.pelaporNama && lap.pelaporNama.toLowerCase().includes(q)) ||
        (lap.alamatLengkap && lap.alamatLengkap.toLowerCase().includes(q)) ||
        (lap.kronologi && lap.kronologi.toLowerCase().includes(q)) ||
        (lap.uraianTindakan && lap.uraianTindakan.toLowerCase().includes(q)) ||
        (lap.keteranganTambahan && lap.keteranganTambahan.toLowerCase().includes(q)) ||
        lap.korban.some((k) => k.nama.toLowerCase().includes(q) || (k.alamat && k.alamat.toLowerCase().includes(q))) ||
        lap.saksi.some((s) => s.nama.toLowerCase().includes(q)) ||
        filename.includes(q) ||
        (q === 'pdf' && true);

      // Kategori filter
      let matchKategori = true;
      if (filterKategori !== 'all') {
        const katObj = DAFTAR_KATEGORI_LAPORAN.find((k) => k.id === filterKategori);
        if (katObj && katObj.jenisList.length > 0) {
          matchKategori = katObj.jenisList.includes(lap.jenisKejadian);
        }
      }

      // Jenis filter
      const matchJenis = filterJenis === 'all' || lap.jenisKejadian === filterJenis;
      // RT filter
      const matchRt = filterRt === 'all' || lap.rt === filterRt;
      // Status filter
      const matchStatus = filterStatus === 'all' || lap.status === filterStatus;

      // Rentang Tanggal filter (membandingkan tanggal kejadian / tanggal laporan)
      let matchDate = true;
      if (filterStartDate) {
        matchDate = matchDate && (lap.tanggalKejadian >= filterStartDate || lap.tanggalLaporan >= filterStartDate);
      }
      if (filterEndDate) {
        matchDate = matchDate && (lap.tanggalKejadian <= filterEndDate || lap.tanggalLaporan <= filterEndDate);
      }

      return matchQuery && matchKategori && matchJenis && matchRt && matchStatus && matchDate;
    });
  }, [laporanList, searchQuery, filterKategori, filterJenis, filterRt, filterStatus, filterStartDate, filterEndDate]);

  // Statistics Summary
  const stats = useMemo(() => {
    const total = laporanList.length;
    const baru = laporanList.filter((l) => l.status === 'Baru').length;
    const diproses = laporanList.filter((l) => l.status === 'Diproses').length;
    const selesai = laporanList.filter((l) => l.status === 'Selesai').length;
    const dilaporkan = laporanList.filter((l) => l.status === 'Sudah Dilaporkan').length;
    const dicetak = laporanList.filter((l) => l.status === 'Sudah Dicetak').length;
    const dibuat = laporanList.filter((l) => l.status === 'Sudah Dibuat').length;
    const draft = laporanList.filter((l) => l.status === 'Draft').length;
    const totalKerugian = laporanList.reduce((acc, curr) => acc + (curr.nilaiKerugian || 0), 0);
    return { total, baru, diproses, selesai, dilaporkan, dicetak, dibuat, draft, totalKerugian };
  }, [laporanList]);

  // Status Filter Aktif
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (filterKategori !== 'all') count++;
    if (filterJenis !== 'all') count++;
    if (filterRt !== 'all') count++;
    if (filterStatus !== 'all') count++;
    if (filterStartDate) count++;
    if (filterEndDate) count++;
    return count;
  }, [searchQuery, filterKategori, filterJenis, filterRt, filterStatus, filterStartDate, filterEndDate]);

  const isFiltered = activeFilterCount > 0;

  const resetAllFilters = () => {
    setSearchQuery('');
    setFilterKategori('all');
    setFilterJenis('all');
    setFilterRt('all');
    setFilterStatus('all');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  const handleSetBulanIni = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const firstDay = `${y}-${m}-01`;
    const lastDay = new Date(y, now.getMonth() + 1, 0).toISOString().slice(0, 10);
    setFilterStartDate(firstDay);
    setFilterEndDate(lastDay);
  };

  const handleSetHariIni = () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    setFilterStartDate(todayStr);
    setFilterEndDate(todayStr);
  };

  // If user is NOT authorized (only Ketua RW / super admin and Eko Purwanto)
  if (!isAuthorized) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center bg-white rounded-3xl border border-rose-200 shadow-lg mt-8 space-y-4">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200 shadow-xs">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800 border border-rose-200 tracking-wider">
            Akses Dibatasi Khusus Ketua RW & Super Admin
          </span>
          <h2 className="text-xl font-black text-slate-800">
            Laporan Kejadian RW 018
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-md mx-auto">
            Modul <strong>LAPORAN KEJADIAN RW 018</strong> ini bersifat resmi kedinasan. Sesuai ketentuan sistem, yang bisa membuka menu ini <strong>hanya user login Ketua RW / Super Admin dan Eko Purwanto (Ketua RW / Super Admin)</strong>.
          </p>
        </div>

        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs text-slate-600 space-y-1">
          <p><strong>Akun Login:</strong> {currentUser?.nama || 'Belum Login / Tamu'}</p>
          <p><strong>Peran Akun:</strong> {currentUser?.roleLabel || 'Warga'}</p>
          <p className="text-rose-600 font-bold text-[11px] pt-1">
            Status: Tidak memiliki kewenangan membuka modul ini.
          </p>
        </div>

        {onBackToKeamanan && (
          <button
            onClick={onBackToKeamanan}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Pos Keamanan
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-6 pb-20 ${previewLaporan ? 'print:hidden' : ''}`}>
      {/* HEADER UTAMA: Identitas Pemerintah & RW 018 */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
          <Shield className="w-64 h-64 text-white" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold tracking-wider text-emerald-200 uppercase">
              <span>Pemerintah Kota Metro</span>
              <span>•</span>
              <span>Kecamatan Metro Timur</span>
              <span>•</span>
              <span>Kelurahan Iringmulyo</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <FileCheck2 className="w-8 h-8 text-amber-400" />
              LAPORAN KEJADIAN RW 018
            </h1>
            <p className="text-sm text-emerald-100/90 mt-1 max-w-2xl">
              Modul resmi digitalisasi pelaporan insiden, musibah, dan gangguan kamtibmas di wilayah RW 018 Kampung Banten untuk Lurah, Camat, dan Kapolsek.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onBackToKeamanan && (
              <button
                onClick={onBackToKeamanan}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-2 border border-white/20 backdrop-blur-sm transition"
              >
                <ArrowLeft className="w-4 h-4" /> Pos Keamanan
              </button>
            )}

            {activeTab === 'list' && canCreateEdit && (
              <button
                onClick={() => {
                  initNewForm();
                  setActiveTab('form');
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-sm font-black flex items-center gap-2 shadow-lg transition transform active:scale-95"
              >
                <FilePlus className="w-4 h-4" /> Buat Laporan Baru
              </button>
            )}

            {activeTab === 'form' && (
              <button
                onClick={() => setActiveTab('list')}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-2 border border-white/20 backdrop-blur-sm transition"
              >
                <Layers className="w-4 h-4" /> Daftar Laporan ({laporanList.length})
              </button>
            )}
          </div>
        </div>

        {/* IDENTITAS OTOMATIS PELAPOR BANNER */}
        <div className="mt-5 pt-4 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-xs border border-white/10">
            <span className="text-emerald-200 block text-[10px] uppercase font-bold">Pelapor Otomatis</span>
            <span className="font-bold text-white text-sm">Eko Purwanto</span>
            <span className="text-white/80 block text-[11px]">Ketua RW 018</span>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-xs border border-white/10">
            <span className="text-emerald-200 block text-[10px] uppercase font-bold">Wilayah Pelaporan</span>
            <span className="font-bold text-white">RW 018 Kampung Banten</span>
            <span className="text-white/80 block text-[11px]">RT 039 - RT 042</span>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-xs border border-white/10">
            <span className="text-emerald-200 block text-[10px] uppercase font-bold">Kelurahan & Kecamatan</span>
            <span className="font-bold text-white">Kel. Iringmulyo</span>
            <span className="text-white/80 block text-[11px]">Kec. Metro Timur</span>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-xs border border-white/10">
            <span className="text-emerald-200 block text-[10px] uppercase font-bold">Database Terintegrasi</span>
            <span className="font-bold text-white">Firebase Firestore</span>
            <span className="text-emerald-300 block text-[11px]">Online & Sinkron Realtime</span>
          </div>
        </div>
      </div>

      {/* VIEW 1: DAFTAR LAPORAN KEJADIAN */}
      {activeTab === 'list' && (
        <div className="space-y-6">
          {/* STATISTIK RINGKAS BERDASARKAN STATUS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`text-left bg-white p-4 rounded-2xl border transition-all cursor-pointer shadow-xs hover:shadow-md flex items-center gap-3.5 ${
                filterStatus === 'all'
                  ? 'border-slate-800 ring-2 ring-slate-300 bg-slate-50/50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase block tracking-wider">Total Laporan</span>
                <span className="text-2xl font-black text-slate-900">{stats.total}</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setFilterStatus(filterStatus === 'Baru' ? 'all' : 'Baru')}
              className={`text-left bg-white p-4 rounded-2xl border transition-all cursor-pointer shadow-xs hover:shadow-md flex items-center gap-3.5 ${
                filterStatus === 'Baru'
                  ? 'border-blue-600 ring-2 ring-blue-300 bg-blue-50/60'
                  : 'border-slate-200 hover:border-blue-300'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs shadow-blue-500/20 shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-extrabold text-blue-700 uppercase tracking-wider block">Laporan Baru</span>
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                </div>
                <span className="text-2xl font-black text-blue-900">{stats.baru}</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setFilterStatus(filterStatus === 'Diproses' ? 'all' : 'Diproses')}
              className={`text-left bg-white p-4 rounded-2xl border transition-all cursor-pointer shadow-xs hover:shadow-md flex items-center gap-3.5 ${
                filterStatus === 'Diproses'
                  ? 'border-amber-500 ring-2 ring-amber-300 bg-amber-50/60'
                  : 'border-slate-200 hover:border-amber-300'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-xs shadow-amber-500/20 shrink-0">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
              <div>
                <span className="text-[11px] font-extrabold text-amber-800 uppercase tracking-wider block">Sedang Diproses</span>
                <span className="text-2xl font-black text-amber-950">{stats.diproses}</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setFilterStatus(filterStatus === 'Selesai' ? 'all' : 'Selesai')}
              className={`text-left bg-white p-4 rounded-2xl border transition-all cursor-pointer shadow-xs hover:shadow-md flex items-center gap-3.5 ${
                filterStatus === 'Selesai'
                  ? 'border-emerald-600 ring-2 ring-emerald-300 bg-emerald-50/60'
                  : 'border-slate-200 hover:border-emerald-300'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs shadow-emerald-500/20 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-wider block">Selesai / Tuntas</span>
                <span className="text-2xl font-black text-emerald-900">{stats.selesai}</span>
              </div>
            </button>
          </div>

          {/* FILTER & PENCARIAN TERPADU */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
            {/* Baris 1: Pencarian Cepat Berkas Laporan PDF */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nomor laporan, nama warga/korban/saksi, lokasi kejadian, tanggal, kronologi, kata kunci, atau 'pdf'..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-600 shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md"
                  title="Hapus kata kunci pencarian"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Baris 2: Filter Kategori, Jenis Kejadian, Wilayah RT, dan Status */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Filter Kategori */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-slate-400" /> Kategori
                </label>
                <select
                  value={filterKategori}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFilterKategori(val);
                    if (val !== 'all') {
                      const kat = DAFTAR_KATEGORI_LAPORAN.find((k) => k.id === val);
                      if (kat && kat.jenisList.length > 0 && !kat.jenisList.includes(filterJenis as any)) {
                        setFilterJenis('all');
                      }
                    }
                  }}
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-emerald-600"
                >
                  {DAFTAR_KATEGORI_LAPORAN.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Jenis Kejadian */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-slate-400" /> Jenis Kejadian
                </label>
                <select
                  value={filterJenis}
                  onChange={(e) => setFilterJenis(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="all">Semua Jenis Kejadian</option>
                  {DAFTAR_JENIS_KEJADIAN
                    .filter((j) => {
                      if (filterKategori === 'all') return true;
                      const kat = DAFTAR_KATEGORI_LAPORAN.find((k) => k.id === filterKategori);
                      return kat ? kat.jenisList.includes(j.label) : true;
                    })
                    .map((j) => (
                      <option key={j.label} value={j.label}>
                        {j.label}
                      </option>
                    ))}
                </select>
              </div>

              {/* Filter Wilayah RT */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1 flex items-center gap-1">
                  <Building className="w-3 h-3 text-slate-400" /> Wilayah RT
                </label>
                <select
                  value={filterRt}
                  onChange={(e) => setFilterRt(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="all">Semua RT di RW 018</option>
                  <option value="039">RT 039</option>
                  <option value="040">RT 040</option>
                  <option value="041">RT 041</option>
                  <option value="042">RT 042</option>
                </select>
              </div>

              {/* Filter Status */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-slate-400" /> Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="all">Semua Status</option>
                  <option value="Baru">Baru (Laporan Masuk)</option>
                  <option value="Diproses">Diproses (Sedang Ditangani)</option>
                  <option value="Selesai">Selesai (Kasus Tuntas)</option>
                  <option value="Sudah Dilaporkan">Sudah Dilaporkan</option>
                  <option value="Sudah Dicetak">Sudah Dicetak</option>
                  <option value="Sudah Dibuat">Sudah Dibuat</option>
                  <option value="Draft">Draft (Konsep)</option>
                </select>
              </div>
            </div>

            {/* Baris 3: Rentang Tanggal & Tombol Cepat */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2.5 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 text-xs text-slate-600 font-semibold">
                  <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Rentang Tanggal:</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:ring-2 focus:ring-emerald-600"
                    title="Tanggal Awal"
                  />
                  <span className="text-xs text-slate-400">s/d</span>
                  <input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:ring-2 focus:ring-emerald-600"
                    title="Tanggal Akhir"
                  />
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleSetHariIni}
                    className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                  >
                    Hari Ini
                  </button>
                  <button
                    type="button"
                    onClick={handleSetBulanIni}
                    className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                  >
                    Bulan Ini
                  </button>
                  {(filterStartDate || filterEndDate) && (
                    <button
                      type="button"
                      onClick={() => {
                        setFilterStartDate('');
                        setFilterEndDate('');
                      }}
                      className="px-2 py-1 text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
                    >
                      Hapus Tanggal
                    </button>
                  )}
                </div>
              </div>

              {isFiltered && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Filter ({activeFilterCount})
                </button>
              )}
            </div>

            {/* Filter Cepat Berdasarkan Badge Status */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs pt-2.5 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 shrink-0 flex items-center gap-1 mr-1">
                <Tag className="w-3 h-3 text-slate-400" /> Filter Status:
              </span>
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  filterStatus === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Semua ({laporanList.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('Baru')}
                className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  filterStatus === 'Baru'
                    ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-300'
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
                <Sparkles className="w-3 h-3" /> Baru ({laporanList.filter((l) => l.status === 'Baru').length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('Diproses')}
                className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  filterStatus === 'Diproses'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs ring-2 ring-amber-300'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
                }`}
              >
                <Loader2 className="w-3 h-3 animate-spin" /> Diproses ({laporanList.filter((l) => l.status === 'Diproses').length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('Selesai')}
                className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  filterStatus === 'Selesai'
                    ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-300'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" /> Selesai ({laporanList.filter((l) => l.status === 'Selesai').length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('Sudah Dilaporkan')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  filterStatus === 'Sudah Dilaporkan'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                }`}
              >
                <Send className="w-3 h-3" /> Dilaporkan ({laporanList.filter((l) => l.status === 'Sudah Dilaporkan').length})
              </button>
            </div>

            {/* Baris 4: Info Hasil & Searchable PDF Indicator */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">
                  Menemukan <strong className="text-emerald-700 font-extrabold">{filteredList.length}</strong> dari {laporanList.length} berkas laporan
                </span>
                {isFiltered && (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                    Tersaring
                  </span>
                )}
              </div>
              <div className="inline-flex items-center gap-1.5 text-[11px] text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                <FileSearch className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Seluruh berkas PDF laporan resmi dapat dicari (Searchable PDF)</span>
              </div>
            </div>
          </div>

          {/* LIST KARTU LAPORAN */}
          {filteredList.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">Belum ada laporan kejadian</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                {searchQuery || filterKategori !== 'all' || filterJenis !== 'all' || filterRt !== 'all' || filterStartDate || filterEndDate
                  ? 'Tidak ada laporan yang sesuai dengan kriteria pencarian atau filter yang dipilih.'
                  : 'Klik tombol "Buat Laporan Baru" untuk mendokumentasikan insiden resmi di RW 018.'}
              </p>
              {isFiltered && (
                <button
                  onClick={resetAllFilters}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Bersihkan Filter
                </button>
              )}
              {canCreateEdit && !isFiltered && (
                <button
                  onClick={() => {
                    initNewForm();
                    setActiveTab('form');
                  }}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition"
                >
                  <Plus className="w-4 h-4" /> Buat Laporan Pertama
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredList.map((lap) => {
                const jenisObj = DAFTAR_JENIS_KEJADIAN.find((j) => j.label === lap.jenisKejadian) || DAFTAR_JENIS_KEJADIAN[0];
                const kategoriObj = getKategoriFromJenis(lap.jenisKejadian);
                const IconComponent = jenisObj.icon;
                const statusCfg = getStatusConfig(lap.status);
                const StatusIcon = statusCfg.icon;

                return (
                  <div
                    key={lap.id}
                    className={`bg-white rounded-2xl border p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between ${statusCfg.cardBorder}`}
                  >
                    <div>
                      {/* Top Header Card */}
                      <div className="flex items-start justify-between gap-3 mb-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`p-2.5 rounded-xl border shrink-0 ${jenisObj.color}`}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-900 block truncate">
                              {lap.nomorLaporan}
                            </span>
                            <span className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3 shrink-0" /> {lap.hariKejadian}, {formatTanggalIndonesia(lap.tanggalKejadian)}
                            </span>
                          </div>
                        </div>

                        {/* Indikator Visual (Badge) Status Menonjol */}
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide border transition-all duration-200 whitespace-nowrap shadow-xs ${statusCfg.badgeBg} ${statusCfg.badgeText} ${statusCfg.badgeBorder} ${statusCfg.badgeRing}`}
                            title={statusCfg.description}
                          >
                            <span className="relative flex h-2 w-2">
                              {statusCfg.dotPulse && (
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${statusCfg.dotColor}`} />
                              )}
                              <span className={`relative inline-flex rounded-full h-2 w-2 ${statusCfg.dotColor}`} />
                            </span>
                            <StatusIcon className={`w-3.5 h-3.5 ${lap.status === 'Diproses' ? 'animate-spin' : ''}`} />
                            <span>{statusCfg.label}</span>
                          </span>

                          {/* Quick Status Selector untuk Pengurus */}
                          {canCreateEdit && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                              <span className="text-[9px] uppercase font-bold text-slate-400">Status:</span>
                              <select
                                value={lap.status}
                                onChange={(e) => handleQuickStatusChange(lap, e.target.value as StatusLaporanKejadian)}
                                className="text-[10px] font-semibold text-slate-700 hover:text-emerald-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md px-1.5 py-0.5 cursor-pointer focus:ring-1 focus:ring-emerald-500 focus:outline-hidden transition"
                                title="Ubah status penanganan laporan secara cepat"
                              >
                                <option value="Baru">Baru</option>
                                <option value="Diproses">Diproses</option>
                                <option value="Selesai">Selesai</option>
                                <option value="Sudah Dilaporkan">Sudah Dilaporkan</option>
                                <option value="Sudah Dicetak">Sudah Dicetak</option>
                                <option value="Sudah Dibuat">Sudah Dibuat</option>
                                <option value="Draft">Draft</option>
                              </select>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Kategori & PDF Searchable Tags */}
                      <div className="flex items-center gap-1.5 flex-wrap mb-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${kategoriObj.badgeColor}`}>
                          {kategoriObj.label}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          RT {lap.rt}
                        </span>
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200"
                          title="1 Berkas PDF format A4 resmi, teks dapat dicari (Ctrl+F / Search) nomor laporan, tanggal, saksi, dan kronologi"
                        >
                          <FileSearch className="w-3 h-3 text-blue-600" /> PDF Resmi (Searchable)
                        </span>
                      </div>

                      {/* Detail Info */}
                      <div className="space-y-2 text-xs border-y border-slate-100 py-3 my-2">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                          <div>
                            <span className="text-slate-500">Jenis:</span>{' '}
                            <strong className="text-slate-800">
                              {lap.jenisKejadian === 'Kejadian Lainnya'
                                ? lap.jenisKejadianLainnya || 'Kejadian Lainnya'
                                : lap.jenisKejadian}
                            </strong>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                          <div>
                            <span className="text-slate-500">Lokasi:</span>{' '}
                            <span className="text-slate-800 font-medium">
                              {lap.lokasiKejadian} (RT {lap.rt} RW 018)
                            </span>
                          </div>
                        </div>

                        {lap.korban && lap.korban.length > 0 && lap.korban[0].nama && (
                          <div className="flex items-start gap-2">
                            <Users className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                            <div>
                              <span className="text-slate-500">Korban/Pihak:</span>{' '}
                              <span className="text-slate-800 font-medium">
                                {lap.korban.map((k) => k.nama).filter(Boolean).join(', ')}
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="flex items-start gap-2">
                          <Send className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                          <div>
                            <span className="text-slate-500">Tujuan:</span>{' '}
                            <span className="text-slate-700 font-semibold">
                              {lap.tujuanLaporan.join(', ')}
                            </span>
                          </div>
                        </div>

                        {lap.kronologi && (
                          <p className="text-slate-600 text-xs line-clamp-2 bg-slate-50 p-2 rounded-lg italic">
                            "{lap.kronologi}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100 mt-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => handleDownloadToDevice(lap)}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                          title="Download Hasil Cetak Menjadi PDF A4 ke Perangkat Pengguna"
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-100" />
                          <span>📄 DOWNLOAD PDF</span>
                        </button>

                        <button
                          onClick={() => {
                            setPreviewLaporan(lap);
                            setTimeout(() => window.print(), 350);
                          }}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                          title="Cetak Laporan ke Mesin Printer atau Simpan sebagai PDF"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-300" />
                          <span>🖨️ CETAK</span>
                        </button>

                        <button
                          onClick={() => setPreviewLaporan(lap)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                          title="Lihat Dokumen Resmi A4"
                        >
                          <Eye className="w-3.5 h-3.5" /> Lihat A4
                        </button>

                        <button
                          onClick={() => setShareLaporan(lap)}
                          className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                          title="Buka Menu Bagikan Hasil Cetak 1 File PDF Resmi (A4) Sesuai Tampilan Cetak Layar"
                        >
                          <Share2 className="w-3.5 h-3.5" /> Bagikan PDF
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        {canCreateEdit && (
                          <button
                            onClick={() => handleEdit(lap)}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            title="Edit Laporan"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}

                        {canDelete && (
                          <button
                            onClick={() => {
                              if (confirm(`Hapus laporan kejadian ${lap.nomorLaporan}? Tindakan ini tidak dapat dibatalkan.`)) {
                                onDeleteLaporan(lap.id);
                              }
                            }}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Hapus Laporan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: FORM DIGITAL INPUT & EDIT LAPORAN */}
      {activeTab === 'form' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Form Header */}
          <div className="bg-slate-50 p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
                Formulir Laporan Resmi
              </span>
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-emerald-600" />
                {editingLaporan ? `Edit Laporan Kejadian: ${editingLaporan.nomorLaporan}` : 'Pembuatan Laporan Kejadian Digital'}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Batal / Kembali
              </button>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (validateForm()) {
                setShowConfirmSaveModal(true);
              }
            }}
            className="p-6 space-y-8"
          >
            {/* 1. BAGIAN IDENTITAS OTOMATIS */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <Building className="w-5 h-5 text-emerald-700" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  1. Identitas Resmi Pelapor (Otomatis)
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <label className="text-slate-500 block font-semibold mb-1">Nama Pelapor</label>
                  <input
                    type="text"
                    value={formData.pelaporNama}
                    readOnly
                    className="w-full bg-white px-3 py-2 rounded-lg border border-slate-200 text-slate-700 font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block font-semibold mb-1">Jabatan Pelapor</label>
                  <input
                    type="text"
                    value={formData.pelaporJabatan}
                    readOnly
                    className="w-full bg-white px-3 py-2 rounded-lg border border-slate-200 text-slate-700 font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block font-semibold mb-1">Wilayah / Satuan</label>
                  <input
                    type="text"
                    value={`${formData.wilayah}, Kel. ${formData.kelurahan}, Kec. ${formData.kecamatan}, Kota ${formData.kota}`}
                    readOnly
                    className="w-full bg-white px-3 py-2 rounded-lg border border-slate-200 text-slate-700 font-medium truncate"
                  />
                </div>
              </div>
            </div>

            {/* 2. TUJUAN LAPORAN */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <Send className="w-5 h-5 text-emerald-700" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  2. Tujuan Laporan <span className="text-rose-600">*</span>
                </h3>
              </div>

              <p className="text-xs text-slate-500">
                Pilih satu, dua, atau ketiga pihak yang menjadi tujuan resmi laporan ini:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {DAFTAR_TUJUAN_DEFAULT.map((tujuan) => {
                  const isChecked = formData.tujuanLaporan.includes(tujuan);
                  return (
                    <label
                      key={tujuan}
                      onClick={() => toggleTujuan(tujuan)}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                        isChecked
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-semibold">{tujuan}</span>
                    </label>
                  );
                })}
              </div>
              {formErrors.tujuanLaporan && (
                <p className="text-xs text-rose-600 font-medium">{formErrors.tujuanLaporan}</p>
              )}
            </div>

            {/* 3. NOMOR LAPORAN & JENIS KEJADIAN */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <AlertTriangle className="w-5 h-5 text-emerald-700" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  3. Nomor Laporan & Jenis Kejadian
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Nomor Laporan Otomatis (Format: 001/RW.018/IX/2026) <span className="text-rose-600">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.nomorLaporan}
                      onChange={(e) => setFormData({ ...formData, nomorLaporan: e.target.value })}
                      placeholder="001/RW.018/IX/2026"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold text-emerald-900 bg-slate-50"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newNomor = generateNextNomorLaporan(laporanList, formData.tanggalKejadian);
                        setFormData({ ...formData, nomorLaporan: newNomor });
                      }}
                      className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-xl whitespace-nowrap transition"
                      title="Hitung Ulang Nomor"
                    >
                      Perbarui No
                    </button>
                  </div>
                  {formErrors.nomorLaporan && (
                    <p className="text-xs text-rose-600 font-medium mt-1">{formErrors.nomorLaporan}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Tanggal Pembuatan Laporan
                  </label>
                  <input
                    type="date"
                    value={formData.tanggalLaporan}
                    onChange={(e) => setFormData({ ...formData, tanggalLaporan: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  Pilih Kategori / Jenis Kejadian <span className="text-rose-600">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                  {DAFTAR_JENIS_KEJADIAN.map((item) => {
                    const isSelected = formData.jenisKejadian === item.label;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => setFormData({ ...formData, jenisKejadian: item.label })}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-900 font-bold shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-emerald-700' : 'text-slate-400'}`} />
                        <span className="text-[11px] leading-tight">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {formData.jenisKejadian === 'Kejadian Lainnya' && (
                <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200">
                  <label className="text-xs font-bold text-amber-900 block mb-1">
                    Sebutkan Jenis Kejadian Lainnya <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.jenisKejadianLainnya || ''}
                    onChange={(e) => setFormData({ ...formData, jenisKejadianLainnya: e.target.value })}
                    placeholder="Contoh: Saluran Irigasi Tersumbat Limbah / Pohon Tumbang"
                    className="w-full px-3.5 py-2 rounded-lg border border-amber-300 text-sm bg-white"
                  />
                  {formErrors.jenisKejadianLainnya && (
                    <p className="text-xs text-rose-600 font-medium mt-1">{formErrors.jenisKejadianLainnya}</p>
                  )}
                </div>
              )}
            </div>

            {/* 4. DATA WAKTU & TEMPAT KEJADIAN */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <MapPin className="w-5 h-5 text-emerald-700" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  4. Data Kejadian (Waktu & Lokasi)
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Tanggal Kejadian <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.tanggalKejadian}
                    onChange={(e) => {
                      const newTgl = e.target.value;
                      setFormData({
                        ...formData,
                        tanggalKejadian: newTgl,
                        hariKejadian: getHariIndonesia(newTgl),
                      });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                  {formErrors.tanggalKejadian && (
                    <p className="text-xs text-rose-600 font-medium mt-1">{formErrors.tanggalKejadian}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Hari Kejadian (Otomatis)
                  </label>
                  <input
                    type="text"
                    value={formData.hariKejadian}
                    onChange={(e) => setFormData({ ...formData, hariKejadian: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Jam / Waktu Kejadian <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.waktuKejadian}
                    onChange={(e) => setFormData({ ...formData, waktuKejadian: e.target.value })}
                    placeholder="Contoh: 02:30 WIB"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                  {formErrors.waktuKejadian && (
                    <p className="text-xs text-rose-600 font-medium mt-1">{formErrors.waktuKejadian}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Wilayah RT <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={formData.rt}
                    onChange={(e) => setFormData({ ...formData, rt: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white font-bold text-emerald-800"
                  >
                    <option value="039">RT 039</option>
                    <option value="040">RT 040</option>
                    <option value="041">RT 041</option>
                    <option value="042">RT 042</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Wilayah RW (Otomatis)
                  </label>
                  <input
                    type="text"
                    value="018 (Kampung Banten)"
                    readOnly
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Nama Jalan / Gang / Titik Lokasi <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.lokasiKejadian}
                    onChange={(e) => setFormData({ ...formData, lokasiKejadian: e.target.value })}
                    placeholder="Contoh: Jl. Pala Gang Melati No. 12"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                  {formErrors.lokasiKejadian && (
                    <p className="text-xs text-rose-600 font-medium mt-1">{formErrors.lokasiKejadian}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Alamat Lengkap Kejadian <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={2}
                  value={formData.alamatLengkap}
                  onChange={(e) => setFormData({ ...formData, alamatLengkap: e.target.value })}
                  placeholder="Contoh: Jl. Pala No. 12 RT 040 RW 018 Kampung Banten Kelurahan Iringmulyo Kecamatan Metro Timur Kota Metro"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
                {formErrors.alamatLengkap && (
                  <p className="text-xs text-rose-600 font-medium mt-1">{formErrors.alamatLengkap}</p>
                )}
              </div>
            </div>

            {/* 5. DATA KORBAN / PIHAK TERKAIT */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-700" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                    5. Data Korban / Pihak Terkait
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={addKorbanRow}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Pihak Terkait
                </button>
              </div>

              {formData.korban.map((kb, idx) => (
                <div
                  key={kb.id || idx}
                  className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-700">
                      Pihak Terkait #{idx + 1}
                    </span>
                    {formData.korban.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeKorbanRow(idx)}
                        className="text-rose-500 hover:text-rose-700 text-xs flex items-center gap-1 font-semibold"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Hapus
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="text-slate-600 block font-semibold mb-1">Nama Lengkap</label>
                      <input
                        type="text"
                        value={kb.nama}
                        onChange={(e) => updateKorbanField(idx, 'nama', e.target.value)}
                        placeholder="Nama korban/pemilik"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-600 block font-semibold mb-1">NIK (Tidak Wajib)</label>
                      <input
                        type="text"
                        value={kb.nik || ''}
                        onChange={(e) => updateKorbanField(idx, 'nik', e.target.value)}
                        placeholder="16 digit NIK"
                        maxLength={16}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-600 block font-semibold mb-1">Status Keterkaitan</label>
                      <select
                        value={kb.status}
                        onChange={(e) => updateKorbanField(idx, 'status', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-medium"
                      >
                        <option value="Korban">Korban</option>
                        <option value="Saksi">Saksi</option>
                        <option value="Pemilik Rumah/Barang">Pemilik Rumah/Barang</option>
                        <option value="Pihak Terkait">Pihak Terkait</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="sm:col-span-2">
                      <label className="text-slate-600 block font-semibold mb-1">Alamat Tempat Tinggal</label>
                      <input
                        type="text"
                        value={kb.alamat}
                        onChange={(e) => updateKorbanField(idx, 'alamat', e.target.value)}
                        placeholder="Alamat domisili"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-600 block font-semibold mb-1">No. HP (Tidak Wajib)</label>
                      <input
                        type="tel"
                        value={kb.noHp || ''}
                        onChange={(e) => updateKorbanField(idx, 'noHp', e.target.value)}
                        placeholder="0812xxxxxxx"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 6. KRONOLOGI KEJADIAN & FITUR AI */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-700" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                    6. Uraian Kronologis Kejadian <span className="text-rose-600">*</span>
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setAiNotes(formData.kronologi || '');
                    setShowAiModal(true);
                  }}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition"
                >
                  <Sparkles className="w-4 h-4 text-slate-950" /> Buat Kronologi dengan AI
                </button>
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-2">
                  Tuliskan urutan kronologis kejadian secara rinci dan objektif. Anda juga dapat menggunakan bantuan tombol <strong>"Buat Kronologi dengan AI"</strong> untuk merapikan catatan lapangan menjadi narasi resmi tanpa mengarang fakta.
                </p>
                <textarea
                  rows={6}
                  value={formData.kronologi}
                  onChange={(e) => setFormData({ ...formData, kronologi: e.target.value })}
                  placeholder="Tuliskan runtutan waktu kejadian:
1. Pada pukul...
2. Terdengar / diketahui bahwa...
3. Warga dan petugas segera..."
                  className="w-full p-4 rounded-xl border border-slate-200 text-sm leading-relaxed focus:ring-2 focus:ring-emerald-600"
                />
                {formErrors.kronologi && (
                  <p className="text-xs text-rose-600 font-medium mt-1">{formErrors.kronologi}</p>
                )}
              </div>
            </div>

            {/* 7. DAMPAK / KERUGIAN */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <HeartPulse className="w-5 h-5 text-emerald-700" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  7. Dampak / Kerugian
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="text-xs font-bold text-slate-700 block mb-2">Korban Jiwa</label>
                  <div className="flex items-center gap-4 mb-2">
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input
                        type="radio"
                        name="korbanJiwa"
                        checked={formData.korbanJiwa === 'Tidak ada'}
                        onChange={() => setFormData({ ...formData, korbanJiwa: 'Tidak ada', jumlahKorbanJiwa: 0 })}
                        className="text-emerald-600"
                      />
                      <span>Tidak ada</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input
                        type="radio"
                        name="korbanJiwa"
                        checked={formData.korbanJiwa === 'Ada'}
                        onChange={() => setFormData({ ...formData, korbanJiwa: 'Ada', jumlahKorbanJiwa: 1 })}
                        className="text-rose-600"
                      />
                      <span className="font-bold text-rose-700">Ada</span>
                    </label>
                  </div>
                  {formData.korbanJiwa === 'Ada' && (
                    <div>
                      <label className="text-[11px] text-slate-500 block mb-1">Jumlah Orang</label>
                      <input
                        type="number"
                        min={1}
                        value={formData.jumlahKorbanJiwa}
                        onChange={(e) => setFormData({ ...formData, jumlahKorbanJiwa: parseInt(e.target.value) || 1 })}
                        className="w-full px-3 py-1.5 bg-white border border-rose-300 rounded-lg text-xs font-bold"
                      />
                    </div>
                  )}
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="text-xs font-bold text-slate-700 block mb-2">Korban Luka-luka</label>
                  <div className="flex items-center gap-4 mb-2">
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input
                        type="radio"
                        name="korbanLuka"
                        checked={formData.korbanLuka === 'Tidak ada'}
                        onChange={() => setFormData({ ...formData, korbanLuka: 'Tidak ada', jumlahKorbanLuka: 0 })}
                        className="text-emerald-600"
                      />
                      <span>Tidak ada</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input
                        type="radio"
                        name="korbanLuka"
                        checked={formData.korbanLuka === 'Ada'}
                        onChange={() => setFormData({ ...formData, korbanLuka: 'Ada', jumlahKorbanLuka: 1 })}
                        className="text-amber-600"
                      />
                      <span className="font-bold text-amber-700">Ada</span>
                    </label>
                  </div>
                  {formData.korbanLuka === 'Ada' && (
                    <div>
                      <label className="text-[11px] text-slate-500 block mb-1">Jumlah Orang</label>
                      <input
                        type="number"
                        min={1}
                        value={formData.jumlahKorbanLuka}
                        onChange={(e) => setFormData({ ...formData, jumlahKorbanLuka: parseInt(e.target.value) || 1 })}
                        className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold"
                      />
                    </div>
                  )}
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="text-xs font-bold text-slate-700 block mb-2">Kerugian Materiil</label>
                  <div className="flex items-center gap-4 mb-2">
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input
                        type="radio"
                        name="kerugianMateri"
                        checked={formData.kerugianMateri === 'Tidak ada'}
                        onChange={() => setFormData({ ...formData, kerugianMateri: 'Tidak ada', nilaiKerugian: 0 })}
                        className="text-emerald-600"
                      />
                      <span>Tidak ada</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input
                        type="radio"
                        name="kerugianMateri"
                        checked={formData.kerugianMateri === 'Ada'}
                        onChange={() => setFormData({ ...formData, kerugianMateri: 'Ada' })}
                        className="text-rose-600"
                      />
                      <span className="font-bold text-rose-700">Ada</span>
                    </label>
                  </div>
                  {formData.kerugianMateri === 'Ada' && (
                    <div>
                      <label className="text-[11px] text-slate-500 block mb-1">Perkiraan Nilai (Rp)</label>
                      <input
                        type="number"
                        step={50000}
                        value={formData.nilaiKerugian || ''}
                        onChange={(e) => setFormData({ ...formData, nilaiKerugian: parseInt(e.target.value) || 0 })}
                        placeholder="Nilai Rupiah"
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold font-mono"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Uraian Kerusakan Fisik / Bangunan / Barang
                </label>
                <textarea
                  rows={2}
                  value={formData.kerusakan}
                  onChange={(e) => setFormData({ ...formData, kerusakan: e.target.value })}
                  placeholder="Uraikan kondisi kerusakan (misal: pintu pagar rusak, jendela samping tercongkel, instalasi kabel terbakar)..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>
            </div>

            {/* 8. TINDAKAN YANG TELAH DILAKUKAN */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <Shield className="w-5 h-5 text-emerald-700" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  8. Tindakan yang Telah Dilakukan
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                {DAFTAR_TINDAKAN_DEFAULT.map((tindakan) => {
                  const isChecked = formData.tindakan.includes(tindakan);
                  return (
                    <label
                      key={tindakan}
                      onClick={() => toggleTindakan(tindakan)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                        isChecked
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-[11px] leading-tight">{tindakan}</span>
                    </label>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Tindakan Lainnya (Bila Ada)
                  </label>
                  <input
                    type="text"
                    value={formData.tindakanLainnya || ''}
                    onChange={(e) => setFormData({ ...formData, tindakanLainnya: e.target.value })}
                    placeholder="Contoh: Evakuasi barang bersama warga RT 040"
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Uraian Penanganan / Hasil Tindakan
                  </label>
                  <input
                    type="text"
                    value={formData.uraianTindakan}
                    onChange={(e) => setFormData({ ...formData, uraianTindakan: e.target.value })}
                    placeholder="Contoh: Situasi TKP telah aman terkendali, barang bukti diserahkan ke Polsek"
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* 9. DATA SAKSI-SAKSI */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-emerald-700" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                    9. Data Saksi-Saksi (Minimal 2 Saksi)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={addSaksiRow}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Saksi
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {formData.saksi.map((sk, idx) => (
                  <div
                    key={sk.id || idx}
                    className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5 relative"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        Saksi {idx + 1}
                      </span>
                      {formData.saksi.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeSaksiRow(idx)}
                          className="text-rose-500 hover:text-rose-700 text-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="text-xs space-y-2">
                      <div>
                        <label className="text-slate-500 block font-semibold mb-0.5">Nama Saksi</label>
                        <input
                          type="text"
                          value={sk.nama}
                          onChange={(e) => updateSaksiField(idx, 'nama', e.target.value)}
                          placeholder="Nama saksi"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-slate-500 block font-semibold mb-0.5">Alamat Saksi</label>
                        <input
                          type="text"
                          value={sk.alamat}
                          onChange={(e) => updateSaksiField(idx, 'alamat', e.target.value)}
                          placeholder="Alamat domisili saksi"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-slate-500 block font-semibold mb-0.5">No. HP Saksi</label>
                        <input
                          type="tel"
                          value={sk.noHp}
                          onChange={(e) => updateSaksiField(idx, 'noHp', e.target.value)}
                          placeholder="0812xxxxxxx"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 10. DOKUMENTASI (FOTO/VIDEO/DOKUMEN) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-emerald-700" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                    10. Lampiran Dokumentasi Foto / Bukti TKP
                  </h3>
                </div>

                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    multiple
                    accept="image/*,video/*,application/pdf"
                    className="hidden"
                    id="laporan-file-upload"
                  />
                  <label
                    htmlFor="laporan-file-upload"
                    className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition border border-emerald-200"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {isUploading ? 'Mengunggah...' : 'Unggah File / Foto'}
                  </label>
                </div>
              </div>

              {formData.dokumentasi.length === 0 ? (
                <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl text-center">
                  <Camera className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">
                    Belum ada foto atau dokumen dokumentasi yang dilampirkan.
                  </p>
                  <label
                    htmlFor="laporan-file-upload"
                    className="inline-block mt-2 text-xs text-emerald-700 font-bold cursor-pointer hover:underline"
                  >
                    Klik di sini untuk memilih foto TKP
                  </label>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {formData.dokumentasi.map((dok, idx) => (
                    <div
                      key={dok.id || idx}
                      className="bg-slate-50 rounded-xl border border-slate-200 p-2 relative group overflow-hidden"
                    >
                      {dok.jenisFile === 'foto' ? (
                        <img
                          src={dok.url}
                          alt={dok.namaFile}
                          className="w-full h-28 object-cover rounded-lg mb-1.5"
                        />
                      ) : (
                        <div className="w-full h-28 bg-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-500 mb-1.5">
                          <FileText className="w-8 h-8 mb-1" />
                          <span className="text-[10px] font-bold uppercase">{dok.jenisFile}</span>
                        </div>
                      )}
                      <p className="text-[10px] text-slate-700 font-bold truncate">{dok.namaFile}</p>
                      <button
                        type="button"
                        onClick={() => removeDokumentasi(idx)}
                        className="absolute top-3 right-3 p-1 bg-rose-600 text-white rounded-full shadow-md opacity-90 hover:opacity-100 transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 11. KETERANGAN TAMBAHAN & STATUS LAPORAN */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <Info className="w-5 h-5 text-emerald-700" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  11. Keterangan Tambahan & Status Dokumen
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Keterangan Tambahan / Catatan Khusus
                  </label>
                  <textarea
                    rows={2}
                    value={formData.keteranganTambahan || ''}
                    onChange={(e) => setFormData({ ...formData, keteranganTambahan: e.target.value })}
                    placeholder="Tambahkan catatan khusus bila ada tindak lanjut berikutnya..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Status Penanganan Laporan
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as StatusLaporanKejadian })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                  >
                    <option value="Baru">Baru (Laporan Baru Masuk)</option>
                    <option value="Diproses">Diproses (Sedang Ditangani Aparat/Pengurus)</option>
                    <option value="Selesai">Selesai (Kasus Tuntas & Selesai)</option>
                    <option value="Sudah Dilaporkan">Sudah Dilaporkan (ke Lurah/Polsek)</option>
                    <option value="Sudah Dicetak">Sudah Dicetak (Format A4 Resmi)</option>
                    <option value="Sudah Dibuat">Sudah Dibuat (Resmi Terdaftar)</option>
                    <option value="Draft">Draft (Konsep Sementara)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* TOMBOL AKSI FORM */}
            <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={initNewForm}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset Form
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    if (validateForm()) {
                      setPreviewLaporan(formData);
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Eye className="w-4 h-4" /> Pratinjau Dokumen
                </button>

                <button
                  type="button"
                  onClick={() => setShareLaporan(formData)}
                  className="px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1.5 transition border border-blue-200 cursor-pointer"
                  title="Buka Menu Bagikan Berkas File PDF (A4)"
                >
                  <Share2 className="w-4 h-4" /> Bagikan PDF (A4)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (validateForm()) {
                      handleConfirmSave(true);
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
                >
                  <Printer className="w-4 h-4" /> Simpan & Cetak PDF
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black flex items-center gap-1.5 shadow-md transition transform active:scale-95"
                >
                  <Check className="w-4 h-4" /> SIMPAN LAPORAN
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* MODAL KONFIRMASI SIMPAN */}
      {showConfirmSaveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900">
                Apakah data laporan sudah benar?
              </h3>
              <p className="text-xs text-slate-600">
                Pastikan nomor laporan, rincian tempat/waktu, uraian kronologis, serta tujuan laporan telah sesuai fakta di lapangan.
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Nomor:</span>
                <span className="font-bold text-slate-800">{formData.nomorLaporan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Jenis:</span>
                <span className="font-bold text-slate-800">{formData.jenisKejadian}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tujuan:</span>
                <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                  {formData.tujuanLaporan.join(', ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Lokasi:</span>
                <span className="font-semibold text-slate-800">
                  {formData.lokasiKejadian} (RT {formData.rt})
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmSaveModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                Periksa Kembali
              </button>
              <button
                type="button"
                onClick={() => handleConfirmSave(false)}
                className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-sm"
              >
                Ya, Simpan Laporan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ASISTEN AI KRONOLOGIS */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Susun Kronologi Resmi dengan AI
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    AI merapikan bahasa catatan singkat Anda menjadi narasi resmi tanpa mengarang fakta baru.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Catatan Singkat / Poin Lapangan Anda:
                </label>
                <textarea
                  rows={4}
                  value={aiNotes}
                  onChange={(e) => setAiNotes(e.target.value)}
                  placeholder="Contoh: jam 01.30 terdengar suara gaduh di rumah bapak ahmad rt 040, saat diperiksa jendela samping sudah dicongkel dan 1 unit laptop hilang, warga dan ronda langsung amankan lokasi dan hubungi polsek..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Konteks: {formData.jenisKejadian} • RT {formData.rt} • {formData.waktuKejadian}
                </span>
                <button
                  type="button"
                  disabled={isAiProcessing || !aiNotes.trim()}
                  onClick={handleGenerateAiChronology}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-xs transition"
                >
                  <Sparkles className="w-4 h-4" />
                  {isAiProcessing ? 'Menyusun Kronologis...' : 'Proses Kronologi'}
                </button>
              </div>

              {aiGeneratedText && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800">
                      Hasil Susunan Kronologi Resmi:
                    </span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                      Terverifikasi Runtut
                    </span>
                  </div>
                  <textarea
                    rows={6}
                    value={aiGeneratedText}
                    onChange={(e) => setAiGeneratedText(e.target.value)}
                    className="w-full p-3.5 rounded-xl border border-emerald-300 bg-emerald-50/40 text-xs leading-relaxed font-sans"
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={applyAiChronology}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                    >
                      <Check className="w-4 h-4" /> Gunakan ke Formulir
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MENU BAGIKAN HASIL CETAK LAPORAN KEJADIAN RW 018 (FILE PDF FORMAT SURAT RESMI KERTAS A4) */}
      {shareLaporan && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in duration-150 my-auto">
            {/* Header Modal */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 text-blue-700 rounded-xl shadow-xs">
                  <FileCheck2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                    Menu Bagikan Hasil Cetak Laporan Kejadian RW 018
                  </h3>
                  <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                    <span className="text-xs text-blue-700 font-bold">
                      1 File PDF Fisik Sesuai Tampilan Cetak Layar
                    </span>
                    <span className="text-[10px] px-2 py-0.2 bg-emerald-100 text-emerald-800 font-extrabold rounded-full border border-emerald-300 uppercase">
                      Bukan Copy Text
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Nomor: {shareLaporan.nomorLaporan}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShareLaporan(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                title="Tutup Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* KARTU UTAMA FILE PDF RESMI FORMAT KERTAS A4 SIAP CETAK */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-50/90 via-slate-50 to-indigo-50/60 border-2 border-blue-200/90 space-y-3.5 shadow-xs">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 text-white flex flex-col items-center justify-center shrink-0 shadow-sm border border-red-400/40">
                    <FileText className="w-6 h-6" />
                    <span className="text-[9px] font-extrabold uppercase tracking-wider">PDF</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-600 text-white uppercase tracking-wide">
                        1 Berkas Dokumen PDF Resmi
                      </span>
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Standar Kertas A4
                      </span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 mt-1 break-all font-mono">
                      Laporan_Kejadian_RW018_{shareLaporan.nomorLaporan.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf
                    </h4>
                  </div>
                </div>
              </div>

              {/* Ringkasan Isi Surat Resmi */}
              <div className="bg-white/90 p-3 rounded-xl border border-blue-100 text-xs space-y-1.5 text-slate-700">
                <div className="grid grid-cols-[110px_10px_1fr] gap-y-1 text-[11px] sm:text-xs">
                  <span className="text-slate-500 font-medium">Jenis Kejadian</span>
                  <span>:</span>
                  <strong className="text-slate-900">{shareLaporan.jenisKejadian}</strong>

                  <span className="text-slate-500 font-medium">Hari / Tgl / Jam</span>
                  <span>:</span>
                  <span>{shareLaporan.hariKejadian}, {formatTanggalIndonesia(shareLaporan.tanggalKejadian)} — {shareLaporan.waktuKejadian}</span>

                  <span className="text-slate-500 font-medium">Lokasi Kejadian</span>
                  <span>:</span>
                  <span>{shareLaporan.lokasiKejadian} (RT {shareLaporan.rt} RW 018)</span>

                  <span className="text-slate-500 font-medium">Tanda Tangan</span>
                  <span>:</span>
                  <span className="font-semibold text-emerald-800">
                    Bhabinkamtibmas (Aipda Evodius NRP 84050233) & Ketua RW 018 (Eko Purwanto)
                  </span>
                </div>
              </div>

              <div className="bg-blue-50/90 p-3 rounded-xl border border-blue-200/80 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <div className="text-[11px] text-blue-950 leading-relaxed space-y-1">
                  <p className="m-0">
                    <strong>1 Buah File PDF Sesuai Tampilan Cetak Layar:</strong> Yang dibagikan adalah <strong>1 berkas file dokumen fisik PDF asli</strong> lengkap dengan Kop Surat RW 018, isi kronologi kejadian, rincian korban & kerugian, dokumentasi bukti, serta tanda tangan resmi Bhabinkamtibmas & Ketua RW 018 (BUKAN copy text).
                  </p>
                </div>
              </div>

              {/* Tombol Utama: Simpan ke HP Dulu & Teruskan ke WhatsApp */}
              <div className="space-y-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleShareToWhatsApp(shareLaporan)}
                  disabled={isGeneratingPdf}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 active:scale-[0.99] text-white rounded-xl text-left flex items-center gap-3 transition shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="grow min-w-0">
                    <div className="text-xs sm:text-sm font-extrabold flex items-center gap-1.5 flex-wrap">
                      <span>Simpan ke HP Dulu ➔ Teruskan ke WhatsApp</span>
                      <span className="px-1.5 py-0.2 text-[9px] bg-white/25 rounded uppercase tracking-wider font-bold">
                        1 File PDF Fisik
                      </span>
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-emerald-100 font-normal leading-tight mt-0.5">
                      Otomatis simpan berkas file PDF resmi (A4) ke penyimpanan HP lalu teruskan ke WhatsApp
                    </div>
                  </div>
                </button>

                {/* Grid Pilihan Aplikasi Langsung: WA, IG, Email, Telegram, Simpan ke Perangkat */}
                <div className="pt-1">
                  <span className="text-[11px] font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    Pilihan Aplikasi Tujuan (Unduh ke HP Dulu ➔ Lalu Teruskan):
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-1.5">
                    {/* WhatsApp */}
                    <button
                      type="button"
                      onClick={() => handleShareToWhatsApp(shareLaporan)}
                      disabled={isGeneratingPdf}
                      className="p-2.5 bg-emerald-50/90 hover:bg-emerald-100 active:bg-emerald-200 border border-emerald-300 rounded-xl text-emerald-900 flex flex-col items-center justify-center gap-1 transition cursor-pointer group text-center shadow-2xs"
                      title="Unduh ke HP & Teruskan ke WhatsApp"
                    >
                      <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition">
                        <MessageCircle className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-bold">WhatsApp</span>
                      <span className="text-[9px] text-emerald-700 leading-none">Simpan & Kirim</span>
                    </button>

                    {/* Instagram (IG) */}
                    <button
                      type="button"
                      onClick={() => handleShareToInstagram(shareLaporan)}
                      disabled={isGeneratingPdf}
                      className="p-2.5 bg-pink-50/90 hover:bg-pink-100 active:bg-pink-200 border border-pink-300 rounded-xl text-pink-900 flex flex-col items-center justify-center gap-1 transition cursor-pointer group text-center shadow-2xs"
                      title="Unduh ke HP & Buka Instagram"
                    >
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition">
                        <Instagram className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-bold">Instagram (IG)</span>
                      <span className="text-[9px] text-pink-700 leading-none">Simpan & Buka</span>
                    </button>

                    {/* Email / Gmail */}
                    <button
                      type="button"
                      onClick={() => handleShareToEmail(shareLaporan)}
                      disabled={isGeneratingPdf}
                      className="p-2.5 bg-amber-50/90 hover:bg-amber-100 active:bg-amber-200 border border-amber-300 rounded-xl text-amber-950 flex flex-col items-center justify-center gap-1 transition cursor-pointer group text-center shadow-2xs"
                      title="Unduh ke HP & Kirim ke Email"
                    >
                      <div className="w-7 h-7 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition">
                        <Mail className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-bold">Email / Gmail</span>
                      <span className="text-[9px] text-amber-800 leading-none">Simpan & Kirim</span>
                    </button>

                    {/* Telegram */}
                    <button
                      type="button"
                      onClick={() => handleShareToTelegram(shareLaporan)}
                      disabled={isGeneratingPdf}
                      className="p-2.5 bg-sky-50/90 hover:bg-sky-100 active:bg-sky-200 border border-sky-300 rounded-xl text-sky-900 flex flex-col items-center justify-center gap-1 transition cursor-pointer group text-center shadow-2xs"
                      title="Unduh ke HP & Teruskan ke Telegram"
                    >
                      <div className="w-7 h-7 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition">
                        <Send className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-bold">Telegram</span>
                      <span className="text-[9px] text-sky-700 leading-none">Simpan & Kirim</span>
                    </button>

                    {/* Penyimpanan Perangkat (HP) */}
                    <button
                      type="button"
                      onClick={() => handleDownloadToDevice(shareLaporan)}
                      disabled={isGeneratingPdf}
                      className="p-2.5 bg-slate-50/90 hover:bg-slate-100 active:bg-slate-200 border border-slate-300 rounded-xl text-slate-800 flex flex-col items-center justify-center gap-1 transition cursor-pointer group text-center shadow-2xs col-span-2 sm:col-span-1"
                      title="Unduh & Simpan Berkas PDF ke Memori HP"
                    >
                      <div className="w-7 h-7 rounded-full bg-slate-700 text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition">
                        <HardDrive className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-bold">Simpan ke HP</span>
                      <span className="text-[9px] text-slate-600 leading-none">Folder Download</span>
                    </button>
                  </div>
                </div>

                {/* Unduh & Cetak Langsung */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => generateAndSharePdf(shareLaporan, 'download')}
                    disabled={isGeneratingPdf}
                    className="py-2.5 px-3 bg-white hover:bg-slate-50 active:bg-slate-100 text-blue-700 border border-blue-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-2xs"
                  >
                    <FileDown className="w-4 h-4 text-blue-600" />
                    <span>Unduh 1 Berkas File PDF (A4)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const target = shareLaporan;
                      setShareLaporan(null);
                      setPreviewLaporan(target);
                      setTimeout(() => window.print(), 500);
                    }}
                    className="py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak Langsung ke Mesin Printer</span>
                  </button>
                </div>
              </div>
            </div>

            {/* PANDUAN PENGIRIMAN 1 FILE PDF RESMI (BUKAN COPY TEXT) */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
                  Format Dokumen Yang Dibagikan: 1 Berkas File PDF Fisik (A4)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                  Bukan Salinan Teks
                </span>
              </div>

              <div className="text-[11px] text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 leading-relaxed">
                <p className="m-0">
                  <strong>• Di Handphone / Tablet (Android & iOS):</strong> Klik tombol <em>"Bagikan 1 Berkas File PDF (A4) Resmi"</em>, lalu pilih aplikasi <strong>WhatsApp</strong> ➔ pilih Kontak/Grup tujuan. Berkas 1 file PDF resmi A4 akan langsung terlampir otomatis.
                </p>
                <p className="m-0">
                  <strong>• Di Komputer / WhatsApp Web:</strong> File PDF akan otomatis terunduh ke komputer Anda. Buka chat WhatsApp, klik ikon <strong>Lampiran (📎)</strong> ➔ pilih <strong>Dokumen</strong> ➔ kirim file PDF yang baru diunduh.
                </p>
              </div>
            </div>

            {/* FOOTER MODAL */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  const target = shareLaporan;
                  setShareLaporan(null);
                  setPreviewLaporan(target);
                }}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <Eye className="w-4 h-4" /> Buka Tampilan Cetak Layar Laporan (A4)
              </button>

              <button
                type="button"
                onClick={() => setShareLaporan(null)}
                className="py-1.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CETAK & PRATINJAU DOKUMEN RESMI (KOP RESMI RW 018) */}
      {previewLaporan && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-6 overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-300 overflow-hidden flex flex-col my-auto print:border-none print:shadow-none print:rounded-none">
            {/* Top Toolbar (Hidden on Print) - Ramping & Nyaman Android */}
            <div className="bg-slate-900 text-white px-3 py-2 sm:px-4 sm:py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 print:hidden shadow-sm">
              {/* Sisi Kiri: Judul Dokumen, Ikon, & Status Badge */}
              <div className="flex items-center justify-between sm:justify-start gap-2 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <FileCheck2 className="w-4.5 h-4.5 text-amber-400 shrink-0" />
                  <span className="font-bold text-xs sm:text-sm truncate">Dokumen Resmi Laporan Kejadian RW 018</span>
                  {(() => {
                    const prevCfg = getStatusConfig(previewLaporan.status);
                    const PrevIcon = prevCfg.icon;
                    return (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border shadow-2xs shrink-0 ${prevCfg.badgeBg} ${prevCfg.badgeText} ${prevCfg.badgeBorder}`}
                        title={prevCfg.description}
                      >
                        <span className="relative flex h-1.5 w-1.5">
                          {prevCfg.dotPulse && (
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${prevCfg.dotColor}`} />
                          )}
                          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${prevCfg.dotColor}`} />
                        </span>
                        <PrevIcon className={`w-3 h-3 ${previewLaporan.status === 'Diproses' ? 'animate-spin' : ''}`} />
                        <span>{prevCfg.label}</span>
                      </span>
                    );
                  })()}
                </div>

                {/* Tombol Tutup X di Mobile (Tampil Rata Kanan di Baris Judul) */}
                <button
                  type="button"
                  onClick={() => setPreviewLaporan(null)}
                  className="sm:hidden p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer shrink-0 active:scale-90"
                  title="Tutup Pratinjau"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Susunan Tombol Menu: Rata Kiri & Kanan di Android (w-full justify-between), Ramping & Nyaman */}
              <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto shrink-0 pt-1 sm:pt-0 border-t border-slate-800/80 sm:border-t-0">
                {/* Rata Kiri di Mobile: Tombol 🖨️ CETAK */}
                <button
                  id="btn-cetak-preview"
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 sm:flex-initial px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-950 text-white border border-slate-700 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 shadow-2xs"
                  title="Cetak Dokumen ke Printer Fisik atau Simpan sebagai PDF"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  <span>🖨️ CETAK</span>
                </button>

                {/* Rata Kanan di Mobile: Tombol 📄 DOWNLOAD PDF */}
                <button
                  id="btn-download-pdf-preview"
                  type="button"
                  onClick={() => generateAndSharePdf(previewLaporan, 'download')}
                  disabled={isGeneratingPdf}
                  className="flex-1 sm:flex-initial px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-extrabold rounded-lg flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer active:scale-95 disabled:opacity-50"
                  title="Download Hasil Cetak Menjadi File PDF A4 ke Perangkat Pengguna"
                >
                  <FileDown className="w-3.5 h-3.5 text-emerald-100 shrink-0" />
                  <span>📄 DOWNLOAD PDF</span>
                </button>

                {/* Tombol Tutup X di Desktop (sm+) */}
                <button
                  type="button"
                  onClick={() => setPreviewLaporan(null)}
                  className="hidden sm:flex p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer shrink-0 ml-1"
                  title="Tutup Pratinjau"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            {/* Sub-bar Info Bhabinkamtibmas & RT 039 (Hidden on Print) - Ramping */}
            <div className="bg-slate-800 text-slate-200 px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] flex flex-wrap items-center justify-between gap-2 border-t border-slate-700 print:hidden">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-[11px]">
                <span className="text-slate-400">Bhabinkamtibmas:</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-900/70 border border-emerald-500/40 text-emerald-300 font-bold">
                  {namaBhabinkamtibmas} (NRP. {nrpBhabinkamtibmas})
                </span>
                <span className="text-slate-400 ml-1">Sekretariat:</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-200 font-semibold">
                  Jl. Pala No. 1 RT 039 RW 018
                </span>
              </div>
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] hover:text-white">
                  <input
                    type="checkbox"
                    checked={sertakanBabinsa}
                    onChange={(e) => setSertakanBabinsa(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-3 h-3 cursor-pointer"
                  />
                  <span>Sertakan Kolom Babinsa</span>
                </label>
              </div>
            </div>

            {/* ISI DOKUMEN KERTAS RESMI (A4 FORMAT) MENGGUNAKAN KOMPONEN RESMI */}
            <OfficialA4Document
              laporan={previewLaporan}
              profile={profile}
              namaBhabinkamtibmas={namaBhabinkamtibmas}
              nrpBhabinkamtibmas={nrpBhabinkamtibmas}
              namaBabinsa={namaBabinsa}
              sertakanBabinsa={sertakanBabinsa}
              domId="laporan-a4-official-document"
            />
          </div>
        </div>
      )}

      {/* OFFSCREEN TARGET UNTUK GENERASI FILE PDF A4 JIKA MODAL PREVIEW TIDAK AKTIF */}
      {generatingPdfTarget && (
        <div
          id="laporan-pdf-render-container"
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            width: '794px',
            backgroundColor: '#ffffff',
            zIndex: -50,
            opacity: 0.01,
            pointerEvents: 'none',
          }}
        >
          <OfficialA4Document
            laporan={generatingPdfTarget}
            profile={profile}
            namaBhabinkamtibmas={namaBhabinkamtibmas}
            nrpBhabinkamtibmas={nrpBhabinkamtibmas}
            namaBabinsa={namaBabinsa}
            sertakanBabinsa={sertakanBabinsa}
            domId="laporan-a4-offscreen-document"
          />
        </div>
      )}

      {/* OVERLAY LOADING PEMBUATAN FILE PDF RESMI (A4) */}
      {isGeneratingPdf && (
        <div className="fixed inset-0 z-60 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full text-center space-y-4 border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="w-14 h-14 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base">Membuat PDF...</h4>
              <p className="text-xs text-slate-600 mt-1">
                {pdfProgressMsg || 'Membuat PDF...'}
              </p>
            </div>
            <div className="text-[11px] text-slate-400 font-sans">
              Format Standar Kertas A4 (210 x 297 mm) Siap Cetak ke Printer
            </div>
          </div>
        </div>
      )}

      {/* MODAL AKSI SIMPAN FILE PDF KE HP / PERANGKAT (GARANSI TERSIMPAN) */}
      {downloadReadyModal && (
        <div className="fixed inset-0 z-70 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 my-auto">
            {/* Header Modal */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                    File PDF Cetak Siap Disimpan di HP
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Format Resmi Kertas A4 (210 x 297 mm) Siap Cetak
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDownloadReadyModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Info Berkas PDF */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Nama Berkas:</span>
                <span className="font-bold text-slate-800 text-right truncate max-w-[200px]" title={downloadReadyModal.filename}>
                  {downloadReadyModal.filename}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Nomor Laporan:</span>
                <span className="font-bold text-emerald-800">{downloadReadyModal.laporan.nomorLaporan}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Ukuran Berkas:</span>
                <span className="font-semibold text-slate-700">
                  {(downloadReadyModal.fileSizeBytes / 1024).toFixed(1)} KB (1 Berkas Fisik PDF)
                </span>
              </div>
            </div>

            {/* Tombol Aksi Simpan ke HP */}
            <div className="space-y-2 pt-1">
              {/* Tombol 1: Unduh Langsung via Anchor (User Gesture Asli) */}
              <a
                href={downloadReadyModal.blobUrl}
                download={downloadReadyModal.filename}
                onClick={() => {
                  setPdfSuccessToast(`File PDF (${downloadReadyModal.filename}) berhasil diunduh ke memori HP.`);
                  setTimeout(() => setPdfSuccessToast(null), 4500);
                }}
                className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Simpan Langsung ke Folder Download HP</span>
              </a>

              {/* Tombol 2: Native Web Share (Simpan ke File / Penyimpanan HP) */}
              {typeof navigator !== 'undefined' && navigator.canShare && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.share({
                        title: `Simpan: ${downloadReadyModal.filename}`,
                        text: `Berkas resmi format kertas A4 Laporan Kejadian RW 018 Kampung Banten.`,
                        files: [downloadReadyModal.file],
                      });
                      setPdfSuccessToast('File PDF berhasil disimpan / dibagikan.');
                    } catch (e: any) {
                      if (e?.name !== 'AbortError') {
                        console.warn('Share error:', e);
                      }
                    }
                  }}
                  className="w-full py-2.5 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <HardDrive className="w-4 h-4 text-blue-600" />
                  <span>Simpan via Menu File Manager HP (Android / iOS)</span>
                </button>
              )}

              {/* Tombol 3: Buka di Tab Baru & WhatsApp */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    window.open(downloadReadyModal.blobUrl, '_blank');
                  }}
                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka Tab Baru</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const lap = downloadReadyModal.laporan;
                    setDownloadReadyModal(null);
                    handleShareToWhatsApp(lap);
                  }}
                  className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer border border-emerald-200"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Kirim WhatsApp</span>
                </button>
              </div>
            </div>

            {/* Panduan HP */}
            <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200/70 text-[11px] text-amber-900 leading-relaxed space-y-1">
              <p className="font-bold flex items-center gap-1 text-amber-950 m-0">
                <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                Petunjuk Lokasi Berkas di HP:
              </p>
              <p className="m-0">
                • <strong>Android:</strong> Berkas otomatis tersimpan di aplikasi <em>Pengelola Berkas (File Manager)</em> ➔ folder <strong>Download</strong>.
              </p>
              <p className="m-0">
                • <strong>iPhone (iOS):</strong> Ketuk tombol <em>Simpan via Menu File Manager HP</em> ➔ pilih <strong>Simpan ke File (Save to Files)</strong>.
              </p>
            </div>

            {/* Footer Modal */}
            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setDownloadReadyModal(null)}
                className="py-1.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Selesai & Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFIKASI SUKSES PDF */}
      {pdfSuccessToast && (
        <div className="fixed bottom-6 right-6 z-60 bg-emerald-950 text-white px-4 py-3 rounded-xl shadow-2xl border border-emerald-600 flex items-center gap-3 text-xs animate-in slide-in-from-bottom duration-300 max-w-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="leading-snug font-bold">{pdfSuccessToast}</span>
        </div>
      )}

      {/* TOAST NOTIFIKASI GAGAL PDF */}
      {pdfErrorToast && (
        <div className="fixed bottom-6 right-6 z-60 bg-rose-950 text-white px-4 py-3 rounded-xl shadow-2xl border border-rose-600 flex items-center gap-3 text-xs animate-in slide-in-from-bottom duration-300 max-w-md">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span className="leading-snug font-bold">{pdfErrorToast}</span>
        </div>
      )}
    </div>
  );
};
