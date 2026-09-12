import React, { useState, useMemo } from 'react';
import {
  X,
  Printer,
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  Users,
  Briefcase,
  Baby,
  HeartHandshake,
  FileText,
  Calendar,
  Building,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  MapPin,
  Phone,
  ArrowLeft
} from 'lucide-react';
import { Warga, KartuKeluarga, RWProfile } from '../types';
import { hitungUsia, formatTanggalIndo } from '../utils/formatters';
import { LOGO_RW_018, handleLogoError } from '../constants/logo';
import { exportWargaKategoriKhusus } from '../utils/exportUtils';

export type SpecialCategoryTab =
  | 'ALL_SPECIAL'
  | 'PRODUKTIF'
  | 'YATIM_PIATU'
  | 'LANSIA'
  | 'DISABILITAS'
  | 'DUDA_JANDA'
  | 'ALL_WARGA';

interface WargaSpecialCategoryReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  wargaList: Warga[];
  kkList: KartuKeluarga[];
  profile: RWProfile;
  initialCategory?: SpecialCategoryTab;
  restrictedRt?: string | null;
}

export const WargaSpecialCategoryReportModal: React.FC<WargaSpecialCategoryReportModalProps> = ({
  isOpen,
  onClose,
  wargaList,
  kkList,
  profile,
  initialCategory = 'ALL_SPECIAL',
  restrictedRt = null,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<SpecialCategoryTab>(initialCategory);
  const [filterRt, setFilterRt] = useState<string>(restrictedRt || 'ALL');
  const [filterGender, setFilterGender] = useState<'ALL' | 'L' | 'P'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 1. Helper Checkers
  const isUsiaProduktif = (w: Warga): boolean => {
    const age = hitungUsia(w.tanggalLahir);
    return age >= 16 && age <= 59;
  };

  const isLansia = (w: Warga): boolean => {
    return !!w.isLansia || hitungUsia(w.tanggalLahir) >= 60;
  };

  const isDisabilitas = (w: Warga): boolean => {
    return !!w.isDisabilitas;
  };

  const isDudaJanda = (w: Warga): boolean => {
    return (
      !!w.isDudaJanda ||
      w.statusKawin === 'Cerai Mati' ||
      w.statusKawin === 'Cerai Hidup'
    );
  };

  const isAnakYatimPiatu = (w: Warga): boolean => {
    const age = hitungUsia(w.tanggalLahir);
    if (age < 0 || age > 15) return false;

    // 1. Cek dari wargaList: anggota keluarga berstatus Kepala Keluarga di KK yang sama
    const kepala = wargaList.find(
      (item) =>
        item.noKk === w.noKk &&
        (item.statusKeluarga === 'Kepala Keluarga' ||
          item.statusKeluarga?.toLowerCase().includes('kepala'))
    );
    if (kepala) {
      if (
        kepala.isDudaJanda ||
        kepala.statusKawin === 'Cerai Mati' ||
        kepala.statusKawin === 'Cerai Hidup'
      ) {
        return true;
      }
    }

    // 2. Cek apakah ada orang tua / pengasuh di 1 KK yang berstatus Duda / Janda
    const hasDudaJandaParent = wargaList.some(
      (item) =>
        item.noKk === w.noKk &&
        item.id !== w.id &&
        (item.statusKeluarga === 'Kepala Keluarga' ||
          item.statusKeluarga === 'Istri' ||
          item.statusKeluarga === 'Suami' ||
          item.statusKeluarga === 'Orang Tua' ||
          item.statusKeluarga === 'Mertua') &&
        (item.isDudaJanda ||
          item.statusKawin === 'Cerai Mati' ||
          item.statusKawin === 'Cerai Hidup')
    );
    if (hasDudaJandaParent) return true;

    // 3. Cek dari kkList
    const matchedKk = kkList.find((k) => k.noKk === w.noKk);
    if (matchedKk && matchedKk.nikKepala) {
      const kepalaWarga = wargaList.find((item) => item.nik === matchedKk.nikKepala);
      if (
        kepalaWarga &&
        (kepalaWarga.isDudaJanda ||
          kepalaWarga.statusKawin === 'Cerai Mati' ||
          kepalaWarga.statusKawin === 'Cerai Hidup')
      ) {
        return true;
      }
    }

    return false;
  };

  // Check if citizen qualifies for any special category
  const isAnySpecialCategory = (w: Warga): boolean => {
    return (
      isUsiaProduktif(w) ||
      isAnakYatimPiatu(w) ||
      isLansia(w) ||
      isDisabilitas(w) ||
      isDudaJanda(w)
    );
  };

  // Get labels and tags for a citizen
  const getWargaSpecialTags = (w: Warga): string[] => {
    const tags: string[] = [];
    if (isUsiaProduktif(w)) tags.push('Usia Produktif (16-59 th)');
    if (isAnakYatimPiatu(w)) tags.push('Anak Yatim/Piatu (0-15 th)');
    if (isLansia(w)) tags.push('Lansia (>60 th)');
    if (isDisabilitas(w)) tags.push('Disabilitas');
    if (isDudaJanda(w)) tags.push(w.jenisKelamin === 'L' ? 'Duda' : 'Janda');
    return tags;
  };

  // Scope base by restrictedRt if applicable
  const baseWargaList = useMemo(() => {
    if (restrictedRt) {
      return wargaList.filter(
        (w) => w.rt === restrictedRt || w.rt === restrictedRt.replace(/^0+/, '')
      );
    }
    return wargaList;
  }, [wargaList, restrictedRt]);

  // Comprehensive Counts and Stats across the entire base
  const stats = useMemo(() => {
    const totalWarga = baseWargaList.length;
    const totalProduktif = baseWargaList.filter(isUsiaProduktif).length;
    const totalYatim = baseWargaList.filter(isAnakYatimPiatu).length;
    const totalLansiaCount = baseWargaList.filter(isLansia).length;
    const totalDisabilitasCount = baseWargaList.filter(isDisabilitas).length;
    const totalDudaJandaCount = baseWargaList.filter(isDudaJanda).length;
    const totalAnySpecial = baseWargaList.filter(isAnySpecialCategory).length;

    return {
      totalWarga,
      totalProduktif,
      totalYatim,
      totalLansia: totalLansiaCount,
      totalDisabilitas: totalDisabilitasCount,
      totalDudaJanda: totalDudaJandaCount,
      totalAnySpecial,
      persenProduktif: totalWarga > 0 ? Math.round((totalProduktif / totalWarga) * 100) : 0,
      persenLansia: totalWarga > 0 ? Math.round((totalLansiaCount / totalWarga) * 100) : 0,
    };
  }, [baseWargaList, wargaList, kkList]);

  // Rekapitulasi per RT Matrix
  const rekapitulasiRt = useMemo(() => {
    const dRt = profile.daftarRt || ['001', '002', '003', '004', '005', '006', '007', '008'];
    return dRt.map((rt) => {
      const wargaInRt = baseWargaList.filter(
        (w) => w.rt === rt || w.rt === rt.replace(/^0+/, '')
      );
      return {
        rt,
        total: wargaInRt.length,
        produktif: wargaInRt.filter(isUsiaProduktif).length,
        yatim: wargaInRt.filter(isAnakYatimPiatu).length,
        lansia: wargaInRt.filter(isLansia).length,
        disabilitas: wargaInRt.filter(isDisabilitas).length,
        dudaJanda: wargaInRt.filter(isDudaJanda).length,
      };
    });
  }, [baseWargaList, profile.daftarRt, wargaList, kkList]);

  // Filtered detailed citizen list based on active category, RT, Gender, and Search Query
  const filteredData = useMemo(() => {
    return baseWargaList
      .filter((w) => {
        // 1. RT Filter
        if (filterRt !== 'ALL') {
          const matchRt = w.rt === filterRt || w.rt === filterRt.replace(/^0+/, '');
          if (!matchRt) return false;
        }

        // 2. Gender Filter
        if (filterGender !== 'ALL' && w.jenisKelamin !== filterGender) {
          return false;
        }

        // 3. Category Filter
        switch (selectedCategory) {
          case 'PRODUKTIF':
            if (!isUsiaProduktif(w)) return false;
            break;
          case 'YATIM_PIATU':
            if (!isAnakYatimPiatu(w)) return false;
            break;
          case 'LANSIA':
            if (!isLansia(w)) return false;
            break;
          case 'DISABILITAS':
            if (!isDisabilitas(w)) return false;
            break;
          case 'DUDA_JANDA':
            if (!isDudaJanda(w)) return false;
            break;
          case 'ALL_SPECIAL':
            if (!isAnySpecialCategory(w)) return false;
            break;
          case 'ALL_WARGA':
          default:
            break;
        }

        // 4. Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchQ =
            w.nama.toLowerCase().includes(q) ||
            w.nik.includes(q) ||
            w.noKk.includes(q) ||
            w.alamat.toLowerCase().includes(q) ||
            w.pekerjaan.toLowerCase().includes(q) ||
            w.rt.includes(q);
          if (!matchQ) return false;
        }

        return true;
      })
      .map((w) => ({
        ...w,
        kategoriLabel: getWargaSpecialTags(w).join(', ') || 'Umum',
        catatanKhusus: [
          isAnakYatimPiatu(w) ? 'Yatim/Piatu' : null,
          isUsiaProduktif(w) ? 'Usia Produktif' : null,
          isLansia(w) ? 'Lansia' : null,
          isDisabilitas(w) ? 'Disabilitas' : null,
          isDudaJanda(w) ? (w.jenisKelamin === 'L' ? 'Duda' : 'Janda') : null,
        ]
          .filter(Boolean)
          .join(', '),
      }));
  }, [
    baseWargaList,
    selectedCategory,
    filterRt,
    filterGender,
    searchQuery,
    wargaList,
    kkList,
  ]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const getCategoryTitle = (tab: SpecialCategoryTab): string => {
    switch (tab) {
      case 'PRODUKTIF':
        return 'Warga Usia Produktif (16 - 59 Tahun)';
      case 'YATIM_PIATU':
        return 'Anak Yatim / Piatu (0 - 15 Tahun)';
      case 'LANSIA':
        return 'Warga Lanjut Usia / Lansia (> 60 Tahun)';
      case 'DISABILITAS':
        return 'Warga Penyandang Disabilitas';
      case 'DUDA_JANDA':
        return 'Warga Berstatus Duda / Janda';
      case 'ALL_SPECIAL':
        return 'Seluruh Warga Kategori Khusus Terpadu';
      case 'ALL_WARGA':
      default:
        return 'Seluruh Data Induk Kependudukan Warga';
    }
  };

  const handleExportExcel = () => {
    const scopeLabel = filterRt === 'ALL' ? 'Semua_RT' : `RT_${filterRt}`;
    exportWargaKategoriKhusus(
      filteredData,
      'xlsx',
      selectedCategory,
      scopeLabel,
      profile
    );
  };

  const handleExportCsv = () => {
    const scopeLabel = filterRt === 'ALL' ? 'Semua_RT' : `RT_${filterRt}`;
    exportWargaKategoriKhusus(
      filteredData,
      'csv',
      selectedCategory,
      scopeLabel,
      profile
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-3xl w-full max-w-6xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* =========================================================================
            1. MODAL HEADER & ACTION BUTTONS (HIDDEN ON PRINT)
            ========================================================================= */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border border-white/20 shadow-2xs shrink-0 cursor-pointer active:scale-95"
              title="Kembali ke menu sebelumnya"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-amber-300" />
              <span>Kembali</span>
            </button>
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 flex items-center justify-center font-black shrink-0 hidden sm:flex">
              <FileText className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Laporan Lengkap Data Warga & Kategori Khusus
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  {profile.namaRw}
                </span>
                {restrictedRt && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    Khusus RT {restrictedRt}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300">
                Rekapitulasi statistik dan detail data kependudukan per kategori khusus: Usia Produktif, Anak Yatim/Piatu, Lansia, Disabilitas, & Duda/Janda.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer border border-emerald-400/30"
              title="Cetak Dokumen Resmi PDF"
            >
              <Printer className="w-4 h-4 text-emerald-100" />
              <span>Cetak Laporan PDF</span>
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all cursor-pointer"
              title="Ekspor ke Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
              <span className="hidden sm:inline">Excel</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* =========================================================================
            2. SUB-MENU KATEGORI KHUSUS TABS (HIDDEN ON PRINT)
            ========================================================================= */}
        <div className="bg-slate-100/90 border-b border-slate-200 px-3 sm:px-5 py-2.5 shrink-0 print:hidden overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 min-w-max">
            {/* Tab: Semua Kategori Khusus */}
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL_SPECIAL')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                selectedCategory === 'ALL_SPECIAL'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80'
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Semua Kategori Khusus</span>
              <span
                className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  selectedCategory === 'ALL_SPECIAL' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-900'
                }`}
              >
                {stats.totalAnySpecial}
              </span>
            </button>

            {/* Tab: Usia Produktif */}
            <button
              type="button"
              onClick={() => setSelectedCategory('PRODUKTIF')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                selectedCategory === 'PRODUKTIF'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-blue-500" />
              <span>Usia Produktif (16-59 th)</span>
              <span
                className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  selectedCategory === 'PRODUKTIF' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-900'
                }`}
              >
                {stats.totalProduktif}
              </span>
            </button>

            {/* Tab: Anak Yatim/Piatu */}
            <button
              type="button"
              onClick={() => setSelectedCategory('YATIM_PIATU')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                selectedCategory === 'YATIM_PIATU'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80'
              }`}
            >
              <Baby className="w-3.5 h-3.5 text-teal-600" />
              <span>Yatim / Piatu (0-15 th)</span>
              <span
                className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  selectedCategory === 'YATIM_PIATU' ? 'bg-white/20 text-white' : 'bg-teal-100 text-teal-900'
                }`}
              >
                {stats.totalYatim}
              </span>
            </button>

            {/* Tab: Lansia */}
            <button
              type="button"
              onClick={() => setSelectedCategory('LANSIA')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                selectedCategory === 'LANSIA'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80'
              }`}
            >
              <span>🧓 Lansia (&gt;60 th)</span>
              <span
                className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  selectedCategory === 'LANSIA' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-900'
                }`}
              >
                {stats.totalLansia}
              </span>
            </button>

            {/* Tab: Disabilitas */}
            <button
              type="button"
              onClick={() => setSelectedCategory('DISABILITAS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                selectedCategory === 'DISABILITAS'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80'
              }`}
            >
              <span>♿ Disabilitas</span>
              <span
                className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  selectedCategory === 'DISABILITAS' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-900'
                }`}
              >
                {stats.totalDisabilitas}
              </span>
            </button>

            {/* Tab: Duda/Janda */}
            <button
              type="button"
              onClick={() => setSelectedCategory('DUDA_JANDA')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                selectedCategory === 'DUDA_JANDA'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80'
              }`}
            >
              <span>🥀 Duda / Janda</span>
              <span
                className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  selectedCategory === 'DUDA_JANDA' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-900'
                }`}
              >
                {stats.totalDudaJanda}
              </span>
            </button>

            {/* Tab: Seluruh Data Warga */}
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL_WARGA')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                selectedCategory === 'ALL_WARGA'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Semua Warga</span>
              <span
                className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  selectedCategory === 'ALL_WARGA' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                }`}
              >
                {stats.totalWarga}
              </span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            3. FILTER CONTROLS TOOLBAR (HIDDEN ON PRINT)
            ========================================================================= */}
        <div className="p-3 sm:p-4 bg-slate-50/80 border-b border-slate-200 shrink-0 space-y-2.5 print:hidden">
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-12 gap-2">
            {/* Search Input */}
            <div className="relative sm:col-span-2 lg:col-span-5">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama warga, NIK, No KK, alamat, pekerjaan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter RT */}
            <div className="sm:col-span-1 lg:col-span-4 flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 shrink-0">
                <Filter className="w-3.5 h-3.5 text-indigo-600" /> RT:
              </span>
              <select
                value={filterRt}
                onChange={(e) => setFilterRt(e.target.value)}
                disabled={!!restrictedRt}
                className="w-full text-xs font-bold py-2 px-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 shadow-2xs focus:ring-2 focus:ring-indigo-500 cursor-pointer disabled:bg-slate-100"
              >
                <option value="ALL">Semua RT (4 Rukun Tetangga)</option>
                {profile.daftarRt.map((rt) => (
                  <option key={rt} value={rt}>
                    RT {rt} ({baseWargaList.filter((w) => w.rt === rt || w.rt === rt.replace(/^0+/, '')).length} Jiwa)
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Gender */}
            <div className="sm:col-span-3 lg:col-span-3 flex items-center justify-between sm:justify-end gap-2">
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setFilterGender('ALL')}
                  className={`flex-1 sm:flex-initial px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                    filterGender === 'ALL' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => setFilterGender('L')}
                  className={`flex-1 sm:flex-initial px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                    filterGender === 'L' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  L (Laki)
                </button>
                <button
                  type="button"
                  onClick={() => setFilterGender('P')}
                  className={`flex-1 sm:flex-initial px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                    filterGender === 'P' ? 'bg-rose-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  P (Perempuan)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            4. PRINTABLE REPORT DOCUMENT BODY (INTERACTIVE + PRINT READY)
            ========================================================================= */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 font-sans print:p-6 print:overflow-visible">
          
          {/* KOP SURAT RESMI RW 018 (ALWAYS SHOWN ON PRINT & IN PRATINJAU) */}
          <div className="pb-3 border-b-4 border-double border-black relative">
            <div className="absolute left-0 top-0 w-16 sm:w-20 h-16 sm:h-20 rounded-full overflow-hidden flex items-center justify-center">
              <img
                src={profile.logoUrl || LOGO_RW_018}
                alt="Logo RW 018"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
                onError={handleLogoError}
              />
            </div>

            <div className="text-center px-16 sm:px-20">
              <h3 className="text-xs sm:text-sm font-bold tracking-wider uppercase font-sans text-slate-900 print:text-black">
                PEMERINTAH {profile.kotaKab.toUpperCase()}
              </h3>
              <h4 className="text-[11px] sm:text-xs font-bold tracking-wider uppercase font-sans text-slate-800 print:text-black">
                KECAMATAN {profile.kecamatan.toUpperCase()} • KELURAHAN {profile.kelurahan.toUpperCase()}
              </h4>
              <h1 className="text-base sm:text-lg font-black tracking-widest uppercase font-sans mt-0.5 text-emerald-950 print:text-black">
                PENGURUS {profile.namaRw.toUpperCase()}
              </h1>
              <p className="text-[10px] sm:text-[11px] text-slate-600 font-sans mt-0.5 print:text-black">
                Sekretariat: {profile.alamatKantor} • Kode Pos: {profile.kodePos} • Telp: {profile.noHpKetuaRw}
              </p>
            </div>
          </div>

          {/* DOCUMENT TITLE & METADATA */}
          <div className="text-center space-y-1">
            <h2 className="text-sm sm:text-base font-black uppercase tracking-wide text-slate-900 print:text-black">
              LAPORAN REKAPITULASI & DATA DETAIL WARGA KATEGORI KHUSUS
            </h2>
            <p className="text-xs font-bold text-slate-700 print:text-black">
              Kategori: <span className="underline">{getCategoryTitle(selectedCategory)}</span>
            </p>
            <div className="flex items-center justify-center gap-3 text-[11px] text-slate-500 print:text-black flex-wrap">
              <span>Wilayah: <strong>{filterRt === 'ALL' ? `Seluruh ${profile.namaRw}` : `RT ${filterRt} / ${profile.namaRw}`}</strong></span>
              <span>•</span>
              <span>Jumlah Terdata: <strong>{filteredData.length} Jiwa</strong></span>
              <span>•</span>
              <span>Tanggal Cetak: <strong>{formatTanggalIndo(new Date().toISOString().slice(0, 10))}</strong></span>
            </div>
          </div>

          {/* =========================================================================
              5. SUMMARY KPI STATS CARDS (INTERACTIVE & PRINTABLE)
              ========================================================================= */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 print:grid-cols-6 print:gap-2">
            <div className="p-3 bg-indigo-50/80 rounded-2xl border border-indigo-200 print:border-slate-300 print:bg-white text-center space-y-0.5">
              <span className="text-[10px] font-black uppercase text-indigo-900 tracking-wider block">Total Warga</span>
              <div className="text-xl font-black text-indigo-950 font-mono">{stats.totalWarga}</div>
              <span className="text-[9px] text-indigo-700 font-bold block">100% Kependudukan</span>
            </div>

            <div className="p-3 bg-blue-50/80 rounded-2xl border border-blue-200 print:border-slate-300 print:bg-white text-center space-y-0.5">
              <span className="text-[10px] font-black uppercase text-blue-900 tracking-wider block">Usia Produktif</span>
              <div className="text-xl font-black text-blue-950 font-mono">{stats.totalProduktif}</div>
              <span className="text-[9px] text-blue-700 font-bold block">16 - 59 Th ({stats.persenProduktif}%)</span>
            </div>

            <div className="p-3 bg-teal-50/80 rounded-2xl border border-teal-200 print:border-slate-300 print:bg-white text-center space-y-0.5">
              <span className="text-[10px] font-black uppercase text-teal-900 tracking-wider block">Yatim / Piatu</span>
              <div className="text-xl font-black text-teal-950 font-mono">{stats.totalYatim}</div>
              <span className="text-[9px] text-teal-700 font-bold block">0 - 15 Th (Duda/Janda)</span>
            </div>

            <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200 print:border-slate-300 print:bg-white text-center space-y-0.5">
              <span className="text-[10px] font-black uppercase text-amber-900 tracking-wider block">Lansia</span>
              <div className="text-xl font-black text-amber-950 font-mono">{stats.totalLansia}</div>
              <span className="text-[9px] text-amber-700 font-bold block">&gt; 60 Tahun ({stats.persenLansia}%)</span>
            </div>

            <div className="p-3 bg-purple-50/80 rounded-2xl border border-purple-200 print:border-slate-300 print:bg-white text-center space-y-0.5">
              <span className="text-[10px] font-black uppercase text-purple-900 tracking-wider block">Disabilitas</span>
              <div className="text-xl font-black text-purple-950 font-mono">{stats.totalDisabilitas}</div>
              <span className="text-[9px] text-purple-700 font-bold block">Kebutuhan Khusus</span>
            </div>

            <div className="p-3 bg-rose-50/80 rounded-2xl border border-rose-200 print:border-slate-300 print:bg-white text-center space-y-0.5">
              <span className="text-[10px] font-black uppercase text-rose-900 tracking-wider block">Duda / Janda</span>
              <div className="text-xl font-black text-rose-950 font-mono">{stats.totalDudaJanda}</div>
              <span className="text-[9px] text-rose-700 font-bold block">Cerai Mati / Hidup</span>
            </div>
          </div>

          {/* =========================================================================
              6. REKAPITULASI MATRIKS PER RT
              ========================================================================= */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-indigo-600" />
                <span>Rekapitulasi Kategori Khusus Berdasarkan Rukun Tetangga (RT)</span>
              </h4>
              <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">
                Data terintegrasi 4 RT {profile.namaRw}
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200 text-[11px]">
                    <th className="py-2.5 px-3">Wilayah RT</th>
                    <th className="py-2.5 px-3 text-center">Total Warga</th>
                    <th className="py-2.5 px-3 text-center text-blue-900">Usia Produktif (16-59)</th>
                    <th className="py-2.5 px-3 text-center text-teal-900">Yatim / Piatu (0-15)</th>
                    <th className="py-2.5 px-3 text-center text-amber-900">Lansia (&gt;60)</th>
                    <th className="py-2.5 px-3 text-center text-purple-900">Disabilitas</th>
                    <th className="py-2.5 px-3 text-center text-rose-900">Duda / Janda</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {rekapitulasiRt.map((row) => (
                    <tr
                      key={row.rt}
                      className={`hover:bg-slate-50 transition-colors ${
                        filterRt === row.rt ? 'bg-indigo-50/60 font-bold' : ''
                      }`}
                    >
                      <td className="py-2 px-3 font-black text-slate-900">
                        RT {row.rt}
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-slate-800">
                        {row.total}
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-blue-700">
                        {row.produktif}
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-teal-700">
                        {row.yatim}
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-amber-700">
                        {row.lansia}
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-purple-700">
                        {row.disabilitas}
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-rose-700">
                        {row.dudaJanda}
                      </td>
                    </tr>
                  ))}
                  {/* Total Baris */}
                  <tr className="bg-slate-100/90 font-black text-slate-900 border-t-2 border-slate-300">
                    <td className="py-2.5 px-3 uppercase tracking-wider">Total {profile.namaRw}</td>
                    <td className="py-2.5 px-3 text-center font-mono">{stats.totalWarga}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-blue-800">{stats.totalProduktif}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-teal-800">{stats.totalYatim}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-amber-800">{stats.totalLansia}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-purple-800">{stats.totalDisabilitas}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-rose-800">{stats.totalDudaJanda}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* =========================================================================
              7. DETAIL DATA TABEL WARGA
              ========================================================================= */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span>Rincian Data Detail Warga ({filteredData.length} Jiwa Terpilih)</span>
              </h4>
              <span className="text-[10px] text-slate-500 font-medium">
                Format resmi sensus kependudukan
              </span>
            </div>

            {filteredData.length > 0 ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200 text-[10px] sm:text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 px-2 text-center w-8">No</th>
                      <th className="py-2.5 px-3">Nama Lengkap & NIK</th>
                      <th className="py-2.5 px-2.5 text-center">L/P</th>
                      <th className="py-2.5 px-3">Usia & Tgl Lahir</th>
                      <th className="py-2.5 px-3">Kategori Khusus</th>
                      <th className="py-2.5 px-3">RT & Alamat</th>
                      <th className="py-2.5 px-3">Status Keluarga & Kawin</th>
                      <th className="py-2.5 px-3">Pekerjaan & Kontak</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {filteredData.map((w, idx) => {
                      const tags = getWargaSpecialTags(w);
                      const age = hitungUsia(w.tanggalLahir);

                      return (
                        <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2 px-2 text-center font-bold text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-3">
                            <div className="font-bold text-slate-900">{w.nama}</div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              NIK: {w.nik}
                            </div>
                            <div className="text-[9px] text-slate-400 font-mono">
                              KK: {w.noKk}
                            </div>
                          </td>
                          <td className="py-2 px-2.5 text-center font-bold">
                            <span
                              className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                                w.jenisKelamin === 'L'
                                  ? 'bg-blue-100 text-blue-800 font-black'
                                  : 'bg-rose-100 text-rose-800 font-black'
                              }`}
                            >
                              {w.jenisKelamin}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <div className="font-bold text-slate-800">{age} Tahun</div>
                            <div className="text-[10px] text-slate-500">
                              {w.tempatLahir ? `${w.tempatLahir}, ` : ''}{w.tanggalLahir}
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex flex-wrap gap-1 max-w-[220px]">
                              {tags.length > 0 ? (
                                tags.map((tag, tIdx) => (
                                  <span
                                    key={tIdx}
                                    className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold ${
                                      tag.includes('Yatim')
                                        ? 'bg-teal-100 text-teal-900 border border-teal-300'
                                        : tag.includes('Produktif')
                                        ? 'bg-blue-100 text-blue-900 border border-blue-200'
                                        : tag.includes('Lansia')
                                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                        : tag.includes('Disabilitas')
                                        ? 'bg-purple-100 text-purple-900 border border-purple-300'
                                        : 'bg-rose-100 text-rose-900 border border-rose-300'
                                    }`}
                                  >
                                    {tag}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">Umum</span>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <div className="font-bold text-slate-900">RT {w.rt}</div>
                            <div className="text-[10px] text-slate-600 line-clamp-1 max-w-[160px]" title={w.alamat}>
                              {w.alamat}
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <div className="font-semibold text-slate-800">{w.statusKeluarga}</div>
                            <div className="text-[10px] text-slate-500">{w.statusKawin}</div>
                          </td>
                          <td className="py-2 px-3">
                            <div className="font-semibold text-slate-800">{w.pekerjaan || '-'}</div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {w.noHp ? `WA: ${w.noHp}` : '-'}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center space-y-2">
                <Users className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700">Tidak ada data warga yang cocok dengan kriteria filter</p>
                <p className="text-[11px] text-slate-500">Coba ubah kata kunci pencarian atau sesuaikan pilihan filter kategori dan RT.</p>
              </div>
            )}
          </div>

          {/* =========================================================================
              8. TANDA TANGAN RESMI PENGESAHAN DOKUMEN (PRINT SIGNATURES)
              ========================================================================= */}
          <div className="pt-6 mt-6 border-t border-slate-200 grid grid-cols-2 gap-4 text-center font-sans text-xs print:grid-cols-2">
            <div>
              <p className="text-slate-600 print:text-black">
                {filterRt !== 'ALL' ? `Ketua Rukun Tetangga (RT ${filterRt})` : 'Sekretaris RW 018'}
              </p>
              <div className="h-16 sm:h-20 flex items-end justify-center">
                <span className="font-black text-slate-900 border-b border-black pb-0.5 uppercase print:text-black">
                  {filterRt !== 'ALL' ? `( Ketua RT ${filterRt} )` : `( ${profile.namaSekretarisRw || 'Agung Prayoga'} )`}
                </span>
              </div>
            </div>

            <div>
              <p className="text-slate-600 print:text-black">
                {profile.kotaKab || 'Kota Metro'}, {formatTanggalIndo(new Date().toISOString().slice(0, 10))}
                <br />
                <strong>Ketua {profile.namaRw}</strong>
              </p>
              <div className="h-16 sm:h-20 flex items-end justify-center">
                <span className="font-black text-slate-900 border-b border-black pb-0.5 uppercase print:text-black">
                  ( {profile.namaKetuaRw || 'Eko Purwanto S.Kom'} )
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
