import React, { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts';
import {
  Users,
  Home,
  Gift,
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  FileText,
  Calendar,
  Briefcase,
  Store,
  CheckCircle2,
  Clock,
  ArrowRight,
  PlusCircle,
  Share2,
  Copy,
  Check,
  Building,
  ShieldAlert,
  ChevronRight,
  PhoneCall,
  Phone,
  ShieldCheck,
  Ambulance,
  Flame,
  Zap,
  Radio,
  Landmark,
  Search,
  UserCheck,
  X,
  ChevronLeft,
  MessageSquareWarning,
  Camera,
  Video,
  Play,
  Film,
  Eye,
  Sparkles,
  Crown,
  Award,
  BadgeCheck,
  Image as ImageIcon,
  HeartHandshake,
  Megaphone,
  Printer,
  Compass,
  Map,
  Navigation
} from 'lucide-react';
import {
  Warga,
  KartuKeluarga,
  BansosItem,
  RkmItem,
  UmkmItem,
  TransaksiKas,
  IuranWargaRecord,
  KegiatanRw,
  PengaduanWarga,
  SuratItem,
  RWProfile,
  PbbRecord,
  AppUser
} from '../types';
import { formatRupiah, formatTanggalIndo } from '../utils/formatters';
import { LOGO_RW_018, handleLogoError, getRtLogo, RT_LOGOS } from '../constants/logo';
import { getRolePermission, canUserAccessTab, getUserPhotoUrl } from '../services/auth';
import { extractKegiatanMedia } from '../utils/mediaUtils';
import { VideoPlayer, PhotoLightbox, VideoLightbox } from './MediaModalViewer';
import { KasReportModal } from './KasReportModal';
import { DashboardResidentSearch } from './DashboardResidentSearch';
import { DashboardCekBansos } from './DashboardCekBansos';

interface DashboardViewProps {
  profile: RWProfile;
  wargaList: Warga[];
  kkList: KartuKeluarga[];
  bansosList: BansosItem[];
  rkmList: RkmItem[];
  umkmList: UmkmItem[];
  kasList: TransaksiKas[];
  iuranList: IuranWargaRecord[];
  kegiatanList: KegiatanRw[];
  pengaduanList: PengaduanWarga[];
  suratList: SuratItem[];
  pbbList?: PbbRecord[];
  currentUser?: AppUser | null;
  onNavigate?: (tab: any) => void;
  onNavigateTab?: (tab: string) => void;
  onCreateSurat?: (warga: Warga) => void;
  onSelectKk?: (noKk: string) => void;
  onNavigateWargaWithSearch?: (query: string) => void;
  onOpenNewSurat?: () => void;
  onOpenNewWarga?: () => void;
  onOpenNewKas?: () => void;
  onOpenDatabaseModal?: () => void;
  onOpenLogin?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  wargaList,
  kkList,
  bansosList,
  rkmList,
  umkmList,
  kasList,
  iuranList,
  kegiatanList,
  pengaduanList,
  suratList,
  pbbList = [],
  currentUser,
  onNavigate,
  onNavigateTab,
  onCreateSurat,
  onSelectKk,
  onNavigateWargaWithSearch,
  onOpenNewSurat,
  onOpenNewWarga,
  onOpenNewKas,
  onOpenDatabaseModal,
  onOpenLogin,
}) => {
  const [copiedAnnouncement, setCopiedAnnouncement] = useState(false);
  const [selectedMediaKegiatan, setSelectedMediaKegiatan] = useState<KegiatanRw | null>(null);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<string | null>(null);
  const [activeMediaTab, setActiveMediaTab] = useState<'semua' | 'foto' | 'video'>('semua');
  const [copiedLaporanText, setCopiedLaporanText] = useState(false);

  // Kas Report Modal state
  const [isKasReportModalOpen, setIsKasReportModalOpen] = useState(false);
  const [isKasReportPrintMode, setIsKasReportPrintMode] = useState(false);

  // Lightboxes for dashboard media playback
  const [dashboardPhotoLightbox, setDashboardPhotoLightbox] = useState<{
    isOpen: boolean;
    photos: Array<{ url: string; caption?: string }>;
    currentIndex: number;
    activityTitle?: string;
  }>({
    isOpen: false,
    photos: [],
    currentIndex: 0,
    activityTitle: '',
  });

  const [dashboardVideoLightbox, setDashboardVideoLightbox] = useState<{
    url: string;
    title?: string;
  } | null>(null);

  const userPerm = currentUser ? getRolePermission(currentUser.role) : null;
  const isKetuaRt = currentUser?.role === 'ketua_rt';
  const myRt = currentUser?.rtAccess && currentUser.rtAccess !== 'ALL' ? currentUser.rtAccess : '';

  const navigateTo = (tab: any) => {
    if (currentUser && !canUserAccessTab(currentUser, tab)) {
      alert(`Fitur "${tab.toUpperCase()}" dibatasi. Sesuai tugas dan fungsi peran ${currentUser.roleLabel}, fitur ini hanya dapat diakses oleh peran yang berwenang.`);
      return;
    }
    if (onNavigate) {
      onNavigate(tab);
    } else if (onNavigateTab) {
      onNavigateTab(tab);
    }
  };

  const handleOpenNewSurat = () => {
    if (currentUser && !canUserAccessTab(currentUser, 'surat')) {
      alert(`Penerbitan surat hanya dapat dilakukan oleh Pengurus yang berwenang.`);
      return;
    }
    if (onOpenNewSurat) {
      onOpenNewSurat();
    } else {
      navigateTo('surat');
    }
  };

  const handleOpenNewWarga = () => {
    if (currentUser && !canUserAccessTab(currentUser, 'warga')) {
      alert(`Penambahan data warga dibatasi untuk Sekretaris, Ketua RT, dan Ketua RW.`);
      return;
    }
    if (onOpenNewWarga) {
      onOpenNewWarga();
    } else {
      navigateTo('warga');
    }
  };

  const handleOpenNewKas = () => {
    if (currentUser && !canUserAccessTab(currentUser, 'kas')) {
      alert(`Pencatatan kas dan keuangan dikhususkan untuk Bendahara dan Ketua RW.`);
      return;
    }
    if (onOpenNewKas) {
      onOpenNewKas();
    } else {
      navigateTo('kas');
    }
  };

  const handleOpenDatabaseModal = () => {
    if (currentUser && currentUser.role !== 'admin_rw') {
      alert(`Pengaturan database dan backup hanya dapat diakses oleh Ketua RW (Super Admin).`);
      return;
    }
    if (onOpenDatabaseModal) {
      onOpenDatabaseModal();
    } else {
      navigateTo('menu');
    }
  };


  // Financial calculations
  const totalMasuk = kasList
    .filter((k) => k.tipe === 'Pemasukan')
    .reduce((acc, k) => acc + k.jumlah, 0);
  const totalKeluar = kasList
    .filter((k) => k.tipe === 'Pengeluaran')
    .reduce((acc, k) => acc + k.jumlah, 0);
  const saldoKas = totalMasuk - totalKeluar;

  // Warga demographics
  const totalWargaL = wargaList.filter((w) => w.jenisKelamin === 'L').length;
  const totalWargaP = wargaList.filter((w) => w.jenisKelamin === 'P').length;
  const totalLansia = wargaList.filter((w) => w.isLansia).length;
  const totalDisabilitas = wargaList.filter((w) => w.isDisabilitas).length;
  const totalDudaJanda = wargaList.filter((w) => w.isDudaJanda || w.statusKawin === 'Cerai Mati' || w.statusKawin === 'Cerai Hidup').length;

  // Bansos counts
  const bansosDisalurkan = bansosList.filter((b) => b.status === 'Disalurkan').length;
  const bansosMenunggu = bansosList.filter((b) => b.status === 'Menunggu Verifikasi').length;

  // Pending complaints
  const pendingPengaduan = pengaduanList.filter(
    (p) => p.status === 'Menunggu Verifikasi' || p.status === 'Sedang Ditindaklanjuti'
  );

  // Active RKM
  const activeRkm = rkmList.filter((r) => r.status === 'Sedang Berjalan');

  // Distribution by RT
  const RT_COLOR_MAP: Record<string, { hex: string; bg: string; text: string; border: string; lightBg: string; dot: string }> = {
    '039': { hex: '#059669', bg: 'bg-emerald-600', text: 'text-emerald-800', border: 'border-emerald-200/80', lightBg: 'bg-emerald-50/70', dot: 'bg-emerald-500' },
    '040': { hex: '#2563eb', bg: 'bg-blue-600', text: 'text-blue-800', border: 'border-blue-200/80', lightBg: 'bg-blue-50/70', dot: 'bg-blue-500' },
    '041': { hex: '#d97706', bg: 'bg-amber-600', text: 'text-amber-800', border: 'border-amber-200/80', lightBg: 'bg-amber-50/70', dot: 'bg-amber-500' },
    '042': { hex: '#7c3aed', bg: 'bg-purple-600', text: 'text-purple-800', border: 'border-purple-200/80', lightBg: 'bg-purple-50/70', dot: 'bg-purple-500' },
  };

  const FALLBACK_RT_COLORS = [
    { hex: '#059669', bg: 'bg-emerald-600', text: 'text-emerald-800', border: 'border-emerald-200/80', lightBg: 'bg-emerald-50/70', dot: 'bg-emerald-500' },
    { hex: '#2563eb', bg: 'bg-blue-600', text: 'text-blue-800', border: 'border-blue-200/80', lightBg: 'bg-blue-50/70', dot: 'bg-blue-500' },
    { hex: '#d97706', bg: 'bg-amber-600', text: 'text-amber-800', border: 'border-amber-200/80', lightBg: 'bg-amber-50/70', dot: 'bg-amber-500' },
    { hex: '#7c3aed', bg: 'bg-purple-600', text: 'text-purple-800', border: 'border-purple-200/80', lightBg: 'bg-purple-50/70', dot: 'bg-purple-500' },
    { hex: '#e11d48', bg: 'bg-rose-600', text: 'text-rose-800', border: 'border-rose-200/80', lightBg: 'bg-rose-50/70', dot: 'bg-rose-500' },
    { hex: '#0891b2', bg: 'bg-cyan-600', text: 'text-cyan-800', border: 'border-cyan-200/80', lightBg: 'bg-cyan-50/70', dot: 'bg-cyan-500' },
  ];

  const rtStats = profile.daftarRt.map((rtNum) => {
    const wargaRt = wargaList.filter((w) => w.rt === rtNum || w.rt === rtNum.replace(/^0+/, ''));
    const kkRt = kkList.filter((k) => k.rt === rtNum || k.rt === rtNum.replace(/^0+/, ''));
    return {
      rt: rtNum,
      wargaCount: wargaRt.length,
      kkCount: kkRt.length,
    };
  });

  const totalWargaInAllRt = rtStats.reduce((sum, item) => sum + item.wargaCount, 0) || wargaList.length || 1;
  const pieChartData = rtStats.map((item, index) => {
    const colorStyle = RT_COLOR_MAP[item.rt] || FALLBACK_RT_COLORS[index % FALLBACK_RT_COLORS.length];
    const percentage = totalWargaInAllRt > 0 ? Math.round((item.wargaCount / totalWargaInAllRt) * 100) : 0;
    return {
      name: `RT ${item.rt}`,
      rt: item.rt,
      value: item.wargaCount,
      kkCount: item.kkCount,
      percentage,
      color: colorStyle.hex,
      style: colorStyle,
    };
  });

  const maxWargaInRt = Math.max(...rtStats.map((r) => r.wargaCount), 1);

  // Quick announcement copy for WhatsApp
  const handleCopyAnnouncement = () => {
    const upcomingKeg = kegiatanList.find((k) => k.status === 'Akan Datang');
    const text = `*PEMBERITAHUAN PENGURUS RW 018*\n*${profile.kelurahan}, ${profile.kotaKab}*\n\nKepada Yth. Bapak/Ibu Warga RW 018,\n\nBerikut informasi agenda kegiatan lingkungan terdekat:\n📌 *${upcomingKeg?.judul || 'Kerja Bakti Lingkungan RW 018'}*\n🗓 Tanggal: ${formatTanggalIndo(upcomingKeg?.tanggal || '2026-08-23')}\n⏰ Waktu: ${upcomingKeg?.waktu || '07.00 WIB s.d Selesai'}\n📍 Lokasi: ${upcomingKeg?.lokasi || 'Lingkungan RW 018'}\n\nMari kita tingkatkan keguyuban dan kebersihan lingkungan kita bersama.\n\n_Tertanda,_\n*Ketua RW 018 (${profile.namaKetuaRw})*`;

    navigator.clipboard.writeText(text);
    setCopiedAnnouncement(true);
    setTimeout(() => setCopiedAnnouncement(false), 2500);
  };

  return (
    <div className="space-y-4 p-4 pb-8 max-w-5xl mx-auto">
      {/* Welcome Banner with Official Logo in Top-Left & Active User Real Photo in Top-Center */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-950 border border-amber-400/40 shadow-xl ring-1 ring-white/10 text-white p-5 sm:p-7">
        {/* Subtle Ambient Radial Lighting Effects */}
        <div className="absolute -right-12 -top-12 w-72 h-72 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/80 to-transparent" />

        {/* Top Bar: Official Logo RW 018 on Top-Left + Status Badges on Top-Right */}
        <div className="relative z-10 flex items-center justify-between gap-3 pb-3 border-b border-emerald-900/60">
          {/* Top-Left: Logo RW 018 */}
          <div className="flex items-center gap-2.5">
            <div className="relative group shrink-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden bg-slate-950 border-2 border-amber-400 shadow-md ring-2 ring-amber-400/25 flex items-center justify-center">
                <img
                  src={profile.logoUrl || LOGO_RW_018}
                  alt="Logo RW 018"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={handleLogoError}
                />
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-amber-300 truncate">
                  {profile.namaRw || 'RW 018 IRINGMULYO'}
                </span>
              </div>
              <p className="text-[10px] text-emerald-200/80 font-medium truncate">
                Kel. {profile.kelurahan}, {profile.kotaKab}
              </p>
            </div>
          </div>

          {/* Top-Right: Periode & Service Badge */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] text-emerald-200 font-medium backdrop-blur-md">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Periode {profile.periodeJabatan}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-900/90 border border-emerald-700/60 text-[10px] sm:text-[11px] text-emerald-200 font-bold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Siaga 24 Jam</span>
            </div>
          </div>
        </div>

        {/* Top-Center & Body: Active User Photo (Bagian Atas Tengah) & Greeting Typography */}
        <div className="relative z-10 pt-4 flex flex-col items-center justify-center text-center space-y-3">
          {/* Active User Photo in Top Center */}
          <div className="relative group">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 bg-gradient-to-tr from-amber-400 via-emerald-300 to-amber-200 shadow-xl shadow-emerald-950/60 ring-4 ring-amber-400/30 group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 border-2 border-slate-950">
                <img
                  src={getUserPhotoUrl(currentUser || null, profile.namaKetuaRw)}
                  alt={currentUser ? currentUser.nama : profile.namaKetuaRw}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      currentUser ? currentUser.nama : profile.namaKetuaRw
                    )}&background=047857&color=ffffff&bold=true&size=256`;
                  }}
                />
              </div>
            </div>

            {/* Active Login Status Pill below photo */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-emerald-900 border border-emerald-400 text-[10px] font-black uppercase tracking-wider text-emerald-200 shadow-md flex items-center gap-1 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Online • Aktif Login</span>
            </div>
          </div>

          {/* Role Badge */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-900/90 border border-amber-400/50 text-xs font-black text-amber-300 shadow-xs backdrop-blur-md mt-1">
            <Crown className="w-3.5 h-3.5 text-amber-300" />
            <span>
              {currentUser ? currentUser.roleLabel : 'Ketua RW 018 (Super Admin)'}
              {currentUser?.rtAccess && currentUser.rtAccess !== 'ALL' && ` • RT ${currentUser.rtAccess}`}
            </span>
          </div>

          {/* Main Title & Greeting */}
          <div className="space-y-1 max-w-2xl mx-auto">
            <h2 className="text-xl sm:text-2xl lg:text-[28px] font-black tracking-tight text-white leading-tight">
              Selamat Bertugas,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400">
                {currentUser ? currentUser.nama : profile.namaKetuaRw}
              </span>
            </h2>

            {/* Dynamic Role Subtext */}
            <p className="text-xs sm:text-[13px] text-emerald-100/90 leading-relaxed max-w-xl mx-auto">
              {isKetuaRt && myRt
                ? `Pusat kendali pelayanan dan pengawasan administrasi kependudukan warga RT ${myRt} RW 018 Kelurahan ${profile.kelurahan}, ${profile.kotaKab}.`
                : currentUser?.role === 'bendahara'
                ? `Pengelolaan transparansi buku kas keuangan, iuran warga RT, dan pembukuan bansos terpadu RW 018.`
                : currentUser?.role === 'sekretaris'
                ? `Tata kelola arsip persuratan resmi, database kependudukan, dan dokumentasi notulensi kegiatan RW 018.`
                : currentUser?.role === 'keamanan'
                ? `Pusat pantau pos ronda, pengawasan CCTV 16 titik wilayah, dan respon cepat siaga lingkungan.`
                : currentUser?.role === 'pengurus_rkm'
                ? `Pelayanan sosial Rukun Kematian Masyarakat (RKM), santunan duka, dan inventaris perlengkapan jenazah.`
                : currentUser?.role === 'warga'
                ? `Layanan mandiri warga RW 018: Permohonan surat pengantar online dan kanal aspirasi lingkungan.`
                : `"${profile.semboyan}" • Sistem Informasi Manajemen Wilayah RT 039 s.d. RT 042 Kelurahan ${profile.kelurahan}, ${profile.kotaKab}.`}
            </p>
          </div>

          {/* Centered Actions Cluster */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            {canUserAccessTab(currentUser || null, 'surat') ? (
              <button
                id="btn-hero-create-surat"
                onClick={handleOpenNewSurat}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-200 active:scale-95 text-emerald-950 text-xs sm:text-sm font-black shadow-lg shadow-amber-500/20 border border-amber-200/60 transition-all cursor-pointer group"
              >
                <FileText className="w-4 h-4 text-emerald-950 group-hover:scale-110 transition-transform" />
                <span>Buat Surat Pengantar</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-0.5 transition-transform" />
              </button>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-bold border border-white/20 shadow-xs backdrop-blur-md transition-all cursor-pointer"
              >
                <UserCheck className="w-4 h-4 text-amber-300" />
                <span>Info Hak Akses</span>
              </button>
            )}

            {onNavigate && (
              <button
                onClick={() => onNavigate('peta')}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white text-xs font-bold border border-emerald-500/60 shadow-md transition-all cursor-pointer"
                title="Buka Peta Wilayah & Denah RW 018"
              >
                <Compass className="w-3.5 h-3.5 text-amber-300" />
                <span>Peta Wilayah RW 018</span>
              </button>
            )}

            {onNavigate && (
              <button
                onClick={() => onNavigate('pengaduan')}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 text-emerald-100 text-xs font-bold border border-emerald-600/50 shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <Megaphone className="w-3.5 h-3.5 text-amber-300" />
                <span>Kanal Aspirasi Lingkungan</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Menu Cek Bansos Pemerintah (Data DTKS / P3KE Kesejahteraan Sosial) - Tepat di bawah Peta Wilayah, Ramping & Nyaman Android */}
      <DashboardCekBansos
        wargaList={wargaList}
        kkList={kkList}
        onNavigateToBansos={() => navigateTo('bansos')}
      />

      {/* RT Spotlight Card for Ketua RT */}
      {isKetuaRt && myRt && (
        <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/60 p-4 rounded-3xl border-2 border-emerald-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-13 h-13 rounded-2xl bg-slate-950 border-2 border-amber-400 overflow-hidden flex items-center justify-center font-black text-sm shadow-md shrink-0 ring-2 ring-amber-400/40">
              {getRtLogo(myRt) ? (
                <img
                  src={getRtLogo(myRt)!}
                  alt={`Logo RT ${myRt}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-amber-300 font-black text-xs">RT {myRt}</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-800 text-white uppercase tracking-wider">
                  Wilayah Tugas Anda
                </span>
                <span className="text-xs font-bold text-emerald-900">RT {myRt} RW 018</span>
              </div>
              <p className="text-xs text-emerald-800 mt-0.5">
                Total:{' '}
                <strong>
                  {wargaList.filter((w) => w.rt === myRt || w.rt === myRt.replace(/^0+/, '')).length} Jiwa
                </strong>{' '}
                •{' '}
                <strong>
                  {kkList.filter((k) => k.rt === myRt || k.rt === myRt.replace(/^0+/, '')).length} KK
                </strong>{' '}
                • PBB Terdata:{' '}
                <strong>
                  {pbbList.filter((p) => p.rt === myRt || p.rt === myRt.replace(/^0+/, '')).length} Objek
                </strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => navigateTo('warga')}
              className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer"
            >
              Lihat Warga RT {myRt}
            </button>
            <button
              onClick={() => navigateTo('surat')}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-emerald-950 text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer"
            >
              Surat RT {myRt}
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Global Resident Search & Multi-Criteria Filtering */}
      <DashboardResidentSearch
        wargaList={wargaList}
        kkList={kkList}
        bansosList={bansosList}
        pbbList={pbbList}
        profile={profile}
        currentUser={currentUser}
        onNavigateTab={onNavigateTab || navigateTo}
        onCreateSurat={onCreateSurat}
        onSelectKk={onSelectKk}
        onNavigateWargaWithSearch={onNavigateWargaWithSearch || ((q) => navigateTo('warga'))}
      />

      {/* Main Metric Cards Grid - Ramping, Rapi, & Elegan Mewah */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
        {/* Card 1: Total Warga */}
        <div
          onClick={() => navigateTo('warga')}
          className="relative bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-lg hover:border-emerald-400 hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 cursor-pointer group flex flex-col justify-between overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div>
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-500 uppercase tracking-wider group-hover:text-emerald-700 transition-colors truncate">
                Total Warga
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shrink-0 shadow-2xs">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>

            <div className="flex items-baseline gap-1 my-1">
              <span className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-emerald-900 transition-colors">
                {wargaList.length}
              </span>
              <span className="text-[11px] font-bold text-slate-400">Jiwa</span>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-semibold text-blue-600">L:{totalWargaL}</span>
              <span className="text-slate-300">•</span>
              <span className="font-semibold text-rose-600">P:{totalWargaP}</span>
              <span className="text-slate-300">•</span>
              <span className="text-amber-700 font-medium">Lansia:{totalLansia}</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" />
          </div>
        </div>

        {/* Card 2: Kepala Keluarga */}
        <div
          onClick={() => navigateTo('kk')}
          className="relative bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-lg hover:border-blue-400 hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 cursor-pointer group flex flex-col justify-between overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div>
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-500 uppercase tracking-wider group-hover:text-blue-700 transition-colors truncate">
                Kepala Keluarga
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shrink-0 shadow-2xs">
                <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>

            <div className="flex items-baseline gap-1 my-1">
              <span className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-blue-900 transition-colors">
                {kkList.length}
              </span>
              <span className="text-[11px] font-bold text-slate-400">KK</span>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-600">
            <div className="flex items-center gap-1 truncate">
              <span className="text-slate-500">Prasejahtera:</span>
              <strong className="text-amber-700 font-bold">
                {kkList.filter(k => k.statusEkonomi === 'Prasejahtera').length} KK
              </strong>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
          </div>
        </div>

        {/* Card 3: Saldo Kas RW */}
        <div
          onClick={() => navigateTo('kas')}
          className="relative bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-lg hover:border-teal-400 hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 cursor-pointer group flex flex-col justify-between overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div>
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-500 uppercase tracking-wider group-hover:text-teal-700 transition-colors truncate">
                Saldo Kas RW
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center group-hover:scale-110 group-hover:bg-teal-600 group-hover:text-white transition-all duration-300 shrink-0 shadow-2xs">
                <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>

            <div className="my-1">
              <span className="text-lg sm:text-[21px] font-black text-emerald-700 group-hover:text-emerald-800 transition-colors tracking-tight block truncate">
                {formatRupiah(saldoKas)}
              </span>
            </div>

            {/* Quick Action Buttons: Laporan Lengkap & Menu Cetak */}
            <div className="mt-2.5 flex items-center gap-1.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsKasReportPrintMode(false);
                  setIsKasReportModalOpen(true);
                }}
                className="flex-1 py-1.5 px-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200/80 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-all shadow-2xs cursor-pointer active:scale-95"
                title="Buka Laporan Lengkap & Detail Kas RW"
              >
                <FileText className="w-3 h-3 text-teal-600 shrink-0" />
                <span className="truncate">Laporan Detail</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsKasReportPrintMode(true);
                  setIsKasReportModalOpen(true);
                }}
                className="py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0"
                title="Cetak Laporan Kas RW"
              >
                <Printer className="w-3 h-3 shrink-0" />
                <span>Cetak</span>
              </button>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] sm:text-[11px]">
            <div className="flex items-center gap-1 text-emerald-700 font-bold truncate">
              <TrendingUp className="w-3 h-3 text-emerald-600 shrink-0" />
              <span className="truncate">+{formatRupiah(totalMasuk)}</span>
            </div>
            <div className="flex items-center gap-0.5 text-slate-400 group-hover:text-teal-600 transition-colors text-[10px] font-semibold">
              <span>Buku Kas</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>

        {/* Card 4: Data Bansos */}
        <div
          onClick={() => navigateTo('bansos')}
          className="relative bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-lg hover:border-amber-400 hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 cursor-pointer group flex flex-col justify-between overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div>
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-500 uppercase tracking-wider group-hover:text-amber-700 transition-colors truncate">
                Data Bansos
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300 shrink-0 shadow-2xs">
                <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>

            <div className="flex items-baseline gap-1 my-1">
              <span className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-amber-900 transition-colors">
                {bansosList.length}
              </span>
              <span className="text-[11px] font-bold text-slate-400">Penerima</span>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] sm:text-[11px]">
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-emerald-700 font-bold">{bansosDisalurkan} Salur</span>
              {bansosMenunggu > 0 && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="text-amber-700 font-semibold">{bansosMenunggu} Verif</span>
                </>
              )}
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all shrink-0" />
          </div>
        </div>
      </div>

      {/* Quick Actions Bar with Interactive Hover and Spring */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            {currentUser ? `Aksi Cepat (${currentUser.roleLabel})` : 'Aksi Cepat Pengurus'}
          </h3>
          <span className="text-[11px] text-emerald-700 font-semibold">
            Pintasan Menu Sesuai Tupoksi
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {/* Data PBB & SHM */}
          {(!currentUser || canUserAccessTab(currentUser, 'pbb')) && (
            <button
              onClick={() => navigateTo('pbb')}
              className="relative flex flex-col items-center justify-center p-2.5 rounded-xl bg-amber-50/80 hover:bg-amber-100 hover:border-amber-300 hover:-translate-y-1 hover:shadow-md text-amber-950 border border-amber-200 transition-all duration-200 active:scale-95 group shadow-2xs cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-200/60 flex items-center justify-center mb-1 text-amber-900 group-hover:scale-115 group-hover:rotate-3 transition-transform duration-200">
                <Landmark className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-center leading-tight">Data PBB & SHM</span>
              {pbbList.filter(p => p.statusPembayaran === 'Belum Lunas').length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 bg-amber-600 text-white font-black text-[9px] rounded-full shadow-xs border border-white">
                  {pbbList.filter(p => p.statusPembayaran === 'Belum Lunas').length} Blm Lunas
                </span>
              )}
            </button>
          )}

          {/* Buat Surat */}
          {(!currentUser || canUserAccessTab(currentUser, 'surat')) && (
            <button
              onClick={handleOpenNewSurat}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-emerald-50/80 hover:bg-emerald-100 hover:border-emerald-300 hover:-translate-y-1 hover:shadow-md text-emerald-900 border border-emerald-100 transition-all duration-200 active:scale-95 group shadow-2xs cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-200/50 flex items-center justify-center mb-1 text-emerald-800 group-hover:scale-115 group-hover:rotate-3 transition-transform duration-200">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-center leading-tight">Buat Surat</span>
            </button>
          )}

          {/* Tambah Warga */}
          {(!currentUser || canUserAccessTab(currentUser, 'warga')) && (
            <button
              onClick={handleOpenNewWarga}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-blue-50/80 hover:bg-blue-100 hover:border-blue-300 hover:-translate-y-1 hover:shadow-md text-blue-900 border border-blue-100 transition-all duration-200 active:scale-95 group shadow-2xs cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-200/50 flex items-center justify-center mb-1 text-blue-800 group-hover:scale-115 group-hover:rotate-3 transition-transform duration-200">
                <PlusCircle className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-center leading-tight">
                {isKetuaRt ? `Warga RT ${myRt}` : 'Data Warga'}
              </span>
            </button>
          )}

          {/* Catat Kas */}
          {(!currentUser || canUserAccessTab(currentUser, 'kas')) && (
            <button
              onClick={handleOpenNewKas}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-teal-50/80 hover:bg-teal-100 hover:border-teal-300 hover:-translate-y-1 hover:shadow-md text-teal-900 border border-teal-100 transition-all duration-200 active:scale-95 group shadow-2xs cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-teal-200/50 flex items-center justify-center mb-1 text-teal-800 group-hover:scale-115 group-hover:rotate-3 transition-transform duration-200">
                <Wallet className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-center leading-tight">Catat Kas</span>
            </button>
          )}

          {/* Cek Bansos Kemensos RI Official Link */}
          <a
            href="https://cekbansos.kemensos.go.id/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-emerald-50/80 hover:bg-emerald-100 hover:border-emerald-300 hover:-translate-y-1 hover:shadow-md text-emerald-900 border border-emerald-200 transition-all duration-200 active:scale-95 group shadow-2xs cursor-pointer text-decoration-none"
            title="Buka Portal Resmi Cek Bansos Kemensos RI (https://cekbansos.kemensos.go.id/)"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-200/50 flex items-center justify-center mb-1 text-emerald-800 group-hover:scale-115 group-hover:rotate-3 transition-transform duration-200">
              <Gift className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-center leading-tight">Cek Bansos</span>
          </a>

          {/* Peta Wilayah */}
          {(!currentUser || canUserAccessTab(currentUser, 'peta')) && (
            <button
              onClick={() => navigateTo('peta')}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-teal-50/80 hover:bg-teal-100 hover:border-teal-300 hover:-translate-y-1 hover:shadow-md text-teal-900 border border-teal-200 transition-all duration-200 active:scale-95 group shadow-2xs cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-teal-200/50 flex items-center justify-center mb-1 text-teal-800 group-hover:scale-115 group-hover:rotate-3 transition-transform duration-200">
                <Compass className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-center leading-tight">Peta Wilayah</span>
            </button>
          )}

          {/* RKM */}
          {(!currentUser || canUserAccessTab(currentUser, 'rkm')) && (
            <button
              onClick={() => navigateTo('rkm')}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-rose-50/80 hover:bg-rose-100 hover:border-rose-300 hover:-translate-y-1 hover:shadow-md text-rose-900 border border-rose-100 transition-all duration-200 active:scale-95 group shadow-2xs cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-rose-200/50 flex items-center justify-center mb-1 text-rose-800 group-hover:scale-115 group-hover:rotate-3 transition-transform duration-200">
                <HeartHandshake className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-center leading-tight">Layanan RKM</span>
            </button>
          )}

          {/* Pengaduan / Aduan */}
          {(!currentUser || canUserAccessTab(currentUser, 'pengaduan')) && (
            <button
              onClick={() => navigateTo('pengaduan')}
              className="relative flex flex-col items-center justify-center p-2.5 rounded-xl bg-rose-50/80 hover:bg-rose-100 hover:border-rose-300 hover:-translate-y-1 hover:shadow-md text-rose-900 border border-rose-100 transition-all duration-200 active:scale-95 group shadow-2xs cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-rose-200/50 flex items-center justify-center mb-1 text-rose-800 group-hover:scale-115 group-hover:rotate-3 transition-transform duration-200">
                <AlertCircle className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-center leading-tight">Cek Aduan</span>
              {pendingPengaduan.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 bg-rose-600 text-white font-bold text-[9px] rounded-full shadow-xs border border-white">
                  {pendingPengaduan.length}
                </span>
              )}
            </button>
          )}

          {/* Keamanan Lingkungan */}
          {(!currentUser || canUserAccessTab(currentUser, 'keamanan')) && (
            <button
              onClick={() => navigateTo('keamanan')}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-cyan-50/80 hover:bg-cyan-100 hover:border-cyan-300 hover:-translate-y-1 hover:shadow-md text-cyan-900 border border-cyan-100 transition-all duration-200 active:scale-95 group shadow-2xs cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-cyan-200/50 flex items-center justify-center mb-1 text-cyan-800 group-hover:scale-115 group-hover:rotate-3 transition-transform duration-200">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-center leading-tight">Pos Keamanan</span>
            </button>
          )}

          {/* Laporan Kegiatan */}
          {(!currentUser || canUserAccessTab(currentUser, 'kegiatan')) && (
            <button
              onClick={() => navigateTo('kegiatan')}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-indigo-50/80 hover:bg-indigo-100 hover:border-indigo-300 hover:-translate-y-1 hover:shadow-md text-indigo-900 border border-indigo-100 transition-all duration-200 active:scale-95 group shadow-2xs cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-200/50 flex items-center justify-center mb-1 text-indigo-800 group-hover:scale-115 group-hover:rotate-3 transition-transform duration-200">
                <Camera className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-center leading-tight">Laporan Kegiatan</span>
            </button>
          )}

          {/* Cadangkan DB (Admin RW only) */}
          {currentUser?.role === 'admin_rw' && (
            <button
              onClick={handleOpenDatabaseModal}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 hover:border-slate-300 hover:-translate-y-1 hover:shadow-md text-slate-800 border border-slate-200 transition-all duration-200 active:scale-95 group shadow-2xs cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-300/60 flex items-center justify-center mb-1 text-slate-700 group-hover:scale-115 group-hover:rotate-3 transition-transform duration-200">
                <Building className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-center leading-tight">Cadangkan DB</span>
            </button>
          )}
        </div>
      </div>

      {/* Identitas & Lambang RW 018 Showcase Card */}
      <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-4 sm:p-5 text-white border-2 border-amber-400/60 shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          <div className="relative shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden bg-slate-950 border-3 border-amber-400 shadow-2xl flex items-center justify-center ring-4 ring-amber-400/20 group">
              <img
                src={profile.logoUrl || LOGO_RW_018}
                alt="Logo RW 018"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                onError={handleLogoError}
              />
            </div>
            <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-amber-400 text-emerald-950 font-black text-[10px] tracking-wider shadow-md uppercase">
              RW 018
            </span>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[11px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Logo Pengurus RW 018 Iringmulyo</span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-amber-300">
              Rukun Warga 018 • Kelurahan Iringmulyo
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Logo berupa medali emas dengan simbol <strong>Bintang</strong>, <strong>Sepasang Sayap Padi Kemakmuran</strong>, dan teks <strong>RW 018</strong> melambangkan persatuan, kejujuran, dan kebersamaan warga di 4 Rukun Tetangga (RT 039 s.d. RT 042).
            </p>
            <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-[11px]">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-900/80 text-emerald-200 border border-emerald-700 font-medium">
                🏛️ Metro Timur, Kota Metro
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-950/80 text-amber-200 border border-amber-700/60 font-medium">
                👤 Ketua: {profile.namaKetuaRw}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 font-medium">
                📞 {profile.noHpKetuaRw}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Section: Persebaran RT & Pengaduan Warga */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Persebaran Warga per RT (Lingkaran PIE & Warna per RT) */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Persebaran Warga per RT</h3>
                <p className="text-xs text-slate-500">Distribusi populasi warga & KK per Rukun Tetangga</p>
              </div>
              <button
                onClick={() => navigateTo('warga')}
                className="text-xs text-emerald-700 font-semibold hover:underline flex items-center gap-0.5"
              >
                <span>Detail</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Diagram Lingkaran PIE & Legend Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center pt-1">
              {/* Sisi Kiri: Diagram PIE Donat */}
              <div className="sm:col-span-5 flex flex-col items-center justify-center relative min-h-[160px]">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <RechartsTooltip
                      content={({ active, payload }: any) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900/95 text-white p-2.5 rounded-xl text-xs shadow-lg border border-slate-700/80 backdrop-blur-xs z-50">
                              <div className="flex items-center gap-1.5 font-bold mb-1">
                                <span
                                  className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                                  style={{ backgroundColor: data.color }}
                                />
                                <span>{data.name}</span>
                              </div>
                              <div className="text-[11px] text-slate-300 space-y-0.5">
                                <p>
                                  Warga: <strong className="text-white">{data.value}</strong> Jiwa
                                </p>
                                <p>
                                  Keluarga: <strong className="text-white">{data.kkCount}</strong> KK
                                </p>
                                <p>
                                  Proporsi: <strong className="text-emerald-400">{data.percentage}%</strong>
                                </p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={44}
                      outerRadius={68}
                      paddingAngle={3}
                      dataKey="value"
                      animationDuration={800}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* Center Label for Donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-lg font-black text-slate-800 leading-tight">
                    {wargaList.length}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    Total Jiwa
                  </span>
                </div>
              </div>

              {/* Sisi Kanan: Kartu Info Warna per RT */}
              <div className="sm:col-span-7 space-y-1.5">
                {pieChartData.map((item) => {
                  const rtInfo = profile.daftarRtInfo?.find((r) => r.rt === item.rt);
                  const rtLogo = getRtLogo(item.rt);
                  return (
                    <div
                      key={item.rt}
                      className={`p-2.5 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm flex items-center justify-between gap-2 cursor-pointer ${item.style.lightBg} ${item.style.border}`}
                      onClick={() => navigateTo('warga')}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {rtLogo ? (
                          <div className="w-8 h-8 rounded-lg overflow-hidden border border-amber-300 bg-slate-950 shrink-0 shadow-2xs">
                            <img
                              src={rtLogo}
                              alt={`Logo RT ${item.rt}`}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <span
                            className="w-3 h-3 rounded-full shrink-0 shadow-xs ring-2 ring-white"
                            style={{ backgroundColor: item.color }}
                          />
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-800 text-xs truncate">
                              RT {item.rt}
                            </span>
                            {rtInfo?.ketuaRt && (
                              <span className="text-[10px] text-slate-500 font-medium truncate hidden sm:inline">
                                • {rtInfo.ketuaRt}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 block">
                            <strong className="text-slate-700">{item.value}</strong> Jiwa ({item.kkCount} KK)
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-extrabold ${item.style.text} bg-white/95 border ${item.style.border} shadow-2xs`}
                        >
                          {item.percentage}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Bar Info */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>{profile.daftarRt.length} Wilayah RT Terdaftar</span>
            <span className="font-semibold text-emerald-800">
              Rata-rata: {Math.round(wargaList.length / (profile.daftarRt.length || 1))} Jiwa/RT
            </span>
          </div>
        </div>

        {/* Pengaduan Warga Terkini - Slide Card Carousel */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <MessageSquareWarning className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Lapor Pak RW (Aduan Masuk)</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    {pendingPengaduan.length > 0 ? (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                        {pendingPengaduan.length} Menunggu
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Semua aduan tertangani</span>
                    )}
                    <span className="text-[10px] text-slate-400 font-medium">Geser untuk melihat ➔</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigateTo('pengaduan')}
                className="text-xs text-emerald-700 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>Lihat Semua</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {pengaduanList.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                Tidak ada pengaduan warga saat ini.
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2 pt-1 snap-x snap-mandatory scroll-smooth no-scrollbar">
                {pengaduanList.map((aduan) => (
                  <div
                    key={aduan.id}
                    onClick={() => navigateTo('pengaduan')}
                    className="shrink-0 w-72 sm:w-80 snap-start p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-200/80 hover:border-emerald-400 hover:shadow-lg hover:-translate-y-1.5 active:scale-[0.98] transition-all duration-300 cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 group-hover:border-emerald-300 transition-colors">
                          {aduan.noAduan} • RT {aduan.rt}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold shadow-2xs ${
                            aduan.status === 'Selesai'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : aduan.status === 'Sedang Ditindaklanjuti' || aduan.status === 'Diproses'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {aduan.status}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-emerald-900 transition-colors">
                        {aduan.judul}
                      </h4>
                      <p className="text-[11px] text-slate-600 line-clamp-2 mt-1.5 bg-slate-100/70 p-2 rounded-lg italic border border-slate-200/40">
                        "{aduan.isiPengaduan || aduan.deskripsi}"
                      </p>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                      <span>👤 {aduan.namaPelapor}</span>
                      <span>📅 {formatTanggalIndo(aduan.tanggalLapor)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <span>👈 Geser kartu aduan 👉</span>
            </span>
            <button
              onClick={() => navigateTo('pengaduan')}
              className="text-xs px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg border border-emerald-200 transition-all hover:shadow-xs active:scale-95 cursor-pointer"
            >
              Tindak Lanjuti
            </button>
          </div>
        </div>
      </div>

      {/* 2-Column Section: Kegiatan RW Terdekat & RKM Program */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Agenda Kegiatan RW - Slide Card Carousel */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Agenda Kegiatan RW Terdekat</h3>
                  <p className="text-[10px] text-slate-500">Jadwal gotong royong, posyandu, & rapat (Geser ➔)</p>
                </div>
              </div>
              <button
                onClick={() => navigateTo('kegiatan')}
                className="text-xs text-emerald-700 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>Semua</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {kegiatanList.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                Belum ada agenda kegiatan terdekat.
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2 pt-1 snap-x snap-mandatory scroll-smooth no-scrollbar">
                {kegiatanList.map((keg) => (
                  <div
                    key={keg.id}
                    onClick={() => navigateTo('kegiatan')}
                    className="shrink-0 w-64 sm:w-72 snap-start p-3.5 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white hover:border-emerald-400 hover:shadow-lg hover:-translate-y-1.5 active:scale-[0.98] transition-all duration-300 cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1.5 mb-1.5">
                        <span className="inline-block text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/70 group-hover:bg-emerald-100 transition-colors">
                          {keg.kategori}
                        </span>
                        <span
                          className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            keg.status === 'Akan Datang'
                              ? 'bg-blue-100 text-blue-800'
                              : keg.status === 'Selesai'
                              ? 'bg-slate-200 text-slate-700'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {keg.status}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-800 leading-tight line-clamp-2 group-hover:text-emerald-900 transition-colors">
                        {keg.judul}
                      </h4>

                      <div className="mt-2 space-y-1 text-[11px] text-slate-600 bg-white/90 p-2 rounded-lg border border-slate-100 group-hover:border-emerald-100 transition-colors">
                        <p className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>{formatTanggalIndo(keg.tanggal)} ({keg.waktu})</span>
                        </p>
                        <p className="flex items-center gap-1.5 truncate">
                          <span>📍 {keg.lokasi}</span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                      <span>PIC: {keg.penanggungJawab || 'Pengurus RW'}</span>
                      <span className="text-emerald-700 font-semibold group-hover:translate-x-0.5 transition-transform">Detail ➔</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>👈 Geser agenda kegiatan 👉</span>
            <button
              onClick={() => navigateTo('kegiatan')}
              className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
            >
              Lihat Kalender
            </button>
          </div>
        </div>

        {/* Laporan Kegiatan Warga RW 018 - Dokumentasi Foto & Video Kegiatan */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Laporan Kegiatan Warga RW 018</h3>
                  <p className="text-[10px] text-slate-500">Dokumentasi foto & video kegiatan (Geser ➔)</p>
                </div>
              </div>
              <button
                onClick={() => navigateTo('kegiatan')}
                className="text-xs text-indigo-700 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>Lihat Semua</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {kegiatanList.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                Belum ada laporan dokumentasi kegiatan warga.
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2 pt-1 snap-x snap-mandatory scroll-smooth no-scrollbar">
                {kegiatanList.map((keg) => {
                  const media = extractKegiatanMedia(keg);
                  const allPhotos = media.photos;
                  const allVideos = media.videos;
                  const hasVideo = allVideos.length > 0;
                  const primaryVideo = allVideos[0];
                  const coverImg =
                    allPhotos[0]?.url ||
                    keg.fotoUrls?.[0] ||
                    primaryVideo?.thumbnail ||
                    keg.videoThumbnail ||
                    'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=800&q=80';
                  const fotoCount = allPhotos.length;

                  return (
                    <div
                      key={keg.id}
                      onClick={() => {
                        setSelectedMediaKegiatan(keg);
                        setActiveMediaTab('semua');
                      }}
                      className="shrink-0 w-72 sm:w-80 snap-start rounded-3xl bg-gradient-to-br from-slate-50 to-white border border-slate-200 hover:border-indigo-400 hover:shadow-xl hover:-translate-y-1.5 active:scale-[0.99] transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden group"
                    >
                      {/* Media Cover */}
                      <div className="relative h-36 w-full bg-slate-900 overflow-hidden">
                        <img
                          src={coverImg}
                          alt={keg.judul}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-black/40" />

                        {/* Top Category and Video Tag */}
                        <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 z-10">
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-slate-900/80 text-white backdrop-blur-xs border border-white/20">
                            {keg.kategori}
                          </span>
                          {hasVideo && (
                            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-rose-600 text-white flex items-center gap-1 shadow-xs animate-pulse">
                              <Film className="w-2.5 h-2.5" />
                              <span>Video Liputan</span>
                            </span>
                          )}
                        </div>

                        {/* Play Video Overlay (clickable by all users) */}
                        {hasVideo && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setDashboardVideoLightbox({
                                url: primaryVideo.url,
                                title: keg.judul,
                              });
                            }}
                            className="absolute inset-0 flex items-center justify-center z-10 group/play cursor-pointer"
                            title="Klik untuk langsung memutar video liputan kegiatan"
                          >
                            <div className="w-11 h-11 rounded-full bg-white/95 hover:bg-white text-slate-900 flex items-center justify-center shadow-xl group-hover/play:scale-115 transition-transform pl-0.5 ring-4 ring-rose-500/40">
                              <Play className="w-5 h-5 fill-rose-600 text-rose-600" />
                            </div>
                          </div>
                        )}

                        {/* Bottom Info inside media */}
                        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] text-white font-medium z-10">
                          <span className="flex items-center gap-1 bg-black/70 px-2 py-0.5 rounded-md backdrop-blur-xs">
                            <Camera className="w-2.5 h-2.5 text-indigo-300" />
                            {fotoCount > 0 ? `${fotoCount} Foto Lengkap` : 'Dokumentasi'}
                          </span>
                          {keg.wargaHadir ? (
                            <span className="flex items-center gap-1 bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded-md backdrop-blur-xs border border-emerald-500/30 font-bold">
                              <Users className="w-2.5 h-2.5" />
                              {keg.wargaHadir} Hadir
                            </span>
                          ) : (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/80 text-white">
                              {keg.status}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-3.5 flex flex-col justify-between flex-1 space-y-2.5">
                        <div>
                          <h4 className="font-bold text-slate-800 leading-snug line-clamp-2 text-xs group-hover:text-indigo-900 transition-colors">
                            {keg.judul}
                          </h4>
                          <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{formatTanggalIndo(keg.tanggal)}</span>
                          </p>

                          {/* Mini Photo Strip if multiple photos */}
                          {fotoCount > 1 && (
                            <div className="flex items-center gap-1 mt-2 overflow-hidden">
                              {allPhotos.slice(0, 3).map((p, pIdx) => (
                                <img
                                  key={pIdx}
                                  src={p.url}
                                  alt={`Mini ${pIdx + 1}`}
                                  referrerPolicy="no-referrer"
                                  className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                                />
                              ))}
                              {fotoCount > 3 && (
                                <span className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600 flex items-center justify-center">
                                  +{fotoCount - 3}
                                </span>
                              )}
                            </div>
                          )}

                          {keg.catatanHasil && (
                            <p className="text-[10px] text-slate-600 mt-1.5 line-clamp-2 italic bg-slate-100/90 p-2 rounded-xl border border-slate-200/60 leading-relaxed">
                              "{keg.catatanHasil}"
                            </p>
                          )}
                        </div>

                        {/* Direct Action Buttons */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-[10px]">
                          {hasVideo ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDashboardVideoLightbox({
                                  url: primaryVideo.url,
                                  title: keg.judul,
                                });
                              }}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold flex items-center gap-1 border border-rose-200 transition-colors cursor-pointer"
                            >
                              <Play className="w-3 h-3 fill-rose-600" />
                              <span>Putar Video</span>
                            </button>
                          ) : (
                            <span className="font-bold text-indigo-700 flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              Lihat {fotoCount} Foto
                            </span>
                          )}

                          <span className="text-indigo-600 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                            Buka Lengkap ➔
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>👈 Geser dokumentasi kegiatan 👉</span>
            <button
              onClick={() => navigateTo('kegiatan')}
              className="text-xs font-semibold text-indigo-700 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Film className="w-3 h-3" />
              <span>Semua Dokumentasi</span>
            </button>
          </div>
        </div>
      </div>

      {/* Broadcast WhatsApp Announcement Tool */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-4 rounded-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-950">
                Broadcast Pengumuman Grup WhatsApp RW 018
              </h4>
              <p className="text-xs text-emerald-800/90 mt-0.5">
                Salin template pengumuman resmi Ketua RW untuk diteruskan ke grup WA Pengurus RT & Warga.
              </p>
            </div>
          </div>
          <button
            onClick={handleCopyAnnouncement}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 ${
              copiedAnnouncement
                ? 'bg-emerald-800 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {copiedAnnouncement ? (
              <>
                <Check className="w-4 h-4 text-amber-300" />
                <span>Berhasil Disalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Salin Pesan WA</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modal Detail Laporan & Dokumentasi Foto/Video Kegiatan */}
      {selectedMediaKegiatan && (() => {
        const modalMedia = extractKegiatanMedia(selectedMediaKegiatan);
        const modalPhotos = modalMedia.photos;
        const modalVideos = modalMedia.videos;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
              {/* Modal Header */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white flex items-start justify-between gap-3 shrink-0">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                      {selectedMediaKegiatan.kategori}
                    </span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                      Status: {selectedMediaKegiatan.status}
                    </span>
                    {selectedMediaKegiatan.wargaHadir && (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/30 text-amber-200 border border-amber-400/30 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {selectedMediaKegiatan.wargaHadir} Warga Hadir
                      </span>
                    )}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold leading-snug text-white">
                    {selectedMediaKegiatan.judul}
                  </h3>
                  <p className="text-xs text-indigo-200/80 mt-1 flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-indigo-300" />
                      {formatTanggalIndo(selectedMediaKegiatan.tanggal)} ({selectedMediaKegiatan.waktu})
                    </span>
                    <span>•</span>
                    <span>📍 {selectedMediaKegiatan.lokasi}</span>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedMediaKegiatan(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Navigation Tabs for Media */}
              <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 border-b border-slate-200 text-xs font-semibold shrink-0 overflow-x-auto">
                <button
                  onClick={() => setActiveMediaTab('semua')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    activeMediaTab === 'semua'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Semua Media ({modalPhotos.length + modalVideos.length})
                </button>
                <button
                  onClick={() => setActiveMediaTab('foto')}
                  className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeMediaTab === 'foto'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Foto Dokumentasi ({modalPhotos.length})</span>
                </button>
                {modalVideos.length > 0 && (
                  <button
                    onClick={() => setActiveMediaTab('video')}
                    className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeMediaTab === 'video'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Film className="w-3.5 h-3.5" />
                    <span>Video Liputan ({modalVideos.length})</span>
                  </button>
                )}
              </div>

              {/* Modal Body Scrollable */}
              <div className="p-4 sm:p-5 overflow-y-auto space-y-6 flex-1">
                {/* Video Player Section */}
                {(activeMediaTab === 'semua' || activeMediaTab === 'video') && modalVideos.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Film className="w-3.5 h-3.5 text-rose-600" />
                        <span>Video Liputan & Dokumentasi ({modalVideos.length})</span>
                      </h4>
                      <span className="text-[10px] text-slate-500 bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-md font-bold">
                        Bisa Diputar Semua User
                      </span>
                    </div>

                    <div className="space-y-4">
                      {modalVideos.map((vid, vIdx) => (
                        <div key={vIdx} className="space-y-1.5">
                          <VideoPlayer
                            url={vid.url}
                            thumbnail={vid.thumbnail}
                            title={vid.title || selectedMediaKegiatan.judul}
                            onFullscreenClick={() => {
                              setDashboardVideoLightbox({
                                url: vid.url,
                                title: vid.title || selectedMediaKegiatan.judul,
                              });
                            }}
                          />
                          {vid.title && (
                            <p className="text-[11px] text-slate-600 font-medium px-1 flex items-center gap-1">
                              <Film className="w-3 h-3 text-rose-500" />
                              <span>{vid.title}</span>
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Photos Gallery Grid */}
                {(activeMediaTab === 'semua' || activeMediaTab === 'foto') && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Galeri Foto Dokumentasi Kegiatan RW 018 ({modalPhotos.length})</span>
                      </h4>
                      <span className="text-[10px] text-slate-500">
                        Klik foto untuk perbesar / slide
                      </span>
                    </div>

                    {modalPhotos.length === 0 ? (
                      <div className="text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-xs text-slate-400">
                        Belum ada foto yang diunggah untuk kegiatan ini.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {modalPhotos.map((photoItem, idx) => (
                          <div
                            key={idx}
                            onClick={() =>
                              setDashboardPhotoLightbox({
                                isOpen: true,
                                photos: modalPhotos,
                                currentIndex: idx,
                                activityTitle: selectedMediaKegiatan.judul,
                              })
                            }
                            className="group relative aspect-4/3 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer shadow-2xs hover:shadow-lg transition-all"
                          >
                            <img
                              src={photoItem.url}
                              alt={photoItem.caption || `${selectedMediaKegiatan.judul} - foto ${idx + 1}`}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/40 transition-colors flex items-center justify-center">
                              <span className="w-9 h-9 rounded-full bg-white/90 text-slate-900 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                                <Eye className="w-4 h-4" />
                              </span>
                            </div>
                            <span className="absolute bottom-1.5 right-1.5 text-[9px] bg-black/70 text-white px-2 py-0.5 rounded-md backdrop-blur-xs font-semibold">
                              Foto #{idx + 1}
                            </span>
                            {photoItem.caption && (
                              <span className="absolute bottom-1.5 left-1.5 max-w-[70%] truncate text-[9px] bg-indigo-900/80 text-white px-1.5 py-0.5 rounded backdrop-blur-xs font-medium">
                                {photoItem.caption}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Ringkasan & Catatan Notulen Kegiatan */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Ringkasan Hasil & Notulen Kegiatan</span>
                  </h4>

                  {selectedMediaKegiatan.catatanHasil && (
                    <div className="p-3.5 bg-emerald-50/90 rounded-2xl border border-emerald-200 text-xs text-emerald-950 font-medium leading-relaxed">
                      <strong className="text-emerald-800 block mb-1 font-bold">Hasil & Kesepakatan:</strong>
                      {selectedMediaKegiatan.catatanHasil}
                    </div>
                  )}

                  <div className="text-xs text-slate-700 leading-relaxed space-y-1.5">
                    <p><strong>Deskripsi:</strong> {selectedMediaKegiatan.deskripsi}</p>
                    {selectedMediaKegiatan.pesertaSasaran && (
                      <p><strong>Sasaran Peserta:</strong> {selectedMediaKegiatan.pesertaSasaran}</p>
                    )}
                    <p><strong>Penanggung Jawab (PIC):</strong> {selectedMediaKegiatan.penanggungJawab || profile.namaKetuaRw}</p>
                    {selectedMediaKegiatan.anggaran ? (
                      <p><strong>Realisasi Anggaran:</strong> {formatRupiah(selectedMediaKegiatan.anggaran)}</p>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
                <button
                  onClick={() => {
                    const text = `*LAPORAN DOKUMENTASI KEGIATAN RW 018*\n\n` +
                      `📌 *Kegiatan:* ${selectedMediaKegiatan.judul}\n` +
                      `🏷️ *Kategori:* ${selectedMediaKegiatan.kategori}\n` +
                      `🗓️ *Waktu:* ${formatTanggalIndo(selectedMediaKegiatan.tanggal)} (${selectedMediaKegiatan.waktu})\n` +
                      `📍 *Lokasi:* ${selectedMediaKegiatan.lokasi}\n` +
                      `👤 *PIC:* ${selectedMediaKegiatan.penanggungJawab || profile.namaKetuaRw}\n` +
                      (selectedMediaKegiatan.wargaHadir ? `👥 *Partisipasi:* ${selectedMediaKegiatan.wargaHadir} Warga Hadir\n` : '') +
                      `\n📝 *Hasil:* ${selectedMediaKegiatan.catatanHasil || selectedMediaKegiatan.deskripsi}\n\n` +
                      `_Dokumentasi lengkap (${modalPhotos.length} Foto & ${modalVideos.length} Video) tersimpan di Aplikasi RW 018 Iringmulyo_`;

                    navigator.clipboard.writeText(text);
                    setCopiedLaporanText(true);
                    setTimeout(() => setCopiedLaporanText(false), 2500);
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                    copiedLaporanText
                      ? 'bg-emerald-800 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {copiedLaporanText ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-amber-300" />
                      <span>Laporan Disalin ke Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Bagikan ke WA Grup RT</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedMediaKegiatan(null);
                      navigateTo('kegiatan');
                    }}
                    className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors border border-indigo-200 cursor-pointer"
                  >
                    Kelola di Menu Kegiatan
                  </button>
                  <button
                    onClick={() => setSelectedMediaKegiatan(null)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Lightbox Zoom Foto Full Gallery */}
      <PhotoLightbox
        isOpen={dashboardPhotoLightbox.isOpen}
        photos={dashboardPhotoLightbox.photos}
        currentIndex={dashboardPhotoLightbox.currentIndex}
        onClose={() => setDashboardPhotoLightbox(prev => ({ ...prev, isOpen: false }))}
        onNavigate={(newIdx) => setDashboardPhotoLightbox(prev => ({ ...prev, currentIndex: newIdx }))}
        activityTitle={dashboardPhotoLightbox.activityTitle}
      />

      {/* Lightbox Video Player */}
      <VideoLightbox
        isOpen={!!dashboardVideoLightbox}
        videoUrl={dashboardVideoLightbox?.url || ''}
        videoTitle={dashboardVideoLightbox?.title}
        onClose={() => setDashboardVideoLightbox(null)}
      />

      {/* Modal Laporan Lengkap & Detail Kas RW */}
      <KasReportModal
        isOpen={isKasReportModalOpen}
        onClose={() => setIsKasReportModalOpen(false)}
        kasList={kasList}
        profile={profile}
        initialPrintMode={isKasReportPrintMode}
      />
    </div>
  );
};
