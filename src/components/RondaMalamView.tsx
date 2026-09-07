import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Clock,
  Calendar,
  Users,
  UserCheck,
  UserX,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  Filter,
  Printer,
  Edit2,
  Trash2,
  Phone,
  MapPin,
  Check,
  X,
  FileText,
  BadgeAlert,
  ChevronDown,
  Sparkles,
  Info,
  CalendarDays,
  Send,
  Eye,
  Building
} from 'lucide-react';
import {
  JadwalRonda,
  AbsensiRondaRecord,
  HariRonda,
  StatusKehadiranRonda,
  ItemPresensiRonda,
  AnggotaRonda,
  Warga,
  RWProfile,
  AppUser
} from '../types';
import { generateId } from '../utils/formatters';

interface RondaMalamViewProps {
  profile: RWProfile;
  wargaList: Warga[];
  jadwalList: JadwalRonda[];
  absensiList: AbsensiRondaRecord[];
  onSaveJadwal: (item: JadwalRonda) => void;
  onDeleteJadwal: (id: string) => void;
  onSaveAbsensi: (record: AbsensiRondaRecord) => void;
  onDeleteAbsensi: (id: string) => void;
  currentUser?: AppUser | null;
}

const HARI_ORDER: HariRonda[] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export const RondaMalamView: React.FC<RondaMalamViewProps> = ({
  profile,
  wargaList = [],
  jadwalList = [],
  absensiList = [],
  onSaveJadwal,
  onDeleteJadwal,
  onSaveAbsensi,
  onDeleteAbsensi,
  currentUser,
}) => {
  // Submenu tabs: 'jadwal' (Jadwal Ronda Senin-Minggu) or 'absensi' (Daftar Hadir & Pengecekan RT/RW)
  const [activeSubMenu, setActiveSubMenu] = useState<'jadwal' | 'absensi'>('jadwal');

  // Filters
  const [selectedHari, setSelectedHari] = useState<string>('ALL');
  const [selectedRt, setSelectedRt] = useState<string>(() => {
    if (currentUser?.role === 'ketua_rt' && currentUser.rtAccess && currentUser.rtAccess !== 'ALL') {
      return currentUser.rtAccess;
    }
    return 'ALL';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAbsensiId, setSelectedAbsensiId] = useState<string>(() => {
    return absensiList.length > 0 ? absensiList[0].id : '';
  });
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals
  const [isJadwalModalOpen, setIsJadwalModalOpen] = useState(false);
  const [editingJadwal, setEditingJadwal] = useState<JadwalRonda | null>(null);
  const [deleteJadwalConfirm, setDeleteJadwalConfirm] = useState<JadwalRonda | null>(null);

  const [isAbsensiModalOpen, setIsAbsensiModalOpen] = useState(false);
  const [activeAbsensiRecord, setActiveAbsensiRecord] = useState<AbsensiRondaRecord | null>(null);
  const [printPreviewMode, setPrintPreviewMode] = useState<'jadwal' | 'absensi' | null>(null);

  // Jadwal Form State
  const [jadwalForm, setJadwalForm] = useState<{
    hari: HariRonda;
    rt: string;
    posKamling: string;
    jamMulai: string;
    jamSelesai: string;
    namaGrup: string;
    ketuaGrupNama: string;
    ketuaGrupNik: string;
    ketuaGrupNoHp: string;
    ketuaGrupAlamat: string;
    anggotaList: AnggotaRonda[];
    keterangan: string;
  }>({
    hari: 'Senin',
    rt: currentUser?.role === 'ketua_rt' && currentUser.rtAccess ? currentUser.rtAccess : '039',
    posKamling: 'Pos Ronda Utama (Jl. Pala)',
    jamMulai: '23:00',
    jamSelesai: '04:00',
    namaGrup: 'Regu 1 (Senin)',
    ketuaGrupNama: '',
    ketuaGrupNik: '',
    ketuaGrupNoHp: '',
    ketuaGrupAlamat: '',
    anggotaList: [],
    keterangan: 'Keliling lingkungan berkala setiap jam, pastikan portal dan lampu jalan aman.',
  });

  const [wargaSearchInput, setWargaSearchInput] = useState('');

  // Role permissions
  const isKetuaRw = currentUser?.role === 'admin_rw';
  const isKetuaRt = currentUser?.role === 'ketua_rt';
  const isKeamanan = currentUser?.role === 'keamanan';
  const canManage = !currentUser || isKetuaRw || isKetuaRt || isKeamanan;

  // Filtered Jadwal
  const filteredJadwal = useMemo(() => {
    return jadwalList.filter((j) => {
      const matchHari = selectedHari === 'ALL' || j.hari === selectedHari;
      const matchRt = selectedRt === 'ALL' || j.rt === selectedRt;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        j.namaGrup.toLowerCase().includes(q) ||
        j.ketuaGrup.nama.toLowerCase().includes(q) ||
        j.posKamling.toLowerCase().includes(q) ||
        j.anggota.some((a) => a.nama.toLowerCase().includes(q));
      return matchHari && matchRt && matchSearch;
    }).sort((a, b) => {
      return HARI_ORDER.indexOf(a.hari) - HARI_ORDER.indexOf(b.hari);
    });
  }, [jadwalList, selectedHari, selectedRt, searchQuery]);

  // Currently selected absensi record
  const currentAbsensi = useMemo(() => {
    if (!selectedAbsensiId) {
      return absensiList.length > 0 ? absensiList[0] : null;
    }
    return absensiList.find((a) => a.id === selectedAbsensiId) || (absensiList.length > 0 ? absensiList[0] : null);
  }, [absensiList, selectedAbsensiId]);

  // Filtered Presensi Table rows
  const filteredPresensiRows = useMemo(() => {
    if (!currentAbsensi) return [];
    return currentAbsensi.daftarKehadiran.filter((item) => {
      const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.nama.toLowerCase().includes(q) ||
        (item.nik && item.nik.includes(q)) ||
        item.peran.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [currentAbsensi, statusFilter, searchQuery]);

  // Aggregate statistics
  const stats = useMemo(() => {
    const totalRegu = jadwalList.length;
    const totalPersonil = jadwalList.reduce((acc, curr) => acc + 1 + (curr.anggota?.length || 0), 0);

    let totalKehadiranTerakhir = 0;
    let totalTidakHadirTerakhir = 0;
    let persentaseKehadiran = 0;

    if (currentAbsensi && currentAbsensi.daftarKehadiran.length > 0) {
      const hadirCount = currentAbsensi.daftarKehadiran.filter((p) => p.status === 'Hadir').length;
      totalTidakHadirTerakhir = currentAbsensi.daftarKehadiran.filter((p) => p.status === 'Tidak Hadir').length;
      totalKehadiranTerakhir = hadirCount;
      persentaseKehadiran = Math.round((hadirCount / currentAbsensi.daftarKehadiran.length) * 100);
    }

    return {
      totalRegu,
      totalPersonil,
      totalKehadiranTerakhir,
      totalTidakHadirTerakhir,
      persentaseKehadiran,
    };
  }, [jadwalList, currentAbsensi]);

  // Eligible Warga for Input Form (filtered by the RT selected in the form)
  const wargaPilihanByRt = useMemo(() => {
    const targetRt = jadwalForm.rt;
    return wargaList
      .filter((w) => w.rt === targetRt)
      .sort((a, b) => a.nama.localeCompare(b.nama));
  }, [wargaList, jadwalForm.rt]);

  // Open Modal Add Jadwal
  const handleOpenAddJadwal = () => {
    setEditingJadwal(null);
    const defaultRt = currentUser?.role === 'ketua_rt' && currentUser.rtAccess ? currentUser.rtAccess : '039';
    setJadwalForm({
      hari: 'Senin',
      rt: defaultRt,
      posKamling: `Pos Ronda RT ${defaultRt} (Jl. Pala)`,
      jamMulai: '23:00',
      jamSelesai: '04:00',
      namaGrup: `Regu Ronda RT ${defaultRt}`,
      ketuaGrupNama: '',
      ketuaGrupNik: '',
      ketuaGrupNoHp: '',
      ketuaGrupAlamat: '',
      anggotaList: [],
      keterangan: 'Keliling lingkungan berkala setiap jam, cek portal masuk, bawa senter dan kentongan.',
    });
    setIsJadwalModalOpen(true);
  };

  // Open Modal Edit Jadwal
  const handleOpenEditJadwal = (item: JadwalRonda) => {
    setEditingJadwal(item);
    setJadwalForm({
      hari: item.hari,
      rt: item.rt,
      posKamling: item.posKamling,
      jamMulai: item.jamMulai || '23:00',
      jamSelesai: item.jamSelesai || '04:00',
      namaGrup: item.namaGrup,
      ketuaGrupNama: item.ketuaGrup.nama,
      ketuaGrupNik: item.ketuaGrup.nik || '',
      ketuaGrupNoHp: item.ketuaGrup.noHp || '',
      ketuaGrupAlamat: item.ketuaGrup.alamat || '',
      anggotaList: [...(item.anggota || [])],
      keterangan: item.keterangan || '',
    });
    setIsJadwalModalOpen(true);
  };

  // Handle select Ketua Grup from Warga dropdown
  const handleSelectKetuaWarga = (nik: string) => {
    const found = wargaList.find((w) => w.nik === nik);
    if (found) {
      setJadwalForm((prev) => ({
        ...prev,
        ketuaGrupNama: found.nama,
        ketuaGrupNik: found.nik,
        ketuaGrupNoHp: found.noHp || '',
        ketuaGrupAlamat: found.alamat,
      }));
    }
  };

  // Add Anggota from Warga selector
  const handleAddAnggotaWarga = (warga: Warga) => {
    // Check if already in list
    if (jadwalForm.anggotaList.some((a) => a.nik === warga.nik || a.nama.toLowerCase() === warga.nama.toLowerCase())) {
      alert(`Warga ${warga.nama} sudah ada di dalam daftar regu ini.`);
      return;
    }
    const newAnggota: AnggotaRonda = {
      id: generateId('ar'),
      wargaId: warga.id,
      nik: warga.nik,
      nama: warga.nama,
      rt: warga.rt,
      noHp: warga.noHp || '',
      alamat: warga.alamat,
    };
    setJadwalForm((prev) => ({
      ...prev,
      anggotaList: [...prev.anggotaList, newAnggota],
    }));
  };

  // Remove Anggota from list
  const handleRemoveAnggota = (id: string) => {
    setJadwalForm((prev) => ({
      ...prev,
      anggotaList: prev.anggotaList.filter((a) => a.id !== id),
    }));
  };

  // Save Jadwal
  const handleSaveJadwalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jadwalForm.namaGrup || !jadwalForm.ketuaGrupNama) {
      alert('Nama Regu dan Ketua Grup Ronda wajib diisi!');
      return;
    }

    const item: JadwalRonda = {
      id: editingJadwal ? editingJadwal.id : generateId('jr'),
      hari: jadwalForm.hari,
      rt: jadwalForm.rt,
      posKamling: jadwalForm.posKamling || `Pos Kamling RT ${jadwalForm.rt}`,
      jamMulai: jadwalForm.jamMulai || '23:00',
      jamSelesai: jadwalForm.jamSelesai || '04:00',
      namaGrup: jadwalForm.namaGrup,
      ketuaGrup: {
        nama: jadwalForm.ketuaGrupNama,
        nik: jadwalForm.ketuaGrupNik,
        noHp: jadwalForm.ketuaGrupNoHp,
        alamat: jadwalForm.ketuaGrupAlamat,
        rt: jadwalForm.rt,
      },
      anggota: jadwalForm.anggotaList,
      keterangan: jadwalForm.keterangan,
      updatedAt: new Date().toISOString(),
      createdAt: editingJadwal?.createdAt || new Date().toISOString(),
    };

    onSaveJadwal(item);
    setIsJadwalModalOpen(false);
  };

  // Start Presensi from a Schedule
  const handleStartPresensiFromJadwal = (jadwal: JadwalRonda) => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const tanggalStr = `${yyyy}-${mm}-${dd}`;

    const defaultDaftar: ItemPresensiRonda[] = [
      {
        anggotaId: generateId('kp'),
        nama: jadwal.ketuaGrup.nama,
        nik: jadwal.ketuaGrup.nik,
        rt: jadwal.rt,
        peran: 'Ketua',
        status: 'Hadir',
        jamHadir: '22:55',
        keterangan: 'Ketua Regu memimpin apel malam pos ronda.',
      },
      ...jadwal.anggota.map((a) => ({
        anggotaId: a.id,
        nama: a.nama,
        nik: a.nik,
        rt: a.rt,
        peran: 'Anggota' as const,
        status: 'Hadir' as StatusKehadiranRonda,
        jamHadir: '23:00',
        keterangan: 'Hadir patroli lingkungan.',
      })),
    ];

    const newRecord: AbsensiRondaRecord = {
      id: generateId('abs'),
      jadwalId: jadwal.id,
      hari: jadwal.hari,
      tanggal: tanggalStr,
      rt: jadwal.rt,
      posKamling: jadwal.posKamling,
      jamTugas: `${jadwal.jamMulai} - ${jadwal.jamSelesai}`,
      namaGrup: jadwal.namaGrup,
      daftarKehadiran: defaultDaftar,
      catatanPetugas: 'Situasi lingkungan kondusif dan aman. Patroli berlangsung lancar.',
      dicatatOleh: currentUser ? `${currentUser.nama} (${currentUser.roleLabel})` : `Ketua RT ${jadwal.rt}`,
      createdAt: new Date().toISOString(),
    };

    setActiveAbsensiRecord(newRecord);
    setIsAbsensiModalOpen(true);
  };

  // Quick toggle status for a row in Presensi modal
  const handleToggleRowStatus = (index: number, newStatus: StatusKehadiranRonda) => {
    if (!activeAbsensiRecord) return;
    const updatedList = [...activeAbsensiRecord.daftarKehadiran];
    const currentItem = updatedList[index];
    updatedList[index] = {
      ...currentItem,
      status: newStatus,
      jamHadir: newStatus === 'Hadir' ? (currentItem.jamHadir === '-' ? '23:05' : currentItem.jamHadir) : '-',
      keterangan: newStatus === 'Tidak Hadir' ? 'Tidak hadir tanpa keterangan (Alpa)' : currentItem.keterangan,
    };
    setActiveAbsensiRecord({
      ...activeAbsensiRecord,
      daftarKehadiran: updatedList,
    });
  };

  // Update detail keterangan of a row in Presensi modal
  const handleUpdateRowKeterangan = (index: number, keterangan: string) => {
    if (!activeAbsensiRecord) return;
    const updatedList = [...activeAbsensiRecord.daftarKehadiran];
    updatedList[index] = {
      ...updatedList[index],
      keterangan,
    };
    setActiveAbsensiRecord({
      ...activeAbsensiRecord,
      daftarKehadiran: updatedList,
    });
  };

  // Save Absensi Submit
  const handleSaveAbsensiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAbsensiRecord) return;
    onSaveAbsensi(activeAbsensiRecord);
    setSelectedAbsensiId(activeAbsensiRecord.id);
    setIsAbsensiModalOpen(false);
    setActiveSubMenu('absensi');
  };

  // Quick Verifikasi oleh Ketua RT
  const handleVerifikasiRt = (record: AbsensiRondaRecord) => {
    const updated: AbsensiRondaRecord = {
      ...record,
      diperiksaOlehRt: currentUser?.nama || `Ketua RT ${record.rt}`,
      tanggalDiperiksaRt: new Date().toISOString(),
    };
    onSaveAbsensi(updated);
  };

  // Quick Verifikasi oleh Ketua RW
  const handleVerifikasiRw = (record: AbsensiRondaRecord) => {
    const updated: AbsensiRondaRecord = {
      ...record,
      diperiksaOlehRw: `${profile.namaKetuaRw}`,
      tanggalDiperiksaRw: new Date().toISOString(),
    };
    onSaveAbsensi(updated);
  };

  return (
    <div className="space-y-4">
      {/* Banner Utama Ronda Malam */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 rounded-3xl p-4 sm:p-5 text-white shadow-md border border-blue-900/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0 shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  Jadwal Ronda Malam & Siskamling RW 018
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-400 text-slate-950 flex items-center gap-1 shadow-xs">
                  <Clock className="w-3.5 h-3.5" />
                  Pukul 23:00 s.d. 04:00 WIB
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-1 max-w-2xl leading-relaxed">
                Pengamanan lingkungan terpadu RT 039 s.d. RT 042. Regu ronda dijadwalkan dari hari <strong>Senin sampai Minggu</strong> dengan personil Ketua Grup dan Anggota yang diinput langsung dari data warga terdaftar. Pengecekan presensi terpantau oleh Ketua RT & Ketua RW.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start sm:self-center">
            {canManage && (
              <button
                id="btn-tambah-jadwal-ronda"
                onClick={handleOpenAddJadwal}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Input Regu Ronda</span>
              </button>
            )}

            <button
              id="btn-cetak-jadwal-ronda"
              onClick={() => setPrintPreviewMode('jadwal')}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Jadwal</span>
            </button>
          </div>
        </div>

        {/* Ringkasan Metrik Pengawasan Ronda */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-indigo-800/60 text-xs">
          <div className="bg-slate-950/40 p-2.5 rounded-2xl border border-indigo-800/50">
            <span className="text-[11px] text-indigo-300 block font-semibold">Total Regu Terjadwal</span>
            <span className="text-sm font-black text-amber-300">{stats.totalRegu} Regu (Senin-Minggu)</span>
          </div>
          <div className="bg-slate-950/40 p-2.5 rounded-2xl border border-indigo-800/50">
            <span className="text-[11px] text-indigo-300 block font-semibold">Total Personil Warga</span>
            <span className="text-sm font-black text-white">{stats.totalPersonil} Warga Terdaftar</span>
          </div>
          <div className="bg-slate-950/40 p-2.5 rounded-2xl border border-indigo-800/50">
            <span className="text-[11px] text-indigo-300 block font-semibold">Tingkat Kehadiran Presensi</span>
            <span className="text-sm font-black text-emerald-300">{stats.persentaseKehadiran}% Hadir Terpantau</span>
          </div>
          <div className="bg-slate-950/40 p-2.5 rounded-2xl border border-rose-800/60 bg-rose-950/30">
            <span className="text-[11px] text-rose-300 block font-semibold flex items-center gap-1">
              <BadgeAlert className="w-3 h-3 text-rose-400" />
              Tidak Hadir (Alpa)
            </span>
            <span className="text-sm font-black text-rose-300">
              {stats.totalTidakHadirTerakhir > 0 ? (
                <span className="underline decoration-rose-500 font-extrabold">{stats.totalTidakHadirTerakhir} Anggota (Tanda Merah)</span>
              ) : (
                '0 (Tertib 100%)'
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Navigasi Sub Menu Ronda Malam */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            id="subtab-jadwal-mingguan"
            onClick={() => setActiveSubMenu('jadwal')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubMenu === 'jadwal'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Jadwal Ronda (Senin - Minggu)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-400 text-slate-950">
              {jadwalList.length}
            </span>
          </button>

          <button
            id="subtab-absensi-ronda"
            onClick={() => setActiveSubMenu('absensi')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubMenu === 'absensi'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Daftar Hadir & Presensi (Pengecekan RT & RW)</span>
            {stats.totalTidakHadirTerakhir > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white">
                {stats.totalTidakHadirTerakhir} Alpa
              </span>
            )}
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter RT */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500">Filter RT:</span>
            <select
              value={selectedRt}
              onChange={(e) => setSelectedRt(e.target.value)}
              className="p-1.5 bg-slate-100 rounded-xl font-bold text-slate-700 border-none text-xs"
            >
              <option value="ALL">Semua RT (039 - 042)</option>
              <option value="039">RT 039 (Zaenal Fanani)</option>
              <option value="040">RT 040 (Epi)</option>
              <option value="041">RT 041 (Etty Herawati)</option>
              <option value="042">RT 042 (Sefrizal)</option>
            </select>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama warga / regu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 bg-slate-100 rounded-xl text-xs text-slate-800 placeholder-slate-400 border-none focus:ring-1 focus:ring-blue-500 w-44"
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAMPILAN 1: JADWAL RONDA SENIN SAMPAI MINGGU                               */}
      {/* ========================================================================= */}
      {activeSubMenu === 'jadwal' && (
        <div className="space-y-4">
          {/* Filter Hari Tab Bar (Senin - Minggu) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedHari('ALL')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                selectedHari === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Semua Hari ({jadwalList.length})
            </button>
            {HARI_ORDER.map((hari) => {
              const countHari = jadwalList.filter((j) => j.hari === hari).length;
              return (
                <button
                  key={hari}
                  onClick={() => setSelectedHari(hari)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
                    selectedHari === hari
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{hari}</span>
                  <span className={`text-[10px] px-1 rounded-full ${selectedHari === hari ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    {countHari}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Grid Jadwal Ronda */}
          {filteredJadwal.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Belum Ada Jadwal Ronda Terdaftar</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Tidak ditemukan jadwal ronda untuk filter yang dipilih. Silakan klik tombol "Input Regu Ronda" untuk membuat jadwal tugas malam.
              </p>
              {canManage && (
                <button
                  onClick={handleOpenAddJadwal}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Input Regu Ronda Baru</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredJadwal.map((jadwal) => {
                return (
                  <div
                    key={jadwal.id}
                    className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:border-blue-400 transition-all p-4.5 flex flex-col justify-between"
                  >
                    <div>
                      {/* Card Header: Hari, Jam, RT */}
                      <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-blue-100 text-blue-900 flex items-center gap-1">
                              <CalendarDays className="w-3.5 h-3.5 text-blue-700" />
                              Hari {jadwal.hari}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                              RT {jadwal.rt}
                            </span>
                          </div>
                          <h3 className="text-sm font-black text-slate-900 mt-1.5">
                            {jadwal.namaGrup}
                          </h3>
                        </div>

                        <div className="text-right">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-black bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            {jadwal.jamMulai} - {jadwal.jamSelesai} WIB
                          </span>
                        </div>
                      </div>

                      {/* Lokasi Pos Kamling */}
                      <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="font-semibold">{jadwal.posKamling}</span>
                      </div>

                      {/* Ketua Grup Ronda (Input data warga RT masing-masing) */}
                      <div className="mt-3 p-3 bg-amber-50/70 rounded-2xl border border-amber-200/80">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-amber-600" />
                            Ketua Grup Ronda:
                          </span>
                          {jadwal.ketuaGrup.noHp && (
                            <a
                              href={`https://wa.me/${jadwal.ketuaGrup.noHp.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3" />
                              {jadwal.ketuaGrup.noHp}
                            </a>
                          )}
                        </div>
                        <div className="mt-1 flex items-baseline justify-between">
                          <span className="text-xs font-black text-slate-900">
                            {jadwal.ketuaGrup.nama}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            NIK: {jadwal.ketuaGrup.nik || '-'}
                          </span>
                        </div>
                        {jadwal.ketuaGrup.alamat && (
                          <p className="text-[11px] text-slate-600 mt-0.5 truncate">
                            {jadwal.ketuaGrup.alamat}
                          </p>
                        )}
                      </div>

                      {/* Anggota Regu Ronda (Input data warga RT masing-masing) */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-blue-600" />
                            Anggota Regu ({jadwal.anggota?.length || 0} Warga):
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            Sesuai Data Warga RT {jadwal.rt}
                          </span>
                        </div>

                        {jadwal.anggota && jadwal.anggota.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {jadwal.anggota.map((ang, idx) => (
                              <div
                                key={ang.id || idx}
                                className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs"
                              >
                                <div className="truncate pr-1">
                                  <span className="font-bold text-slate-800 block truncate">
                                    {idx + 1}. {ang.nama}
                                  </span>
                                  <span className="text-[10px] text-slate-500 block truncate">
                                    {ang.alamat || `RT ${ang.rt}`}
                                  </span>
                                </div>
                                {ang.noHp && (
                                  <a
                                    href={`tel:${ang.noHp}`}
                                    className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg shrink-0"
                                    title={`Hubungi ${ang.nama}`}
                                  >
                                    <Phone className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                            Belum ada anggota yang ditambahkan
                          </div>
                        )}
                      </div>

                      {/* Catatan / Instruksi Khusus */}
                      {jadwal.keterangan && (
                        <div className="mt-3 p-2 bg-blue-50/50 rounded-xl border border-blue-100 text-[11px] text-blue-900 leading-relaxed">
                          <span className="font-bold block">Instruksi Pos:</span>
                          {jadwal.keterangan}
                        </div>
                      )}
                    </div>

                    {/* Card Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleStartPresensiFromJadwal(jadwal)}
                        className="flex-1 px-3 py-2 bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Catat Presensi Malam Ini</span>
                      </button>

                      {canManage && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditJadwal(jadwal)}
                            className="p-2 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                            title="Edit Regu Ronda"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteJadwalConfirm(jadwal)}
                            className="p-2 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                            title="Hapus Jadwal"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAMPILAN 2: DAFTAR HADIR & PENGECEKAN KETUA RT & RW                       */}
      {/* (Apabila ada anggota yang tidak hadir diberi tanda merah pada tabel)       */}
      {/* ========================================================================= */}
      {activeSubMenu === 'absensi' && (
        <div className="space-y-4">
          {/* Header Pengecekan & Filter Catatan Presensi */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  Daftar Hadir & Rekap Pengawasan Ronda Malam
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ketua RT dan Ketua RW dapat memantau kedisiplinan jaga malam, memvalidasi kehadiran, serta mengevaluasi warga yang <strong>Tidak Hadir (Alpa)</strong> bertanda merah.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPrintPreviewMode('absensi')}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Presensi Resmi</span>
                </button>
              </div>
            </div>

            {/* Selector Catatan Tanggal Presensi */}
            <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-600">Pilih Tanggal Presensi:</span>
              <select
                value={selectedAbsensiId}
                onChange={(e) => setSelectedAbsensiId(e.target.value)}
                className="p-2 bg-slate-100 rounded-xl font-bold text-slate-800 border-none text-xs focus:ring-1 focus:ring-blue-500"
              >
                {absensiList.length === 0 ? (
                  <option value="">Belum Ada Catatan Presensi</option>
                ) : (
                  absensiList.map((rec) => (
                    <option key={rec.id} value={rec.id}>
                      {rec.tanggal} ({rec.hari}) - {rec.namaGrup} (RT {rec.rt})
                    </option>
                  ))
                )}
              </select>

              {/* Status Filter Tab */}
              <div className="flex items-center gap-1 ml-auto">
                <span className="text-[11px] font-bold text-slate-500 mr-1">Status:</span>
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                    statusFilter === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  Semua ({currentAbsensi?.daftarKehadiran.length || 0})
                </button>
                <button
                  onClick={() => setStatusFilter('Tidak Hadir')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black flex items-center gap-1 ${
                    statusFilter === 'Tidak Hadir' ? 'bg-rose-600 text-white shadow-xs' : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  <XCircle className="w-3 h-3" />
                  <span>Tidak Hadir (Alpa)</span>
                </button>
                <button
                  onClick={() => setStatusFilter('Hadir')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                    statusFilter === 'Hadir' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-800'
                  }`}
                >
                  Hadir
                </button>
              </div>
            </div>
          </div>

          {/* Detailed Absensi View */}
          {currentAbsensi ? (
            <div className="space-y-4">
              {/* Info Header Record */}
              <div className="bg-slate-900 text-white p-4 rounded-3xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-blue-500 text-slate-950">
                      RT {currentAbsensi.rt}
                    </span>
                    <h4 className="text-base font-black">
                      {currentAbsensi.namaGrup} - Tanggal {currentAbsensi.tanggal} ({currentAbsensi.hari})
                    </h4>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-300 mt-1 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      Jam Tugas: {currentAbsensi.jamTugas || '23:00 - 04:00 WIB'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" />
                      {currentAbsensi.posKamling}
                    </span>
                    <span>•</span>
                    <span>Dicatat oleh: {currentAbsensi.dicatatOleh}</span>
                  </div>
                </div>

                {/* Tombol Edit Presensi jika diperlukan */}
                {canManage && (
                  <button
                    onClick={() => {
                      setActiveAbsensiRecord(currentAbsensi);
                      setIsAbsensiModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1 shrink-0 self-start sm:self-center cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Perbarui Data Hadir</span>
                  </button>
                )}
              </div>

              {/* Status Validasi Pemeriksaan Pimpinan (Ketua RT & Ketua RW) */}
              <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
                <div className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-700" />
                  Pemeriksaan & Verifikasi Pimpinan Wilayah (Ketua RT & Ketua RW)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Verifikasi Ketua RT */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-500 text-[11px]">Pemeriksaan Ketua RT {currentAbsensi.rt}</span>
                        {currentAbsensi.diperiksaOlehRt ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Terverifikasi
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            Menunggu Verifikasi
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-900 mt-1">
                        {currentAbsensi.diperiksaOlehRt ? `Telah diverifikasi oleh: ${currentAbsensi.diperiksaOlehRt}` : 'Belum ditandatangani oleh Ketua RT'}
                      </p>
                      {currentAbsensi.tanggalDiperiksaRt && (
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Waktu: {new Date(currentAbsensi.tanggalDiperiksaRt).toLocaleString('id-ID')}
                        </p>
                      )}
                    </div>

                    {!currentAbsensi.diperiksaOlehRt && (isKetuaRt || isKetuaRw || !currentUser) && (
                      <button
                        onClick={() => handleVerifikasiRt(currentAbsensi)}
                        className="mt-2.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white font-bold text-[11px] rounded-xl flex items-center justify-center gap-1 self-start cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Verifikasi Sebagai Ketua RT {currentAbsensi.rt}</span>
                      </button>
                    )}
                  </div>

                  {/* Verifikasi Ketua RW */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-500 text-[11px]">Pemeriksaan Ketua RW 018</span>
                        {currentAbsensi.diperiksaOlehRw ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Terverifikasi RW
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            Menunggu Verifikasi RW
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-900 mt-1">
                        {currentAbsensi.diperiksaOlehRw ? `Telah diperiksa oleh: ${currentAbsensi.diperiksaOlehRw} (Ketua RW)` : `Menunggu pemeriksaan ${profile.namaKetuaRw}`}
                      </p>
                      {currentAbsensi.tanggalDiperiksaRw && (
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Waktu: {new Date(currentAbsensi.tanggalDiperiksaRw).toLocaleString('id-ID')}
                        </p>
                      )}
                    </div>

                    {!currentAbsensi.diperiksaOlehRw && (isKetuaRw || !currentUser) && (
                      <button
                        onClick={() => handleVerifikasiRw(currentAbsensi)}
                        className="mt-2.5 px-3 py-1.5 bg-indigo-800 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-xl flex items-center justify-center gap-1 self-start cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Verifikasi Sebagai Ketua RW 018</span>
                      </button>
                    )}
                  </div>
                </div>

                {currentAbsensi.catatanPetugas && (
                  <div className="mt-2.5 p-2.5 bg-slate-100 rounded-xl text-xs text-slate-700">
                    <span className="font-bold text-slate-900">Catatan Mutasi Ronda Malam: </span>
                    {currentAbsensi.catatanPetugas}
                  </div>
                )}
              </div>

              {/* TABEL DAFTAR HADIR (DENGAN TANDA MERAH UNTUK YANG TIDAK HADIR) */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4 className="text-sm font-black text-slate-900">
                      Tabel Presensi Kehadiran Petugas Jaga Ronda
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      Sesuai instruksi: Petugas/warga yang <strong>Tidak Hadir (Alpa)</strong> ditandai dengan warna merah tegas pada tabel.
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-600">
                    Total: {filteredPresensiRows.length} Personil
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-900 text-white text-[11px] font-bold">
                        <th className="py-3 px-3 w-10 text-center">No</th>
                        <th className="py-3 px-3">Nama Warga / Petugas</th>
                        <th className="py-3 px-3">Peran Regu</th>
                        <th className="py-3 px-3">RT & NIK</th>
                        <th className="py-3 px-3">Jam Tugas</th>
                        <th className="py-3 px-3">Jam Hadir</th>
                        <th className="py-3 px-4 text-center">Status Kehadiran</th>
                        <th className="py-3 px-4">Keterangan / Alasan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPresensiRows.map((row, idx) => {
                        const isTidakHadir = row.status === 'Tidak Hadir';
                        const isHadir = row.status === 'Hadir';
                        const isIzin = row.status === 'Izin';
                        const isSakit = row.status === 'Sakit';

                        return (
                          <tr
                            key={row.anggotaId || idx}
                            className={`transition-colors ${
                              isTidakHadir
                                ? 'bg-rose-50/80 hover:bg-rose-100/80 border-l-4 border-rose-600'
                                : 'hover:bg-slate-50'
                            }`}
                          >
                            {/* No */}
                            <td className="py-3 px-3 text-center font-bold text-slate-700">
                              {idx + 1}
                            </td>

                            {/* Nama Warga */}
                            <td className="py-3 px-3">
                              <div className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                                <span>{row.nama}</span>
                                {row.peran === 'Ketua' && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-200 text-amber-900">
                                    Ketua
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Peran */}
                            <td className="py-3 px-3 font-semibold text-slate-600">
                              {row.peran === 'Ketua' ? 'Ketua Grup Ronda' : 'Anggota Regu'}
                            </td>

                            {/* RT & NIK */}
                            <td className="py-3 px-3">
                              <span className="font-bold text-slate-800">RT {row.rt}</span>
                              <span className="text-[10px] text-slate-400 block font-mono">
                                {row.nik || '-'}
                              </span>
                            </td>

                            {/* Jam Tugas */}
                            <td className="py-3 px-3 font-semibold text-slate-600 whitespace-nowrap">
                              {currentAbsensi.jamTugas || '23:00 - 04:00'}
                            </td>

                            {/* Jam Hadir */}
                            <td className="py-3 px-3 font-mono font-bold text-slate-700">
                              {row.jamHadir || '-'}
                            </td>

                            {/* STATUS KEHADIRAN (TANDA MERAH JIKA TIDAK HADIR) */}
                            <td className="py-3 px-4 text-center">
                              {isTidakHadir && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-600 text-white shadow-xs animate-pulse">
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>TIDAK HADIR (ALPA)</span>
                                </span>
                              )}

                              {isHadir && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>HADIR</span>
                                </span>
                              )}

                              {isIzin && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                  <span>IZIN RESMI</span>
                                </span>
                              )}

                              {isSakit && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
                                  <span>SAKIT</span>
                                </span>
                              )}

                              {row.status === 'Digantikan' && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">
                                  <span>DIGANTIKAN</span>
                                </span>
                              )}
                            </td>

                            {/* Keterangan */}
                            <td className="py-3 px-4">
                              <span
                                className={`text-xs ${
                                  isTidakHadir ? 'font-black text-rose-700' : 'text-slate-600'
                                }`}
                              >
                                {row.keterangan || (isTidakHadir ? 'Tidak hadir tanpa keterangan' : '-')}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-3">
              <UserX className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">Belum Ada Catatan Presensi Ronda</h3>
              <p className="text-xs text-slate-500">
                Pilih salah satu jadwal di tab "Jadwal Ronda" lalu klik "Catat Presensi Malam Ini" untuk merekam daftar hadir petugas ronda.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL INPUT / EDIT JADWAL RONDA MALAM                                     */}
      {/* ========================================================================= */}
      {isJadwalModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black">
                    {editingJadwal ? 'Edit Regu & Jadwal Ronda Malam' : 'Input Jadwal Regu Ronda Malam'}
                  </h3>
                  <p className="text-[11px] text-blue-200">
                    Jadwal Ronda Wajib: 23:00 s.d. 04:00 WIB • Data Warga Sesuai RT Masing-Masing
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsJadwalModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSaveJadwalSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
              {/* Row: Hari, RT, Jam Tugas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Hari */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Hari Tugas Ronda *</label>
                  <select
                    value={jadwalForm.hari}
                    onChange={(e) => setJadwalForm({ ...jadwalForm, hari: e.target.value as HariRonda })}
                    className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-bold text-slate-800 focus:ring-1 focus:ring-blue-500"
                    required
                  >
                    {HARI_ORDER.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* RT */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Wilayah RT *</label>
                  <select
                    value={jadwalForm.rt}
                    onChange={(e) => {
                      const newRt = e.target.value;
                      setJadwalForm({
                        ...jadwalForm,
                        rt: newRt,
                        posKamling: `Pos Ronda RT ${newRt} (Jl. Pala)`,
                        ketuaGrupNama: '',
                        ketuaGrupNik: '',
                        ketuaGrupNoHp: '',
                        ketuaGrupAlamat: '',
                        anggotaList: [], // reset when RT changes so only matching warga can be chosen
                      });
                    }}
                    className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-bold text-slate-800 focus:ring-1 focus:ring-blue-500"
                    required
                  >
                    <option value="039">RT 039 (Zaenal Fanani)</option>
                    <option value="040">RT 040 (Epi)</option>
                    <option value="041">RT 041 (Etty Herawati)</option>
                    <option value="042">RT 042 (Sefrizal)</option>
                  </select>
                </div>

                {/* Jam Tugas (23:00 s.d 04:00) */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Jam Ronda (Wajib) *</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={jadwalForm.jamMulai}
                      onChange={(e) => setJadwalForm({ ...jadwalForm, jamMulai: e.target.value })}
                      placeholder="23:00"
                      className="w-1/2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-mono font-bold text-center text-slate-800"
                      required
                    />
                    <span className="font-bold text-slate-400">s/d</span>
                    <input
                      type="text"
                      value={jadwalForm.jamSelesai}
                      onChange={(e) => setJadwalForm({ ...jadwalForm, jamSelesai: e.target.value })}
                      placeholder="04:00"
                      className="w-1/2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-mono font-bold text-center text-slate-800"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Row: Nama Regu & Pos Kamling */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Regu Ronda *</label>
                  <input
                    type="text"
                    value={jadwalForm.namaGrup}
                    onChange={(e) => setJadwalForm({ ...jadwalForm, namaGrup: e.target.value })}
                    placeholder="Contoh: Regu Elang / Regu 1 (Senin)"
                    className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-bold text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Lokasi Pos Kamling *</label>
                  <input
                    type="text"
                    value={jadwalForm.posKamling}
                    onChange={(e) => setJadwalForm({ ...jadwalForm, posKamling: e.target.value })}
                    placeholder="Pos Kamling Utama Jl. Pala"
                    className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-bold text-slate-800"
                    required
                  />
                </div>
              </div>

              {/* SECTION: INPUT KETUA GRUP RONDA (DARI DATA WARGA RT MASING-MASING) */}
              <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-black text-amber-950 text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-700" />
                    Pilih Ketua Grup Ronda dari Data Warga RT {jadwalForm.rt} *
                  </label>
                  <span className="text-[10px] text-amber-800 font-bold">
                    Tersedia {wargaPilihanByRt.length} Warga RT {jadwalForm.rt}
                  </span>
                </div>

                {/* Dropdown pilih warga terdaftar */}
                <select
                  value={jadwalForm.ketuaGrupNik}
                  onChange={(e) => handleSelectKetuaWarga(e.target.value)}
                  className="w-full p-2.5 bg-white rounded-xl border border-amber-300 font-bold text-slate-900"
                >
                  <option value="">-- Pilih Ketua dari Daftar Warga Terdaftar RT {jadwalForm.rt} --</option>
                  {wargaPilihanByRt.map((w) => (
                    <option key={w.nik} value={w.nik}>
                      {w.nama} ({w.jenisKelamin === 'L' ? 'L' : 'P'}) - NIK: {w.nik} - {w.alamat}
                    </option>
                  ))}
                </select>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block">Nama Lengkap Ketua</label>
                    <input
                      type="text"
                      value={jadwalForm.ketuaGrupNama}
                      onChange={(e) => setJadwalForm({ ...jadwalForm, ketuaGrupNama: e.target.value })}
                      placeholder="Nama Ketua Regu Ronda"
                      className="w-full p-2 bg-white rounded-lg border border-slate-200 font-bold text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block">No. HP / WhatsApp</label>
                    <input
                      type="text"
                      value={jadwalForm.ketuaGrupNoHp}
                      onChange={(e) => setJadwalForm({ ...jadwalForm, ketuaGrupNoHp: e.target.value })}
                      placeholder="0812-xxxx-xxxx"
                      className="w-full p-2 bg-white rounded-lg border border-slate-200 font-mono font-bold text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION: INPUT ANGGOTA RONDA DARI DATA WARGA SESUAI RT MASING-MASING */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <div>
                    <label className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-blue-600" />
                      Pilih Anggota Ronda dari Data Warga RT {jadwalForm.rt}
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Klik tanda (+) untuk menambahkan warga RT {jadwalForm.rt} ke dalam regu ronda ini.
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-900">
                    {jadwalForm.anggotaList.length} Anggota Terpilih
                  </span>
                </div>

                {/* Search Warga RT */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={`Ketik nama warga RT ${jadwalForm.rt} untuk mencari...`}
                    value={wargaSearchInput}
                    onChange={(e) => setWargaSearchInput(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white rounded-xl text-xs text-slate-800 border border-slate-200 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Quick Add Warga Chips List */}
                <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white p-1">
                  {wargaPilihanByRt
                    .filter((w) => {
                      if (!wargaSearchInput.trim()) return true;
                      return (
                        w.nama.toLowerCase().includes(wargaSearchInput.toLowerCase()) ||
                        w.nik.includes(wargaSearchInput)
                      );
                    })
                    .slice(0, 15)
                    .map((w) => {
                      const isAdded = jadwalForm.anggotaList.some((a) => a.nik === w.nik || a.nama === w.nama);
                      return (
                        <div
                          key={w.nik}
                          className="flex items-center justify-between p-1.5 hover:bg-slate-50 text-xs"
                        >
                          <div className="truncate pr-2">
                            <span className="font-bold text-slate-900 block truncate">{w.nama}</span>
                            <span className="text-[10px] text-slate-500 block truncate font-mono">
                              NIK: {w.nik} • {w.pekerjaan || 'Warga'}
                            </span>
                          </div>
                          {isAdded ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 shrink-0">
                              Terdaftar
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAddAnggotaWarga(w)}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] rounded-lg shrink-0 flex items-center gap-1 active:scale-95"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Tambah</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                </div>

                {/* List of currently chosen members */}
                {jadwalForm.anggotaList.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-bold text-slate-600 block">Daftar Anggota Terpilih:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {jadwalForm.anggotaList.map((ang, idx) => (
                        <div
                          key={ang.id || idx}
                          className="p-2 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs shadow-2xs"
                        >
                          <div className="truncate pr-1">
                            <span className="font-bold text-slate-900 block truncate">
                              {idx + 1}. {ang.nama}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              {ang.nik || 'Data Warga'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveAnggota(ang.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg shrink-0"
                            title="Keluarkan dari regu"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Keterangan / Instruksi Pos */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Instruksi Tugas Ronda</label>
                <textarea
                  rows={2}
                  value={jadwalForm.keterangan}
                  onChange={(e) => setJadwalForm({ ...jadwalForm, keterangan: e.target.value })}
                  placeholder="Keliling per 1 jam, koordinasi via HT/WA, tutup portal pukul 23:30..."
                  className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-800"
                />
              </div>

              {/* Footer Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsJadwalModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl shadow-xs"
                >
                  {editingJadwal ? 'Simpan Perubahan' : 'Simpan Jadwal Ronda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL INPUT PRESENSI / DAFTAR HADIR RONDA MALAM                           */}
      {/* ========================================================================= */}
      {isAbsensiModalOpen && activeAbsensiRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-blue-950 text-white p-4.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500 text-slate-950 flex items-center justify-center font-black">
                  <UserCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black">
                    Form Catat Daftar Hadir / Presensi Ronda Malam
                  </h3>
                  <p className="text-[11px] text-blue-200">
                    Regu: {activeAbsensiRecord.namaGrup} • RT {activeAbsensiRecord.rt} • {activeAbsensiRecord.tanggal} ({activeAbsensiRecord.hari})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAbsensiModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-blue-900 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Form */}
            <form onSubmit={handleSaveAbsensiSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
              {/* Petunjuk Tanda Merah */}
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong>Instruksi Pengisian Presensi:</strong>
                  <br />
                  Klik status di samping nama setiap anggota: <strong>Hadir</strong>, <strong>Tidak Hadir (Alpa)</strong>, atau <strong>Izin</strong>.
                  Anggota yang berstatus <strong>Tidak Hadir</strong> akan otomatis diberi <strong className="text-rose-700">Tanda Merah</strong> mencolok pada tabel laporan dan dievaluasi langsung oleh Ketua RT & Ketua RW.
                </div>
              </div>

              {/* Daftar Personil Presensi */}
              <div className="space-y-2">
                <label className="font-black text-slate-900 block">
                  Status Kehadiran Anggota Regu ({activeAbsensiRecord.daftarKehadiran.length} Personil)
                </label>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {activeAbsensiRecord.daftarKehadiran.map((item, idx) => {
                    const isTidakHadir = item.status === 'Tidak Hadir';
                    return (
                      <div
                        key={item.anggotaId || idx}
                        className={`p-3 rounded-2xl border transition-all ${
                          isTidakHadir
                            ? 'bg-rose-50 border-rose-300 ring-1 ring-rose-400'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-slate-900 text-xs">
                                {idx + 1}. {item.nama}
                              </span>
                              <span
                                className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                  item.peran === 'Ketua'
                                    ? 'bg-amber-200 text-amber-900 font-extrabold'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {item.peran}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                RT {item.rt}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono block">
                              NIK: {item.nik || '-'}
                            </span>
                          </div>

                          {/* Quick Status Buttons */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleToggleRowStatus(idx, 'Hadir')}
                              className={`px-2.5 py-1 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
                                item.status === 'Hadir'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              ✓ Hadir
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleRowStatus(idx, 'Tidak Hadir')}
                              className={`px-2.5 py-1 rounded-xl font-black text-[11px] transition-all cursor-pointer ${
                                item.status === 'Tidak Hadir'
                                  ? 'bg-rose-600 text-white shadow-xs animate-pulse ring-2 ring-rose-400'
                                  : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                              }`}
                            >
                              ✗ Tidak Hadir (Merah)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleRowStatus(idx, 'Izin')}
                              className={`px-2.5 py-1 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
                                item.status === 'Izin'
                                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Izin
                            </button>
                          </div>
                        </div>

                        {/* Input Keterangan Jika Tidak Hadir / Izin */}
                        <div className="mt-2 pt-2 border-t border-slate-100/80 flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-500 shrink-0">Catatan/Alasan:</span>
                          <input
                            type="text"
                            value={item.keterangan || ''}
                            onChange={(e) => handleUpdateRowKeterangan(idx, e.target.value)}
                            placeholder={isTidakHadir ? 'Contoh: Alpa tanpa kabar / dinas luar' : 'Keterangan tambahan'}
                            className={`w-full p-1.5 rounded-lg text-[11px] border ${
                              isTidakHadir
                                ? 'bg-white border-rose-300 font-bold text-rose-800'
                                : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Catatan Petugas */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Catatan Situasi Patroli Malam</label>
                <textarea
                  rows={2}
                  value={activeAbsensiRecord.catatanPetugas || ''}
                  onChange={(e) =>
                    setActiveAbsensiRecord({
                      ...activeAbsensiRecord,
                      catatanPetugas: e.target.value,
                    })
                  }
                  placeholder="Situasi lingkungan aman terkendali, cuaca cerah..."
                  className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-800"
                />
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAbsensiModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white font-bold rounded-xl shadow-xs"
                >
                  Simpan Daftar Hadir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL PRINT PREVIEW RESMI (JADWAL / PRESENSI)                             */}
      {/* ========================================================================= */}
      {printPreviewMode && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col">
            {/* Header Preview */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-black">
                  {printPreviewMode === 'jadwal'
                    ? 'Cetak Jadwal Ronda Malam Resmi RW 018'
                    : 'Cetak Laporan Kehadiran Ronda Malam (Pemeriksaan RT/RW)'}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / Cetak ke PDF</span>
                </button>
                <button
                  onClick={() => setPrintPreviewMode(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Content */}
            <div className="p-6 sm:p-8 overflow-y-auto text-slate-900 text-xs font-serif leading-relaxed">
              {/* Kop Surat Resmi */}
              <div className="text-center border-b-2 border-double border-slate-900 pb-3 mb-4">
                <h2 className="text-sm sm:text-base font-black uppercase tracking-wider">
                  RUKUN WARGA 018 KELURAHAN IRINGMULYO
                </h2>
                <h3 className="text-xs sm:text-sm font-bold uppercase">
                  KECAMATAN METRO TIMUR - KOTA METRO
                </h3>
                <p className="text-[10px] text-slate-600 mt-0.5">
                  Sekretariat: {profile.alamatKantor} • Telp/WA: {profile.noHpKetuaRw}
                </p>
                <h4 className="text-xs font-black uppercase underline mt-2 tracking-wide font-sans">
                  {printPreviewMode === 'jadwal'
                    ? 'JADWAL TUGAS RONDA MALAM & SISKAMLING (23:00 - 04:00 WIB)'
                    : `DAFTAR HADIR & PENGAWASAN RONDA MALAM - ${currentAbsensi ? currentAbsensi.tanggal : ''}`}
                </h4>
              </div>

              {printPreviewMode === 'jadwal' ? (
                <div className="space-y-4">
                  <table className="w-full text-left text-[11px] border border-slate-800">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-800 font-bold">
                        <th className="p-2 border-r border-slate-800 w-16">Hari</th>
                        <th className="p-2 border-r border-slate-800 w-12">RT</th>
                        <th className="p-2 border-r border-slate-800 w-24">Jam Jaga</th>
                        <th className="p-2 border-r border-slate-800">Nama Regu & Pos</th>
                        <th className="p-2 border-r border-slate-800">Ketua Regu (Kontak)</th>
                        <th className="p-2">Anggota Regu Warga</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {filteredJadwal.map((j) => (
                        <tr key={j.id}>
                          <td className="p-2 font-bold border-r border-slate-800">{j.hari}</td>
                          <td className="p-2 font-bold border-r border-slate-800 text-center">RT {j.rt}</td>
                          <td className="p-2 border-r border-slate-800 font-mono text-[10px]">
                            {j.jamMulai} - {j.jamSelesai}
                          </td>
                          <td className="p-2 border-r border-slate-800">
                            <strong className="block">{j.namaGrup}</strong>
                            <span className="text-[10px] text-slate-600">{j.posKamling}</span>
                          </td>
                          <td className="p-2 border-r border-slate-800 font-semibold">
                            {j.ketuaGrup.nama}
                            <span className="block text-[10px] text-slate-500 font-mono">
                              {j.ketuaGrup.noHp || '-'}
                            </span>
                          </td>
                          <td className="p-2 text-[10px]">
                            {j.anggota && j.anggota.length > 0 ? (
                              j.anggota.map((a, i) => `${i + 1}. ${a.nama}`).join(', ')
                            ) : (
                              '-'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : currentAbsensi ? (
                <div className="space-y-4">
                  <div className="flex justify-between text-xs mb-2">
                    <div>
                      <p><strong>Regu:</strong> {currentAbsensi.namaGrup} (RT {currentAbsensi.rt})</p>
                      <p><strong>Hari/Tanggal:</strong> {currentAbsensi.hari}, {currentAbsensi.tanggal}</p>
                    </div>
                    <div className="text-right">
                      <p><strong>Jam Patroli:</strong> {currentAbsensi.jamTugas}</p>
                      <p><strong>Pos:</strong> {currentAbsensi.posKamling}</p>
                    </div>
                  </div>

                  <table className="w-full text-left text-[11px] border border-slate-800">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-800 font-bold">
                        <th className="p-2 border-r border-slate-800 w-10 text-center">No</th>
                        <th className="p-2 border-r border-slate-800">Nama Petugas Warga</th>
                        <th className="p-2 border-r border-slate-800">Peran</th>
                        <th className="p-2 border-r border-slate-800">Jam Hadir</th>
                        <th className="p-2 border-r border-slate-800 text-center">Status Kehadiran</th>
                        <th className="p-2">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {currentAbsensi.daftarKehadiran.map((row, idx) => {
                        const isTidakHadir = row.status === 'Tidak Hadir';
                        return (
                          <tr key={idx} className={isTidakHadir ? 'bg-rose-100 font-bold' : ''}>
                            <td className="p-2 text-center border-r border-slate-800">{idx + 1}</td>
                            <td className="p-2 border-r border-slate-800">{row.nama}</td>
                            <td className="p-2 border-r border-slate-800">{row.peran}</td>
                            <td className="p-2 border-r border-slate-800 font-mono">{row.jamHadir || '-'}</td>
                            <td className={`p-2 text-center border-r border-slate-800 ${isTidakHadir ? 'text-rose-700 font-black' : 'font-bold'}`}>
                              {row.status.toUpperCase()}
                            </td>
                            <td className="p-2 text-[10px]">{row.keterangan || '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {currentAbsensi.catatanPetugas && (
                    <p className="text-[11px] mt-2">
                      <strong>Catatan Petugas:</strong> {currentAbsensi.catatanPetugas}
                    </p>
                  )}
                </div>
              ) : null}

              {/* Tanda Tangan Mengetahui */}
              <div className="mt-8 pt-4 flex justify-between text-center text-xs font-sans">
                <div>
                  <p>Mengetahui,</p>
                  <p className="font-bold">Ketua RT {currentAbsensi?.rt || 'Wilayah'}</p>
                  <div className="h-16 flex items-end justify-center font-bold underline">
                    {currentAbsensi?.diperiksaOlehRt || '( ........................................ )'}
                  </div>
                </div>

                <div>
                  <p>Iringmulyo, {new Date().toLocaleDateString('id-ID')}</p>
                  <p className="font-bold">Ketua RW 018 Iringmulyo</p>
                  <div className="h-16 flex items-end justify-center font-bold underline">
                    {profile.namaKetuaRw}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal Delete Jadwal */}
      {deleteJadwalConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-3 shadow-xl">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black text-slate-900">Hapus Jadwal Ronda?</h3>
            <p className="text-xs text-slate-600">
              Apakah Anda yakin ingin menghapus jadwal <strong>{deleteJadwalConfirm.namaGrup}</strong> ({deleteJadwalConfirm.hari} RT {deleteJadwalConfirm.rt})?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteJadwalConfirm(null)}
                className="px-3.5 py-1.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onDeleteJadwal(deleteJadwalConfirm.id);
                  setDeleteJadwalConfirm(null);
                }}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
