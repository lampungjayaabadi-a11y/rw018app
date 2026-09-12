import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  Filter,
  X,
  User,
  Home,
  UserCheck,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Tag,
  Phone,
  MessageCircle,
  FileText,
  Copy,
  Check,
  Eye,
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  ArrowUpDown,
  Users,
  Shield,
  HeartHandshake,
  Landmark,
  Layers
} from 'lucide-react';
import { Warga, KartuKeluarga, BansosItem, PbbRecord, RWProfile, AppUser } from '../types';
import { formatTanggalIndo, hitungUsia, getCleanWaNumber } from '../utils/formatters';
import { DashboardResidentDetailModal } from './DashboardResidentDetailModal';

interface DashboardResidentSearchProps {
  wargaList: Warga[];
  kkList: KartuKeluarga[];
  bansosList?: BansosItem[];
  pbbList?: PbbRecord[];
  profile: RWProfile;
  currentUser?: AppUser | null;
  onNavigateTab?: (tab: string) => void;
  onCreateSurat?: (warga: Warga) => void;
  onSelectKk?: (noKk: string) => void;
  onNavigateWargaWithSearch?: (query: string) => void;
}

export type SpecialCategoryFilter =
  | 'ALL'
  | 'lansia'
  | 'disabilitas'
  | 'duda_janda'
  | 'usia_produktif'
  | 'anak_yatim'
  | 'kepala_keluarga'
  | 'istri'
  | 'kontrak_kost'
  | 'bansos'
  | 'pbb';

export const DashboardResidentSearch: React.FC<DashboardResidentSearchProps> = ({
  wargaList,
  kkList,
  bansosList = [],
  pbbList = [],
  profile,
  currentUser,
  onNavigateTab,
  onCreateSurat,
  onSelectKk,
  onNavigateWargaWithSearch,
}) => {
  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRt, setSelectedRt] = useState<string>('ALL');
  const [specialCategory, setSpecialCategory] = useState<SpecialCategoryFilter>('ALL');
  const [filterGender, setFilterGender] = useState<string>('ALL');
  const [filterGolDarah, setFilterGolDarah] = useState<string>('ALL');
  const [filterStatusKawin, setFilterStatusKawin] = useState<string>('ALL');
  const [filterDomisili, setFilterDomisili] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'nama_asc' | 'nama_desc' | 'rt_asc' | 'usia_desc' | 'usia_asc' | 'nik'>('nama_asc');
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState<number>(8);
  const [isManualRequested, setIsManualRequested] = useState<boolean>(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  // Close Category Dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCategoryDropdownOpen(false);
      }
    };
    if (isCategoryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCategoryDropdownOpen]);

  // Quick Resident Detail Modal
  const [selectedWargaForModal, setSelectedWargaForModal] = useState<Warga | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [copiedNik, setCopiedNik] = useState<string | null>(null);

  // Helper untuk Kepala Keluarga
  const getKepalaKeluarga = (w: Warga): { nama: string; noKk: string; isSelf: boolean } => {
    const wNama = (w.nama || '').toLowerCase().trim();
    const wKk = w.noKk || '';

    if (kkList && kkList.length > 0 && wKk) {
      const matchedKk = kkList.find((k) => k.noKk === wKk);
      if (matchedKk && matchedKk.kepalaKeluarga) {
        const kkName = (matchedKk.kepalaKeluarga || '').toLowerCase().trim();
        return {
          nama: matchedKk.kepalaKeluarga,
          noKk: wKk,
          isSelf:
            (kkName && wNama && kkName === wNama) ||
            w.statusKeluarga === 'Kepala Keluarga',
        };
      }
    }

    if (w.statusKeluarga === 'Kepala Keluarga') {
      return { nama: w.nama || '-', noKk: wKk, isSelf: true };
    }

    if (wKk && wargaList && wargaList.length > 0) {
      const kepalaInWarga = wargaList.find(
        (item) =>
          item.noKk === wKk &&
          (item.statusKeluarga === 'Kepala Keluarga' ||
            (item.statusKeluarga && item.statusKeluarga.toLowerCase().includes('kepala')))
      );
      if (kepalaInWarga) {
        return { nama: kepalaInWarga.nama || '-', noKk: wKk, isSelf: false };
      }
    }

    return { nama: w.nama || '-', noKk: wKk, isSelf: true };
  };

  // Helper Usia Produktif (16-59 th)
  const isUsiaProduktif = (w: Warga): boolean => {
    const age = hitungUsia(w.tanggalLahir);
    return age >= 16 && age <= 59;
  };

  // Helper Anak Yatim / Piatu (0-15 th dengan orang tua / KK status Duda atau Janda)
  const isAnakYatim = (w: Warga): boolean => {
    const age = hitungUsia(w.tanggalLahir);
    if (age < 0 || age > 15) return false;
    if (!wargaList || wargaList.length === 0 || !w.noKk) return false;

    // 1. Cek dari wargaList: anggota keluarga berstatus Kepala Keluarga di KK yang sama
    const kepala = wargaList.find(
      (item) =>
        item.noKk === w.noKk &&
        (item.statusKeluarga === 'Kepala Keluarga' ||
          (item.statusKeluarga && item.statusKeluarga.toLowerCase().includes('kepala')))
    );
    if (kepala) {
      if (kepala.isDudaJanda || kepala.statusKawin === 'Cerai Mati' || kepala.statusKawin === 'Cerai Hidup') {
        return true;
      }
    }

    // 2. Cek apakah ada orang tua / keluarga di KK yang Duda/Janda
    const hasDudaJandaParent = wargaList.some(
      (item) =>
        item.noKk === w.noKk &&
        item.id !== w.id &&
        (item.statusKeluarga === 'Kepala Keluarga' || item.statusKeluarga === 'Istri' || item.statusKeluarga === 'Orang Tua') &&
        (item.isDudaJanda || item.statusKawin === 'Cerai Mati' || item.statusKawin === 'Cerai Hidup')
    );
    if (hasDudaJandaParent) return true;

    return false;
  };

  // Cek apakah terdaftar di Bansos
  const hasBansos = (w: Warga): boolean => {
    if (!bansosList || bansosList.length === 0) return false;
    const wNik = (w.nik || '').trim();
    const wKk = (w.noKk || '').trim();
    return bansosList.some((b) => (wNik && b.nik && b.nik === wNik) || (wKk && b.noKk && b.noKk === wKk));
  };

  // Cek apakah terdaftar di PBB
  const hasPbb = (w: Warga): boolean => {
    if (!pbbList || pbbList.length === 0) return false;
    const wNik = (w.nik || '').trim();
    const wKk = (w.noKk || '').trim();
    return pbbList.some((p) => (wKk && p.noKk && p.noKk === wKk) || (wNik && p.nik && p.nik === wNik));
  };

  // Active filters count indicator
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedRt !== 'ALL') count++;
    if (specialCategory !== 'ALL') count++;
    if (filterGender !== 'ALL') count++;
    if (filterGolDarah !== 'ALL') count++;
    if (filterStatusKawin !== 'ALL') count++;
    if (filterDomisili !== 'ALL') count++;
    if (searchQuery.trim()) count++;
    return count;
  }, [selectedRt, specialCategory, filterGender, filterGolDarah, filterStatusKawin, filterDomisili, searchQuery]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedRt('ALL');
    setSpecialCategory('ALL');
    setFilterGender('ALL');
    setFilterGolDarah('ALL');
    setFilterStatusKawin('ALL');
    setFilterDomisili('ALL');
    setSortBy('nama_asc');
    setVisibleCount(8);
    setIsManualRequested(false);
    setIsCategoryDropdownOpen(false);
  };

  // Status apakah pencarian cepat sedang aktif (diketik, dipilih filternya, atau diminta)
  const isSearchActive = useMemo(() => {
    return searchQuery.trim().length > 0 || activeFiltersCount > 0 || isManualRequested;
  }, [searchQuery, activeFiltersCount, isManualRequested]);

  // Filtered & Sorted Warga List
  const filteredWarga = useMemo(() => {
    if (!wargaList || wargaList.length === 0) return [];

    let list = wargaList.filter((w) => {
      if (!w) return false;

      // 1. RT Filter
      if (selectedRt !== 'ALL') {
        const rtClean = (selectedRt || '').replace(/^0+/, '');
        const wRtClean = (w.rt || '').replace(/^0+/, '');
        if (w.rt !== selectedRt && wRtClean !== rtClean) {
          return false;
        }
      }

      // 2. Gender Filter
      if (filterGender !== 'ALL' && w.jenisKelamin !== filterGender) {
        return false;
      }

      // 3. Golongan Darah Filter
      if (filterGolDarah !== 'ALL' && (w.golDarah || '').toUpperCase() !== filterGolDarah.toUpperCase()) {
        return false;
      }

      // 4. Status Perkawinan Filter
      if (filterStatusKawin !== 'ALL' && w.statusKawin !== filterStatusKawin) {
        return false;
      }

      // 5. Status Domisili Filter
      if (filterDomisili !== 'ALL' && w.statusDomisili !== filterDomisili) {
        return false;
      }

      // 6. Special Category Filter
      if (specialCategory !== 'ALL') {
        const age = hitungUsia(w.tanggalLahir);
        if (specialCategory === 'lansia' && !(w.isLansia || age >= 60)) return false;
        if (specialCategory === 'disabilitas' && !w.isDisabilitas) return false;
        if (specialCategory === 'duda_janda' && !(w.isDudaJanda || w.statusKawin === 'Cerai Mati' || w.statusKawin === 'Cerai Hidup')) return false;
        if (specialCategory === 'usia_produktif' && !isUsiaProduktif(w)) return false;
        if (specialCategory === 'anak_yatim' && !isAnakYatim(w)) return false;
        if (specialCategory === 'kepala_keluarga' && w.statusKeluarga !== 'Kepala Keluarga') return false;
        if (specialCategory === 'istri' && w.statusKeluarga !== 'Istri') return false;
        if (specialCategory === 'kontrak_kost' && w.statusDomisili !== 'Kontrak / Kost') return false;
        if (specialCategory === 'bansos' && !hasBansos(w)) return false;
        if (specialCategory === 'pbb' && !hasPbb(w)) return false;
      }

      // 7. Full-Text Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const kepala = getKepalaKeluarga(w);
        const age = hitungUsia(w.tanggalLahir).toString();

        const match =
          (w.nama && w.nama.toLowerCase().includes(q)) ||
          (w.nik && w.nik.includes(q)) ||
          (w.noKk && w.noKk.includes(q)) ||
          (w.alamat && w.alamat.toLowerCase().includes(q)) ||
          (w.noHp && w.noHp.includes(q)) ||
          (w.pekerjaan && w.pekerjaan.toLowerCase().includes(q)) ||
          (w.tempatLahir && w.tempatLahir.toLowerCase().includes(q)) ||
          (w.agama && w.agama.toLowerCase().includes(q)) ||
          (w.pendidikan && w.pendidikan.toLowerCase().includes(q)) ||
          (w.statusKeluarga && w.statusKeluarga.toLowerCase().includes(q)) ||
          (w.golDarah && w.golDarah.toLowerCase().includes(q)) ||
          (w.statusKawin && w.statusKawin.toLowerCase().includes(q)) ||
          (w.statusDomisili && w.statusDomisili.toLowerCase().includes(q)) ||
          (kepala.nama && kepala.nama.toLowerCase().includes(q)) ||
          (w.rt && `rt ${w.rt}`.includes(q)) ||
          (w.rt && `rt${w.rt}`.includes(q)) ||
          `usia ${age}`.includes(q) ||
          `${age} tahun`.includes(q);

        if (!match) return false;
      }

      return true;
    });

    // Sorting
    list = [...list].sort((a, b) => {
      const aNama = a.nama || '';
      const bNama = b.nama || '';
      const aRt = a.rt || '';
      const bRt = b.rt || '';
      const aNik = a.nik || '';
      const bNik = b.nik || '';

      if (sortBy === 'nama_asc') return aNama.localeCompare(bNama);
      if (sortBy === 'nama_desc') return bNama.localeCompare(aNama);
      if (sortBy === 'rt_asc') return aRt.localeCompare(bRt);
      if (sortBy === 'usia_desc') return hitungUsia(b.tanggalLahir) - hitungUsia(a.tanggalLahir);
      if (sortBy === 'usia_asc') return hitungUsia(a.tanggalLahir) - hitungUsia(b.tanggalLahir);
      if (sortBy === 'nik') return aNik.localeCompare(bNik);
      return 0;
    });

    return list;
  }, [
    wargaList,
    kkList,
    bansosList,
    pbbList,
    selectedRt,
    filterGender,
    filterGolDarah,
    filterStatusKawin,
    filterDomisili,
    specialCategory,
    searchQuery,
    sortBy,
  ]);

  // RT counts calculation
  const rtCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: wargaList.length };
    profile.daftarRt.forEach((rt) => {
      counts[rt] = wargaList.filter((w) => w.rt === rt || w.rt === rt.replace(/^0+/, '')).length;
    });
    return counts;
  }, [wargaList, profile.daftarRt]);

  // Special Category counts
  const specialCounts = useMemo(() => {
    return {
      lansia: wargaList.filter((w) => w.isLansia || hitungUsia(w.tanggalLahir) >= 60).length,
      disabilitas: wargaList.filter((w) => w.isDisabilitas).length,
      duda_janda: wargaList.filter((w) => w.isDudaJanda || w.statusKawin === 'Cerai Mati' || w.statusKawin === 'Cerai Hidup').length,
      usia_produktif: wargaList.filter(isUsiaProduktif).length,
      anak_yatim: wargaList.filter(isAnakYatim).length,
      kepala_keluarga: wargaList.filter((w) => w.statusKeluarga === 'Kepala Keluarga').length,
      istri: wargaList.filter((w) => w.statusKeluarga === 'Istri').length,
      kontrak_kost: wargaList.filter((w) => w.statusDomisili === 'Kontrak / Kost').length,
      bansos: wargaList.filter(hasBansos).length,
      pbb: wargaList.filter(hasPbb).length,
    };
  }, [wargaList, bansosList, pbbList]);

  // Daftar opsi untuk Menu Drop Down Filter Kategori
  const categoryOptions = useMemo(() => {
    return [
      {
        id: 'ALL' as SpecialCategoryFilter,
        label: 'Semua Kategori Khusus',
        sublabel: 'Tampilkan seluruh warga tanpa batasan kategori',
        emoji: '🌟',
        count: wargaList.length,
      },
      {
        id: 'lansia' as SpecialCategoryFilter,
        label: 'Lansia (≥60 tahun)',
        sublabel: 'Warga lanjut usia 60 tahun ke atas',
        emoji: '👴',
        count: specialCounts.lansia,
      },
      {
        id: 'disabilitas' as SpecialCategoryFilter,
        label: 'Penyandang Disabilitas',
        sublabel: 'Warga dengan kebutuhan khusus / disabilitas',
        emoji: '♿',
        count: specialCounts.disabilitas,
      },
      {
        id: 'duda_janda' as SpecialCategoryFilter,
        label: 'Duda / Janda',
        sublabel: 'Warga status cerai mati atau cerai hidup',
        emoji: '🤍',
        count: specialCounts.duda_janda,
      },
      {
        id: 'usia_produktif' as SpecialCategoryFilter,
        label: 'Usia Produktif (15 - 64 th)',
        sublabel: 'Warga rentang usia angkatan kerja aktif',
        emoji: '💼',
        count: specialCounts.usia_produktif,
      },
      {
        id: 'anak_yatim' as SpecialCategoryFilter,
        label: 'Anak Yatim / Piatu (<18 th)',
        sublabel: 'Anak usia di bawah 18 tahun tanpa ayah/ibu',
        emoji: '👶',
        count: specialCounts.anak_yatim,
      },
      {
        id: 'kepala_keluarga' as SpecialCategoryFilter,
        label: 'Kepala Keluarga (KK)',
        sublabel: 'Warga penanggung jawab / kepala keluarga',
        emoji: '👑',
        count: specialCounts.kepala_keluarga,
      },
      {
        id: 'istri' as SpecialCategoryFilter,
        label: 'Istri / Ibu Rumah Tangga',
        sublabel: 'Warga berstatus istri dalam kartu keluarga',
        emoji: '👩‍👧',
        count: specialCounts.istri,
      },
      {
        id: 'kontrak_kost' as SpecialCategoryFilter,
        label: 'Warga Kost / Kontrak',
        sublabel: 'Warga non-tetap atau tinggal kontrak/kost',
        emoji: '🏡',
        count: specialCounts.kontrak_kost,
      },
      {
        id: 'bansos' as SpecialCategoryFilter,
        label: 'Penerima Bansos',
        sublabel: 'Warga terdata penerima program bantuan sosial',
        emoji: '🎁',
        count: specialCounts.bansos,
      },
      {
        id: 'pbb' as SpecialCategoryFilter,
        label: 'Terdata Wajib Pajak PBB',
        sublabel: 'Warga terdata wajib pajak PBB RW 018',
        emoji: '🏛️',
        count: specialCounts.pbb,
      },
    ];
  }, [wargaList.length, specialCounts]);

  // Opsi kategori yang sedang aktif dipilih
  const activeCategoryOption = useMemo(() => {
    return categoryOptions.find((c) => c.id === specialCategory) || categoryOptions[0];
  }, [categoryOptions, specialCategory]);

  // Copy NIK
  const handleCopyNik = (nik: string) => {
    navigator.clipboard.writeText(nik);
    setCopiedNik(nik);
    setTimeout(() => setCopiedNik(null), 2000);
  };

  // Open resident modal
  const handleOpenDetailModal = (warga: Warga) => {
    setSelectedWargaForModal(warga);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/20 shrink-0">
            <Search className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Pencarian Cepat & Filter Global Data Warga
              </h3>
              {activeFiltersCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  {activeFiltersCount} Filter Aktif
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Cari Nama, NIK, No. KK, Alamat, Profesi, atau filter berdasarkan RT, Kategori Lansia, Disabilitas, & Bansos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={() => setIsAdvancedFiltersOpen(!isAdvancedFiltersOpen)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
              isAdvancedFiltersOpen || activeFiltersCount > 0
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filter Lanjutan</span>
          </button>

          {onNavigateWargaWithSearch ? (
            <button
              type="button"
              onClick={() => onNavigateWargaWithSearch(searchQuery)}
              className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors"
            >
              <span>Buka Data Induk</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Main Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        <input
          type="text"
          placeholder="Ketik Nama Lengkap, NIK (16 digit), No. KK, Alamat, No. HP, Profesi, atau Gol. Darah..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-24 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
        />

        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center justify-center transition-colors cursor-pointer"
              title="Hapus pencarian"
            >
              ✕
            </button>
          )}

          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-2 py-1 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 text-[10px] font-bold rounded-lg border border-rose-200 dark:border-rose-800 flex items-center gap-1 transition-colors cursor-pointer"
              title="Reset seluruh filter"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. Bar Filter Wilayah RT (Baris Atas) */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase shrink-0 mr-1">
          Wilayah RT:
        </span>
        <button
          type="button"
          onClick={() => setSelectedRt('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer min-h-[36px] flex items-center ${
            selectedRt === 'ALL'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          Semua RT ({rtCounts.ALL || 0})
        </button>

        {profile.daftarRt.map((rtNum) => {
          const isSelected = selectedRt === rtNum;
          const count = rtCounts[rtNum] || 0;
          return (
            <button
              key={rtNum}
              type="button"
              onClick={() => setSelectedRt(rtNum)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border min-h-[36px] flex items-center ${
                isSelected
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              RT {rtNum} ({count})
            </button>
          );
        })}
      </div>

      {/* 2. Menu Drop Down Filter Kategori (Diletakkan di Bawah Filter Wilayah - Nyaman Layar Android & Mobile) */}
      <div className="pt-0.5 pb-1">
        <div className="relative w-full" ref={categoryDropdownRef}>
          <div className="flex items-center gap-2 w-full">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase shrink-0">
              Filter Kategori:
            </span>
            <button
              id="btn-dropdown-filter-kategori"
              type="button"
              onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
              className={`flex-1 sm:flex-initial flex items-center justify-between sm:justify-start gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border shadow-2xs cursor-pointer min-h-[42px] ${
                specialCategory !== 'ALL'
                  ? 'bg-amber-400 hover:bg-amber-300 text-emerald-950 border-amber-500 font-black shadow-xs ring-2 ring-amber-400/30'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
              }`}
            >
              <span className="flex items-center gap-1.5 truncate">
                <Tag className={`w-3.5 h-3.5 shrink-0 ${specialCategory !== 'ALL' ? 'text-emerald-950' : 'text-amber-500'}`} />
                <span className="truncate">{activeCategoryOption.emoji} {activeCategoryOption.label}</span>
              </span>
              <div className="flex items-center gap-1.5 shrink-0 ml-1">
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    specialCategory !== 'ALL'
                      ? 'bg-emerald-950 text-amber-300'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {activeCategoryOption.count}
                </span>
                {isCategoryDropdownOpen ? (
                  <ChevronUp className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                )}
              </div>
            </button>

            {specialCategory !== 'ALL' && (
              <button
                type="button"
                onClick={() => setSpecialCategory('ALL')}
                className="p-2.5 rounded-xl text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer min-h-[42px] min-w-[42px] flex items-center justify-center shrink-0"
                title="Reset filter kategori ke semua"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Menu Drop Down Popup Panel */}
          {isCategoryDropdownOpen && (
            <div className="absolute left-0 right-0 sm:right-auto sm:w-96 top-full mt-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-amber-500" />
                  Menu Drop Down Filter Kategori
                </span>
                <button
                  type="button"
                  onClick={() => setIsCategoryDropdownOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-1.5 space-y-1 max-h-80 overflow-y-auto">
                {categoryOptions.map((cat) => {
                  const isSelected = specialCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSpecialCategory(cat.id);
                        setIsCategoryDropdownOpen(false);
                      }}
                      className={`w-full p-2.5 min-h-[44px] rounded-xl text-left text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-400 text-emerald-950 font-black shadow-2xs'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 active:bg-slate-200 dark:active:bg-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-base shrink-0">{cat.emoji}</span>
                        <div className="truncate">
                          <div className="leading-tight truncate">{cat.label}</div>
                          <div
                            className={`text-[10px] font-normal truncate ${
                              isSelected
                                ? 'text-emerald-900 font-medium'
                                : 'text-slate-400 dark:text-slate-500'
                            }`}
                          >
                            {cat.sublabel}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            isSelected
                              ? 'bg-emerald-950 text-amber-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {cat.count}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-950" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Expandable Advanced Multi-Criteria Filter Box */}
      {isAdvancedFiltersOpen && (
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 animate-fade-in text-xs">
          <div className="flex items-center justify-between">
            <span className="font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-emerald-600" />
              Filter Demografi & Parameter Lanjutan
            </span>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[11px] font-bold text-rose-600 hover:underline"
            >
              Reset Seluruh Parameter
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {/* Filter Kategori Khusus (Dropdown) */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">Kategori Khusus</label>
              <select
                value={specialCategory}
                onChange={(e) => setSpecialCategory(e.target.value as SpecialCategoryFilter)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              >
                {categoryOptions.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.emoji} {cat.label} ({cat.count})
                  </option>
                ))}
              </select>
            </div>
            {/* Filter Gender */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">Jenis Kelamin</label>
              <select
                value={filterGender}
                onChange={(e) => setFilterGender(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              >
                <option value="ALL">Semua Gender</option>
                <option value="L">Laki-laki (L)</option>
                <option value="P">Perempuan (P)</option>
              </select>
            </div>

            {/* Filter Gol Darah */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">Golongan Darah</label>
              <select
                value={filterGolDarah}
                onChange={(e) => setFilterGolDarah(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              >
                <option value="ALL">Semua Gol. Darah</option>
                <option value="A">Golongan A</option>
                <option value="B">Golongan B</option>
                <option value="AB">Golongan AB</option>
                <option value="O">Golongan O</option>
                <option value="Tidak Tahu">Tidak Tahu</option>
              </select>
            </div>

            {/* Filter Status Perkawinan */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">Status Pernikahan</label>
              <select
                value={filterStatusKawin}
                onChange={(e) => setFilterStatusKawin(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              >
                <option value="ALL">Semua Status</option>
                <option value="Belum Kawin">Belum Kawin</option>
                <option value="Kawin">Kawin</option>
                <option value="Cerai Hidup">Cerai Hidup</option>
                <option value="Cerai Mati">Cerai Mati</option>
              </select>
            </div>

            {/* Filter Status Domisili */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">Status Domisili</label>
              <select
                value={filterDomisili}
                onChange={(e) => setFilterDomisili(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              >
                <option value="ALL">Semua Domisili</option>
                <option value="Tetap">Tetap</option>
                <option value="Kontrak / Kost">Kontrak / Kost</option>
                <option value="Pindah">Pindah</option>
              </select>
            </div>

            {/* Sorting */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">Urutkan Data</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              >
                <option value="nama_asc">Nama (A - Z)</option>
                <option value="nama_desc">Nama (Z - A)</option>
                <option value="rt_asc">Wilayah RT (039 - 042)</option>
                <option value="usia_desc">Usia (Tertua - Termuda)</option>
                <option value="usia_asc">Usia (Termuda - Tertua)</option>
                <option value="nik">NIK</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Hasil Pencarian / Daftar Warga Tersaring hanya ditampilkan jika sudah diketik atau diminta */}
      {!isSearchActive ? (
        <div className="p-5 sm:p-6 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl text-center border border-dashed border-slate-200 dark:border-slate-700/80 flex flex-col items-center justify-center space-y-2.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shadow-2xs">
            <Search className="w-5 h-5" />
          </div>
          <div className="space-y-1 max-w-md">
            <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
              Pencarian Cepat Warga Siap Digunakan
            </h4>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Ketik nama, NIK, No. KK, alamat, atau pilih filter wilayah RT / kategori di atas untuk memunculkan data warga tersaring.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsManualRequested(true)}
              className="px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
            >
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>Tampilkan Seluruh Warga ({wargaList.length} Jiwa)</span>
            </button>
            {onNavigateWargaWithSearch && (
              <button
                type="button"
                onClick={() => onNavigateWargaWithSearch('')}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1"
              >
                <span>Buka Menu Data Warga</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Results Header Status */}
          <div className="flex items-center justify-between px-1 text-xs text-slate-600 dark:text-slate-400 font-semibold">
            <div>
              {searchQuery.trim() ? (
                <span>
                  Hasil Pencarian &quot;<strong className="text-slate-900 dark:text-white">{searchQuery}</strong>&quot;:
                </span>
              ) : (
                <span>Daftar Warga Tersaring:</span>
              )}
            </div>
            <div>
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                {filteredWarga.length} Warga Ditemukan
              </span>
              <span className="text-slate-400 ml-1">dari {wargaList.length} Jiwa</span>
            </div>
          </div>

      {/* Empty State */}
      {filteredWarga.length === 0 ? (
        <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-center text-xs text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 space-y-2">
          <p className="font-bold text-slate-700 dark:text-slate-300">
            Tidak ditemukan data warga yang sesuai dengan kriteria pencarian.
          </p>
          <p className="text-[11px]">
            Coba periksa kembali ejaan nama, nomor NIK/KK, atau reset filter parameter di atas.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-1.5 mt-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Semua Filter</span>
          </button>
        </div>
      ) : (
        /* Results Cards Grid */
        <div className="space-y-2.5">
          <div className="max-h-[480px] overflow-y-auto space-y-2.5 pr-1">
            {filteredWarga.slice(0, visibleCount).map((warga) => {
              const usia = hitungUsia(warga.tanggalLahir);
              const kepalaInfo = getKepalaKeluarga(warga);
              const cleanWa = warga.noHp ? getCleanWaNumber(warga.noHp) : '';
              const isBansosWarga = hasBansos(warga);
              const isPbbWarga = hasPbb(warga);

              return (
                <div
                  key={warga.id}
                  className="p-3.5 bg-slate-50/80 dark:bg-slate-800/80 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/40 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs group"
                >
                  {/* Left Column: Avatar & Basic Identity */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Avatar Thumbnail */}
                    <div className="relative shrink-0 mt-0.5">
                      <div
                        onClick={() => handleOpenDetailModal(warga)}
                        className={`w-11 h-11 rounded-2xl overflow-hidden flex items-center justify-center font-bold text-sm text-white shadow-xs cursor-pointer border-2 ${
                          warga.jenisKelamin === 'L' ? 'bg-sky-700 border-sky-400' : 'bg-rose-700 border-rose-400'
                        }`}
                      >
                        {warga.foto || warga.fotoUrl ? (
                          <img
                            src={warga.foto || warga.fotoUrl}
                            alt={warga.nama || 'Warga'}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                warga.nama || 'Warga'
                              )}&background=${warga.jenisKelamin === 'L' ? '0284c7' : 'e11d48'}&color=ffffff&bold=true&size=120`;
                            }}
                          />
                        ) : (
                          <span>{(warga.nama || 'W').charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                    </div>

                    {/* Middle Column: Details */}
                    <div className="min-w-0 flex-1 space-y-1.5">
                      {/* Name & Main Badges */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenDetailModal(warga)}
                          className="font-black text-slate-900 dark:text-white text-sm hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors text-left truncate cursor-pointer"
                        >
                          {warga.nama}
                        </button>

                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold text-[10px] border border-emerald-300 dark:border-emerald-800">
                          RT {warga.rt}
                        </span>

                        <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px]">
                          {warga.statusKeluarga}
                        </span>

                        <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                          ({usia} Thn • {warga.jenisKelamin === 'L' ? 'L' : 'P'})
                        </span>
                      </div>

                      {/* Explicit NIK, No KK, and Kepala Keluarga */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="font-mono text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                          NIK: <strong className="font-bold">{warga.nik}</strong>
                          <button
                            type="button"
                            onClick={() => handleCopyNik(warga.nik)}
                            className="p-0.5 hover:text-emerald-600 text-slate-400 cursor-pointer"
                            title="Salin NIK"
                          >
                            {copiedNik === warga.nik ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </span>

                        <span className="font-mono text-blue-900 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900 flex items-center gap-1">
                          <Home className="w-3 h-3 text-blue-600 shrink-0" />
                          No. KK: <strong className="font-bold">{warga.noKk}</strong>
                        </span>

                        <span className="text-emerald-950 dark:text-emerald-200 bg-emerald-100/70 dark:bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-emerald-700 shrink-0" />
                          Kepala KK: <strong className="font-bold">{kepalaInfo.nama}</strong>
                          {kepalaInfo.isSelf && (
                            <span className="text-[9px] text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-200 dark:bg-emerald-900 px-1 rounded">
                              Kepala
                            </span>
                          )}
                        </span>
                      </div>

                      {/* Address & Meta Chips */}
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="truncate max-w-xs">{warga.alamat}</span>
                        {warga.pekerjaan && (
                          <>
                            <span>•</span>
                            <span>{warga.pekerjaan}</span>
                          </>
                        )}
                        {warga.golDarah && (
                          <>
                            <span>•</span>
                            <span className="font-semibold text-rose-600 dark:text-rose-400">
                              Gol. {warga.golDarah}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Special Tags (Lansia, Disabilitas, Duda/Janda, Bansos, PBB, Kost) */}
                      <div className="flex flex-wrap items-center gap-1 pt-0.5">
                        {warga.isLansia || usia >= 60 ? (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                            👴 Lansia
                          </span>
                        ) : null}

                        {warga.isDisabilitas ? (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                            ♿ Disabilitas
                          </span>
                        ) : null}

                        {warga.isDudaJanda || warga.statusKawin === 'Cerai Mati' || warga.statusKawin === 'Cerai Hidup' ? (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-rose-100 dark:bg-rose-950 text-rose-900 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                            🤍 Duda / Janda
                          </span>
                        ) : null}

                        {warga.statusDomisili === 'Kontrak / Kost' && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                            🏡 Kontrak/Kost
                          </span>
                        )}

                        {isBansosWarga && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-teal-100 dark:bg-teal-950 text-teal-900 dark:text-teal-300 border border-teal-300 dark:border-teal-800">
                            🎁 Bansos
                          </span>
                        )}

                        {isPbbWarga && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                            🏛️ PBB
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Direct Quick Action Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-700 w-full sm:w-auto justify-end">
                    {/* View Detail Quick Modal */}
                    <button
                      type="button"
                      onClick={() => handleOpenDetailModal(warga)}
                      className="px-2.5 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-xl text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Lihat Detail Lengkap Warga"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                      <span>Detail</span>
                    </button>

                    {/* Buat Surat Pengantar */}
                    {onCreateSurat && (
                      <button
                        type="button"
                        onClick={() => onCreateSurat(warga)}
                        className="px-2.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-emerald-950 rounded-xl text-[11px] font-black shadow-xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                        title="Buat Surat Pengantar untuk Warga Ini"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Buat Surat</span>
                      </button>
                    )}

                    {/* WhatsApp Button */}
                    {cleanWa ? (
                      <a
                        href={`https://wa.me/${cleanWa}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold shadow-xs flex items-center gap-1 transition-all cursor-pointer"
                        title="Chat WhatsApp Warga"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">WA</span>
                      </a>
                    ) : null}

                    {/* KK Button */}
                    {onSelectKk && (
                      <button
                        type="button"
                        onClick={() => onSelectKk(warga.noKk)}
                        className="p-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-[11px] font-bold transition-colors cursor-pointer"
                        title="Buka Kartu Keluarga Warga Ini"
                      >
                        <Home className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load More Pagination / View All in Warga button */}
          {filteredWarga.length > visibleCount && (
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500">
                Menampilkan {Math.min(visibleCount, filteredWarga.length)} dari {filteredWarga.length} warga tersaring
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + 12)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Tampilkan Lebih Banyak (+12)
                </button>

                {onNavigateWargaWithSearch && (
                  <button
                    type="button"
                    onClick={() => onNavigateWargaWithSearch(searchQuery)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>Buka Seluruhnya di Tab Warga</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )}

      {/* Quick Resident Detail Modal */}
      {selectedWargaForModal && (
        <DashboardResidentDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedWargaForModal(null);
          }}
          warga={selectedWargaForModal}
          allWarga={wargaList}
          kkList={kkList}
          bansosList={bansosList}
          pbbList={pbbList}
          profile={profile}
          currentUser={currentUser}
          onCreateSurat={onCreateSurat}
          onSelectKk={onSelectKk}
          onSelectWarga={(w) => setSelectedWargaForModal(w)}
          onNavigateTab={onNavigateTab}
        />
      )}
    </div>
  );
};
