import React, { useState, useMemo } from 'react';
import {
  Map,
  MapPin,
  Users,
  Home,
  Heart,
  Gift,
  Store,
  Shield,
  Route,
  Sun,
  CloudSun,
  Calendar,
  Search,
  Download,
  Eye,
  Layers,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info,
  Building,
  Phone,
  ArrowRight,
  Sparkles,
  HelpCircle,
  FileText,
  Lock,
  ExternalLink,
  Filter,
  X,
  Compass
} from 'lucide-react';
import { RWProfile, AppUser, Warga, KartuKeluarga, BansosItem, UmkmItem, KegiatanItem } from '../../types';
import {
  RW018_SPATIAL_PROFILE,
  RT_BOUNDARIES_DATA,
  POI_LIST_DATA,
  PetaPointOfInterest,
  RtBoundaryData
} from '../../data/petaData';
import { getWargaList, getKkList, getBansosList, getUmkmList, getKegiatanList } from '../../services/storage';

interface PetaDigitalDashboardProps {
  profile: RWProfile;
  currentUser?: AppUser | null;
  onNavigateToTab?: (tab: any) => void;
  onBackToVisualMap?: () => void;
}

// Data RT presets mirroring the uploaded Digital Map
const RT_DIGITAL_DATA: Record<string, {
  namaRt: string;
  kode: string;
  sektor: string;
  kkCount: number;
  pendudukCount: number;
  lakiCount: number;
  perempuanCount: number;
  balita: number;
  anak: number;
  remaja: number;
  produktif: number;
  lansia: number;
  kepadatan: string;
  luasWilayah: string;
  jumlahRumah: number;
  panjangJalan: string;
  jumlahGang: number;
  bansos: {
    pkh: number;
    bpnt: number;
    blt: number;
    pbi: number;
    lansia: number;
    disabilitas: number;
    total: number;
  };
  kesehatan: {
    balita: number;
    ibuHamil: number;
    lansia: number;
    disabilitas: number;
    bpjs: number;
    posyandu: number;
  };
  colorTheme: {
    border: string;
    fill: string;
    text: string;
    badge: string;
  };
  sampleKk: Array<{
    no: number;
    nama: string;
    alamat: string;
    anggota: number;
    noKk: string;
    kategori: string;
    pekerjaan?: string;
    bantuan?: string;
  }>;
}> = {
  '039': {
    namaRt: 'RT 039',
    kode: '039',
    sektor: 'Sektor Tenggara - Jl. Pala Barat & Gang Manggis',
    kkCount: 312,
    pendudukCount: 1098,
    lakiCount: 540,
    perempuanCount: 558,
    balita: 85,
    anak: 145,
    remaja: 210,
    produktif: 520,
    lansia: 138,
    kepadatan: '3.245 Jiwa/Km²',
    luasWilayah: '0,338 Km²',
    jumlahRumah: 328,
    panjangJalan: '1.250 Meter',
    jumlahGang: 18,
    bansos: {
      pkh: 12,
      bpnt: 18,
      blt: 5,
      pbi: 25,
      lansia: 8,
      disabilitas: 3,
      total: 35
    },
    kesehatan: {
      balita: 85,
      ibuHamil: 12,
      lansia: 138,
      disabilitas: 8,
      bpjs: 956,
      posyandu: 2
    },
    colorTheme: {
      border: '#3b82f6',
      fill: 'rgba(59, 130, 246, 0.25)',
      text: 'text-blue-400',
      badge: 'bg-blue-900/60 text-blue-300 border-blue-500/40'
    },
    sampleKk: [
      { no: 1, nama: 'BUDI SANTOSO', alamat: 'Jl. Pala No. 10', anggota: 5, noKk: '1871031501010001', kategori: 'Miskin / Pra-Sejahtera', pekerjaan: 'Buruh Harian Lepas', bantuan: 'PKH & BPNT' },
      { no: 2, nama: 'SITI AMINAH', alamat: 'Jl. Pala No. 12', anggota: 4, noKk: '1871031501010002', kategori: 'Penerima BPNT', pekerjaan: 'Pedagang Kelontong', bantuan: 'BPNT Sembako' },
      { no: 3, nama: 'EKO PURNOMO', alamat: 'Jl. Pala No. 14', anggota: 3, noKk: '1871031501010003', kategori: 'UMKM', pekerjaan: 'Pemilik Bengkel Motor', bantuan: 'Bantuan Usaha Mikro' },
      { no: 4, nama: 'NURHAYATI', alamat: 'Jl. Pala Gg. 3 No. 5', anggota: 6, noKk: '1871031501010004', kategori: 'Lansia', pekerjaan: 'Ibu Rumah Tangga', bantuan: 'PBI-KIS' },
      { no: 5, nama: 'AHMAD RIFAI', alamat: 'Jl. Pala Gg. 3 No. 7', anggota: 4, noKk: '1871031501010005', kategori: 'Penerima PKH', pekerjaan: 'Karyawan Swasta', bantuan: 'PKH Balita' },
      { no: 6, nama: 'HERI KURNIAWAN', alamat: 'Jl. Pala No. 18', anggota: 4, noKk: '1871031501010006', kategori: 'Umum / Mandiri', pekerjaan: 'Wiraswasta', bantuan: '-' },
      { no: 7, nama: 'SUPRAPTO', alamat: 'Jl. Pala Gg. Manggis No. 2', anggota: 5, noKk: '1871031501010007', kategori: 'Lansia', pekerjaan: 'Pensiunan', bantuan: 'PBI-KIS' }
    ]
  },
  '040': {
    namaRt: 'RT 040',
    kode: '040',
    sektor: 'Sektor Timur Laut - Masjid Baiturrahman & Jl. Pala Timur',
    kkCount: 304,
    pendudukCount: 1064,
    lakiCount: 520,
    perempuanCount: 544,
    balita: 78,
    anak: 138,
    remaja: 195,
    produktif: 512,
    lansia: 141,
    kepadatan: '3.110 Jiwa/Km²',
    luasWilayah: '0,342 Km²',
    jumlahRumah: 318,
    panjangJalan: '1.320 Meter',
    jumlahGang: 16,
    bansos: {
      pkh: 10,
      bpnt: 15,
      blt: 4,
      pbi: 22,
      lansia: 10,
      disabilitas: 2,
      total: 31
    },
    kesehatan: {
      balita: 78,
      ibuHamil: 9,
      lansia: 141,
      disabilitas: 6,
      bpjs: 932,
      posyandu: 2
    },
    colorTheme: {
      border: '#22c55e',
      fill: 'rgba(34, 197, 94, 0.25)',
      text: 'text-emerald-400',
      badge: 'bg-emerald-900/60 text-emerald-300 border-emerald-500/40'
    },
    sampleKk: [
      { no: 1, nama: 'DEDI SURYADI', alamat: 'Jl. Pala Timur No. 02', anggota: 4, noKk: '1871031501010040', kategori: 'Penerima BPNT', pekerjaan: 'Tukang Ojek Online', bantuan: 'BPNT' },
      { no: 2, nama: 'H. MARSUDI', alamat: 'Jl. Pala Timur No. 05', anggota: 3, noKk: '1871031501010041', kategori: 'Umum / Tokoh Agama', pekerjaan: 'Pensiunan Guru', bantuan: '-' },
      { no: 3, nama: 'SRI WAHYUNI', alamat: 'Jl. Pala Gg. Rambutan No. 1', anggota: 5, noKk: '1871031501010042', kategori: 'Penerima PKH', pekerjaan: 'Penjahit', bantuan: 'PKH Sekolah' },
      { no: 4, nama: 'BAMBANG HERMANTO', alamat: 'Jl. Pala Timur No. 14', anggota: 4, noKk: '1871031501010043', kategori: 'UMKM', pekerjaan: 'Toko Kelontong', bantuan: 'Kredit Usaha Rakyat' },
      { no: 5, nama: 'RUKMINI', alamat: 'Jl. Pala Timur No. 20', anggota: 2, noKk: '1871031501010044', kategori: 'Lansia Tunggal', pekerjaan: 'Tidak Bekerja', bantuan: 'BLT Desa & PBI' }
    ]
  },
  '041': {
    namaRt: 'RT 041',
    kode: '041',
    sektor: 'Sektor Barat Daya - Jl. Sukun & Musholla Nurul Huda',
    kkCount: 358,
    pendudukCount: 1300,
    lakiCount: 635,
    perempuanCount: 665,
    balita: 96,
    anak: 168,
    remaja: 245,
    produktif: 625,
    lansia: 166,
    kepadatan: '3.620 Jiwa/Km²',
    luasWilayah: '0,359 Km²',
    jumlahRumah: 362,
    panjangJalan: '1.480 Meter',
    jumlahGang: 21,
    bansos: {
      pkh: 15,
      bpnt: 24,
      blt: 8,
      pbi: 34,
      lansia: 12,
      disabilitas: 4,
      total: 44
    },
    kesehatan: {
      balita: 96,
      ibuHamil: 14,
      lansia: 166,
      disabilitas: 9,
      bpjs: 1120,
      posyandu: 2
    },
    colorTheme: {
      border: '#eab308',
      fill: 'rgba(234, 179, 8, 0.25)',
      text: 'text-amber-400',
      badge: 'bg-amber-900/60 text-amber-300 border-amber-500/40'
    },
    sampleKk: [
      { no: 1, nama: 'WAHYU HIDAYAT', alamat: 'Jl. Sukun Barat No. 04', anggota: 5, noKk: '1871031501010061', kategori: 'Miskin / Pra-Sejahtera', pekerjaan: 'Buruh Tani', bantuan: 'PKH' },
      { no: 2, nama: 'TRI ASTUTI', alamat: 'Jl. Sukun Gg. Salak No. 8', anggota: 4, noKk: '1871031501010062', kategori: 'Penerima BPNT', pekerjaan: 'Pedagang Makanan', bantuan: 'BPNT' },
      { no: 3, nama: 'SUGIARTO', alamat: 'Jl. Sukun Timur No. 12', anggota: 3, noKk: '1871031501010063', kategori: 'UMKM', pekerjaan: 'Laundry Barokah', bantuan: 'Bantuan Usaha' },
      { no: 4, nama: 'KASIMAN', alamat: 'Jl. Sukun No. 25', anggota: 2, noKk: '1871031501010064', kategori: 'Lansia', pekerjaan: 'Pensiunan', bantuan: 'PBI-KIS' },
      { no: 5, nama: 'AGUS PRIYANTO', alamat: 'Jl. Sukun Gg. Salak No. 14', anggota: 6, noKk: '1871031501010065', kategori: 'Penerima PKH', pekerjaan: 'Supir Angkot', bantuan: 'PKH' }
    ]
  },
  '042': {
    namaRt: 'RT 042',
    kode: '042',
    sektor: 'Sektor Barat Laut - Balai Warga & Lapangan RW 018',
    kkCount: 313,
    pendudukCount: 1050,
    lakiCount: 519,
    perempuanCount: 531,
    balita: 80,
    anak: 135,
    remaja: 200,
    produktif: 505,
    lansia: 130,
    kepadatan: '3.080 Jiwa/Km²',
    luasWilayah: '0,341 Km²',
    jumlahRumah: 320,
    panjangJalan: '1.280 Meter',
    jumlahGang: 17,
    bansos: {
      pkh: 11,
      bpnt: 17,
      blt: 6,
      pbi: 26,
      lansia: 9,
      disabilitas: 3,
      total: 34
    },
    kesehatan: {
      balita: 80,
      ibuHamil: 11,
      lansia: 130,
      disabilitas: 7,
      bpjs: 915,
      posyandu: 2
    },
    colorTheme: {
      border: '#a855f7',
      fill: 'rgba(168, 85, 247, 0.25)',
      text: 'text-purple-400',
      badge: 'bg-purple-900/60 text-purple-300 border-purple-500/40'
    },
    sampleKk: [
      { no: 1, nama: 'SEFRIZAL', alamat: 'Jl. Duku No. 01', anggota: 4, noKk: '1871031501010081', kategori: 'Ketua RT 042', pekerjaan: 'Wiraswasta', bantuan: '-' },
      { no: 2, nama: 'MARYANI', alamat: 'Jl. Duku Gg. Sirsak No. 04', anggota: 5, noKk: '1871031501010082', kategori: 'Penerima BPNT', pekerjaan: 'Buruh Harian', bantuan: 'BPNT' },
      { no: 3, nama: 'ANTON SETIAWAN', alamat: 'Jl. Duku No. 15', anggota: 3, noKk: '1871031501010083', kategori: 'UMKM', pekerjaan: 'Catering Rumahan', bantuan: 'KUR Mandiri' },
      { no: 4, nama: 'SUTRISNO', alamat: 'Jl. Duku No. 22', anggota: 4, noKk: '1871031501010084', kategori: 'Penerima PKH', pekerjaan: 'Tukang Bangunan', bantuan: 'PKH' },
      { no: 5, nama: 'SUMIATI', alamat: 'Jl. Duku Gg. Sirsak No. 10', anggota: 2, noKk: '1871031501010085', kategori: 'Lansia', pekerjaan: 'Tidak Bekerja', bantuan: 'PBI-KIS & BLT' }
    ]
  }
};

export const PetaDigitalDashboard: React.FC<PetaDigitalDashboardProps> = ({
  profile,
  currentUser,
  onNavigateToTab,
  onBackToVisualMap
}) => {
  // State for selected RT (default: '039' as shown in the screenshot, or 'ALL')
  const [selectedRt, setSelectedRt] = useState<string>('039');
  const [activeSubTab, setActiveSubTab] = useState<'warga' | 'rumah' | 'bansos' | 'kesehatan' | 'umkm' | 'infrastruktur' | 'keamanan' | 'statistik'>('warga');
  
  // Search & Filters in KK Table
  const [tableSearch, setTableSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const rowsPerPage = 5;

  // Zoom & Map Tool state
  const [mapZoom, setMapZoom] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Modals for detail viewer
  const [detailModal, setDetailModal] = useState<{
    isOpen: boolean;
    title: string;
    type: 'kk' | 'bansos' | 'kesehatan' | 'kegiatan' | 'panduan' | 'tentang' | 'kontak';
    data?: any;
  }>({
    isOpen: false,
    title: '',
    type: 'kk'
  });

  const activeRtInfo = RT_DIGITAL_DATA[selectedRt] || RT_DIGITAL_DATA['039'];

  // Calculate table items
  const filteredKkList = useMemo(() => {
    return activeRtInfo.sampleKk.filter((item) => {
      if (categoryFilter !== 'ALL' && !item.kategori.toLowerCase().includes(categoryFilter.toLowerCase())) {
        return false;
      }
      if (tableSearch.trim() !== '') {
        const q = tableSearch.toLowerCase();
        return (
          item.nama.toLowerCase().includes(q) ||
          item.alamat.toLowerCase().includes(q) ||
          item.noKk.toLowerCase().includes(q) ||
          item.kategori.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [activeRtInfo, tableSearch, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredKkList.length / rowsPerPage));
  const paginatedKk = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredKkList.slice(start, start + rowsPerPage);
  }, [filteredKkList, currentPage]);

  const handleExportData = () => {
    const csvContent = [
      ['No', 'Nama Kepala Keluarga', 'Alamat', 'Jumlah Anggota', 'No KK', 'Kategori', 'Pekerjaan', 'Bantuan'],
      ...activeRtInfo.sampleKk.map(k => [k.no, k.nama, k.alamat, k.anggota, k.noKk, k.kategori, k.pekerjaan || '-', k.bantuan || '-'])
    ].map(e => e.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Daftar_KK_${activeRtInfo.namaRt}_RW018.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full bg-[#050b14] text-slate-100 min-h-screen font-sans antialiased pb-12 transition-all">
      {/* 1. TOP HEADER & NAVIGATION BAR (Mirroring Digital Map UI) */}
      <header className="bg-[#091322] border-b border-blue-900/40 sticky top-0 z-40 px-3 sm:px-6 py-2.5 shadow-xl backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Logo & Main Title */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-amber-400 bg-slate-900 p-0.5 shadow-md shrink-0 flex items-center justify-center overflow-hidden">
              <img
                src={profile.logoUrl || '/logo-rw-018.png'}
                alt="Logo RW 018"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo-rw-018.jpg';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-lg md:text-xl font-black tracking-tight text-white uppercase drop-shadow-sm">
                  PETA DIGITAL RW 018 KAMPUNG BANTEN
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold uppercase tracking-wider hidden sm:inline-block">
                  LIVE GIS
                </span>
              </div>
              <p className="text-[11px] sm:text-xs font-semibold text-amber-300 tracking-wide uppercase">
                KELURAHAN IRINGMULYO - KECAMATAN METRO TIMUR - KOTA METRO
              </p>
            </div>
          </div>

          {/* Navigation Tabs on Header Right */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap w-full md:w-auto justify-end">
            <button
              onClick={() => onNavigateToTab ? onNavigateToTab('dashboard') : null}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
            >
              <Home className="w-3.5 h-3.5 text-blue-400" />
              <span>Beranda</span>
            </button>

            <button
              className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 border border-blue-400 shadow-md transition-all cursor-pointer"
            >
              <Map className="w-3.5 h-3.5" />
              <span>Peta Wilayah</span>
            </button>

            <button
              onClick={() => onNavigateToTab ? onNavigateToTab('warga') : null}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>Data Warga</span>
            </button>

            <button
              onClick={() => onNavigateToTab ? onNavigateToTab('rkm') : null}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>Laporan</span>
            </button>

            {/* Profile Avatar Card */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-700">
              <div className="text-right hidden xl:block">
                <span className="text-xs font-black text-white block leading-tight">EKO PURWANTO</span>
                <span className="text-[10px] text-slate-400 font-semibold">Ketua RW 018</span>
              </div>
              <div className="w-8 h-8 rounded-full border border-amber-400/80 bg-slate-800 overflow-hidden shrink-0 shadow-inner">
                <img
                  src={profile.fotoKetuaRwUrl || '/logo-rw-018.png'}
                  alt="Ketua RW 018"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. MAIN CONTENT GRID (LEFT: MAP + STATS | RIGHT: RT DETAIL & DATA TABLES) */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-4 sm:pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          
          {/* ========================================================= */}
          {/* LEFT COLUMN: INTERACTIVE DIGITAL MAP + BOTTOM 3 WIDGETS */}
          {/* ========================================================= */}
          <div className="lg:col-span-6 xl:col-span-5 flex flex-col gap-4">
            
            {/* Real Satellite Map Card Container */}
            <div className="bg-[#091322] rounded-3xl p-3 sm:p-4 border border-blue-900/50 shadow-2xl relative overflow-hidden flex flex-col">
              
              {/* Map Toolbar / Controls */}
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-black tracking-wide text-white uppercase">
                    PETA SATELIT INTERAKTIF RW 018
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setMapZoom(prev => Math.min(prev + 0.2, 1.8))}
                    className="p-1.5 bg-slate-800/90 hover:bg-slate-700 text-white rounded-lg border border-slate-700 text-xs transition-all"
                    title="Perbesar Peta (+)"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setMapZoom(prev => Math.max(prev - 0.2, 0.8))}
                    className="p-1.5 bg-slate-800/90 hover:bg-slate-700 text-white rounded-lg border border-slate-700 text-xs transition-all"
                    title="Perkecil Peta (-)"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setMapZoom(1)}
                    className="p-1.5 bg-slate-800/90 hover:bg-slate-700 text-white rounded-lg border border-slate-700 text-xs transition-all"
                    title="Reset Zoom (⛶)"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Map SVG Stage with Real Satellite Photo Background */}
              <div className="w-full aspect-[4/3] sm:aspect-[1/1] bg-slate-950 rounded-2xl overflow-hidden relative border border-blue-900/60 shadow-inner group">
                <div
                  className="w-full h-full transition-transform duration-300 origin-center relative"
                  style={{ transform: `scale(${mapZoom})` }}
                >
                  <svg
                    viewBox="0 0 1000 880"
                    className="w-full h-full object-cover select-none cursor-pointer"
                  >
                    <defs>
                      <linearGradient id="bg-grid-glow" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#0b172a" />
                        <stop offset="100%" stopColor="#050b14" />
                      </linearGradient>
                      <filter id="glow-blue-sat" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#3b82f6" floodOpacity="0.8" />
                      </filter>
                      <filter id="glow-green-sat" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#22c55e" floodOpacity="0.8" />
                      </filter>
                      <filter id="glow-yellow-sat" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#eab308" floodOpacity="0.8" />
                      </filter>
                      <filter id="glow-purple-sat" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#a855f7" floodOpacity="0.8" />
                      </filter>
                    </defs>

                    {/* 1. Real Satellite Photo Layer */}
                    <image
                      href="/peta-satelit-rw018.jpg"
                      x="0"
                      y="0"
                      width="1000"
                      height="880"
                      preserveAspectRatio="xMidYMid slice"
                      opacity="0.9"
                    />

                    {/* 2. Outer RW 018 Boundary (Blue dashed line with glow) */}
                    <path
                      d="M 130,220 L 440,200 L 600,150 L 880,160 L 870,330 L 780,360 L 620,440 L 540,480 L 540,570 L 440,590 L 130,735 Z"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="5"
                      strokeDasharray="10 5"
                      opacity="0.95"
                    />

                    {/* 3. POLIGON RT 039 (Top Left / Blue Sector) */}
                    <g
                      onClick={() => setSelectedRt('039')}
                      className="cursor-pointer transition-all hover:opacity-100"
                    >
                      <polygon
                        points="130,220 440,200 425,390 315,390 315,325 140,325"
                        fill={selectedRt === '039' ? 'rgba(59, 130, 246, 0.45)' : 'rgba(59, 130, 246, 0.22)'}
                        stroke="#60a5fa"
                        strokeWidth={selectedRt === '039' ? '4' : '2'}
                        filter={selectedRt === '039' ? 'url(#glow-blue-sat)' : undefined}
                      />
                      <rect x="230" y="240" width="140" height="48" rx="8" fill="#0f172a" stroke="#60a5fa" strokeWidth="2" opacity="0.95" />
                      <text x="300" y="260" textAnchor="middle" fill="#93c5fd" fontSize="16" fontWeight="bold" fontFamily="sans-serif">RT 039</text>
                      <text x="300" y="278" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="sans-serif">312 KK / 1.098 Jiwa</text>
                    </g>

                    {/* 4. POLIGON RT 040 (Top Right / Green Sector) */}
                    <g
                      onClick={() => setSelectedRt('040')}
                      className="cursor-pointer transition-all hover:opacity-100"
                    >
                      <polygon
                        points="440,200 600,150 880,160 870,260 620,330 425,390"
                        fill={selectedRt === '040' ? 'rgba(34, 197, 94, 0.45)' : 'rgba(34, 197, 94, 0.22)'}
                        stroke="#4ade80"
                        strokeWidth={selectedRt === '040' ? '4' : '2'}
                        filter={selectedRt === '040' ? 'url(#glow-green-sat)' : undefined}
                      />
                      <rect x="580" y="235" width="140" height="48" rx="8" fill="#0f172a" stroke="#4ade80" strokeWidth="2" opacity="0.95" />
                      <text x="650" y="255" textAnchor="middle" fill="#86efac" fontSize="16" fontWeight="bold" fontFamily="sans-serif">RT 040</text>
                      <text x="650" y="273" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="sans-serif">304 KK / 1.064 Jiwa</text>
                    </g>

                    {/* 5. POLIGON RT 041 (Bottom Left / Yellow-Orange Sector) */}
                    <g
                      onClick={() => setSelectedRt('041')}
                      className="cursor-pointer transition-all hover:opacity-100"
                    >
                      <polygon
                        points="140,325 315,325 315,390 425,390 425,570 130,735"
                        fill={selectedRt === '041' ? 'rgba(234, 179, 8, 0.45)' : 'rgba(234, 179, 8, 0.22)'}
                        stroke="#facc15"
                        strokeWidth={selectedRt === '041' ? '4' : '2'}
                        filter={selectedRt === '041' ? 'url(#glow-yellow-sat)' : undefined}
                      />
                      <rect x="220" y="440" width="140" height="48" rx="8" fill="#0f172a" stroke="#facc15" strokeWidth="2" opacity="0.95" />
                      <text x="290" y="460" textAnchor="middle" fill="#fde047" fontSize="16" fontWeight="bold" fontFamily="sans-serif">RT 041</text>
                      <text x="290" y="478" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="sans-serif">358 KK / 1.300 Jiwa</text>
                    </g>

                    {/* 6. POLIGON RT 042 (Bottom Right / Purple Sector) */}
                    <g
                      onClick={() => setSelectedRt('042')}
                      className="cursor-pointer transition-all hover:opacity-100"
                    >
                      <polygon
                        points="425,390 620,330 870,260 870,330 780,360 620,440 540,480 540,570 440,590 425,570"
                        fill={selectedRt === '042' ? 'rgba(168, 85, 247, 0.45)' : 'rgba(168, 85, 247, 0.22)'}
                        stroke="#c084fc"
                        strokeWidth={selectedRt === '042' ? '4' : '2'}
                        filter={selectedRt === '042' ? 'url(#glow-purple-sat)' : undefined}
                      />
                      <rect x="580" y="420" width="140" height="48" rx="8" fill="#0f172a" stroke="#c084fc" strokeWidth="2" opacity="0.95" />
                      <text x="650" y="440" textAnchor="middle" fill="#d8b4fe" fontSize="16" fontWeight="bold" fontFamily="sans-serif">RT 042</text>
                      <text x="650" y="458" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="sans-serif">313 KK / 1.050 Jiwa</text>
                    </g>

                    {/* POI Markers on Map */}
                    {/* Masjid Baiturrahman */}
                    <g transform="translate(510, 115)">
                      <circle cx="20" cy="20" r="18" fill="#15803d" stroke="#86efac" strokeWidth="2" />
                      <path d="M 12,25 L 20,12 L 28,25 Z" fill="#ffffff" />
                      <text x="45" y="16" fill="#ffffff" fontSize="12" fontWeight="bold">Masjid</text>
                      <text x="45" y="28" fill="#86efac" fontSize="10">Baiturrahman</text>
                    </g>

                    {/* Lapangan Bola RT 040 */}
                    <g transform="translate(730, 95)">
                      <rect x="0" y="0" width="40" height="26" rx="4" fill="#166534" stroke="#4ade80" strokeWidth="1.5" />
                      <circle cx="20" cy="13" r="5" fill="none" stroke="#ffffff" />
                      <text x="20" y="38" textAnchor="middle" fill="#bbf7d0" fontSize="10" fontWeight="bold">Lapangan Bola</text>
                    </g>

                    {/* Pos Ronda RT 039 */}
                    <g transform="translate(425, 270)">
                      <rect x="0" y="0" width="22" height="22" rx="4" fill="#dc2626" stroke="#ffffff" strokeWidth="1.5" />
                      <path d="M 6,17 L 11,8 L 16,17 Z" fill="#ffffff" />
                      <text x="28" y="14" fill="#ffffff" fontSize="10" fontWeight="bold">Pos Ronda</text>
                      <text x="28" y="24" fill="#fca5a5" fontSize="9">RT 039</text>
                    </g>

                    {/* Pos Ronda RT 040 */}
                    <g transform="translate(775, 220)">
                      <rect x="0" y="0" width="22" height="22" rx="4" fill="#dc2626" stroke="#ffffff" strokeWidth="1.5" />
                      <path d="M 6,17 L 11,8 L 16,17 Z" fill="#ffffff" />
                      <text x="28" y="14" fill="#ffffff" fontSize="10" fontWeight="bold">Pos Ronda</text>
                      <text x="28" y="24" fill="#fca5a5" fontSize="9">RT 040</text>
                    </g>

                    {/* Pos Ronda RT 041 */}
                    <g transform="translate(300, 520)">
                      <rect x="0" y="0" width="22" height="22" rx="4" fill="#dc2626" stroke="#ffffff" strokeWidth="1.5" />
                      <path d="M 6,17 L 11,8 L 16,17 Z" fill="#ffffff" />
                      <text x="28" y="14" fill="#ffffff" fontSize="10" fontWeight="bold">Pos Ronda</text>
                      <text x="28" y="24" fill="#fca5a5" fontSize="9">RT 041</text>
                    </g>

                    {/* Pos Ronda RT 042 */}
                    <g transform="translate(720, 395)">
                      <rect x="0" y="0" width="22" height="22" rx="4" fill="#dc2626" stroke="#ffffff" strokeWidth="1.5" />
                      <path d="M 6,17 L 11,8 L 16,17 Z" fill="#ffffff" />
                      <text x="28" y="14" fill="#ffffff" fontSize="10" fontWeight="bold">Pos Ronda</text>
                      <text x="28" y="24" fill="#fca5a5" fontSize="9">RT 042</text>
                    </g>

                    {/* Siring / Drainase Label & Lines */}
                    <path d="M 70,250 L 130,220 L 140,325 L 130,735 L 210,810" fill="none" stroke="#0284c7" strokeWidth="6" opacity="0.8" />
                    <text x="100" y="280" fill="#38bdf8" fontSize="14" fontWeight="bold" transform="rotate(-70 100 280)">Siring</text>
                    <text x="250" y="700" fill="#38bdf8" fontSize="14" fontWeight="bold" transform="rotate(45 250 700)">Siring</text>

                    {/* Center Pin: Kampung Banten */}
                    <g transform="translate(365, 735)">
                      <circle cx="12" cy="12" r="10" fill="#ffffff" stroke="#0284c7" strokeWidth="3" />
                      <circle cx="12" cy="12" r="4" fill="#0284c7" />
                      <text x="30" y="16" fill="#ffffff" fontSize="12" fontWeight="black">Kampung Banten</text>
                    </g>
                  </svg>
                </div>

                {/* Floating Map Legend (Bottom-Left Overlay) */}
                <div className="absolute bottom-2 left-2 bg-[#091322]/95 backdrop-blur-md p-2.5 rounded-xl border border-blue-900/60 shadow-xl text-[10px] text-slate-200 z-10 max-w-[190px]">
                  <div className="font-bold text-amber-300 uppercase tracking-wider mb-1.5 flex items-center gap-1 border-b border-slate-700/60 pb-1">
                    <Layers className="w-3 h-3 text-amber-400" />
                    <span>LEGENDA PETA</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 border-t-2 border-dashed border-red-500 shrink-0" />
                      <span>Batas RW 018</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 border-t-2 border-white shrink-0" />
                      <span>Batas RT</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 bg-amber-400 shrink-0" />
                      <span>Jalan Utama</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 bg-blue-400 shrink-0" />
                      <span>Jalan Lingkungan</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 bg-sky-500 shrink-0" />
                      <span>Siring / Drainase</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-1 gap-y-0.5 pt-1.5 mt-1.5 border-t border-slate-700/60 text-[9px]">
                    <span className="flex items-center gap-1">🕌 Masjid</span>
                    <span className="flex items-center gap-1">🏫 Sekolah</span>
                    <span className="flex items-center gap-1">🏥 Posyandu</span>
                    <span className="flex items-center gap-1">👮 Pos Ronda</span>
                    <span className="flex items-center gap-1">⚽ Lapangan</span>
                    <span className="flex items-center gap-1">🏛️ Balai Pertemuan</span>
                    <span className="flex items-center gap-1">🗑️ TPS / Bank Sampah</span>
                    <span className="flex items-center gap-1">🏪 UMKM</span>
                  </div>
                </div>
              </div>

              {/* Clickable Quick RT Selector Buttons */}
              <div className="mt-3 grid grid-cols-4 gap-1.5">
                {(['039', '040', '041', '042'] as const).map((rtNum) => {
                  const isSelected = selectedRt === rtNum;
                  const rtData = RT_DIGITAL_DATA[rtNum];
                  return (
                    <button
                      key={rtNum}
                      onClick={() => setSelectedRt(rtNum)}
                      className={`py-2 px-1 rounded-xl text-xs font-black transition-all flex flex-col items-center justify-center cursor-pointer border ${
                        isSelected
                          ? `${rtData.colorTheme.badge} shadow-lg scale-102 ring-2 ring-white/30`
                          : 'bg-slate-900/80 text-slate-400 hover:text-white border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      <span>RT {rtNum}</span>
                      <span className="text-[9px] font-semibold opacity-90">{rtData.kkCount} KK</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3 BOTTOM WIDGETS (STATISTIK RW 018 | INFO KEGIATAN | CUACA) */}
            <div className="space-y-3">
              {/* 1. STATISTIK RW 018 */}
              <div className="bg-[#091322] rounded-2xl p-3 sm:p-4 border border-blue-900/50 shadow-lg">
                <div className="flex items-center justify-between border-b border-blue-900/40 pb-2 mb-2.5">
                  <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    STATISTIK RW 018
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    Update Terakhir : 20 Mei 2026
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                  <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                    <span className="text-[9px] text-slate-400 block font-bold uppercase">TOTAL KK</span>
                    <span className="text-sm sm:text-base font-black text-white">1.287</span>
                    <span className="text-[9px] text-slate-400 font-medium">KK</span>
                  </div>
                  <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                    <span className="text-[9px] text-slate-400 block font-bold uppercase">TOTAL PENDUDUK</span>
                    <span className="text-sm sm:text-base font-black text-emerald-400">4.512</span>
                    <span className="text-[9px] text-slate-400 font-medium">Jiwa</span>
                  </div>
                  <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                    <span className="text-[9px] text-slate-400 block font-bold uppercase">LAKI-LAKI</span>
                    <span className="text-sm sm:text-base font-black text-blue-400">2.214</span>
                    <span className="text-[9px] text-slate-400 font-medium">Jiwa</span>
                  </div>
                  <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                    <span className="text-[9px] text-slate-400 block font-bold uppercase">PEREMPUAN</span>
                    <span className="text-sm sm:text-base font-black text-pink-400">2.298</span>
                    <span className="text-[9px] text-slate-400 font-medium">Jiwa</span>
                  </div>
                  <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                    <span className="text-[9px] text-slate-400 block font-bold uppercase">RUMAH</span>
                    <span className="text-sm sm:text-base font-black text-amber-400">1.356</span>
                    <span className="text-[9px] text-slate-400 font-medium">Unit</span>
                  </div>
                  <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                    <span className="text-[9px] text-slate-400 block font-bold uppercase">UMKM</span>
                    <span className="text-sm sm:text-base font-black text-purple-400">57</span>
                    <span className="text-[9px] text-slate-400 font-medium">Unit</span>
                  </div>
                </div>
              </div>

              {/* 2 & 3. INFO KEGIATAN TERDEKAT & CUACA HARI INI */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Info Kegiatan */}
                <div className="bg-[#091322] rounded-2xl p-3 border border-blue-900/50 shadow-lg flex flex-col justify-between">
                  <div>
                    <div className="text-[11px] font-black text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      INFO KEGIATAN TERDEKAT
                    </div>
                    <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 mb-2 flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-red-600/30 border border-red-500/50 flex items-center justify-center shrink-0">
                        <Calendar className="w-4 h-4 text-red-400" />
                      </div>
                      <div className="text-xs">
                        <span className="font-black text-white block">Kerja Bakti Bersih Lingkungan</span>
                        <span className="text-[11px] text-slate-300 block">Minggu, 25 Mei 2026</span>
                        <span className="text-[10px] text-slate-400 block">Pukul 07.00 WIB | Lapangan RT 041</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigateToTab ? onNavigateToTab('kegiatan') : null}
                    className="w-full py-1.5 bg-blue-900/40 hover:bg-blue-800/60 text-blue-300 border border-blue-700/50 rounded-xl text-xs font-bold text-center transition-all cursor-pointer"
                  >
                    Lihat Semua Kegiatan
                  </button>
                </div>

                {/* Cuaca Hari Ini */}
                <div className="bg-[#091322] rounded-2xl p-3 border border-blue-900/50 shadow-lg flex flex-col justify-between">
                  <div className="text-[11px] font-black text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    CUACA HARI INI
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <CloudSun className="w-9 h-9 text-amber-400 shrink-0" />
                      <div>
                        <div className="text-xl sm:text-2xl font-black text-white leading-none">
                          26 °C
                        </div>
                        <div className="text-xs text-slate-300 font-semibold mt-0.5">
                          Cerah Berawan
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-[10px] text-slate-400 space-y-0.5 border-l border-slate-800 pl-2">
                      <div>Kelembapan: <span className="text-white font-bold">78%</span></div>
                      <div>Angin: <span className="text-white font-bold">8 km/j</span></div>
                    </div>
                  </div>
                  <div className="text-[10px] text-emerald-400 font-medium text-center pt-1.5">
                    ✓ Kondisi Lingkungan Sangat Kondusif
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: DETAIL DATA WILAYAH PER-RT + TABLE OF KK */}
          {/* ========================================================= */}
          <div className="lg:col-span-6 xl:col-span-7 flex flex-col gap-4">
            
            {/* Header Data Wilayah Selected RT */}
            <div className="bg-[#091322] rounded-3xl p-4 sm:p-5 border border-blue-900/50 shadow-2xl space-y-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-900/40 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase">DATA WILAYAH</span>
                    <span className="text-lg sm:text-xl font-black text-amber-400 uppercase tracking-tight">
                      {activeRtInfo.namaRt}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium">
                    RW 018 KAMPUNG BANTEN — <span className="text-blue-300">{activeRtInfo.sektor}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedRt('039')}
                    className="px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Kembali ke Peta RW</span>
                  </button>
                </div>
              </div>

              {/* 4 TOP DEMOGRAPHIC METRIC CARDS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-[#0b172a] p-3 rounded-2xl border border-blue-800/40 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <span className="text-lg sm:text-xl font-black text-white block leading-tight">
                      {activeRtInfo.kkCount}
                    </span>
                    <span className="text-[11px] text-slate-400 font-semibold">Kepala Keluarga</span>
                  </div>
                </div>

                <div className="bg-[#0b172a] p-3 rounded-2xl border border-emerald-800/40 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-lg sm:text-xl font-black text-emerald-300 block leading-tight">
                      {activeRtInfo.pendudukCount.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-slate-400 font-semibold">Total Penduduk</span>
                  </div>
                </div>

                <div className="bg-[#0b172a] p-3 rounded-2xl border border-sky-800/40 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-600/20 border border-sky-500/40 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-sky-400" />
                  </div>
                  <div>
                    <span className="text-lg sm:text-xl font-black text-sky-300 block leading-tight">
                      {activeRtInfo.lakiCount}
                    </span>
                    <span className="text-[11px] text-slate-400 font-semibold">Laki-laki</span>
                  </div>
                </div>

                <div className="bg-[#0b172a] p-3 rounded-2xl border border-pink-800/40 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-pink-600/20 border border-pink-500/40 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-pink-400" />
                  </div>
                  <div>
                    <span className="text-lg sm:text-xl font-black text-pink-300 block leading-tight">
                      {activeRtInfo.perempuanCount}
                    </span>
                    <span className="text-[11px] text-slate-400 font-semibold">Perempuan</span>
                  </div>
                </div>
              </div>

              {/* 5 AGE GROUPS BAR */}
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2 text-center bg-[#070e1a] p-2 rounded-2xl border border-slate-800">
                <div className="p-1.5 bg-amber-950/30 rounded-xl border border-amber-800/30">
                  <span className="text-sm sm:text-base font-black text-amber-400 block">{activeRtInfo.balita}</span>
                  <span className="text-[9px] sm:text-[10px] text-slate-400 block font-medium">Balita (0-5 Th)</span>
                </div>
                <div className="p-1.5 bg-yellow-950/30 rounded-xl border border-yellow-800/30">
                  <span className="text-sm sm:text-base font-black text-yellow-400 block">{activeRtInfo.anak}</span>
                  <span className="text-[9px] sm:text-[10px] text-slate-400 block font-medium">Anak (6-12 Th)</span>
                </div>
                <div className="p-1.5 bg-orange-950/30 rounded-xl border border-orange-800/30">
                  <span className="text-sm sm:text-base font-black text-orange-400 block">{activeRtInfo.remaja}</span>
                  <span className="text-[9px] sm:text-[10px] text-slate-400 block font-medium">Remaja (13-18)</span>
                </div>
                <div className="p-1.5 bg-emerald-950/30 rounded-xl border border-emerald-800/30">
                  <span className="text-sm sm:text-base font-black text-emerald-400 block">{activeRtInfo.produktif}</span>
                  <span className="text-[9px] sm:text-[10px] text-slate-400 block font-medium">Produktif (19-59)</span>
                </div>
                <div className="p-1.5 bg-rose-950/30 rounded-xl border border-rose-800/30">
                  <span className="text-sm sm:text-base font-black text-rose-400 block">{activeRtInfo.lansia}</span>
                  <span className="text-[9px] sm:text-[10px] text-slate-400 block font-medium">Lansia (60+ Th)</span>
                </div>
              </div>

              {/* HORIZONTAL SUB-MENU NAVIGATION (8 TABS) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {[
                  { id: 'warga', label: 'Data Warga', icon: Users },
                  { id: 'rumah', label: 'Rumah Warga', icon: Home },
                  { id: 'bansos', label: 'Bansos', icon: Gift },
                  { id: 'kesehatan', label: 'Kesehatan', icon: Heart },
                  { id: 'umkm', label: 'UMKM', icon: Store },
                  { id: 'infrastruktur', label: 'Infrastruktur', icon: Route },
                  { id: 'keamanan', label: 'Keamanan', icon: Shield },
                  { id: 'statistik', label: 'Statistik', icon: Sparkles }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeSubTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveSubTab(tab.id as any)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer border ${
                        isActive
                          ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                          : 'bg-slate-900 text-slate-300 hover:text-white border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* 3 SUMMARY CARDS (RINGKASAN RT | DATA BANTUAN SOSIAL | DATA KESEHATAN) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1. RINGKASAN DATA RT */}
                <div className="bg-[#0b172a] rounded-2xl p-3.5 border border-blue-900/50 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-black text-white uppercase tracking-wider mb-2.5 pb-1 border-b border-slate-800">
                      RINGKASAN DATA {activeRtInfo.namaRt}
                    </div>
                    <div className="space-y-1.5 text-xs text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Jumlah KK:</span>
                        <span className="font-bold text-white">: {activeRtInfo.kkCount} KK</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Jumlah Penduduk:</span>
                        <span className="font-bold text-white">: {activeRtInfo.pendudukCount} Jiwa</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Laki-laki:</span>
                        <span className="font-bold text-blue-300">: {activeRtInfo.lakiCount} Jiwa</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Perempuan:</span>
                        <span className="font-bold text-pink-300">: {activeRtInfo.perempuanCount} Jiwa</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Kepadatan:</span>
                        <span className="font-bold text-emerald-300">: {activeRtInfo.kepadatan}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Luas Wilayah:</span>
                        <span className="font-bold text-amber-300">: {activeRtInfo.luasWilayah}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Jumlah Rumah:</span>
                        <span className="font-bold text-white">: {activeRtInfo.jumlahRumah} Unit</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Jumlah Jalan:</span>
                        <span className="font-bold text-white">: {activeRtInfo.panjangJalan}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Jumlah Gang:</span>
                        <span className="font-bold text-white">: {activeRtInfo.jumlahGang} Gang</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. DATA BANTUAN SOSIAL */}
                <div className="bg-[#0b172a] rounded-2xl p-3.5 border border-amber-900/40 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-black text-amber-300 uppercase tracking-wider mb-2.5 pb-1 border-b border-slate-800 flex items-center justify-between">
                      <span>DATA BANTUAN SOSIAL</span>
                      <Gift className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <div className="space-y-1.5 text-xs text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">PKH:</span>
                        <span className="font-bold text-white">: {activeRtInfo.bansos.pkh} KK</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">BPNT:</span>
                        <span className="font-bold text-white">: {activeRtInfo.bansos.bpnt} KK</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">BLT:</span>
                        <span className="font-bold text-white">: {activeRtInfo.bansos.blt} KK</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">PBI / KIS:</span>
                        <span className="font-bold text-white">: {activeRtInfo.bansos.pbi} KK</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Lansia:</span>
                        <span className="font-bold text-white">: {activeRtInfo.bansos.lansia} KK</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Disabilitas:</span>
                        <span className="font-bold text-white">: {activeRtInfo.bansos.disabilitas} KK</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-800 font-bold text-amber-300">
                        <span>Total Penerima:</span>
                        <span>: {activeRtInfo.bansos.total} KK</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setDetailModal({
                        isOpen: true,
                        title: `Daftar Penerima Bantuan Sosial ${activeRtInfo.namaRt}`,
                        type: 'bansos',
                        data: activeRtInfo.bansos
                      });
                    }}
                    className="w-full mt-3 py-1.5 bg-blue-900/50 hover:bg-blue-800 text-blue-300 border border-blue-700/50 rounded-xl text-xs font-bold text-center transition-all cursor-pointer"
                  >
                    Lihat Daftar Penerima
                  </button>
                </div>

                {/* 3. DATA KESEHATAN */}
                <div className="bg-[#0b172a] rounded-2xl p-3.5 border border-emerald-900/40 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-black text-emerald-300 uppercase tracking-wider mb-2.5 pb-1 border-b border-slate-800 flex items-center justify-between">
                      <span>DATA KESEHATAN</span>
                      <Heart className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="space-y-1.5 text-xs text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">👶 Balita:</span>
                        <span className="font-bold text-white">: {activeRtInfo.kesehatan.balita}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">🤰 Ibu Hamil:</span>
                        <span className="font-bold text-white">: {activeRtInfo.kesehatan.ibuHamil}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">👴 Lansia:</span>
                        <span className="font-bold text-white">: {activeRtInfo.kesehatan.lansia}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">♿ Disabilitas:</span>
                        <span className="font-bold text-white">: {activeRtInfo.kesehatan.disabilitas}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">🪪 Jiwa BPJS:</span>
                        <span className="font-bold text-emerald-300">: {activeRtInfo.kesehatan.bpjs}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">🏥 Posyandu:</span>
                        <span className="font-bold text-white">: {activeRtInfo.kesehatan.posyandu} Posyandu</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setDetailModal({
                        isOpen: true,
                        title: `Detail Data Kesehatan & Posyandu ${activeRtInfo.namaRt}`,
                        type: 'kesehatan',
                        data: activeRtInfo.kesehatan
                      });
                    }}
                    className="w-full mt-3 py-1.5 bg-blue-900/50 hover:bg-blue-800 text-blue-300 border border-blue-700/50 rounded-xl text-xs font-bold text-center transition-all cursor-pointer"
                  >
                    Lihat Detail Kesehatan
                  </button>
                </div>
              </div>

              {/* TABLE: DAFTAR KEPALA KELUARGA RT */}
              <div className="bg-[#0b172a] rounded-2xl p-3.5 border border-blue-900/40 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="text-xs font-black text-white uppercase tracking-wider">
                    DAFTAR KEPALA KELUARGA {activeRtInfo.namaRt}
                  </div>

                  {/* Search and Action Buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Cari Nama / Alamat / KK..."
                        value={tableSearch}
                        onChange={(e) => {
                          setTableSearch(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-blue-500 w-48 sm:w-60"
                      />
                    </div>

                    <button
                      onClick={handleExportData}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export</span>
                    </button>
                  </div>
                </div>

                {/* Table Container */}
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                        <th className="py-2.5 px-3">No</th>
                        <th className="py-2.5 px-3">Nama Kepala Keluarga</th>
                        <th className="py-2.5 px-3">Alamat</th>
                        <th className="py-2.5 px-3 text-center">Jumlah Anggota</th>
                        <th className="py-2.5 px-3">No. KK</th>
                        <th className="py-2.5 px-3">Kategori</th>
                        <th className="py-2.5 px-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 text-slate-200">
                      {paginatedKk.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-slate-500 font-medium">
                            Tidak ada data Kepala Keluarga yang cocok dengan pencarian.
                          </td>
                        </tr>
                      ) : (
                        paginatedKk.map((item, idx) => (
                          <tr key={item.noKk} className="hover:bg-slate-900/60 transition-colors">
                            <td className="py-2 px-3 font-semibold text-slate-400">
                              {(currentPage - 1) * rowsPerPage + idx + 1}
                            </td>
                            <td className="py-2 px-3 font-bold text-white">
                              {item.nama}
                            </td>
                            <td className="py-2 px-3 text-slate-300">
                              {item.alamat}
                            </td>
                            <td className="py-2 px-3 text-center font-bold text-amber-300">
                              {item.anggota}
                            </td>
                            <td className="py-2 px-3 font-mono text-[11px] text-blue-300">
                              {item.noKk}
                            </td>
                            <td className="py-2 px-3">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                item.kategori.includes('Miskin') || item.kategori.includes('PKH')
                                  ? 'bg-red-950 text-red-300 border border-red-800'
                                  : item.kategori.includes('BPNT')
                                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                  : item.kategori.includes('UMKM')
                                  ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                  : item.kategori.includes('Lansia')
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}>
                                {item.kategori}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => {
                                    setDetailModal({
                                      isOpen: true,
                                      title: `Detail Data KK - ${item.nama}`,
                                      type: 'kk',
                                      data: item
                                    });
                                  }}
                                  className="p-1 hover:bg-slate-800 text-blue-400 hover:text-blue-300 rounded-lg transition-all"
                                  title="Lihat Detail KK"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    alert(`Lokasi Titik Rumah: ${item.nama}\nAlamat: ${item.alamat} (${activeRtInfo.namaRt} RW 018)`);
                                  }}
                                  className="p-1 hover:bg-slate-800 text-amber-400 hover:text-amber-300 rounded-lg transition-all"
                                  title="Tampilkan Titik di Peta"
                                >
                                  <MapPin className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 pt-2">
                  <div>
                    Menampilkan <span className="text-white font-bold">{filteredKkList.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0}</span> - <span className="text-white font-bold">{Math.min(currentPage * rowsPerPage, filteredKkList.length)}</span> dari <span className="text-white font-bold">{activeRtInfo.kkCount}</span> data
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-30 hover:bg-slate-800 text-white"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}

                    {totalPages > 5 && (
                      <>
                        <span className="px-1 text-slate-500">...</span>
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold ${
                            currentPage === totalPages
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {totalPages}
                        </button>
                      </>
                    )}

                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-30 hover:bg-slate-800 text-white"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>

      {/* 3. FOOTER BAR (Mirroring Bottom Copyright Bar) */}
      <footer className="mt-8 border-t border-slate-800/80 pt-4 px-3 sm:px-6 text-xs text-slate-400 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-4 flex-wrap text-slate-300">
          <button
            onClick={() => setDetailModal({ isOpen: true, title: 'Tentang Aplikasi Peta Digital RW 018', type: 'tentang' })}
            className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Info className="w-3.5 h-3.5 text-blue-400" />
            <span>Tentang Aplikasi</span>
          </button>
          <button
            onClick={() => setDetailModal({ isOpen: true, title: 'Panduan Penggunaan Peta Digital', type: 'panduan' })}
            className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>Panduan Penggunaan</span>
          </button>
          <button
            onClick={() => setDetailModal({ isOpen: true, title: 'Kebijakan Privasi & Keamanan Data', type: 'tentang' })}
            className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Kebijakan Privasi</span>
          </button>
          <button
            onClick={() => setDetailModal({ isOpen: true, title: 'Kontak Pengurus RW 018', type: 'kontak' })}
            className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Phone className="w-3.5 h-3.5 text-pink-400" />
            <span>Kontak</span>
          </button>
        </div>

        <div className="text-slate-400 font-medium text-center md:text-right">
          © 2026 Peta Digital RW 018 Kampung Banten - All Rights Reserved
        </div>
      </footer>

      {/* MODAL VIEWER POPUP */}
      {detailModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#091322] border border-blue-900/60 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-400" />
                <span>{detailModal.title}</span>
              </h3>
              <button
                onClick={() => setDetailModal({ isOpen: false, title: '', type: 'kk' })}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 text-xs text-slate-200 space-y-4 max-h-[75vh] overflow-y-auto">
              {detailModal.type === 'kk' && detailModal.data && (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Nama Kepala Keluarga:</span>
                      <span className="font-bold text-white">{detailModal.data.nama}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Nomor Kartu Keluarga:</span>
                      <span className="font-mono font-bold text-blue-300">{detailModal.data.noKk}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Alamat Lengkap:</span>
                      <span className="font-semibold text-white">{detailModal.data.alamat} ({activeRtInfo.namaRt})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Jumlah Anggota Keluarga:</span>
                      <span className="font-bold text-amber-300">{detailModal.data.anggota} Jiwa</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Pekerjaan / Mata Pencaharian:</span>
                      <span className="font-semibold text-white">{detailModal.data.pekerjaan || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Status Kategori:</span>
                      <span className="font-bold text-emerald-300">{detailModal.data.kategori}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Bantuan Sosial Diterima:</span>
                      <span className="font-bold text-rose-300">{detailModal.data.bantuan || '-'}</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 text-center">
                    Data tersinkronisasi dengan Database Kependudukan & SISKAMLING RW 018.
                  </div>
                </div>
              )}

              {detailModal.type === 'bansos' && (
                <div className="space-y-3">
                  <p className="text-slate-300">
                    Rekapitulasi alokasi bansos untuk warga di wilayah <span className="font-bold text-white">{activeRtInfo.namaRt}</span>:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Program Keluarga Harapan (PKH)</span>
                      <span className="text-base font-bold text-white">{activeRtInfo.bansos.pkh} KK</span>
                    </div>
                    <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Bantuan Pangan Non-Tunai (BPNT)</span>
                      <span className="text-base font-bold text-white">{activeRtInfo.bansos.bpnt} KK</span>
                    </div>
                    <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Bantuan Langsung Tunai (BLT)</span>
                      <span className="text-base font-bold text-white">{activeRtInfo.bansos.blt} KK</span>
                    </div>
                    <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">PBI-JK / BPJS Gratis (PBI)</span>
                      <span className="text-base font-bold text-white">{activeRtInfo.bansos.pbi} KK</span>
                    </div>
                  </div>
                </div>
              )}

              {detailModal.type === 'kesehatan' && (
                <div className="space-y-3">
                  <p className="text-slate-300">
                    Layanan pemantauan kesehatan berkala & Posyandu Cempaka 18:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Balita & Baduta Terpantau</span>
                      <span className="text-base font-bold text-emerald-400">{activeRtInfo.kesehatan.balita} Balita</span>
                    </div>
                    <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Ibu Hamil / Menyusui</span>
                      <span className="text-base font-bold text-pink-400">{activeRtInfo.kesehatan.ibuHamil} Orang</span>
                    </div>
                    <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Lansia & Posbindu</span>
                      <span className="text-base font-bold text-amber-400">{activeRtInfo.kesehatan.lansia} Lansia</span>
                    </div>
                    <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Warga Terdaftar JKN-BPJS</span>
                      <span className="text-base font-bold text-blue-400">{activeRtInfo.kesehatan.bpjs} Jiwa</span>
                    </div>
                  </div>
                </div>
              )}

              {detailModal.type === 'tentang' && (
                <div className="space-y-2">
                  <p>
                    <span className="font-bold text-white">Peta Digital RW 018 Kampung Banten</span> adalah sistem informasi geografis terpadu berbasis cloud yang memadukan foto satelit live view, data kependudukan per-RT, bantuan sosial, pemantauan kesehatan posyandu, dan infrastruktur lingkungan.
                  </p>
                  <p className="text-slate-400">
                    Dikembangkan untuk mempermudah Ketua RW 018, para Ketua RT, dan seluruh warga dalam mengakses informasi wilayah secara transparan, akurat, dan cepat.
                  </p>
                </div>
              )}

              {detailModal.type === 'panduan' && (
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-amber-400">1.</span>
                    <span>Klik pada salah satu blok poligon RT di peta satelit (RT 039, RT 040, RT 041, RT 042) untuk melihat data detail per-wilayah.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-amber-400">2.</span>
                    <span>Gunakan tombol tab sub-menu (Data Warga, Rumah, Bansos, Kesehatan, UMKM, Infrastruktur, Keamanan) untuk menavigasi kategori informasi.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-amber-400">3.</span>
                    <span>Gunakan fitur pencarian pada tabel Kepala Keluarga untuk menemukan data warga dengan cepat, atau klik tombol Export untuk mengunduh rekapitulasi data.</span>
                  </div>
                </div>
              )}

              {detailModal.type === 'kontak' && (
                <div className="space-y-2">
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                    <span className="font-bold text-white block">Ketua RW 018 (Eko Purwanto S.Kom)</span>
                    <span className="text-slate-400 block">Jl. Pala No. 1, Kel. Iringmulyo, Kec. Metro Timur, Kota Metro</span>
                    <span className="text-emerald-400 font-mono font-bold block">WhatsApp: 0853-8316-6999</span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-900 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setDetailModal({ isOpen: false, title: '', type: 'kk' })}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default PetaDigitalDashboard;
