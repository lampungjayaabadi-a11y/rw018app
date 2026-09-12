import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Camera,
  Hammer,
  Waves,
  Route,
  Search,
  Plus,
  Filter,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Edit2,
  Trash2,
  X,
  Building,
  User,
  Calendar,
  Layers,
  Sparkles,
  MapPin,
  PhoneCall,
  Phone,
  Ambulance,
  Flame,
  Zap,
  Moon,
  Users,
  FileText,
  Lock,
  ShieldAlert
} from 'lucide-react';
import {
  KeamananProgramItem,
  KeamananCategory,
  KeamananStatus,
  RWProfile,
  AppUser,
  JadwalRonda,
  AbsensiRondaRecord,
  Warga,
  LaporanKejadian,
  NavTab
} from '../types';
import { formatRupiah, generateId } from '../utils/formatters';
import { RondaMalamView } from './RondaMalamView';
import { LaporanKejadianView } from './LaporanKejadianView';

interface KeamananViewProps {
  profile: RWProfile;
  keamananList: KeamananProgramItem[];
  onSaveKeamanan: (item: KeamananProgramItem) => void;
  onDeleteKeamanan: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  currentUser?: AppUser | null;
  wargaList?: Warga[];
  jadwalRondaList?: JadwalRonda[];
  absensiRondaList?: AbsensiRondaRecord[];
  onSaveJadwalRonda?: (item: JadwalRonda) => void;
  onDeleteJadwalRonda?: (id: string) => void;
  onSaveAbsensiRonda?: (record: AbsensiRondaRecord) => void;
  onDeleteAbsensiRonda?: (id: string) => void;
  defaultModule?: 'ronda' | 'pembangunan' | 'lapor_kejadian';
  laporanKejadianList?: LaporanKejadian[];
  onSaveLaporanKejadian?: (item: LaporanKejadian) => Promise<boolean>;
  onDeleteLaporanKejadian?: (id: string) => Promise<boolean>;
  onNavigateTab?: (tab: NavTab) => void;
}

export const KeamananView: React.FC<KeamananViewProps> = ({
  profile,
  keamananList = [],
  onSaveKeamanan,
  onDeleteKeamanan,
  searchQuery,
  onSearchChange,
  currentUser,
  wargaList = [],
  jadwalRondaList = [],
  absensiRondaList = [],
  onSaveJadwalRonda,
  onDeleteJadwalRonda,
  onSaveAbsensiRonda,
  onDeleteAbsensiRonda,
  defaultModule = 'ronda',
  laporanKejadianList = [],
  onSaveLaporanKejadian = async () => true,
  onDeleteLaporanKejadian = async () => true,
  onNavigateTab,
}) => {
  const [activeModule, setActiveModule] = useState<'ronda' | 'pembangunan' | 'lapor_kejadian'>(defaultModule);
  const [selectedKategori, setSelectedKategori] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KeamananProgramItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<KeamananProgramItem | null>(null);
  const [restrictedModalOpen, setRestrictedModalOpen] = useState(false);

  const isAuthorizedLaporanKejadian = currentUser ? (
    currentUser.role === 'ketua_rw' ||
    currentUser.role === 'admin_rw' ||
    currentUser.role === 'super_admin' ||
    currentUser.username.toLowerCase() === 'superadmin' ||
    currentUser.username.toLowerCase() === 'sa' ||
    currentUser.username.toLowerCase() === 'admin' ||
    currentUser.username.toLowerCase() === 'ketuarw' ||
    (currentUser.nama && currentUser.nama.toLowerCase().includes('eko purwanto'))
  ) : false;

  const [formData, setFormData] = useState<Partial<KeamananProgramItem>>({
    namaProgram: '',
    kategori: 'CCTV & Keamanan',
    lokasi: 'Jl. Pala RT 039 s.d. RT 042',
    targetWaktu: 'Agustus - Oktober 2026',
    anggaran: 10000000,
    sumberDana: 'Swadaya Warga',
    penanggungJawab: `${profile.namaKetuaRw} (Ketua RW 018)`,
    progressPercent: 0,
    status: 'Perencanaan',
    deskripsi: '',
    realisasiBiaya: 0,
    titikCctvCount: 0,
  });

  const filteredList = useMemo(() => {
    return keamananList.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.namaProgram.toLowerCase().includes(q) ||
        item.lokasi.toLowerCase().includes(q) ||
        item.penanggungJawab.toLowerCase().includes(q) ||
        item.deskripsi.toLowerCase().includes(q);
      const matchKategori = selectedKategori === 'ALL' || item.kategori === selectedKategori;
      const matchStatus = selectedStatus === 'ALL' || item.status === selectedStatus;
      return matchSearch && matchKategori && matchStatus;
    });
  }, [keamananList, searchQuery, selectedKategori, selectedStatus]);

  // Aggregate stats
  const totalAnggaran = useMemo(() => {
    return keamananList.reduce((acc, curr) => acc + (curr.anggaran || 0), 0);
  }, [keamananList]);

  const totalRealisasi = useMemo(() => {
    return keamananList.reduce((acc, curr) => acc + (curr.realisasiBiaya || 0), 0);
  }, [keamananList]);

  const avgProgress = useMemo(() => {
    if (keamananList.length === 0) return 0;
    const sum = keamananList.reduce((acc, curr) => acc + (curr.progressPercent || 0), 0);
    return Math.round(sum / keamananList.length);
  }, [keamananList]);

  const totalTitikCctv = useMemo(() => {
    return keamananList
      .filter((k) => k.kategori === 'CCTV & Keamanan')
      .reduce((acc, curr) => acc + (curr.titikCctvCount || 0), 0);
  }, [keamananList]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      namaProgram: '',
      kategori: 'CCTV & Keamanan',
      lokasi: 'Jl. Pala RT 039 s.d. RT 042',
      targetWaktu: 'Agustus - Oktober 2026',
      anggaran: 10000000,
      sumberDana: 'Swadaya Warga',
      penanggungJawab: `${profile.namaKetuaRw} (Ketua RW)`,
      progressPercent: 0,
      status: 'Perencanaan',
      deskripsi: '',
      realisasiBiaya: 0,
      titikCctvCount: 0,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: KeamananProgramItem) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaProgram || !formData.lokasi) {
      alert('Nama Program dan Lokasi wajib diisi');
      return;
    }

    const item: KeamananProgramItem = {
      id: editingItem ? editingItem.id : generateId('kp'),
      namaProgram: formData.namaProgram || '',
      kategori: (formData.kategori as KeamananCategory) || 'CCTV & Keamanan',
      lokasi: formData.lokasi || '',
      targetWaktu: formData.targetWaktu || '2026',
      anggaran: Number(formData.anggaran) || 0,
      sumberDana: (formData.sumberDana as any) || 'Kas RW',
      penanggungJawab: formData.penanggungJawab || `${profile.namaKetuaRw}`,
      progressPercent: Math.min(100, Math.max(0, Number(formData.progressPercent) || 0)),
      status: (formData.status as KeamananStatus) || 'Perencanaan',
      deskripsi: formData.deskripsi || '',
      realisasiBiaya: Number(formData.realisasiBiaya) || 0,
      titikCctvCount: Number(formData.titikCctvCount) || 0,
    };

    onSaveKeamanan(item);
    setIsModalOpen(false);
  };

  const getCategoryIcon = (cat: KeamananCategory) => {
    switch (cat) {
      case 'CCTV & Keamanan':
        return <Camera className="w-4 h-4 text-blue-600" />;
      case 'Pos Ronda & Siskamling':
        return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
      case 'Drainase & Saluran Air':
        return <Waves className="w-4 h-4 text-cyan-600" />;
      case 'Paving & Jalan Lingkungan':
        return <Route className="w-4 h-4 text-amber-600" />;
      default:
        return <Hammer className="w-4 h-4 text-purple-600" />;
    }
  };

  const getStatusBadge = (status: KeamananStatus) => {
    switch (status) {
      case 'Selesai':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Selesai 100%
          </span>
        );
      case 'Sedang Berjalan':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Progres Aktif
          </span>
        );
      case 'Perencanaan':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Perencanaan
          </span>
        );
      case 'Tertunda':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Tertunda
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 p-4 pb-12 max-w-5xl mx-auto">
      {/* Tab Switcher Utama: Ronda Malam vs Program Pembangunan & CCTV vs Lapor Kejadian RW 018 */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5">
        <button
          id="tab-sub-ronda-malam"
          onClick={() => setActiveModule('ronda')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-black text-xs transition-all cursor-pointer ${
            activeModule === 'ronda'
              ? 'bg-gradient-to-r from-slate-900 to-blue-950 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span>Menu Ronda Malam (Siskamling)</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950">
            23:00 - 04:00 WIB
          </span>
        </button>

        <button
          id="tab-sub-pembangunan-cctv"
          onClick={() => setActiveModule('pembangunan')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-black text-xs transition-all cursor-pointer ${
            activeModule === 'pembangunan'
              ? 'bg-blue-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Camera className="w-4 h-4 text-cyan-300" />
          <span>Program Pembangunan & CCTV</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
            {keamananList.length} Program
          </span>
        </button>

        <button
          id="tab-sub-lapor-kejadian"
          onClick={() => {
            if (isAuthorizedLaporanKejadian) {
              setActiveModule('lapor_kejadian');
            } else {
              setRestrictedModalOpen(true);
            }
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-black text-xs transition-all cursor-pointer ${
            activeModule === 'lapor_kejadian'
              ? 'bg-gradient-to-r from-rose-800 to-rose-950 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          {isAuthorizedLaporanKejadian ? (
            <>
              <FileText className="w-4 h-4 text-rose-300" />
              <span>Lapor Kejadian RW 018</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800">
                {laporanKejadianList.length > 0 ? `${laporanKejadianList.length} Laporan` : 'Form Digital'}
              </span>
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5 text-rose-500" />
              <span>Lapor Kejadian RW 018</span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-50 text-rose-700 border border-rose-200">
                Khusus Ketua RW / SA
              </span>
            </>
          )}
        </button>
      </div>

      {activeModule === 'lapor_kejadian' ? (
        <LaporanKejadianView
          profile={profile}
          laporanList={laporanKejadianList}
          onSaveLaporan={onSaveLaporanKejadian}
          onDeleteLaporan={onDeleteLaporanKejadian}
          currentUser={currentUser}
          onBackToKeamanan={() => setActiveModule('ronda')}
        />
      ) : activeModule === 'ronda' ? (
        <RondaMalamView
          profile={profile}
          wargaList={wargaList}
          jadwalList={jadwalRondaList}
          absensiList={absensiRondaList}
          onSaveJadwal={onSaveJadwalRonda || (() => {})}
          onDeleteJadwal={onDeleteJadwalRonda || (() => {})}
          onSaveAbsensi={onSaveAbsensiRonda || (() => {})}
          onDeleteAbsensi={onDeleteAbsensiRonda || (() => {})}
          currentUser={currentUser}
        />
      ) : (
        <>
          {/* Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 p-4 sm:p-5 rounded-3xl text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shrink-0 shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  Keamanan & Pembangunan Fisik {profile.namaRw}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-400 text-slate-950">
                  Infrastruktur RW
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-1 max-w-xl">
                Perencanaan & monitoring pembangunan: CCTV 16 titik, renovasi pos ronda RT 039 s.d. RT 042, pengerukan drainase air, dan paving blok jalan lingkungan.
              </p>
            </div>
          </div>

          {currentUser?.role !== 'warga' && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-400 hover:bg-blue-300 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 self-start sm:self-center cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Program Fisik</span>
            </button>
          )}
        </div>

        {/* Aggregate metric cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-indigo-800/60 text-xs">
          <div className="bg-slate-950/40 p-2.5 rounded-2xl border border-indigo-800/50">
            <span className="text-[11px] text-indigo-300 block">Total Alokasi Anggaran</span>
            <span className="text-sm font-black text-amber-300">{formatRupiah(totalAnggaran)}</span>
          </div>
          <div className="bg-slate-950/40 p-2.5 rounded-2xl border border-indigo-800/50">
            <span className="text-[11px] text-indigo-300 block">Realisasi Anggaran</span>
            <span className="text-sm font-black text-emerald-300">{formatRupiah(totalRealisasi)}</span>
          </div>
          <div className="bg-slate-950/40 p-2.5 rounded-2xl border border-indigo-800/50">
            <span className="text-[11px] text-indigo-300 block">Rata-rata Progres Fisik</span>
            <span className="text-sm font-black text-white">{avgProgress}% Selesai</span>
          </div>
          <div className="bg-slate-950/40 p-2.5 rounded-2xl border border-indigo-800/50">
            <span className="text-[11px] text-indigo-300 block">Titik CCTV Lingkungan</span>
            <span className="text-sm font-black text-blue-300">{totalTitikCctv > 0 ? `${totalTitikCctv} Titik Aktif` : '16 Titik RW'}</span>
          </div>
        </div>
      </div>

      {/* Kontak Cepat Keamanan & Tanggap Darurat */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PhoneCall className="w-4 h-4 text-rose-600" />
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Kontak Cepat Keamanan & Tanggap Darurat Lingkungan
            </h3>
          </div>
          <span className="text-[10px] font-bold text-slate-500">
            Siaga Wilayah RW 018
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-xs">
          <a
            href="tel:081379712721"
            className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all flex flex-col justify-between group"
          >
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Bhabinkamtibmas</span>
              <span className="font-bold text-slate-800 block text-xs group-hover:text-emerald-800">Aipda Evodius</span>
              <span className="text-[9px] text-slate-500 font-mono block">NRP. 84050233</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-emerald-700 font-mono font-bold text-[11px]">
              <span>081379712721</span>
              <Phone className="w-3.5 h-3.5" />
            </div>
          </a>

          <a
            href="tel:081269138684"
            className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all flex flex-col justify-between group"
          >
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Babinsa Koramil</span>
              <span className="font-bold text-slate-800 block text-xs group-hover:text-emerald-800">Serda Rusidi</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-emerald-700 font-mono font-bold text-[11px]">
              <span>081269138684</span>
              <Phone className="w-3.5 h-3.5" />
            </div>
          </a>

          <a
            href="tel:085266725346"
            className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-rose-400 hover:bg-rose-50/50 transition-all flex flex-col justify-between group"
          >
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Ambulan Metro Timur</span>
              <span className="font-bold text-slate-800 block text-xs group-hover:text-rose-800">Hanan</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-rose-600 font-mono font-bold text-[11px]">
              <span>085266725346</span>
              <Ambulance className="w-3.5 h-3.5" />
            </div>
          </a>

          <a
            href="tel:081279707203"
            className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-rose-400 hover:bg-rose-50/50 transition-all flex flex-col justify-between group"
          >
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Damkar Metro</span>
              <span className="font-bold text-slate-800 block text-xs group-hover:text-rose-800">Yadi Danru</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-rose-600 font-mono font-bold text-[11px]">
              <span>081279707203</span>
              <Flame className="w-3.5 h-3.5" />
            </div>
          </a>

          <a
            href="tel:08117901867"
            className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 transition-all flex flex-col justify-between group"
          >
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">PLN Metro</span>
              <span className="font-bold text-slate-800 block text-xs group-hover:text-amber-800">Layanan Gangguan</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-amber-700 font-mono font-bold text-[11px]">
              <span>08117901867</span>
              <Zap className="w-3.5 h-3.5" />
            </div>
          </a>
        </div>
      </div>

      {/* Filter and Quick Category Tabs */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setSelectedKategori('ALL')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
              selectedKategori === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Semua Program ({keamananList.length})
          </button>
          <button
            onClick={() => setSelectedKategori('CCTV & Keamanan')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-colors ${
              selectedKategori === 'CCTV & Keamanan'
                ? 'bg-blue-700 text-white'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>CCTV Keamanan</span>
          </button>
          <button
            onClick={() => setSelectedKategori('Pos Ronda & Siskamling')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-colors ${
              selectedKategori === 'Pos Ronda & Siskamling'
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Pos Ronda</span>
          </button>
          <button
            onClick={() => setSelectedKategori('Drainase & Saluran Air')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-colors ${
              selectedKategori === 'Drainase & Saluran Air'
                ? 'bg-cyan-700 text-white'
                : 'bg-cyan-50 text-cyan-800 hover:bg-cyan-100'
            }`}
          >
            <Waves className="w-3.5 h-3.5" />
            <span>Drainase Air</span>
          </button>
          <button
            onClick={() => setSelectedKategori('Paving & Jalan Lingkungan')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-colors ${
              selectedKategori === 'Paving & Jalan Lingkungan'
                ? 'bg-amber-700 text-white'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <Route className="w-3.5 h-3.5" />
            <span>Paving Jalan</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="p-1.5 bg-slate-100 rounded-xl font-semibold text-slate-700 border-none text-xs"
          >
            <option value="ALL">Semua Status Progres</option>
            <option value="Perencanaan">Perencanaan</option>
            <option value="Sedang Berjalan">Sedang Berjalan</option>
            <option value="Selesai">Selesai</option>
            <option value="Tertunda">Tertunda</option>
          </select>
        </div>
      </div>

      {/* Program Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredList.map((item) => (
          <div
            key={item.id}
            className="bg-white p-4.5 rounded-3xl border border-slate-200 hover:border-blue-400 shadow-xs flex flex-col justify-between transition-all"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="p-1.5 bg-slate-100 rounded-lg">
                    {getCategoryIcon(item.kategori)}
                  </div>
                  <span className="text-[11px] font-bold text-slate-600">{item.kategori}</span>
                </div>
                {getStatusBadge(item.status)}
              </div>

              <h3 className="text-sm font-black text-slate-800 mt-2.5 leading-snug">
                {item.namaProgram}
              </h3>

              <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                {item.deskripsi}
              </p>

              {/* Progress Bar */}
              <div className="mt-3.5 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
                  <span className="text-slate-600">Progres Fisik Lapangan</span>
                  <span className={`${item.progressPercent === 100 ? 'text-emerald-700' : 'text-blue-700'}`}>
                    {item.progressPercent}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      item.progressPercent === 100
                        ? 'bg-emerald-600'
                        : item.progressPercent >= 50
                        ? 'bg-blue-600'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${item.progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Detail Metrics */}
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">Alokasi Anggaran</span>
                  <span className="font-bold text-slate-800">{formatRupiah(item.anggaran)}</span>
                  <span className="text-[10px] text-blue-700 block font-medium">
                    Sumber: {item.sumberDana}
                  </span>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">Realisasi Biaya</span>
                  <span className="font-bold text-emerald-800">{formatRupiah(item.realisasiBiaya)}</span>
                  <span className="text-[10px] text-slate-500 block">
                    Target: {item.targetWaktu}
                  </span>
                </div>
              </div>

              <div className="mt-2.5 space-y-1 text-xs text-slate-500">
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">Lokasi: {item.lokasi}</span>
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">PJ: {item.penanggungJawab}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="font-mono text-[10px] text-slate-400">ID: {item.id}</span>
              {currentUser?.role === 'warga' ? (
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  Transparansi Warga
                </span>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Update</span>
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(item)}
                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg cursor-pointer"
                    title="Hapus Program"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredList.length === 0 && (
          <div className="col-span-full p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs">
            Belum ada data program pembangunan & infrastruktur keamanan yang sesuai kriteria.
          </div>
        )}
      </div>

      {/* MODAL FORM TAMBAH / EDIT KEAMANAN & PEMBANGUNAN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl overflow-hidden my-6">
            <div className="bg-slate-900 p-4 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">
                  {editingItem ? 'Edit Program Pembangunan Fisik' : 'Tambah Program Pembangunan Fisik'}
                </h3>
                <p className="text-xs text-blue-300">Infrastruktur & Keamanan {profile.namaRw}</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-800 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3 text-xs max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Program Pembangunan *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pemasangan 16 Titik CCTV RW 018"
                  value={formData.namaProgram || ''}
                  onChange={(e) => setFormData({ ...formData, namaProgram: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori Pembangunan</label>
                  <select
                    value={formData.kategori || 'CCTV & Keamanan'}
                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value as any })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="CCTV & Keamanan">CCTV & Keamanan</option>
                    <option value="Pos Ronda & Siskamling">Pos Ronda & Siskamling</option>
                    <option value="Drainase & Saluran Air">Drainase & Saluran Air</option>
                    <option value="Paving & Jalan Lingkungan">Paving & Jalan Lingkungan</option>
                    <option value="Infrastruktur Lainnya">Infrastruktur Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Progres</label>
                  <select
                    value={formData.status || 'Perencanaan'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="Perencanaan">Perencanaan</option>
                    <option value="Sedang Berjalan">Sedang Berjalan</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Tertunda">Tertunda</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Lokasi Pembangunan *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Sepanjang Jl. Pala & Pos RT 039 - RT 042"
                  value={formData.lokasi || ''}
                  onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Alokasi Anggaran (Rp) *</label>
                  <input
                    type="number"
                    step={500000}
                    value={formData.anggaran || 0}
                    onChange={(e) => setFormData({ ...formData, anggaran: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold text-blue-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Realisasi Biaya Terpakai (Rp)</label>
                  <input
                    type="number"
                    step={500000}
                    value={formData.realisasiBiaya || 0}
                    onChange={(e) => setFormData({ ...formData, realisasiBiaya: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold text-emerald-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sumber Dana</label>
                  <select
                    value={formData.sumberDana || 'Kas RW'}
                    onChange={(e) => setFormData({ ...formData, sumberDana: e.target.value as any })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-semibold"
                  >
                    <option value="Kas RW">Kas RW</option>
                    <option value="Swadaya Warga">Swadaya Warga</option>
                    <option value="Dana Kelurahan Iringmulyo">Dana Kelurahan Iringmulyo</option>
                    <option value="Bantuan Aspirasi / Donatur">Bantuan Aspirasi / Donatur</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Persentase Progres Fisik (0-100%)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={formData.progressPercent || 0}
                      onChange={(e) => setFormData({ ...formData, progressPercent: Number(e.target.value) })}
                      className="w-full"
                    />
                    <span className="font-bold text-blue-900 min-w-[36px] text-right">
                      {formData.progressPercent || 0}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Waktu Pelaksanaan</label>
                  <input
                    type="text"
                    placeholder="Contoh: Agustus - Oktober 2026"
                    value={formData.targetWaktu || ''}
                    onChange={(e) => setFormData({ ...formData, targetWaktu: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Penanggung Jawab (PJ)</label>
                  <input
                    type="text"
                    value={formData.penanggungJawab || ''}
                    onChange={(e) => setFormData({ ...formData, penanggungJawab: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              {formData.kategori === 'CCTV & Keamanan' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jumlah Titik CCTV Terpasang</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.titikCctvCount || 0}
                    onChange={(e) => setFormData({ ...formData, titikCctvCount: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deskripsi / Rincian Program</label>
                <textarea
                  rows={3}
                  placeholder="Jelaskan spesifikasi teknis, tujuan keamanan/kelayakan, dan langkah pelaksanaan..."
                  value={formData.deskripsi || ''}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800"
                >
                  Simpan Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-xl space-y-3 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-800">Hapus Program Fisik?</h4>
            <p className="text-xs text-slate-500">
              Apakah Anda yakin ingin menghapus program: <strong>{deleteConfirm.namaProgram}</strong>?
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onDeleteKeamanan(deleteConfirm.id);
                  setDeleteConfirm(null);
                }}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restricted Modal for Laporan Kejadian */}
      {restrictedModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-rose-200 shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800 border border-rose-200">
                Akses Dibatasi Khusus
              </span>
              <h3 className="text-base font-black text-slate-800 mt-2">
                Laporan Kejadian RW 018
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Sesuai kebijakan hak akses sistem RW 018, menu <strong>Laporan Kejadian RW 018</strong> bersifat resmi dan kedinasan, hanya dapat dibuka oleh user login <strong>Ketua RW / Super Admin</strong> dan <strong>Eko Purwanto</strong> ketua RW / super admin.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-left text-xs border border-slate-200 text-slate-600 space-y-1">
              <p><strong>Pengguna Aktif:</strong> {currentUser?.nama || 'Warga / Tamu'}</p>
              <p><strong>Peran / Jabatan:</strong> {currentUser?.roleLabel || 'Warga'}</p>
              <p className="text-[11px] text-rose-600 font-semibold pt-1">
                Status: Tidak memiliki izin membuka formulir dan dokumen Laporan Kejadian.
              </p>
            </div>

            <button
              onClick={() => setRestrictedModalOpen(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Mengerti & Tutup
            </button>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
