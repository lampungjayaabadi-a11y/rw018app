import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Gift,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
  Trash2,
  Edit2,
  X,
  UserCheck,
  Package,
  Calendar,
  Building,
  Check,
  RotateCcw,
  Sparkles,
  Users,
  ShieldCheck,
  FileText,
  ChevronDown,
  ChevronUp,
  Layers,
  HeartHandshake,
  MapPin,
  IdCard,
  CheckCheck,
  BookmarkPlus
} from 'lucide-react';
import {
  BansosItem,
  BansosType,
  BansosStatus,
  CadanganBansosItem,
  Warga,
  RWProfile,
  AppUser
} from '../types';
import { generateId, formatTanggalIndo, hitungUsia } from '../utils/formatters';
import { exportBansos } from '../utils/exportUtils';
import { ExportButton } from './ExportButton';
import { BansosReportModal } from './BansosReportModal';
import { CadanganBansosTab } from './CadanganBansosTab';
import { CadanganBansosModal } from './CadanganBansosModal';

interface BansosViewProps {
  profile: RWProfile;
  bansosList: BansosItem[];
  cadanganBansosList?: CadanganBansosItem[];
  wargaList: Warga[];
  onSaveBansos: (item: BansosItem) => void;
  onDeleteBansos: (id: string) => void;
  onSaveCadanganBansos?: (item: CadanganBansosItem) => void;
  onDeleteCadanganBansos?: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  currentUser?: AppUser | null;
}

export const BansosView: React.FC<BansosViewProps> = ({
  profile,
  bansosList,
  cadanganBansosList = [],
  wargaList,
  onSaveBansos,
  onDeleteBansos,
  onSaveCadanganBansos,
  onDeleteCadanganBansos,
  searchQuery,
  onSearchChange,
  currentUser,
}) => {
  const [activeMainTab, setActiveMainTab] = useState<'penyaluran' | 'cadangan'>('penyaluran');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedRt, setSelectedRt] = useState<string>('ALL');
  const [selectedKategoriKhusus, setSelectedKategoriKhusus] = useState<string>('ALL');
  const [isProgramDropdownOpen, setIsProgramDropdownOpen] = useState(false);
  const [isKategoriDropdownOpen, setIsKategoriDropdownOpen] = useState(false);
  const programDropdownRef = useRef<HTMLDivElement>(null);
  const kategoriDropdownRef = useRef<HTMLDivElement>(null);

  // Cadangan Bansos Modals
  const [isCadanganModalOpen, setIsCadanganModalOpen] = useState(false);
  const [editingCadanganItem, setEditingCadanganItem] = useState<CadanganBansosItem | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        programDropdownRef.current &&
        !programDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProgramDropdownOpen(false);
      }
      if (
        kategoriDropdownRef.current &&
        !kategoriDropdownRef.current.contains(event.target as Node)
      ) {
        setIsKategoriDropdownOpen(false);
      }
    };
    if (isProgramDropdownOpen || isKategoriDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProgramDropdownOpen, isKategoriDropdownOpen]);

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [editingBansos, setEditingBansos] = useState<BansosItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Warga Lookup / Autocomplete Search in Modal
  const [wargaSearchTerm, setWargaSearchTerm] = useState('');
  const [wargaSearchRtFilter, setWargaSearchRtFilter] = useState('ALL');
  const [isWargaSearchFocused, setIsWargaSearchFocused] = useState(false);
  const [selectedWarga, setSelectedWarga] = useState<Warga | null>(null);
  const [autoFillSuccessMessage, setAutoFillSuccessMessage] = useState<string | null>(null);
  const [isNamaInputFocused, setIsNamaInputFocused] = useState(false);
  const wargaSearchContainerRef = useRef<HTMLDivElement>(null);
  const namaInputContainerRef = useRef<HTMLDivElement>(null);

  // Form
  const initialForm: Partial<BansosItem> = {
    nik: '',
    namaPenerima: '',
    noKk: '',
    rt: profile.daftarRt[0] || '039',
    jenisBansos: 'Beras CBP 10kg',
    periode: 'Agustus 2026',
    status: 'Disalurkan',
    nominalOrPaket: '10 Kg Beras Medium Bulog',
    tanggalPenyaluran: new Date().toISOString().slice(0, 10),
    keterangan: '',
    petugasPenyalur: `Ketua RW (${profile.namaKetuaRw})`,
  };
  const [formData, setFormData] = useState<Partial<BansosItem>>(initialForm);

  // Close citizen search dropdown on outside click
  useEffect(() => {
    const handleSearchOutside = (e: MouseEvent) => {
      if (
        wargaSearchContainerRef.current &&
        !wargaSearchContainerRef.current.contains(e.target as Node)
      ) {
        setIsWargaSearchFocused(false);
      }
      if (
        namaInputContainerRef.current &&
        !namaInputContainerRef.current.contains(e.target as Node)
      ) {
        setIsNamaInputFocused(false);
      }
    };
    document.addEventListener('mousedown', handleSearchOutside);
    return () => document.removeEventListener('mousedown', handleSearchOutside);
  }, []);

  // Summary Metrics Calculations
  const metrics = useMemo(() => {
    const total = bansosList.length;
    const disalurkan = bansosList.filter((b) => b.status === 'Disalurkan').length;
    const menunggu = bansosList.filter((b) => b.status === 'Menunggu Verifikasi' || b.status === 'Belum Diambil').length;
    const berasCbp = bansosList.filter((b) => b.jenisBansos === 'Beras CBP 10kg').length;
    const pkh = bansosList.filter((b) => b.jenisBansos === 'PKH' || b.jenisBansos === 'BPNT (Sembako)').length;
    const persentase = total > 0 ? Math.round((disalurkan / total) * 100) : 0;
    return { total, disalurkan, menunggu, berasCbp, pkh, persentase };
  }, [bansosList]);

  // Real-time Citizen Lookup by Nama, NIK, or No KK from RW 018 Master Data - Sorted A - Z
  const searchedWargaList = useMemo(() => {
    const term = wargaSearchTerm.trim().toLowerCase();

    return wargaList
      .filter((w) => {
        const matchRt =
          wargaSearchRtFilter === 'ALL' ||
          w.rt === wargaSearchRtFilter ||
          w.rt === wargaSearchRtFilter.replace(/^0+/, '');
        if (!matchRt) return false;

        if (!term) return true; // Allows browsing when search box is focused

        const matchNama = w.nama.toLowerCase().includes(term);
        const matchNik = w.nik.includes(term);
        const matchKk = w.noKk ? w.noKk.includes(term) : false;

        return matchNama || matchNik || matchKk;
      })
      .sort((a, b) => a.nama.localeCompare(b.nama, 'id'))
      .slice(0, term ? 25 : 50);
  }, [wargaList, wargaSearchTerm, wargaSearchRtFilter]);

  // Suggestions for Nama input typing - Sorted A - Z
  const namaSuggestions = useMemo(() => {
    const term = (formData.namaPenerima || '').trim().toLowerCase();
    if (!term || term.length < 2) return [];

    return wargaList
      .filter((w) => w.nama.toLowerCase().includes(term))
      .sort((a, b) => a.nama.localeCompare(b.nama, 'id'))
      .slice(0, 8);
  }, [wargaList, formData.namaPenerima]);

  // Check if current form NIK is registered in Data Induk Warga RW 018
  const registeredWargaInForm = useMemo(() => {
    if (!formData.nik) return null;
    return wargaList.find((w) => w.nik === formData.nik.trim()) || null;
  }, [wargaList, formData.nik]);

  // Trigger auto-fill notification helper
  const triggerAutoFillFeedback = (nama: string, rt: string) => {
    setAutoFillSuccessMessage(`✓ Auto-Fill Sukses: NIK, No. KK, Nama (${nama}), dan RT ${rt} telah terisi otomatis!`);
    setTimeout(() => {
      setAutoFillSuccessMessage(null);
    }, 4500);
  };

  // Filtered List for main table and reports
  const filteredBansos = useMemo(() => {
    return bansosList.filter((b) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        b.namaPenerima.toLowerCase().includes(q) ||
        b.nik.includes(q) ||
        b.noKk.includes(q) ||
        b.jenisBansos.toLowerCase().includes(q) ||
        b.rt.includes(q) ||
        (b.nominalOrPaket && b.nominalOrPaket.toLowerCase().includes(q));

      const matchType = selectedType === 'ALL' || b.jenisBansos === selectedType;
      const matchStatus = selectedStatus === 'ALL' || b.status === selectedStatus;
      const matchRt = selectedRt === 'ALL' || b.rt === selectedRt || b.rt === selectedRt.replace(/^0+/, '');

      let matchKategoriKhusus = true;
      if (selectedKategoriKhusus !== 'ALL') {
        const citizen = wargaList.find((w) => w.nik === b.nik);
        if (!citizen) {
          matchKategoriKhusus = false;
        } else if (selectedKategoriKhusus === 'lansia') {
          matchKategoriKhusus = !!citizen.isLansia || hitungUsia(citizen.tanggalLahir) >= 60;
        } else if (selectedKategoriKhusus === 'disabilitas') {
          matchKategoriKhusus = !!citizen.isDisabilitas;
        } else if (selectedKategoriKhusus === 'dudajanda') {
          matchKategoriKhusus =
            !!citizen.isDudaJanda ||
            citizen.statusKawin === 'Cerai Mati' ||
            citizen.statusKawin === 'Cerai Hidup';
        }
      }

      return matchSearch && matchType && matchStatus && matchRt && matchKategoriKhusus;
    });
  }, [bansosList, wargaList, searchQuery, selectedType, selectedStatus, selectedRt, selectedKategoriKhusus]);

  // Handle citizen selection for auto-fill (via Click or Enter)
  const handleSelectWarga = (w: Warga) => {
    setSelectedWarga(w);
    setFormData((prev) => ({
      ...prev,
      nik: w.nik,
      namaPenerima: w.nama,
      noKk: w.noKk || '',
      rt: w.rt || profile.daftarRt[0] || '039',
    }));
    setWargaSearchTerm('');
    setIsWargaSearchFocused(false);
    setIsNamaInputFocused(false);
    triggerAutoFillFeedback(w.nama, w.rt);
  };

  // Handle typing in search bar with auto-fill detection
  const handleSearchTermChange = (value: string) => {
    setWargaSearchTerm(value);
    setIsWargaSearchFocused(true);

    const cleanVal = value.trim();
    if (!cleanVal) return;

    // Check exact 16-digit NIK or exact matching NIK
    const exactNikMatch = wargaList.find((w) => w.nik === cleanVal);
    if (exactNikMatch) {
      handleSelectWarga(exactNikMatch);
      return;
    }

    // Check exact name match (case-insensitive)
    const exactNameMatches = wargaList.filter(
      (w) => w.nama.toLowerCase() === cleanVal.toLowerCase()
    );
    if (exactNameMatches.length === 1) {
      handleSelectWarga(exactNameMatches[0]);
    }
  };

  // Handle direct NIK input change with auto-fill detection
  const handleNikInputChange = (val: string) => {
    const cleanVal = val.trim();
    setFormData((prev) => ({ ...prev, nik: val }));

    if (cleanVal.length >= 8) {
      const match = wargaList.find((w) => w.nik === cleanVal);
      if (match) {
        setSelectedWarga(match);
        setFormData((prev) => ({
          ...prev,
          nik: match.nik,
          namaPenerima: match.nama,
          noKk: match.noKk || '',
          rt: match.rt || profile.daftarRt[0] || '039',
        }));
        triggerAutoFillFeedback(match.nama, match.rt);
      }
    }
  };

  // Handle direct Nama input change with auto-fill detection
  const handleNamaInputChange = (val: string) => {
    setFormData((prev) => ({ ...prev, namaPenerima: val }));
    setIsNamaInputFocused(true);

    const cleanVal = val.trim().toLowerCase();
    if (cleanVal.length >= 3) {
      const exactMatches = wargaList.filter((w) => w.nama.toLowerCase() === cleanVal);
      if (exactMatches.length === 1) {
        const match = exactMatches[0];
        setSelectedWarga(match);
        setFormData((prev) => ({
          ...prev,
          nik: match.nik,
          namaPenerima: match.nama,
          noKk: match.noKk || '',
          rt: match.rt || profile.daftarRt[0] || '039',
        }));
        triggerAutoFillFeedback(match.nama, match.rt);
      }
    }
  };

  const handleClearSelectedWarga = () => {
    setSelectedWarga(null);
    setAutoFillSuccessMessage(null);
    setFormData((prev) => ({
      ...prev,
      nik: '',
      namaPenerima: '',
      noKk: '',
      rt: profile.daftarRt[0] || '039',
    }));
    setWargaSearchTerm('');
  };

  const handleOpenAdd = () => {
    setEditingBansos(null);
    setSelectedWarga(null);
    setWargaSearchTerm('');
    setFormData({
      ...initialForm,
      tanggalPenyaluran: new Date().toISOString().slice(0, 10),
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (item: BansosItem) => {
    setEditingBansos(item);
    const existing = wargaList.find((w) => w.nik === item.nik);
    setSelectedWarga(existing || null);
    setWargaSearchTerm('');
    setFormData({ ...item });
    setIsFormModalOpen(true);
  };

  const handleQuickMarkDisalurkan = (item: BansosItem) => {
    const updated: BansosItem = {
      ...item,
      status: 'Disalurkan',
      tanggalPenyaluran: new Date().toISOString().slice(0, 10),
      petugasPenyalur: `Ketua RW (${profile.namaKetuaRw})`,
    };
    onSaveBansos(updated);
  };

  const handleResetFilters = () => {
    setSelectedType('ALL');
    setSelectedStatus('ALL');
    setSelectedRt('ALL');
    setSelectedKategoriKhusus('ALL');
    onSearchChange('');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaPenerima || !formData.nik || !formData.jenisBansos) {
      alert('Mohon lengkapi NIK, Nama Penerima, dan Jenis Bansos!');
      return;
    }

    // SYARAT WAJIB: Data warga harus terdaftar di Data Induk Warga RW 018
    const isCitizenRegistered = wargaList.some(
      (w) => w.nik === formData.nik?.trim()
    );

    if (!isCitizenRegistered) {
      alert(
        `⚠️ SYARAT INPUT BANSOS:\n\nData warga dengan NIK "${formData.nik}" (${formData.namaPenerima}) TIDAK TERDAFTAR di Data Induk Warga RW 018.\n\nSyarat penerima bansos adalah warga yang sah dan tercatat di Data Induk RW 018. Silakan gunakan baris pencarian untuk memilih warga dari database RW 018.`
      );
      return;
    }

    const saved: BansosItem = {
      id: editingBansos ? editingBansos.id : generateId('bs'),
      nik: formData.nik.trim(),
      namaPenerima: formData.namaPenerima.trim(),
      noKk: formData.noKk || '',
      rt: formData.rt || (selectedRt !== 'ALL' ? selectedRt : profile.daftarRt[0]) || '039',
      jenisBansos: (formData.jenisBansos as BansosType) || 'Beras CBP 10kg',
      periode: formData.periode || 'Agustus 2026',
      status: (formData.status as BansosStatus) || 'Disalurkan',
      nominalOrPaket: formData.nominalOrPaket || '10 Kg Beras Medium Bulog',
      tanggalPenyaluran: formData.status === 'Disalurkan' ? formData.tanggalPenyaluran : undefined,
      keterangan: formData.keterangan || '-',
      petugasPenyalur: formData.petugasPenyalur || `Ketua RW (${profile.namaKetuaRw})`,
    };

    onSaveBansos(saved);
    setIsFormModalOpen(false);
  };

  const handleExportExcel = () => {
    exportBansos(filteredBansos, 'xlsx');
  };

  const handleExportCSV = () => {
    exportBansos(filteredBansos, 'csv');
  };

  const handleOpenAddCadangan = () => {
    setEditingCadanganItem(null);
    setIsCadanganModalOpen(true);
  };

  const handleEditCadangan = (item: CadanganBansosItem) => {
    setEditingCadanganItem(item);
    setIsCadanganModalOpen(true);
  };

  const handlePromoteToBansos = (cadangan: CadanganBansosItem) => {
    setEditingBansos(null);
    const existingWarga = wargaList.find((w) => w.nik === cadangan.nik);
    setSelectedWarga(existingWarga || null);
    setWargaSearchTerm('');
    setFormData({
      nik: cadangan.nik,
      namaPenerima: cadangan.nama,
      noKk: cadangan.noKk || '',
      rt: cadangan.rt || profile.daftarRt[0] || '039',
      jenisBansos: (cadangan.targetJenisBansos as BansosType) || 'Beras CBP 10kg',
      periode: 'Agustus 2026',
      status: 'Disalurkan',
      nominalOrPaket: '10 Kg Beras Medium Bulog',
      tanggalPenyaluran: new Date().toISOString().slice(0, 10),
      keterangan: `Dipromosikan dari Daftar Cadangan Bansos (${cadangan.kategori} - ${cadangan.prioritas})`,
      petugasPenyalur: `Ketua RW (${profile.namaKetuaRw})`,
    });
    setIsFormModalOpen(true);

    if (onSaveCadanganBansos) {
      onSaveCadanganBansos({
        ...cadangan,
        status: 'Telah Dipromosikan',
      });
    }
  };

  const allBansosTypes: BansosType[] = [
    'Beras CBP 10kg',
    'PKH',
    'BPNT (Sembako)',
    'BLT Dana Desa',
    'KIS / PBI',
    'PIP Sekolah',
    'Santunan Kas RW',
    'Santunan Yatim/Piatu',
    'Bedah Rumah',
  ];

  return (
    <div className="space-y-4 p-4 pb-12 max-w-5xl mx-auto">
      {/* 1. Header Card - Symmetrical Left and Right */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          {/* Sisi Kiri: Judul, Subjudul & Indikator Wilayah */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 flex items-center justify-center font-bold shrink-0 shadow-2xs">
              <Gift className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  Penyaluran Bantuan Sosial (Bansos)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
                  {profile.namaRw}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitoring & distribusi beras pangan CBP, PKH, BPNT, BLT, cadangan warga berhak Kel. {profile.kelurahan}, {profile.kotaKab}.
              </p>
            </div>
          </div>

          {/* Sisi Kanan: Deret Tombol Menu (Export, Laporan, Input Cadangan & Input Bansos) */}
          <div className="w-full sm:w-auto grid grid-cols-2 sm:flex items-center gap-1.5 sm:gap-2 justify-between">
            <div className="w-full sm:w-auto flex justify-center">
              <ExportButton
                label="Ekspor"
                onExportExcel={handleExportExcel}
                onExportCsv={handleExportCSV}
                variant="secondary"
                className="w-full justify-center text-center shadow-xs"
              />
            </div>
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-xs font-black rounded-xl shadow-md shadow-amber-600/20 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
              title="Buka Laporan Rekap & Rinci Bantuan Sosial"
            >
              <FileText className="w-4 h-4" />
              <span>Laporan</span>
            </button>
            <button
              onClick={handleOpenAddCadangan}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-700 hover:to-orange-800 text-white text-xs font-black rounded-xl shadow-md shadow-amber-600/20 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
              title="Input Warga Cadangan yang Berhak Menerima Bansos"
            >
              <BookmarkPlus className="w-4 h-4" />
              <span>+ Cadangan</span>
            </button>
            <button
              onClick={handleOpenAdd}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white text-xs font-black rounded-xl shadow-md shadow-emerald-700/20 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
              title="Tambah Catatan Penyaluran Bansos Baru"
            >
              <Plus className="w-4 h-4" />
              <span>+ Bansos</span>
            </button>
          </div>
        </div>

        {/* TAB SWITCHER: Penyaluran Resmi vs Daftar Cadangan */}
        <div className="pt-3 flex items-center gap-2">
          <div className="flex-1 grid grid-cols-2 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setActiveMainTab('penyaluran')}
              className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeMainTab === 'penyaluran'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Gift className={`w-3.5 h-3.5 ${activeMainTab === 'penyaluran' ? 'text-amber-600' : 'text-slate-400'}`} />
              <span>Penyaluran Bansos Resmi</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeMainTab === 'penyaluran' ? 'bg-amber-100 text-amber-900' : 'bg-slate-200 text-slate-700'
              }`}>
                {bansosList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMainTab('cadangan')}
              className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeMainTab === 'cadangan'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookmarkPlus className={`w-3.5 h-3.5 ${activeMainTab === 'cadangan' ? 'text-orange-600' : 'text-slate-400'}`} />
              <span>Daftar Cadangan Warga Berhak</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeMainTab === 'cadangan' ? 'bg-orange-100 text-orange-900' : 'bg-slate-200 text-slate-700'
              }`}>
                {cadanganBansosList.length}
              </span>
            </button>
          </div>
        </div>

        {activeMainTab === 'penyaluran' && (
          <>
            {/* 2. Symmetrical 4-Column Metric Ribbon (Compact & Streamlined) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5 pt-3">
              {/* Kolom 1: Total Penerima */}
              <div className="px-3 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/90 border border-slate-200/80 flex items-center justify-between shadow-2xs">
                <div className="min-w-0 pr-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">Total Penerima</p>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-base sm:text-lg font-black text-slate-900 leading-none">{metrics.total}</span>
                    <span className="text-[10px] text-slate-500 font-medium">Warga</span>
                  </div>
                </div>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-slate-200/80 text-slate-700 flex items-center justify-center font-bold shrink-0">
                  <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>

              {/* Kolom 2: Sudah Disalurkan */}
              <div className="px-3 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/90 border border-emerald-200/80 flex items-center justify-between shadow-2xs">
                <div className="min-w-0 pr-1">
                  <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider truncate">Disalurkan</p>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-base sm:text-lg font-black text-emerald-800 leading-none">{metrics.disalurkan}</span>
                    <span className="text-[10px] text-emerald-600 font-bold">({metrics.persentase}%)</span>
                  </div>
                </div>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-200/80 text-emerald-800 flex items-center justify-center font-bold shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>

              {/* Kolom 3: Menunggu / Verifikasi */}
              <div className="px-3 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/90 border border-amber-200/80 flex items-center justify-between shadow-2xs">
                <div className="min-w-0 pr-1">
                  <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider truncate">Menunggu / Belum</p>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-base sm:text-lg font-black text-amber-800 leading-none">{metrics.menunggu}</span>
                    <span className="text-[10px] text-amber-600 font-medium">Antrean</span>
                  </div>
                </div>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-amber-200/80 text-amber-800 flex items-center justify-center font-bold shrink-0">
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>

              {/* Kolom 4: Program Beras CBP 10kg */}
              <div className="px-3 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-50/70 to-yellow-50/90 border border-amber-300/80 flex items-center justify-between shadow-2xs">
                <div className="min-w-0 pr-1">
                  <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider truncate">Beras CBP Bulog</p>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-base sm:text-lg font-black text-amber-900 leading-none">{metrics.berasCbp}</span>
                    <span className="text-[10px] text-amber-700 font-medium">Paket</span>
                  </div>
                </div>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-amber-300/60 text-amber-900 flex items-center justify-center font-bold shrink-0">
                  <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
            </div>

            {/* 3. Baris Menu & Sub-Menu Navigasi Simetris (Rata Kiri & Kanan) */}
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
          {/* Baris Menu: Filter Program & Kategori Khusus (Kiri) & Pilihan RT (Kanan) */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 relative">
            {/* Sayap Kiri: Menu Dropdown Filter Program Bansos & Kategori Khusus */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Dropdown 1: Filter Program Bansos */}
              <div className="relative" ref={programDropdownRef}>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProgramDropdownOpen(!isProgramDropdownOpen);
                      setIsKategoriDropdownOpen(false);
                    }}
                  className={`flex items-center gap-2.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all border shadow-2xs cursor-pointer active:scale-98 ${
                    selectedType !== 'ALL'
                      ? 'bg-amber-500/10 border-amber-400/80 text-amber-950 ring-2 ring-amber-500/20'
                      : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                  aria-expanded={isProgramDropdownOpen}
                  aria-haspopup="true"
                >
                  <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider">
                      Filter Program
                    </span>
                    <span className="font-black text-slate-900 flex items-center gap-1.5">
                      {selectedType === 'ALL' ? 'Semua Program Bansos' : selectedType}
                      <span className="px-1.5 py-0.2 rounded-md bg-amber-200 text-amber-900 text-[10px] font-black">
                        {selectedType === 'ALL'
                          ? bansosList.length
                          : bansosList.filter((b) => b.jenisBansos === selectedType).length}
                      </span>
                    </span>
                  </div>
                  <div className="pl-1 text-slate-400">
                    {isProgramDropdownOpen ? (
                      <ChevronUp className="w-4 h-4 text-amber-700" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                </button>

                {selectedType !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => setSelectedType('ALL')}
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all text-xs font-bold cursor-pointer"
                    title="Reset Filter Program (Tampilkan Semua)"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Dropdown Menu Container */}
              {isProgramDropdownOpen && (
                <div className="absolute left-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-2xl z-40 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                        <Gift className="w-3.5 h-3.5 text-amber-700" />
                        Pilih Program Bantuan Sosial
                      </h4>
                      <p className="text-[10px] text-amber-800 font-medium">
                        Total {bansosList.length} penerima terdata di RW 018
                      </p>
                    </div>
                    <button
                      onClick={() => setIsProgramDropdownOpen(false)}
                      className="p-1 rounded-lg text-amber-800 hover:bg-amber-200/60 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="p-1.5 max-h-80 overflow-y-auto space-y-1">
                    {/* Option: Semua Program */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedType('ALL');
                        setIsProgramDropdownOpen(false);
                      }}
                      className={`w-full p-2.5 rounded-xl text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                        selectedType === 'ALL'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                            selectedType === 'ALL'
                              ? 'bg-white/20 text-white'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          <Layers className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-black">Semua Program Bansos</div>
                          <div
                            className={`text-[10px] ${
                              selectedType === 'ALL' ? 'text-amber-100' : 'text-slate-400'
                            }`}
                          >
                            Tampilkan seluruh bantuan sosial
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                            selectedType === 'ALL'
                              ? 'bg-white text-amber-900'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {bansosList.length}
                        </span>
                        {selectedType === 'ALL' && <Check className="w-4 h-4 text-white" />}
                      </div>
                    </button>

                    {/* Program List Options */}
                    {allBansosTypes.map((type) => {
                      const count = bansosList.filter((b) => b.jenisBansos === type).length;
                      const isSelected = selectedType === type;

                      // Description helper
                      let desc = 'Program Bantuan Sosial';
                      if (type === 'Beras CBP 10kg') desc = 'Cadangan Beras Pemerintah Bulog';
                      else if (type === 'PKH') desc = 'Program Keluarga Harapan Kemensos';
                      else if (type === 'BPNT (Sembako)') desc = 'Bantuan Pangan Non-Tunai Sembako';
                      else if (type === 'BLT Dana Desa') desc = 'Bantuan Langsung Tunai Kelurahan/Desa';
                      else if (type === 'KIS / PBI') desc = 'Jaminan Kesehatan BPJS PBI / KIS';
                      else if (type === 'PIP Sekolah') desc = 'Program Indonesia Pintar / Beasiswa';
                      else if (type === 'Santunan Kas RW') desc = 'Santunan Dhuafa & Warga Peduli Kas RW';
                      else if (type === 'Santunan Yatim/Piatu') desc = 'Santunan Anak Yatim & Piatu RW 018';
                      else if (type === 'Bedah Rumah') desc = 'Bantuan Stimulan Bedah Rumah / RTLH';

                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            setSelectedType(type);
                            setIsProgramDropdownOpen(false);
                          }}
                          className={`w-full p-2.5 rounded-xl text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'hover:bg-slate-100 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                                isSelected
                                  ? 'bg-white/20 text-white'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}
                            >
                              <Gift className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="font-black leading-tight">{type}</div>
                              <div
                                className={`text-[10px] ${
                                  isSelected ? 'text-amber-100' : 'text-slate-500'
                                } font-medium`}
                              >
                                {desc}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 pl-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                                isSelected
                                  ? 'bg-white text-amber-900'
                                  : count > 0
                                  ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                  : 'bg-slate-100 text-slate-400'
                              }`}
                            >
                              {count}
                            </span>
                            {isSelected && <Check className="w-4 h-4 text-white" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              </div>

              {/* Dropdown 2: Kategori Khusus (Lansia, Disabilitas, Duda/Janda) */}
              <div className="relative" ref={kategoriDropdownRef}>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsKategoriDropdownOpen(!isKategoriDropdownOpen);
                      setIsProgramDropdownOpen(false);
                    }}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all border shadow-2xs cursor-pointer active:scale-98 ${
                      selectedKategoriKhusus !== 'ALL'
                        ? 'bg-purple-50 border-purple-400 text-purple-950 ring-2 ring-purple-500/20'
                        : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                    aria-expanded={isKategoriDropdownOpen}
                    aria-haspopup="true"
                  >
                    <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                      <HeartHandshake className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-left">
                      <span className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider">
                        Kategori Khusus
                      </span>
                      <span className="font-black text-slate-900 flex items-center gap-1">
                        {selectedKategoriKhusus === 'ALL' && 'Semua Kategori'}
                        {selectedKategoriKhusus === 'lansia' && '🧓 Lansia (>60 th)'}
                        {selectedKategoriKhusus === 'disabilitas' && '♿ Disabilitas'}
                        {selectedKategoriKhusus === 'dudajanda' && '🥀 Duda / Janda'}
                      </span>
                    </div>
                    <div className="pl-1 text-slate-400">
                      {isKategoriDropdownOpen ? (
                        <ChevronUp className="w-4 h-4 text-purple-700" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      )}
                    </div>
                  </button>

                  {selectedKategoriKhusus !== 'ALL' && (
                    <button
                      type="button"
                      onClick={() => setSelectedKategoriKhusus('ALL')}
                      className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all text-xs font-bold cursor-pointer"
                      title="Reset Filter Kategori Khusus"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Dropdown Kategori Menu */}
                {isKategoriDropdownOpen && (
                  <div className="absolute left-0 top-full mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-2xl z-40 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100 flex items-center justify-between">
                      <h4 className="text-xs font-black text-purple-950 flex items-center gap-1.5">
                        <HeartHandshake className="w-3.5 h-3.5 text-purple-700" />
                        Pilih Kategori Khusus
                      </h4>
                      <button
                        type="button"
                        onClick={() => setIsKategoriDropdownOpen(false)}
                        className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="p-2 space-y-1">
                      {/* Option: Semua */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedKategoriKhusus('ALL');
                          setIsKategoriDropdownOpen(false);
                        }}
                        className={`w-full p-2.5 rounded-xl text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                          selectedKategoriKhusus === 'ALL'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'hover:bg-slate-100 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5" />
                          <span>Semua Penerima (Tanpa Filter)</span>
                        </div>
                        {selectedKategoriKhusus === 'ALL' && <Check className="w-4 h-4 text-white" />}
                      </button>

                      {/* Option: Lansia */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedKategoriKhusus('lansia');
                          setIsKategoriDropdownOpen(false);
                        }}
                        className={`w-full p-2.5 rounded-xl text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                          selectedKategoriKhusus === 'lansia'
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'hover:bg-amber-50 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">🧓</span>
                          <div>
                            <div className="leading-tight font-black">Lansia (&gt;60 th)</div>
                            <div className={`text-[10px] ${selectedKategoriKhusus === 'lansia' ? 'text-amber-100' : 'text-slate-400'}`}>
                              Penerima bansos usia &gt; 60 th
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              selectedKategoriKhusus === 'lansia' ? 'bg-white text-amber-900' : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            {bansosList.filter((b) => {
                              const c = wargaList.find((w) => w.nik === b.nik);
                              return c && (c.isLansia || hitungUsia(c.tanggalLahir) >= 60);
                            }).length}
                          </span>
                          {selectedKategoriKhusus === 'lansia' && <Check className="w-4 h-4 text-white" />}
                        </div>
                      </button>

                      {/* Option: Disabilitas */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedKategoriKhusus('disabilitas');
                          setIsKategoriDropdownOpen(false);
                        }}
                        className={`w-full p-2.5 rounded-xl text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                          selectedKategoriKhusus === 'disabilitas'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'hover:bg-purple-50 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">♿</span>
                          <div>
                            <div className="leading-tight font-black">Disabilitas</div>
                            <div className={`text-[10px] ${selectedKategoriKhusus === 'disabilitas' ? 'text-purple-100' : 'text-slate-400'}`}>
                              Berkebutuhan khusus
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              selectedKategoriKhusus === 'disabilitas' ? 'bg-white text-purple-900' : 'bg-purple-100 text-purple-900'
                            }`}
                          >
                            {bansosList.filter((b) => {
                              const c = wargaList.find((w) => w.nik === b.nik);
                              return c && c.isDisabilitas;
                            }).length}
                          </span>
                          {selectedKategoriKhusus === 'disabilitas' && <Check className="w-4 h-4 text-white" />}
                        </div>
                      </button>

                      {/* Option: Duda/Janda */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedKategoriKhusus('dudajanda');
                          setIsKategoriDropdownOpen(false);
                        }}
                        className={`w-full p-2.5 rounded-xl text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                          selectedKategoriKhusus === 'dudajanda'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'hover:bg-rose-50 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">🥀</span>
                          <div>
                            <div className="leading-tight font-black">Duda / Janda</div>
                            <div className={`text-[10px] ${selectedKategoriKhusus === 'dudajanda' ? 'text-rose-100' : 'text-slate-400'}`}>
                              Cerai Mati / Cerai Hidup
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              selectedKategoriKhusus === 'dudajanda' ? 'bg-white text-rose-900' : 'bg-rose-100 text-rose-900'
                            }`}
                          >
                            {bansosList.filter((b) => {
                              const c = wargaList.find((w) => w.nik === b.nik);
                              return c && (c.isDudaJanda || c.statusKawin === 'Cerai Mati' || c.statusKawin === 'Cerai Hidup');
                            }).length}
                          </span>
                          {selectedKategoriKhusus === 'dudajanda' && <Check className="w-4 h-4 text-white" />}
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sayap Kanan: Filter Wilayah RT */}
            <div className="flex items-center gap-1.5 self-start lg:self-auto shrink-0 bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
              <span className="text-xs font-black text-slate-500 pl-2.5 pr-1 flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-slate-400" /> RT:
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSelectedRt('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    selectedRt === 'ALL'
                      ? 'bg-white text-emerald-900 shadow-xs border border-emerald-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua RT
                </button>
                {profile.daftarRt.map((rt) => (
                  <button
                    key={rt}
                    type="button"
                    onClick={() => setSelectedRt(rt)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      selectedRt === rt
                        ? 'bg-white text-emerald-900 shadow-xs border border-emerald-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    RT {rt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Baris Sub-Menu: Search Input (Kiri) & Filter Status Penyaluran (Kanan) */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
            {/* Sayap Kiri: Pencarian Cepat */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Cari Nama Penerima, NIK, No KK, atau Paket..."
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none transition-all placeholder:text-slate-400 font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sayap Kanan: Status Penyaluran Segmented Controls & Reset Filter */}
            <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
                {[
                  { id: 'ALL', label: 'Semua Status' },
                  { id: 'Disalurkan', label: 'Disalurkan' },
                  { id: 'Menunggu Verifikasi', label: 'Verifikasi' },
                  { id: 'Belum Diambil', label: 'Belum Diambil' },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setSelectedStatus(st.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedStatus === st.id
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {(selectedType !== 'ALL' || selectedStatus !== 'ALL' || selectedRt !== 'ALL' || selectedKategoriKhusus !== 'ALL' || searchQuery) && (
                <button
                  onClick={handleResetFilters}
                  className="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                  title="Reset Semua Filter"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
          </>
        )}
      </div>

      {/* 4. Content Area: Penyaluran Resmi List ATAU Daftar Cadangan Tab */}
      {activeMainTab === 'cadangan' ? (
        <CadanganBansosTab
          profile={profile}
          cadanganList={cadanganBansosList}
          wargaList={wargaList}
          onSaveCadangan={onSaveCadanganBansos || (() => {})}
          onDeleteCadangan={onDeleteCadanganBansos || (() => {})}
          onOpenAdd={handleOpenAddCadangan}
          onEditItem={handleEditCadangan}
          onPromoteToBansos={handlePromoteToBansos}
        />
      ) : (
        <div className="space-y-3">
          {filteredBansos.length === 0 ? (
            <div className="bg-white p-10 rounded-3xl text-center border border-slate-200 shadow-xs">
              <Gift className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <h4 className="text-base font-bold text-slate-800">Tidak ada data bansos yang sesuai</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Silakan sesuaikan kata kunci pencarian, filter program, atau tambah pencatatan penerima bansos baru.
              </p>
              <button
                onClick={handleOpenAdd}
                className="mt-4 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                + Tambah Data Penerima Bansos
              </button>
            </div>
          ) : (
            filteredBansos.map((item, idx) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-amber-400/80 shadow-xs hover:shadow-md transition-all p-4 sm:p-5 group"
              >
                {/* Baris Atas Kartu (Header Baris Rata Kiri & Kanan) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  {/* Sisi Kiri Atas: Nama, RT, Program Badge & Nomor */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-400/40 text-amber-700 flex items-center justify-center font-black text-sm shrink-0 shadow-2xs">
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-black text-slate-900 tracking-tight truncate">
                          {item.namaPenerima}
                        </h3>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-200 text-[11px] font-black">
                          RT {item.rt}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-black">
                          {item.jenisBansos}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Sisi Kanan Atas: Status Penyaluran & Aksi Cepat */}
                  <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-black flex items-center gap-1.5 shadow-2xs border ${
                        item.status === 'Disalurkan'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : item.status === 'Menunggu Verifikasi'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}
                    >
                      {item.status === 'Disalurkan' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                      )}
                      <span>{item.status}</span>
                    </span>

                    {item.status !== 'Disalurkan' && (
                      <button
                        onClick={() => handleQuickMarkDisalurkan(item)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-2xs active:scale-95 cursor-pointer"
                        title="Tandai Sudah Diserahkan"
                      >
                        <Check className="w-3 h-3" />
                        <span>Serahkan</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Baris Tengah Kartu (Grid 2 Kolom Kiri-Kanan Simetris) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-3 text-xs">
                  {/* Kolom Kiri: Identitas Kependudukan */}
                  <div className="space-y-1.5 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400" /> NIK Penerima:
                      </span>
                      <span className="font-mono font-bold text-slate-900">{item.nik}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                        <Building className="w-3.5 h-3.5 text-slate-400" /> No KK:
                      </span>
                      <span className="font-mono font-bold text-slate-900">{item.noKk || '-'}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" /> Periode Bantuan:
                      </span>
                      <span className="font-bold text-slate-900">{item.periode}</span>
                    </div>
                  </div>

                  {/* Kolom Kanan: Rincian Paket & Tanggal Penyerahan */}
                  <div className="space-y-1.5 bg-amber-50/40 p-3 rounded-xl border border-amber-100">
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="flex items-center gap-1.5 text-amber-800 font-semibold">
                        <Package className="w-3.5 h-3.5 text-amber-600" /> Bentuk/Paket:
                      </span>
                      <span className="font-bold text-slate-900 text-right">{item.nominalOrPaket}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" /> Tanggal Serah:
                      </span>
                      <span className="font-semibold text-slate-900">
                        {item.tanggalPenyaluran ? formatTanggalIndo(item.tanggalPenyaluran) : 'Belum Diserahkan'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> Petugas/Saksi:
                      </span>
                      <span className="font-semibold text-slate-900 truncate max-w-[180px]" title={item.petugasPenyalur}>
                        {item.petugasPenyalur || `Ketua RW (${profile.namaKetuaRw})`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Baris Bawah Kartu (Footer Baris Rata Kiri & Kanan) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2.5 border-t border-slate-100 text-xs">
                  {/* Sisi Kiri Bawah: Catatan / Keterangan */}
                  <div className="min-w-0 flex-1">
                    {item.keterangan && item.keterangan !== '-' ? (
                      <div className="text-[11px] text-slate-600 flex items-center gap-1.5 truncate">
                        <span className="font-bold text-slate-700">Catatan:</span>
                        <span className="italic text-slate-500">{item.keterangan}</span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 italic">
                        Dokumentasi resmi bansos terintegrasi RW 018
                      </div>
                    )}
                  </div>

                  {/* Sisi Kanan Bawah: Action Buttons (Edit & Hapus) */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      title="Edit Data Bansos"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => setDeleteConfirmId(item.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      title="Hapus Data Bansos"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Form Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-amber-700 to-amber-800 p-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                  <Gift className="w-4 h-4 text-amber-200" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">
                    {editingBansos ? 'Perbarui Data Bansos' : 'Catat Penyaluran Bansos Baru'}
                  </h3>
                  <p className="text-xs text-amber-200">Wilayah {profile.namaRw} Kel. {profile.kelurahan}</p>
                </div>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-amber-600/80 text-white cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              {/* 1. Baris Pencarian Data Induk Warga RW 018 */}
              <div
                ref={wargaSearchContainerRef}
                className="p-3.5 bg-gradient-to-br from-emerald-50/90 to-teal-50/70 rounded-2xl border border-emerald-200 shadow-2xs relative space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <label className="font-black text-emerald-950 flex items-center gap-1.5 text-xs">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                    Pencarian Data Induk Warga RW 018
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px] border border-emerald-200">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      {wargaList.length} Warga Terdaftar
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Ketik <strong className="font-bold">Nama</strong> atau <strong className="font-bold">NIK</strong> warga untuk mencari di database dan mengisi form otomatis. Syarat penerima bansos wajib terdaftar di Data Induk RW 018.
                </p>

                {/* Input Pencarian dengan Filter RT */}
                <div className="flex items-center gap-1.5">
                  <div className="relative shrink-0">
                    <select
                      value={wargaSearchRtFilter}
                      onChange={(e) => setWargaSearchRtFilter(e.target.value)}
                      className="h-9 px-2.5 bg-white border border-emerald-300 rounded-xl font-bold text-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                      title="Filter RT Pencarian"
                    >
                      <option value="ALL">Semua RT</option>
                      {profile.daftarRt.map((rt) => (
                        <option key={rt} value={rt}>
                          RT {rt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-600">
                      <Search className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={wargaSearchTerm}
                      onChange={(e) => handleSearchTermChange(e.target.value)}
                      onFocus={() => setIsWargaSearchFocused(true)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (searchedWargaList.length > 0) {
                            handleSelectWarga(searchedWargaList[0]);
                          }
                        }
                      }}
                      placeholder="Ketik Nama atau NIK warga (misal: Eko / 1871...)"
                      className="w-full pl-9 pr-8 py-2 bg-white border border-emerald-300 rounded-xl font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none text-xs shadow-2xs"
                    />
                    {wargaSearchTerm && (
                      <button
                        type="button"
                        onClick={() => {
                          setWargaSearchTerm('');
                          setIsWargaSearchFocused(false);
                        }}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Banner Auto-Fill Berhasil */}
                {autoFillSuccessMessage && (
                  <div className="p-2.5 bg-emerald-600 text-white rounded-xl flex items-center justify-between gap-2 shadow-xs animate-fadeIn">
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <Sparkles className="w-4 h-4 text-emerald-200 shrink-0" />
                      <span>{autoFillSuccessMessage}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAutoFillSuccessMessage(null)}
                      className="text-emerald-100 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Live Dropdown Pencarian & Pemilihan Warga Terdaftar (Urut A - Z) */}
                {isWargaSearchFocused && (
                  <div className="bg-white border border-emerald-300 rounded-2xl shadow-xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-slate-100 z-20">
                    {searchedWargaList.length > 0 ? (
                      <div>
                        <div className="px-3 py-1.5 bg-emerald-100/80 text-emerald-950 font-bold text-[10px] flex items-center justify-between sticky top-0 z-10 backdrop-blur-xs border-b border-emerald-200">
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            {wargaSearchTerm.trim()
                              ? `Hasil Pencarian (Urut A - Z): ${searchedWargaList.length} Warga`
                              : `Daftar Warga RW 018 (Urut A - Z): ${searchedWargaList.length} Warga`}
                          </span>
                          <span className="text-emerald-800 italic text-[9px]">
                            Klik salah satu untuk Auto-Fill
                          </span>
                        </div>
                        {searchedWargaList.map((w) => {
                          const isSelected = formData.nik === w.nik;
                          const usia = hitungUsia(w.tanggalLahir);
                          return (
                            <div
                              key={w.id}
                              onClick={() => handleSelectWarga(w)}
                              className={`p-2.5 hover:bg-emerald-50/80 cursor-pointer transition-colors flex items-center justify-between gap-2.5 ${
                                isSelected ? 'bg-emerald-100/50' : ''
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                                    w.jenisKelamin === 'L'
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-pink-100 text-pink-700'
                                  }`}
                                >
                                  {w.nama.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-slate-900 truncate">{w.nama}</span>
                                    <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded font-bold text-[10px]">
                                      RT {w.rt}
                                    </span>
                                    {w.statusKeluarga === 'Kepala Keluarga' && (
                                      <span className="px-1.5 py-0.2 bg-blue-50 text-blue-700 border border-blue-200 rounded font-semibold text-[9px]">
                                        Kepala KK
                                      </span>
                                    )}
                                    {w.isLansia && (
                                      <span className="px-1.5 py-0.2 bg-amber-50 text-amber-700 border border-amber-200 rounded font-semibold text-[9px]">
                                        Lansia ({usia} th)
                                      </span>
                                    )}
                                    {w.isDisabilitas && (
                                      <span className="px-1.5 py-0.2 bg-purple-50 text-purple-700 border border-purple-200 rounded font-semibold text-[9px]">
                                        Disabilitas
                                      </span>
                                    )}
                                    {w.isDudaJanda && (
                                      <span className="px-1.5 py-0.2 bg-rose-50 text-rose-700 border border-rose-200 rounded font-semibold text-[9px]">
                                        Duda/Janda
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 mt-0.5 truncate">
                                    <span>NIK: {w.nik}</span>
                                    <span>•</span>
                                    <span>KK: {w.noKk}</span>
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] shrink-0 flex items-center gap-1 shadow-2xs cursor-pointer"
                              >
                                <Check className="w-3 h-3" />
                                <span>Pilih</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 text-center space-y-1.5">
                        <AlertTriangle className="w-5 h-5 text-amber-500 mx-auto" />
                        <div className="font-bold text-slate-800">Warga Tidak Ditemukan di RW 018</div>
                        <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                          Warga dengan nama/NIK <strong className="font-mono text-rose-600">"{wargaSearchTerm}"</strong> tidak terdaftar di Data Induk RW 018. Syarat penerima bansos wajib terdaftar di RW 018.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Status Verifikasi Warga Terpilih */}
                {registeredWargaInForm ? (
                  <div className="p-2.5 bg-white border border-emerald-300 rounded-xl flex items-center justify-between gap-2 text-slate-800 shadow-2xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <CheckCheck className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-black text-emerald-950 text-xs truncate">
                            {registeredWargaInForm.nama}
                          </span>
                          <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                            RT {registeredWargaInForm.rt}
                          </span>
                          <span className="text-[10px] text-emerald-700 font-bold">
                            ✓ Terdaftar di Data Induk RW 018
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-2 truncate mt-0.5">
                          <span className="font-mono">NIK: {registeredWargaInForm.nik}</span>
                          <span>•</span>
                          <span className="font-mono">KK: {registeredWargaInForm.noKk}</span>
                          <span>•</span>
                          <span>{registeredWargaInForm.statusKeluarga}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleClearSelectedWarga}
                      className="px-2 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 rounded-lg text-[10px] font-bold transition-colors shrink-0 cursor-pointer"
                      title="Batalkan pilihan & cari warga lain"
                    >
                      Ganti
                    </button>
                  </div>
                ) : formData.nik && formData.nik.length >= 8 ? (
                  <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-[11px]">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>
                      <strong className="font-bold">Perhatian:</strong> NIK ini belum terdaftar di Data Induk Warga RW 018. Gunakan pencarian di atas untuk memilih warga yang sah.
                    </span>
                  </div>
                ) : null}
              </div>

              {/* 2. Rincian Data Penerima Bansos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>NIK Penerima *</span>
                    {registeredWargaInForm ? (
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCheck className="w-3 h-3" />
                        Terdaftar di RW 018
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">16 Digit NIK</span>
                    )}
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={16}
                    placeholder="187102xxxxxxxxxx"
                    value={formData.nik || ''}
                    onChange={(e) => handleNikInputChange(e.target.value)}
                    className={`w-full p-2.5 bg-slate-50 border rounded-xl font-mono font-bold focus:ring-2 focus:bg-white focus:outline-none ${
                      registeredWargaInForm
                        ? 'border-emerald-300 focus:ring-emerald-600 bg-emerald-50/20'
                        : 'border-slate-300 focus:ring-amber-600'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor KK</label>
                  <input
                    type="text"
                    maxLength={16}
                    placeholder="187102xxxxxxxxxx"
                    value={formData.noKk || ''}
                    onChange={(e) => setFormData({ ...formData, noKk: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-amber-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div ref={namaInputContainerRef} className="sm:col-span-2 relative">
                  <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Nama Lengkap Penerima *</span>
                    {registeredWargaInForm && (
                      <span className="text-[10px] text-emerald-600 font-bold">Auto-Fill Aktif</span>
                    )}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ketik Nama Lengkap Warga..."
                    value={formData.namaPenerima || ''}
                    onChange={(e) => handleNamaInputChange(e.target.value)}
                    onFocus={() => setIsNamaInputFocused(true)}
                    className={`w-full p-2.5 bg-slate-50 border rounded-xl font-bold focus:ring-2 focus:bg-white focus:outline-none ${
                      registeredWargaInForm
                        ? 'border-emerald-300 focus:ring-emerald-600 bg-emerald-50/20'
                        : 'border-slate-300 focus:ring-amber-600'
                    }`}
                  />

                  {/* Dropdown Saran Nama Warga */}
                  {isNamaInputFocused && namaSuggestions.length > 0 && !registeredWargaInForm && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-emerald-300 rounded-xl shadow-xl overflow-hidden z-30 divide-y divide-slate-100">
                      <div className="px-3 py-1 bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                        Pilih untuk Auto-Fill NIK, No. KK & RT:
                      </div>
                      {namaSuggestions.map((w) => (
                        <div
                          key={w.id}
                          onClick={() => handleSelectWarga(w)}
                          className="p-2 hover:bg-emerald-50 cursor-pointer flex items-center justify-between gap-2 text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-900">{w.nama}</span>
                            <span className="ml-1.5 text-[10px] text-slate-500 font-mono">
                              (NIK: {w.nik} - RT {w.rt})
                            </span>
                          </div>
                          <span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[9px] font-bold">
                            Pilih
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">RT Domisili *</label>
                  <select
                    value={formData.rt || profile.daftarRt[0] || '039'}
                    onChange={(e) => setFormData({ ...formData, rt: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-amber-600 focus:bg-white focus:outline-none"
                  >
                    {profile.daftarRt.map((rt) => (
                      <option key={rt} value={rt}>
                        RT {rt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 3. Program & Rincian Bansos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jenis Bansos *</label>
                  <select
                    value={formData.jenisBansos || 'Beras CBP 10kg'}
                    onChange={(e) =>
                      setFormData({ ...formData, jenisBansos: e.target.value as BansosType })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-amber-600 focus:bg-white focus:outline-none"
                  >
                    {allBansosTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Periode Bantuan</label>
                  <input
                    type="text"
                    placeholder="Contoh: Agustus 2026"
                    value={formData.periode || ''}
                    onChange={(e) => setFormData({ ...formData, periode: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-amber-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Bentuk / Nominal Paket *</label>
                <input
                  type="text"
                  placeholder="Contoh: 10 Kg Beras Medium Bulog / Tunai Rp 600.000"
                  value={formData.nominalOrPaket || ''}
                  onChange={(e) => setFormData({ ...formData, nominalOrPaket: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-amber-600 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Penyaluran</label>
                  <select
                    value={formData.status || 'Disalurkan'}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as BansosStatus })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-amber-600 focus:bg-white focus:outline-none"
                  >
                    <option value="Disalurkan">Disalurkan (Diterima)</option>
                    <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
                    <option value="Belum Diambil">Belum Diambil</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Penyaluran</label>
                  <input
                    type="date"
                    value={formData.tanggalPenyaluran || ''}
                    onChange={(e) => setFormData({ ...formData, tanggalPenyaluran: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-amber-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Petugas Penyalur / Saksi</label>
                <input
                  type="text"
                  placeholder="Nama Pengurus / Ketua RT"
                  value={formData.petugasPenyalur || ''}
                  onChange={(e) => setFormData({ ...formData, petugasPenyalur: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-amber-600 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Keterangan Tambahan</label>
                <textarea
                  rows={2}
                  placeholder="Catatan kondisi penerima atau tanda terima..."
                  value={formData.keterangan || ''}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-amber-600 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white rounded-xl font-black shadow-md shadow-amber-800/20 cursor-pointer transition-all active:scale-95"
                >
                  Simpan Data Bansos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-3 text-center border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-2xs">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-black text-slate-900">Hapus Data Bansos?</h4>
            <p className="text-xs text-slate-500">
              Data penerima bansos ini akan dihapus permanen dari catatan administrasi RW 018.
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
                  onDeleteBansos(deleteConfirmId);
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
      {/* Laporan Modal (Tabel Rinci & Rekap Semua Jenis Bantuan) */}
      <BansosReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        bansosList={bansosList}
        profile={profile}
      />

      {/* Cadangan Bansos Modal (Input Cadangan Warga Berhak dari Data Induk) */}
      <CadanganBansosModal
        isOpen={isCadanganModalOpen}
        onClose={() => {
          setIsCadanganModalOpen(false);
          setEditingCadanganItem(null);
        }}
        onSave={(item) => {
          if (onSaveCadanganBansos) {
            onSaveCadanganBansos(item);
          }
        }}
        editingItem={editingCadanganItem}
        wargaList={wargaList}
        profile={profile}
        currentUser={currentUser}
      />
    </div>
  );
};
