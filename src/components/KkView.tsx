import React, { useState, useMemo, useEffect } from 'react';
import {
  Home,
  Users,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Eye,
  Download,
  CheckCircle2,
  X,
  FileText,
  UserCheck,
  CreditCard,
  Lock,
  MapPin,
  Gift,
  HeartHandshake,
  Clock,
  AlertCircle,
  Package,
  Calendar,
  ChevronDown,
  RefreshCw,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { KartuKeluarga, Warga, BansosItem, EconomicStatus, RWProfile, AppUser } from '../types';
import { generateId, formatTanggalIndo, hitungUsia } from '../utils/formatters';
import { exportKk } from '../utils/exportUtils';
import { ExportButton } from './ExportButton';
import { isMatchingRt, getUserRestrictedRt } from '../services/auth';
import { getBansosList, syncAllKepalaKeluargaToKk } from '../services/storage';
import { triggerGlobalToast } from '../context/ToastContext';

interface KkViewProps {
  profile: RWProfile;
  kkList: KartuKeluarga[];
  wargaList: Warga[];
  bansosList?: BansosItem[];
  onSaveKK?: (kk: KartuKeluarga) => void;
  onSaveKk?: (kk: KartuKeluarga) => void;
  onDeleteKK?: (id: string) => void;
  onDeleteKk?: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectWarga?: (warga: Warga) => void;
  currentUser?: AppUser | null;
}

export const getDesilBadgeInfo = (desil?: string) => {
  if (!desil || desil === 'Non-Desil') {
    return {
      label: 'Non-Desil',
      shortLabel: 'Non-Desil',
      badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
    };
  }
  if (desil === 'Desil 1') {
    return {
      label: 'Desil 1 (Sangat Miskin)',
      shortLabel: 'Desil 1',
      badgeClass: 'bg-rose-100 text-rose-900 border-rose-300 font-black',
    };
  }
  if (desil === 'Desil 2') {
    return {
      label: 'Desil 2 (Miskin)',
      shortLabel: 'Desil 2',
      badgeClass: 'bg-rose-50 text-rose-800 border-rose-200 font-bold',
    };
  }
  if (desil === 'Desil 3') {
    return {
      label: 'Desil 3 (Hampir Miskin)',
      shortLabel: 'Desil 3',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
    };
  }
  if (desil === 'Desil 4') {
    return {
      label: 'Desil 4 (Rentan Miskin)',
      shortLabel: 'Desil 4',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200 font-bold',
    };
  }
  if (desil === 'Desil 5') {
    return {
      label: 'Desil 5 (Menengah Bawah)',
      shortLabel: 'Desil 5',
      badgeClass: 'bg-yellow-50 text-yellow-800 border-yellow-200 font-semibold',
    };
  }
  if (['Desil 6', 'Desil 7', 'Desil 8'].includes(desil)) {
    return {
      label: `${desil} (Menengah)`,
      shortLabel: desil,
      badgeClass: 'bg-blue-50 text-blue-800 border-blue-200 font-semibold',
    };
  }
  if (['Desil 9', 'Desil 10'].includes(desil)) {
    return {
      label: `${desil} (Mampu)`,
      shortLabel: desil,
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold',
    };
  }
  return {
    label: desil,
    shortLabel: desil,
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
  };
};

export const KkView: React.FC<KkViewProps> = ({
  profile,
  kkList,
  wargaList,
  bansosList,
  onSaveKK,
  onSaveKk,
  onDeleteKK,
  onDeleteKk,
  searchQuery,
  onSearchChange,
  onSelectWarga,
  currentUser,
}) => {
  const saveAction = onSaveKk || onSaveKK || (() => {});
  const deleteAction = onDeleteKk || onDeleteKK || (() => {});
  const restrictedRt = getUserRestrictedRt(currentUser);

  // Scoped lists for Ketua RT
  const scopedKkList = useMemo(() => {
    if (!restrictedRt) return kkList;
    return kkList.filter((k) => isMatchingRt(k.rt, restrictedRt));
  }, [kkList, restrictedRt]);

  const scopedWargaList = useMemo(() => {
    if (!restrictedRt) return wargaList;
    return wargaList.filter((w) => isMatchingRt(w.rt, restrictedRt));
  }, [wargaList, restrictedRt]);

  const [selectedRt, setSelectedRt] = useState<string>(restrictedRt || 'ALL');
  const [selectedEkonomi, setSelectedEkonomi] = useState<string>('ALL');
  const [selectedDesil, setSelectedDesil] = useState<string>('ALL');

  // Sync selected RT when login role changes
  useEffect(() => {
    if (restrictedRt) {
      setSelectedRt(restrictedRt);
    } else {
      setSelectedRt('ALL');
    }
  }, [restrictedRt]);
  
  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingKK, setEditingKK] = useState<KartuKeluarga | null>(null);
  const [detailKK, setDetailKK] = useState<KartuKeluarga | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form state
  const initialForm: Partial<KartuKeluarga> = {
    noKk: '',
    kepalaKeluarga: '',
    nikKepala: '',
    rt: restrictedRt || '039',
    alamat: '',
    telepon: '',
    statusEkonomi: 'Menengah',
    desil: 'Non-Desil',
    jumlahAnggota: 1,
    anggotaIds: [],
  };
  const [formData, setFormData] = useState<Partial<KartuKeluarga>>(initialForm);

  // List of warga with status "Kepala Keluarga" for quick auto-population
  const kepalaOptions = useMemo(() => {
    return wargaList.filter((w) => {
      if (restrictedRt && !isMatchingRt(w.rt, restrictedRt)) return false;
      return w.statusKeluarga === 'Kepala Keluarga';
    });
  }, [wargaList, restrictedRt]);

  // Filtered list
  const filteredKK = useMemo(() => {
    return scopedKkList.filter((k) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        k.noKk.includes(q) ||
        k.kepalaKeluarga.toLowerCase().includes(q) ||
        k.nikKepala.includes(q) ||
        k.alamat.toLowerCase().includes(q) ||
        k.rt.includes(q) ||
        (k.desil && k.desil.toLowerCase().includes(q));

      const matchRt =
        restrictedRt
          ? isMatchingRt(k.rt, restrictedRt)
          : selectedRt === 'ALL' ||
            k.rt === selectedRt ||
            k.rt === selectedRt.replace(/^0+/, '');

      const matchEkonomi = selectedEkonomi === 'ALL' || k.statusEkonomi === selectedEkonomi;

      const matchDesil =
        selectedDesil === 'ALL' ||
        (selectedDesil === 'NON_DESIL' && (!k.desil || k.desil === 'Non-Desil')) ||
        (selectedDesil === 'PRIORITAS' && ['Desil 1', 'Desil 2', 'Desil 3', 'Desil 4'].includes(k.desil || '')) ||
        (selectedDesil === 'DESIL_6_10' && ['Desil 6', 'Desil 7', 'Desil 8', 'Desil 9', 'Desil 10'].includes(k.desil || '')) ||
        k.desil === selectedDesil;

      return matchSearch && matchRt && matchEkonomi && matchDesil;
    });
  }, [scopedKkList, searchQuery, selectedRt, restrictedRt, selectedEkonomi, selectedDesil]);

  const handleOpenAdd = () => {
    setEditingKK(null);
    setFormData({
      ...initialForm,
      rt: restrictedRt || (selectedRt !== 'ALL' ? selectedRt : (profile.daftarRt[0] || '039')),
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (kk: KartuKeluarga) => {
    setEditingKK(kk);
    setFormData({
      ...kk,
      desil: kk.desil || 'Non-Desil',
      rt: restrictedRt || kk.rt,
    });
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.noKk || !formData.kepalaKeluarga) {
      alert('Mohon lengkapi Nomor KK dan Nama Kepala Keluarga!');
      return;
    }

    const currentSelectedRt = restrictedRt || formData.rt || (selectedRt !== 'ALL' ? selectedRt : profile.daftarRt[0]) || '039';

    // Find all warga matching this No KK
    const matchingWarga = scopedWargaList.filter((w) => w.noKk === formData.noKk);
    const anggotaCount = matchingWarga.length > 0 ? matchingWarga.length : (formData.jumlahAnggota || 1);

    const saved: KartuKeluarga = {
      id: editingKK ? editingKK.id : generateId('kk'),
      noKk: formData.noKk || '',
      kepalaKeluarga: formData.kepalaKeluarga || '',
      nikKepala: formData.nikKepala || '',
      rt: currentSelectedRt,
      alamat: formData.alamat || `RT ${currentSelectedRt} ${profile.namaRw}`,
      telepon: formData.telepon || '',
      statusEkonomi: (formData.statusEkonomi as EconomicStatus) || 'Menengah',
      desil: formData.desil || 'Non-Desil',
      jumlahAnggota: anggotaCount,
      anggotaIds: matchingWarga.map((w) => w.nik),
      createdAt: editingKK?.createdAt || new Date().toISOString(),
    };

    saveAction(saved);
    setIsFormModalOpen(false);
  };

  const handleExportExcel = () => {
    const scopeLabel = selectedRt === 'ALL' ? 'Semua_RT' : `RT_${selectedRt}`;
    exportKk(filteredKK, 'xlsx', scopeLabel, profile);
  };

  const handleExportCSV = () => {
    const scopeLabel = selectedRt === 'ALL' ? 'Semua_RT' : `RT_${selectedRt}`;
    exportKk(filteredKK, 'csv', scopeLabel, profile);
  };

  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncKepalaKeluarga = async () => {
    setIsSyncing(true);
    try {
      const res = await syncAllKepalaKeluargaToKk();
      triggerGlobalToast(
        `Integrasi berhasil: ${res.syncedCount} data KK diperbarui dan ${res.newCount} KK baru dibuat dari Data Induk Warga (Kepala Keluarga).`,
        'success',
        'Sinkronisasi Selesai'
      );
    } catch (err) {
      console.error('Gagal sinkronisasi data KK:', err);
      triggerGlobalToast('Terjadi kesalahan saat menyinkronkan data Kepala Keluarga.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Effective Bansos List (from props or local storage fallback)
  const effectiveBansosList = useMemo(() => {
    return bansosList || getBansosList();
  }, [bansosList]);

  // Get members for detail modal
  const detailMembers = useMemo(() => {
    if (!detailKK) return [];
    return wargaList.filter((w) => w.noKk === detailKK.noKk);
  }, [detailKK, wargaList]);

  // Kepala Keluarga detail for detail modal
  const detailKepalaWarga = useMemo(() => {
    if (!detailKK) return null;
    return (
      wargaList.find(
        (w) =>
          w.nik === detailKK.nikKepala ||
          (w.noKk === detailKK.noKk && w.statusKeluarga === 'Kepala Keluarga')
      ) || null
    );
  }, [detailKK, wargaList]);

  // Get Bansos programs for detail modal (matching No KK, NIK Kepala, or Any Family Member)
  const detailBansosList = useMemo(() => {
    if (!detailKK) return [];
    const memberNiks = new Set(detailMembers.map((m) => m.nik));
    if (detailKK.nikKepala) memberNiks.add(detailKK.nikKepala);

    return effectiveBansosList.filter(
      (b) => b.noKk === detailKK.noKk || (b.nik && memberNiks.has(b.nik))
    );
  }, [detailKK, detailMembers, effectiveBansosList]);

  return (
    <div className="space-y-4 p-3 sm:p-4 pb-16 max-w-5xl mx-auto">
      {/* Top Card */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {restrictedRt ? `Data Kartu Keluarga (KK) RT ${restrictedRt}` : `Data Kartu Keluarga (KK) ${profile.namaRw}`}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-800 border border-blue-200">
                {scopedKkList.length} KK {restrictedRt ? `RT ${restrictedRt}` : 'Terdaftar'}
              </span>
              {restrictedRt && (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <Lock className="w-3 h-3 text-amber-700" />
                  RT {restrictedRt}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {restrictedRt
                ? `Pengelolaan data Kepala Keluarga khusus wilayah RT ${restrictedRt}. Anda berwenang mengelola data KK di lingkungan RT ${restrictedRt}.`
                : 'Kelola data kepala keluarga, sebaran per-RT, dan status ekonomi keluarga warga.'}
            </p>
          </div>

          {/* Action Buttons: 2 equal columns on mobile / inline on desktop */}
          <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto shrink-0 flex-wrap">
            <button
              type="button"
              onClick={handleSyncKepalaKeluarga}
              disabled={isSyncing}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-black rounded-xl shadow-2xs transition-all active:scale-95 text-center cursor-pointer"
              title="Sinkronisasikan seluruh data warga yang berstatus Kepala Keluarga langsung ke Data KK"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-600' : 'text-emerald-700'}`} />
              <span>{isSyncing ? 'Sinkronisasi...' : 'Sinkronkan Data KK'}</span>
            </button>
            <ExportButton
              label="Ekspor"
              onExportExcel={handleExportExcel}
              onExportCsv={handleExportCSV}
              variant="secondary"
            />
            <button
              onClick={handleOpenAdd}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-black rounded-xl shadow-xs transition-all active:scale-95 text-center"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Tambah KK</span>
            </button>
          </div>
        </div>

        {/* RT Filter Chips & Economic Filter */}
        <div className="pt-3 border-t border-slate-100 space-y-2.5">
          {/* RT Row */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {restrictedRt ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 font-bold text-xs shadow-2xs">
                <Lock className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                <span>Wilayah Tugas: RT {restrictedRt}</span>
                <span className="px-2 py-0.5 rounded-md bg-blue-700 text-white text-[10px] font-black">{scopedKkList.length} KK</span>
              </div>
            ) : (
              <>
                <span className="text-slate-400 font-bold flex items-center gap-1 shrink-0 mr-1 text-[11px]">
                  <Filter className="w-3 h-3" /> RT:
                </span>
                <button
                  onClick={() => setSelectedRt('ALL')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs shrink-0 ${
                    selectedRt === 'ALL'
                      ? 'bg-blue-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Semua ({scopedKkList.length})
                </button>
                {profile.daftarRt.map((rt) => {
                  const count = scopedKkList.filter(
                    (k) => k.rt === rt || k.rt === rt.replace(/^0+/, '')
                  ).length;
                  return (
                    <button
                      key={rt}
                      onClick={() => setSelectedRt(rt)}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs shrink-0 ${
                        selectedRt === rt
                          ? 'bg-blue-700 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      RT {rt} ({count})
                    </button>
                  );
                })}
              </>
            )}
          </div>

          {/* Economic status & Desil filter */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-400 font-bold text-[11px]">Ekonomi:</span>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                {['ALL', 'Prasejahtera', 'Menengah', 'Mampu'].map((ek) => (
                  <button
                    key={ek}
                    onClick={() => setSelectedEkonomi(ek)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      selectedEkonomi === ek
                        ? 'bg-white text-slate-800 shadow-xs'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {ek === 'ALL' ? 'Semua' : ek}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-bold text-[11px] whitespace-nowrap">Desil P3KE/DTKS:</span>
              <div className="relative inline-block">
                <select
                  value={selectedDesil}
                  onChange={(e) => setSelectedDesil(e.target.value)}
                  className={`pl-2.5 pr-7 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                    selectedDesil !== 'ALL'
                      ? 'border-blue-600 text-blue-900 bg-blue-50/80 ring-1 ring-blue-500/20'
                      : 'border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <option value="ALL">Semua Desil</option>
                  <option value="NON_DESIL">Non Desil</option>
                  <option value="PRIORITAS">Desil 1-4 Prioritas Bansos</option>
                  <option value="DESIL_6_10">Desil 6-10</option>
                  <option value="Desil 1">Desil 1</option>
                  <option value="Desil 2">Desil 2</option>
                  <option value="Desil 3">Desil 3</option>
                  <option value="Desil 4">Desil 4</option>
                  <option value="Desil 5">Desil 5</option>
                  <option value="Desil 6">Desil 6</option>
                  <option value="Desil 7">Desil 7</option>
                  <option value="Desil 8">Desil 8</option>
                  <option value="Desil 9">Desil 9</option>
                  <option value="Desil 10">Desil 10</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                  <ChevronDown className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dedicated Search Input for No KK, Kepala Keluarga, NIK, Desil */}
        <div className="pt-2 border-t border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-700" />
            <input
              type="text"
              placeholder="Pencarian No KK, Nama Kepala Keluarga, NIK, Alamat, atau Desil (contoh: Desil 1)..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-blue-200/80 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KK Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredKK.length === 0 ? (
          <div className="sm:col-span-2 bg-white p-8 rounded-2xl text-center border border-slate-200">
            <Home className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <h4 className="text-sm font-bold text-slate-700">Tidak ada data KK ditemukan</h4>
            <button
              onClick={handleOpenAdd}
              className="mt-3 px-4 py-2 bg-blue-700 text-white rounded-xl text-xs font-bold"
            >
              + Tambah Kartu Keluarga
            </button>
          </div>
        ) : (
          filteredKK.map((kk) => {
            const memberCount = wargaList.filter((w) => w.noKk === kk.noKk).length || kk.jumlahAnggota;
            const desilInfo = getDesilBadgeInfo(kk.desil);
            const kepalaWarga = wargaList.find(
              (w) =>
                w.nik === kk.nikKepala ||
                (w.noKk === kk.noKk && w.statusKeluarga === 'Kepala Keluarga')
            );
            const fotoKepala = kk.fotoKepala || kepalaWarga?.foto || kepalaWarga?.fotoUrl;
            const pekerjaanKepala = kk.pekerjaanKepala || kepalaWarga?.pekerjaan;
            const ttlKepala =
              (kk.tempatLahirKepala || kepalaWarga?.tempatLahir)
                ? `${kk.tempatLahirKepala || kepalaWarga?.tempatLahir}, ${formatTanggalIndo(
                    kk.tanggalLahirKepala || kepalaWarga?.tanggalLahir
                  )} (${hitungUsia(kk.tanggalLahirKepala || kepalaWarga?.tanggalLahir)} th)`
                : null;

            return (
              <div
                key={kk.id}
                className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-blue-300 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {fotoKepala ? (
                        <img
                          src={fotoKepala}
                          alt={kk.kepalaKeluarga}
                          className="w-11 h-11 rounded-xl object-cover border border-blue-200 shadow-2xs shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center font-bold shrink-0 shadow-2xs">
                          <Home className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-sm font-black text-slate-900 leading-tight truncate">
                            {kk.kepalaKeluarga}
                          </h3>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-700" />
                            <span>Terintegrasi</span>
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono block truncate">
                          NIK: <strong className="text-slate-700">{kk.nikKepala || kepalaWarga?.nik || '-'}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          kk.statusEkonomi === 'Prasejahtera'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : kk.statusEkonomi === 'Mampu'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {kk.statusEkonomi}
                      </span>

                      {kk.desil && kk.desil !== 'Non-Desil' && (
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border ${desilInfo.badgeClass}`}
                          title={`Tingkat Desil: ${desilInfo.label}`}
                        >
                          {desilInfo.shortLabel}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Nomor KK</span>
                      <span className="font-mono font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                        {kk.noKk}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Wilayah / RT</span>
                      <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                        RT {kk.rt}
                      </span>
                    </div>

                    {pekerjaanKepala && (
                      <div className="flex justify-between items-center py-1 border-b border-slate-100">
                        <span className="text-slate-500 font-medium">Profesi Kepala KK</span>
                        <span className="font-semibold text-slate-800 truncate max-w-[170px]">
                          {pekerjaanKepala}
                        </span>
                      </div>
                    )}

                    {ttlKepala && (
                      <div className="flex justify-between items-center py-1 border-b border-slate-100">
                        <span className="text-slate-500 font-medium">TTL / Usia</span>
                        <span className="font-semibold text-slate-700 truncate max-w-[170px]">
                          {ttlKepala}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Data Desil (P3KE)</span>
                      <span className={`font-bold px-2 py-0.5 rounded-md text-[10px] border ${desilInfo.badgeClass}`}>
                        {desilInfo.label}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Anggota Keluarga</span>
                      <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                        {memberCount} Orang
                      </span>
                    </div>

                    {/* Status Program Bansos on Card */}
                    {(() => {
                      const matchingBansos = effectiveBansosList.filter(
                        (b) => b.noKk === kk.noKk || b.nik === kk.nikKepala
                      );
                      if (matchingBansos.length > 0) {
                        return (
                          <div className="flex justify-between items-center py-1 border-b border-slate-100">
                            <span className="text-slate-500 font-medium flex items-center gap-1">
                              <Gift className="w-3 h-3 text-amber-600 shrink-0" />
                              <span>Bansos Diterima</span>
                            </span>
                            <span className="font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md text-[10px] truncate max-w-[170px]" title={matchingBansos.map((b) => b.jenisBansos).join(', ')}>
                              {matchingBansos.map((b) => b.jenisBansos).join(', ')}
                            </span>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    <div className="py-1 flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="text-slate-600 text-[11px] leading-snug line-clamp-2">{kk.alamat}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-slate-500 truncate">
                    {kk.telepon || 'Tanpa No Telp'}
                  </span>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setDetailKK(kk)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Detail</span>
                    </button>
                    <button
                      onClick={() => handleOpenEdit(kk)}
                      className="p-1.5 bg-blue-50 hover:bg-blue-100 active:scale-95 text-blue-700 rounded-xl transition-all cursor-pointer"
                      title="Edit KK"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(kk.id)}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 rounded-xl transition-all cursor-pointer"
                      title="Hapus KK"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Form Add / Edit Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl overflow-hidden">
            <div className="bg-blue-800 p-4 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">
                  {editingKK ? 'Edit Kartu Keluarga' : 'Tambah Kartu Keluarga (KK)'}
                </h3>
                <p className="text-xs text-blue-200">RW 018 {profile.kelurahan}</p>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-blue-700 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-3 text-xs">
              {kepalaOptions.length > 0 && !editingKK && (
                <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50/70 rounded-2xl border border-blue-200 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-blue-950 text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                    <span>Integrasi Otomatis dari Data Induk Warga:</span>
                  </div>
                  <select
                    onChange={(e) => {
                      const selectedWarga = kepalaOptions.find((w) => w.id === e.target.value);
                      if (selectedWarga) {
                        setFormData((prev) => ({
                          ...prev,
                          noKk: selectedWarga.noKk || prev.noKk,
                          kepalaKeluarga: selectedWarga.nama,
                          nikKepala: selectedWarga.nik,
                          rt: selectedWarga.rt || prev.rt,
                          alamat: selectedWarga.alamat || prev.alamat,
                          telepon: selectedWarga.noHp || prev.telepon,
                          fotoKepala: selectedWarga.foto || selectedWarga.fotoUrl,
                          pekerjaanKepala: selectedWarga.pekerjaan,
                          tempatLahirKepala: selectedWarga.tempatLahir,
                          tanggalLahirKepala: selectedWarga.tanggalLahir,
                          jenisKelaminKepala: selectedWarga.jenisKelamin,
                          agamaKepala: selectedWarga.agama,
                          statusKawinKepala: selectedWarga.statusKawin,
                          golDarahKepala: selectedWarga.golDarah,
                          pendidikanKepala: selectedWarga.pendidikan,
                        }));
                      }
                    }}
                    defaultValue=""
                    className="w-full p-2 bg-white border border-blue-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value="" disabled>
                      -- Pilih Warga Kepala Keluarga untuk Otomatisasi Input --
                    </option>
                    {kepalaOptions.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.nama} (NIK: {w.nik} - No KK: {w.noKk} - RT {w.rt})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-blue-800 leading-tight">
                    Memilih warga di atas akan langsung mengintegrasikan seluruh rincian detailnya ke formulir KK.
                  </p>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nomor Kartu Keluarga (16 Digit) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={16}
                  placeholder="187102xxxxxxxxxx"
                  value={formData.noKk || ''}
                  onChange={(e) => setFormData({ ...formData, noKk: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Kepala Keluarga *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nama Lengkap Kepala Keluarga"
                  value={formData.kepalaKeluarga || ''}
                  onChange={(e) => setFormData({ ...formData, kepalaKeluarga: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NIK Kepala</label>
                  <input
                    type="text"
                    maxLength={16}
                    placeholder="187102xxxxxxxxxx"
                    value={formData.nikKepala || ''}
                    onChange={(e) => setFormData({ ...formData, nikKepala: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Wilayah RT * {restrictedRt && <span className="text-blue-700 font-bold">(Terkunci RT {restrictedRt})</span>}
                  </label>
                  {restrictedRt ? (
                    <div>
                      <select
                        disabled
                        value={restrictedRt}
                        className="w-full p-2 border border-blue-300 bg-blue-50 text-blue-950 font-bold rounded-xl cursor-not-allowed"
                      >
                        <option value={restrictedRt}>RT {restrictedRt}</option>
                      </select>
                      <div className="text-[10px] text-blue-700 font-semibold flex items-center gap-1 mt-1">
                        <Lock className="w-3 h-3" />
                        <span>Sesuai hak akses login Ketua RT {restrictedRt}</span>
                      </div>
                    </div>
                  ) : (
                    <select
                      value={formData.rt || profile.daftarRt[0] || '039'}
                      onChange={(e) => setFormData({ ...formData, rt: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold"
                    >
                      {profile.daftarRt.map((rt) => (
                        <option key={rt} value={rt}>
                          RT {rt}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Ekonomi</label>
                  <select
                    value={formData.statusEkonomi || 'Menengah'}
                    onChange={(e) =>
                      setFormData({ ...formData, statusEkonomi: e.target.value as EconomicStatus })
                    }
                    className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value="Mampu">Mampu</option>
                    <option value="Menengah">Menengah</option>
                    <option value="Prasejahtera">Prasejahtera (DTKS)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Data Desil Kesejahteraan</span>
                    <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                      P3KE / DTKS
                    </span>
                  </label>
                  <select
                    value={formData.desil || 'Non-Desil'}
                    onChange={(e) => setFormData({ ...formData, desil: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-semibold text-slate-800"
                  >
                    <option value="Desil 1">Desil 1 (Sangat Miskin / Prioritas 1)</option>
                    <option value="Desil 2">Desil 2 (Miskin / Prioritas 2)</option>
                    <option value="Desil 3">Desil 3 (Hampir Miskin / Prioritas 3)</option>
                    <option value="Desil 4">Desil 4 (Rentan Miskin / Prioritas 4)</option>
                    <option value="Desil 5">Desil 5 (Menengah Bawah)</option>
                    <option value="Desil 6">Desil 6 (Menengah)</option>
                    <option value="Desil 7">Desil 7 (Menengah)</option>
                    <option value="Desil 8">Desil 8 (Menengah Atas)</option>
                    <option value="Desil 9">Desil 9 (Mampu)</option>
                    <option value="Desil 10">Desil 10 (Sangat Mampu)</option>
                    <option value="Non-Desil">Non-Desil / Belum Terdata</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">No Telepon / WA</label>
                <input
                  type="tel"
                  placeholder="0812xxxxxxxx"
                  value={formData.telepon || ''}
                  onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alamat Rumah</label>
                <textarea
                  rows={2}
                  placeholder="Nama jalan, nomor rumah, blok..."
                  value={formData.alamat || ''}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold"
                >
                  Simpan KK
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail KK & Family Members Modal */}
      {detailKK && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-blue-800 to-indigo-900 p-4 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-blue-200 uppercase">
                  SALINAN KARTU KELUARGA
                </span>
                <h3 className="text-base font-bold font-mono">No. {detailKK.noKk}</h3>
                <p className="text-xs text-blue-100">
                  Kepala Keluarga: <strong className="text-amber-300">{detailKK.kepalaKeluarga}</strong> (RT {detailKK.rt})
                </p>
              </div>
              <button
                onClick={() => setDetailKK(null)}
                className="p-1.5 rounded-full hover:bg-white/10 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3.5 text-xs flex-1">
              {/* Summary Info Header */}
              {(() => {
                const detailDesilInfo = getDesilBadgeInfo(detailKK.desil);
                return (
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Alamat</span>
                      <span className="font-semibold text-slate-800 line-clamp-2">{detailKK.alamat}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">RT / RW</span>
                      <span className="font-semibold text-slate-800">RT {detailKK.rt} / {profile.namaRw}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Status Ekonomi</span>
                      <span
                        className={`font-bold inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs mt-0.5 ${
                          detailKK.statusEkonomi === 'Prasejahtera'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : detailKK.statusEkonomi === 'Mampu'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {detailKK.statusEkonomi}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Data Desil (P3KE)</span>
                      <span className={`font-bold inline-flex items-center px-2 py-0.5 rounded-md text-[11px] mt-0.5 border ${detailDesilInfo.badgeClass}`}>
                        {detailDesilInfo.label}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">No Telepon</span>
                      <span className="font-mono text-slate-800">{detailKK.telepon || '-'}</span>
                    </div>
                  </div>
                );
              })()}

              {/* DATA DETAIL KEPALA KELUARGA (TERINTEGRASI OTOMATIS DARI DATA INDUK WARGA) */}
              {(() => {
                const foto = detailKK.fotoKepala || detailKepalaWarga?.foto || detailKepalaWarga?.fotoUrl;
                const nik = detailKK.nikKepala || detailKepalaWarga?.nik || '-';
                const nama = detailKK.kepalaKeluarga;
                const tempatLahir = detailKK.tempatLahirKepala || detailKepalaWarga?.tempatLahir || '-';
                const tanggalLahir = detailKK.tanggalLahirKepala || detailKepalaWarga?.tanggalLahir;
                const usia = tanggalLahir ? hitungUsia(tanggalLahir) : null;
                const jk = (detailKK.jenisKelaminKepala || detailKepalaWarga?.jenisKelamin) === 'P' ? 'Perempuan' : 'Laki-Laki';
                const agama = detailKK.agamaKepala || detailKepalaWarga?.agama || 'Islam';
                const pekerjaan = detailKK.pekerjaanKepala || detailKepalaWarga?.pekerjaan || 'Wiraswasta';
                const statusKawin = detailKK.statusKawinKepala || detailKepalaWarga?.statusKawin || 'Kawin';
                const golDarah = detailKK.golDarahKepala || detailKepalaWarga?.golDarah || '-';
                const pendidikan = detailKK.pendidikanKepala || detailKepalaWarga?.pendidikan || '-';
                const telp = detailKK.telepon || detailKepalaWarga?.noHp || '-';

                // Birth year for red (odd) or blue (even) KTP photo background
                const tahunLahir = tanggalLahir ? parseInt(tanggalLahir.substring(0, 4), 10) : 0;
                const bgPhotoClass = tahunLahir && tahunLahir % 2 === 1 ? 'bg-red-700' : 'bg-blue-700';

                return (
                  <div className="bg-gradient-to-br from-blue-50/90 via-indigo-50/50 to-slate-50 p-4 rounded-2xl border-2 border-blue-300/80 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-blue-200">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-blue-700 text-white flex items-center justify-center shadow-xs">
                          <UserCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-black text-xs text-blue-950 uppercase tracking-wide flex items-center gap-1.5">
                            <span>Data Detail Kepala Keluarga</span>
                            <span className="px-2 py-0.2 rounded-full text-[9px] bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold">
                              ⚡ Terintegrasi Otomatis
                            </span>
                          </h4>
                          <p className="text-[10px] text-blue-800/80">
                            Disinkronkan secara otomatis dari Data Induk Warga RW 018
                          </p>
                        </div>
                      </div>

                      {detailKepalaWarga && onSelectWarga && (
                        <button
                          type="button"
                          onClick={() => {
                            const wargaToSelect = detailKepalaWarga;
                            setDetailKK(null);
                            onSelectWarga(wargaToSelect);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-bold text-[10px] shadow-2xs transition-all active:scale-95 cursor-pointer"
                        >
                          <CreditCard className="w-3 h-3" />
                          <span>Buka KTP Digital</span>
                          <ExternalLink className="w-2.5 h-2.5 ml-0.5 opacity-80" />
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3.5">
                      {/* Pas Foto Kepala Keluarga */}
                      <div className="shrink-0 flex flex-col items-center">
                        <div className={`w-20 h-26 rounded-xl overflow-hidden p-1 shadow-md border-2 border-white ${bgPhotoClass} flex items-center justify-center`}>
                          {foto ? (
                            <img
                              src={foto}
                              alt={nama}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-white/90">
                              <UserCheck className="w-8 h-8 opacity-80" />
                              <span className="text-[8px] font-bold mt-1">PAS FOTO</span>
                            </div>
                          )}
                        </div>
                        <span className="text-[9px] text-slate-500 font-bold mt-1 text-center">
                          Kepala Keluarga
                        </span>
                      </div>

                      {/* Detail Fields Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 flex-1 w-full text-xs">
                        <div className="bg-white/90 p-2 rounded-xl border border-blue-100 shadow-2xs">
                          <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">NIK Kepala</span>
                          <span className="font-mono font-black text-slate-900 text-[11px] block truncate">{nik}</span>
                        </div>
                        <div className="bg-white/90 p-2 rounded-xl border border-blue-100 shadow-2xs">
                          <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Nama Lengkap</span>
                          <span className="font-black text-slate-900 text-[11px] block truncate uppercase">{nama}</span>
                        </div>
                        <div className="bg-white/90 p-2 rounded-xl border border-blue-100 shadow-2xs">
                          <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">TTL / Usia</span>
                          <span className="font-semibold text-slate-800 text-[11px] block truncate">
                            {tempatLahir}{tanggalLahir ? `, ${formatTanggalIndo(tanggalLahir)} (${usia} th)` : ''}
                          </span>
                        </div>
                        <div className="bg-white/90 p-2 rounded-xl border border-blue-100 shadow-2xs">
                          <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Jenis Kelamin</span>
                          <span className="font-bold text-slate-800 text-[11px] block truncate">{jk}</span>
                        </div>
                        <div className="bg-white/90 p-2 rounded-xl border border-blue-100 shadow-2xs">
                          <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Agama</span>
                          <span className="font-bold text-slate-800 text-[11px] block truncate">{agama}</span>
                        </div>
                        <div className="bg-white/90 p-2 rounded-xl border border-blue-100 shadow-2xs">
                          <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Pekerjaan / Profesi</span>
                          <span className="font-bold text-blue-900 text-[11px] block truncate">{pekerjaan}</span>
                        </div>
                        <div className="bg-white/90 p-2 rounded-xl border border-blue-100 shadow-2xs">
                          <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Pendidikan</span>
                          <span className="font-semibold text-slate-800 text-[11px] block truncate">{pendidikan}</span>
                        </div>
                        <div className="bg-white/90 p-2 rounded-xl border border-blue-100 shadow-2xs">
                          <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Status Kawin</span>
                          <span className="font-semibold text-slate-800 text-[11px] block truncate">{statusKawin}</span>
                        </div>
                        <div className="bg-white/90 p-2 rounded-xl border border-blue-100 shadow-2xs">
                          <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Gol. Darah</span>
                          <span className="font-black text-rose-700 text-[11px] block truncate">{golDarah}</span>
                        </div>
                        <div className="bg-white/90 p-2 rounded-xl border border-blue-100 shadow-2xs col-span-2 sm:col-span-3">
                          <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">No HP / WhatsApp</span>
                          {telp !== '-' ? (
                            <a
                              href={`https://wa.me/${telp.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="font-mono font-bold text-emerald-700 hover:text-emerald-800 text-[11px] flex items-center gap-1 truncate"
                            >
                              <Phone className="w-3 h-3 text-emerald-600" />
                              <span>{telp} (Klik untuk chat WhatsApp)</span>
                            </a>
                          ) : (
                            <span className="font-mono text-slate-400 text-[11px]">-</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Status Program Bansos yang Diterima (Directly below Status Ekonomi) */}
              <div className="bg-gradient-to-br from-amber-50/80 via-orange-50/40 to-amber-50/70 p-3.5 sm:p-4 rounded-2xl border border-amber-200 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
                      <Gift className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="font-black text-xs text-amber-950 uppercase tracking-wide">
                        Status Program Bansos yang Diterima
                      </h4>
                      <p className="text-[10px] text-amber-800/80">
                        Bantuan sosial Pemerintah & Kas RW yang diterima keluarga ini
                      </p>
                    </div>
                  </div>

                  {detailBansosList.length > 0 ? (
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                      {detailBansosList.length} Program Diterima
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-200/90 text-slate-700">
                      Belum Ada Bansos
                    </span>
                  )}
                </div>

                {detailBansosList.length > 0 ? (
                  <div className="space-y-2 pt-1">
                    {detailBansosList.map((b) => (
                      <div
                        key={b.id}
                        className="p-3 bg-white rounded-xl border border-amber-200 shadow-2xs flex flex-col sm:flex-row sm:items-start justify-between gap-2.5"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-slate-900 text-xs px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md border border-amber-300">
                              {b.jenisBansos}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                b.status === 'Disalurkan'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : b.status === 'Menunggu Verifikasi'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : b.status === 'Belum Diambil'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                  : 'bg-rose-100 text-rose-800 border border-rose-300'
                              }`}
                            >
                              {b.status === 'Disalurkan' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                              {b.status === 'Menunggu Verifikasi' && <Clock className="w-3 h-3 text-amber-600" />}
                              {b.status === 'Belum Diambil' && <AlertCircle className="w-3 h-3 text-blue-600" />}
                              {b.status}
                            </span>
                            <span className="text-[10px] text-slate-500 font-semibold">
                              Periode: <strong className="text-slate-700">{b.periode}</strong>
                            </span>
                          </div>

                          <div className="text-slate-700 text-xs font-semibold pt-0.5">
                            Penerima: <span className="text-slate-900 font-bold">{b.namaPenerima}</span>{' '}
                            <span className="font-mono text-slate-500 text-[11px]">(NIK: {b.nik})</span>
                          </div>

                          <div className="text-[11px] text-emerald-900 font-bold flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200/80 w-fit">
                            <Package className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                            <span>Bantuan: {b.nominalOrPaket}</span>
                          </div>

                          {b.keterangan && (
                            <p className="text-[11px] text-slate-600 italic leading-snug pt-0.5">
                              "{b.keterangan}"
                            </p>
                          )}
                        </div>

                        <div className="sm:text-right shrink-0 text-[10px] text-slate-500 space-y-0.5 border-t sm:border-t-0 pt-1.5 sm:pt-0 border-slate-100">
                          {b.tanggalPenyaluran && (
                            <div className="font-medium text-slate-700 flex sm:justify-end items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>Penyaluran: {formatTanggalIndo(b.tanggalPenyaluran)}</span>
                            </div>
                          )}
                          {b.petugasPenyalur && (
                            <div className="text-slate-500">
                              Petugas: <strong className="text-slate-700">{b.petugasPenyalur}</strong>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-white/90 rounded-xl border border-dashed border-amber-300 text-center space-y-1">
                    <div className="flex items-center justify-center gap-1.5 text-slate-600 font-bold text-xs">
                      <HeartHandshake className="w-4 h-4 text-slate-400" />
                      <span>Belum Ada Program Bansos Terdaftar</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed max-w-lg mx-auto">
                      Keluarga ini belum tercatat menerima program bantuan sosial (seperti PKH, BPNT, Beras CBP 10kg, BLT, KIS/PBI, atau Santunan RW).
                    </p>
                    {detailKK.statusEkonomi === 'Prasejahtera' && (
                      <div className="mt-2 p-2 bg-amber-100/90 text-amber-950 rounded-lg text-[11px] text-left font-medium border border-amber-300">
                        💡 <strong>Catatan:</strong> Status ekonomi keluarga ini adalah <strong>Prasejahtera (DTKS)</strong>. Pengurus RT/RW dapat mengusulkan bantuan pada menu <strong>Bansos</strong> saat kuota penyaluran tersedia.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-blue-700" />
                    Daftar Anggota Keluarga ({detailMembers.length} Orang)
                  </h4>
                </div>

                {detailMembers.length === 0 ? (
                  <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400">
                    Belum ada data rincian anggota keluarga yang terhubung dengan No KK ini.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {detailMembers.map((m, idx) => (
                      <div key={m.id} className="p-3 bg-white hover:bg-slate-50 flex items-center justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-[10px] shrink-0">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800">{m.nama}</span>
                              <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 font-semibold text-slate-700">
                                {m.statusKeluarga}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                ({m.jenisKelamin === 'L' ? 'L' : 'P'}, {hitungUsia(m.tanggalLahir)} th)
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              NIK: {m.nik} • {m.pekerjaan}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setDetailKK(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-xl space-y-3 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-800">Hapus Kartu Keluarga?</h4>
            <p className="text-xs text-slate-500">
              Data Kartu Keluarga ini akan dihapus dari database lokal RW 018.
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  deleteAction(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
              >
                Hapus KK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
