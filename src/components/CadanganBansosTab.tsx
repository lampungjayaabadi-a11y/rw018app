import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
  Trash2,
  Edit2,
  UserCheck,
  Package,
  Calendar,
  Building,
  Check,
  RotateCcw,
  Sparkles,
  MapPin,
  IdCard,
  HeartHandshake,
  ShieldCheck,
  Tag,
  ArrowRight,
  Printer,
  ChevronRight,
  Gift,
  X
} from 'lucide-react';
import {
  CadanganBansosItem,
  PrioritasCadangan,
  StatusCadanganBansos,
  KategoriCadanganBansos,
  BansosType,
  Warga,
  RWProfile,
  AppUser
} from '../types';
import { formatTanggalIndo, hitungUsia } from '../utils/formatters';
import { ExportButton } from './ExportButton';

interface CadanganBansosTabProps {
  profile: RWProfile;
  cadanganList: CadanganBansosItem[];
  wargaList: Warga[];
  onOpenAddModal: () => void;
  onEditCadangan: (item: CadanganBansosItem) => void;
  onDeleteCadangan: (id: string) => void;
  onPromoteToBansos: (item: CadanganBansosItem) => void;
  currentUser?: AppUser | null;
}

export const CadanganBansosTab: React.FC<CadanganBansosTabProps> = ({
  profile,
  cadanganList,
  wargaList,
  onOpenAddModal,
  onEditCadangan,
  onDeleteCadangan,
  onPromoteToBansos,
  currentUser,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRt, setSelectedRt] = useState('ALL');
  const [selectedPrioritas, setSelectedPrioritas] = useState('ALL');
  const [selectedKategori, setSelectedKategori] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Metrics calculation
  const metrics = useMemo(() => {
    const total = cadanganList.length;
    const prioritas1 = cadanganList.filter((c) =>
      c.prioritas?.includes('Prioritas 1')
    ).length;
    const lansiaDisabilitas = cadanganList.filter(
      (c) => c.kategori === 'Lansia' || c.kategori === 'Disabilitas'
    ).length;
    const menunggu = cadanganList.filter(
      (c) => c.status === 'Menunggu Kuota' || !c.status
    ).length;

    return { total, prioritas1, lansiaDisabilitas, menunggu };
  }, [cadanganList]);

  // Filtered List
  const filteredList = useMemo(() => {
    return cadanganList.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        c.nama.toLowerCase().includes(q) ||
        c.nik.includes(q) ||
        (c.noKk && c.noKk.includes(q)) ||
        (c.alamat && c.alamat.toLowerCase().includes(q)) ||
        (c.targetJenisBansos && c.targetJenisBansos.toLowerCase().includes(q)) ||
        (c.alasanKelayakan && c.alasanKelayakan.toLowerCase().includes(q));

      const matchRt =
        selectedRt === 'ALL' ||
        c.rt === selectedRt ||
        c.rt === selectedRt.replace(/^0+/, '');

      const matchPrioritas =
        selectedPrioritas === 'ALL' || c.prioritas === selectedPrioritas;

      const matchKategori =
        selectedKategori === 'ALL' || c.kategori === selectedKategori;

      const matchStatus =
        selectedStatus === 'ALL' || c.status === selectedStatus;

      return matchSearch && matchRt && matchPrioritas && matchKategori && matchStatus;
    });
  }, [cadanganList, searchQuery, selectedRt, selectedPrioritas, selectedKategori, selectedStatus]);

  // Export handlers
  const handleExportCSV = () => {
    const headers = [
      'NIK',
      'Nama Warga',
      'No KK',
      'RT',
      'Alamat Lengkap',
      'Kategori',
      'Prioritas',
      'Target Bansos',
      'Status',
      'Alasan Kelayakan',
      'Tanggal Daftar',
      'Petugas Pencatat',
    ];

    const rows = filteredList.map((c) => [
      `"${c.nik}"`,
      `"${c.nama}"`,
      `"${c.noKk || '-'}"`,
      `"${c.rt}"`,
      `"${c.alamat || '-'}"`,
      `"${c.kategori}"`,
      `"${c.prioritas}"`,
      `"${c.targetJenisBansos || '-'}"`,
      `"${c.status || 'Menunggu Kuota'}"`,
      `"${(c.alasanKelayakan || '-').replace(/"/g, '""')}"`,
      `"${c.tanggalDaftar || '-'}"`,
      `"${c.petugasPencatat || '-'}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Cadangan_Bansos_${profile.namaRw}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintRekap = () => {
    window.print();
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedRt('ALL');
    setSelectedPrioritas('ALL');
    setSelectedKategori('ALL');
    setSelectedStatus('ALL');
  };

  return (
    <div className="space-y-4">
      {/* Top Banner Information */}
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 p-4 rounded-2xl border border-amber-300/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center font-bold shrink-0 mt-0.5">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
              Daftar Cadangan Warga Berhak Bansos
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                Data Induk RW 018
              </span>
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Antrean warga terverifikasi yang memenuhi kriteria kelayakan dan siap disalurkan ketika kuota tambahan tersedia.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-2xs transition-colors cursor-pointer"
            title="Ekspor CSV Data Cadangan"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Ekspor CSV</span>
          </button>
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-xs font-black rounded-xl shadow-md shadow-amber-600/20 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>+ Input Cadangan</span>
          </button>
        </div>
      </div>

      {/* 4-Column Metric Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Cadangan</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-base sm:text-xl font-black text-slate-900">{metrics.total}</span>
              <span className="text-[10px] text-slate-500 font-medium">Warga</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white border border-rose-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Prioritas 1 (Mendesak)</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-base sm:text-xl font-black text-rose-700">{metrics.prioritas1}</span>
              <span className="text-[10px] text-rose-500 font-medium">Warga</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white border border-purple-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Lansia & Disabilitas</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-base sm:text-xl font-black text-purple-800">{metrics.lansiaDisabilitas}</span>
              <span className="text-[10px] text-purple-600 font-medium">Warga</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
            <HeartHandshake className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white border border-emerald-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Menunggu Kuota</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-base sm:text-xl font-black text-emerald-800">{metrics.menunggu}</span>
              <span className="text-[10px] text-emerald-600 font-medium">Antrean</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <Clock className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari Nama, NIK, Alamat, atau Alasan Kelayakan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* RT Filter Buttons */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
              RT:
            </span>
            <button
              onClick={() => setSelectedRt('ALL')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors whitespace-nowrap ${
                selectedRt === 'ALL'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua RT
            </button>
            {profile.daftarRt.map((rt) => (
              <button
                key={rt}
                onClick={() => setSelectedRt(rt)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors whitespace-nowrap ${
                  selectedRt === rt
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                RT {rt}
              </button>
            ))}
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] font-bold text-slate-500 uppercase">Filter:</span>
          </div>

          {/* Prioritas Filter */}
          <select
            value={selectedPrioritas}
            onChange={(e) => setSelectedPrioritas(e.target.value)}
            className="p-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
          >
            <option value="ALL">Semua Prioritas</option>
            <option value="Prioritas 1 (Mendesak / Sangat Layak)">Prioritas 1 (Mendesak)</option>
            <option value="Prioritas 2 (Layak)">Prioritas 2 (Layak)</option>
            <option value="Cadangan Reguler">Cadangan Reguler</option>
          </select>

          {/* Kategori Filter */}
          <select
            value={selectedKategori}
            onChange={(e) => setSelectedKategori(e.target.value)}
            className="p-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
          >
            <option value="ALL">Semua Kategori</option>
            <option value="Lansia">Lansia</option>
            <option value="Disabilitas">Disabilitas</option>
            <option value="Duda / Janda">Duda / Janda</option>
            <option value="Prasejahtera">Prasejahtera</option>
            <option value="Yatim / Piatu">Yatim / Piatu</option>
            <option value="Umum">Umum</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="p-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
          >
            <option value="ALL">Semua Status</option>
            <option value="Menunggu Kuota">Menunggu Kuota</option>
            <option value="Dalam Proses Usulan">Dalam Proses Usulan</option>
            <option value="Telah Dipromosikan">Telah Dipromosikan</option>
          </select>

          {(selectedRt !== 'ALL' ||
            selectedPrioritas !== 'ALL' ||
            selectedKategori !== 'ALL' ||
            selectedStatus !== 'ALL' ||
            searchQuery) && (
            <button
              onClick={handleResetFilters}
              className="p-1.5 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-bold text-xs flex items-center gap-1 transition-colors ml-auto cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filter</span>
            </button>
          )}
        </div>
      </div>

      {/* List / Cards of Cadangan Warga */}
      {filteredList.length === 0 ? (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-800">
            {cadanganList.length === 0
              ? 'Belum Ada Data Cadangan Penerima Bansos'
              : 'Tidak Ada Data Cadangan yang Cocok'}
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {cadanganList.length === 0
              ? 'Silakan tambahkan warga terdaftar dari Data Induk RW 018 yang berhak mendapatkan bantuan sosial saat kuota tersedia.'
              : 'Coba ubah kata kunci pencarian atau reset filter di atas.'}
          </p>
          {cadanganList.length === 0 && (
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black shadow-md shadow-amber-600/20 cursor-pointer transition-all active:scale-95"
            >
              + Input Cadangan Bansos Pertama
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredList.map((item) => {
            const isP1 = item.prioritas?.includes('Prioritas 1');
            const isP2 = item.prioritas?.includes('Prioritas 2');

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl p-4 border transition-all duration-200 hover:shadow-md space-y-3 flex flex-col justify-between ${
                  isP1
                    ? 'border-rose-200/90 ring-1 ring-rose-100 bg-gradient-to-b from-rose-50/20 to-white'
                    : isP2
                    ? 'border-amber-200/80 bg-gradient-to-b from-amber-50/10 to-white'
                    : 'border-slate-200/90'
                }`}
              >
                {/* Header Card */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-2xs ${
                          isP1
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : isP2
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {item.nama.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-black text-slate-900 truncate flex items-center gap-1.5">
                          <span>{item.nama}</span>
                          <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 text-[10px] font-black rounded border border-amber-200 shrink-0">
                            RT {item.rt}
                          </span>
                        </h4>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                          NIK: {item.nik} {item.noKk ? `• KK: ${item.noKk}` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Prioritas Badge */}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 border ${
                        isP1
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : isP2
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      {item.prioritas || 'Cadangan'}
                    </span>
                  </div>

                  {/* Alamat & Badges */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1.5 text-[11px]">
                    <div className="flex items-start gap-1.5 text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="leading-tight font-medium">
                        {item.alamat || `RT ${item.rt} RW 018`}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-200/60">
                      <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-bold text-[10px]">
                        {item.kategori}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">
                        Target: {item.targetJenisBansos || 'Beras CBP 10kg'}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        {item.status || 'Menunggu Kuota'}
                      </span>
                    </div>
                  </div>

                  {/* Alasan Kelayakan */}
                  {item.alasanKelayakan && (
                    <p className="text-[11px] text-slate-600 italic bg-amber-50/50 p-2 rounded-lg border border-amber-100/60">
                      "{item.alasanKelayakan}"
                    </p>
                  )}
                </div>

                {/* Footer & Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="text-[10px] text-slate-400">
                    Dicatat: {formatTanggalIndo(item.tanggalDaftar)}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onPromoteToBansos(item)}
                      className="px-2.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg text-xs font-black shadow-xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                      title="Salurkan Bansos Sekarang (Jadikan Penerima Resmi)"
                    >
                      <Gift className="w-3.5 h-3.5" />
                      <span>Salurkan</span>
                    </button>

                    <button
                      onClick={() => onEditCadangan(item)}
                      className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg text-xs transition-colors cursor-pointer"
                      title="Edit Data Cadangan"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setDeleteConfirmId(item.id)}
                      className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg text-xs transition-colors cursor-pointer"
                      title="Hapus Data Cadangan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Modal Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-3 text-center border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-2xs">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-black text-slate-900">Hapus Data Cadangan Bansos?</h4>
            <p className="text-xs text-slate-500">
              Data warga cadangan ini akan dihapus dari antrean usulan bansos RW 018.
            </p>
            <div className="flex justify-center gap-2.5 pt-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onDeleteCadangan(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-sm cursor-pointer transition-all active:scale-95"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
