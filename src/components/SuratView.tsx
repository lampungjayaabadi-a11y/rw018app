import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  FileText,
  Search,
  Plus,
  Printer,
  Download,
  Trash2,
  Edit2,
  CheckCircle2,
  Calendar,
  User,
  MapPin,
  Building,
  Eye,
  X,
  FileCheck,
  QrCode,
  Megaphone,
  AlertCircle,
  ShieldCheck,
  Hammer,
  Filter,
  Lock,
  ArrowLeft,
  Check,
  RotateCcw,
  UserCheck,
  Sparkles
} from 'lucide-react';
import { SuratItem, SuratType, Warga, RWProfile, AppUser, PengaduanWarga } from '../types';
import { generateId, formatTanggalIndo } from '../utils/formatters';
import { getUserRestrictedRt, isMatchingRt } from '../services/auth';

interface SuratViewProps {
  profile: RWProfile;
  suratList: SuratItem[];
  wargaList: Warga[];
  onSaveSurat: (item: SuratItem) => void;
  onDeleteSurat: (id: string) => void;
  onOpenPrintModal: (surat: SuratItem) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  initialSelectedWarga?: Warga | null;
  currentUser?: AppUser | null;
  onSavePengaduan?: (aduan: PengaduanWarga) => void;
}

export const SuratView: React.FC<SuratViewProps> = ({
  profile,
  suratList,
  wargaList,
  onSaveSurat,
  onDeleteSurat,
  onOpenPrintModal,
  searchQuery,
  onSearchChange,
  initialSelectedWarga,
  currentUser,
  onSavePengaduan,
}) => {
  const restrictedRt = getUserRestrictedRt(currentUser);

  // Scoped lists for Ketua RT
  const scopedSuratList = useMemo(() => {
    if (!restrictedRt) return suratList;
    return suratList.filter((s) => isMatchingRt(s.rt, restrictedRt));
  }, [suratList, restrictedRt]);

  const scopedWargaList = useMemo(() => {
    if (!restrictedRt) return wargaList;
    return wargaList.filter((w) => isMatchingRt(w.rt, restrictedRt));
  }, [wargaList, restrictedRt]);

  const [selectedRt, setSelectedRt] = useState<string>(restrictedRt || 'ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');

  // Sync selected RT when login role changes
  useEffect(() => {
    if (restrictedRt) {
      setSelectedRt(restrictedRt);
    } else {
      setSelectedRt('ALL');
    }
  }, [restrictedRt]);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSurat, setEditingSurat] = useState<SuratItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // State for typed citizen search inside modal
  const [wargaSearchInput, setWargaSearchInput] = useState<string>('');
  const [selectedWarga, setSelectedWarga] = useState<Warga | null>(initialSelectedWarga || null);
  const [isCitizenDropdownOpen, setIsCitizenDropdownOpen] = useState<boolean>(false);
  const citizenSearchRef = useRef<HTMLDivElement>(null);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (citizenSearchRef.current && !citizenSearchRef.current.contains(e.target as Node)) {
        setIsCitizenDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRomanMonth = (monthIdx: number): string => {
    const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    return romans[monthIdx] || 'VIII';
  };

  const getNextNoSurat = () => {
    const currentMonthRoman = getRomanMonth(new Date().getMonth());
    const year = new Date().getFullYear();
    const seq = 470 + suratList.length + 1;
    return `${seq}/018/HB/${currentMonthRoman}/${year}`;
  };

  const initialForm: Partial<SuratItem> = {
    noSurat: getNextNoSurat(),
    jenisSurat: 'Surat Pengantar SKCK',
    nikPemohon: initialSelectedWarga?.nik || '',
    namaPemohon: initialSelectedWarga?.nama || '',
    tempatTglLahir: initialSelectedWarga
      ? `${initialSelectedWarga.tempatLahir}, ${formatTanggalIndo(initialSelectedWarga.tanggalLahir)}`
      : '',
    pekerjaan: initialSelectedWarga?.pekerjaan || '',
    agama: initialSelectedWarga?.agama || 'Islam',
    rt: restrictedRt || initialSelectedWarga?.rt || profile.daftarRt[0] || '039',
    alamat: initialSelectedWarga?.alamat || '',
    keperluan: 'Persyaratan pengurusan surat di Kantor Kelurahan / Instansi Terkait',
    tanggalSurat: new Date().toISOString().slice(0, 10),
    namaKetuaRw: profile.namaKetuaRw,
    status: 'Diterbitkan',
    catatan: 'Orang tersebut di atas adalah benar warga RW 018 dan berkelakuan baik.',
  };

  const [formData, setFormData] = useState<Partial<SuratItem>>(initialForm);

  // Apply citizen data to form
  const applyCitizenData = (found: Warga) => {
    setFormData((prev) => ({
      ...prev,
      nikPemohon: found.nik,
      namaPemohon: found.nama,
      tempatTglLahir: `${found.tempatLahir}, ${formatTanggalIndo(found.tanggalLahir)}`,
      pekerjaan: found.pekerjaan || '-',
      agama: found.agama || 'Islam',
      rt: restrictedRt || found.rt,
      alamat: `${found.alamat}, RT ${found.rt} RW 018`,
    }));
    setSelectedWarga(found);
    setWargaSearchInput(`${found.nama} (${found.nik})`);
    setIsCitizenDropdownOpen(false);
  };

  const handleClearCitizenSelection = () => {
    setSelectedWarga(null);
    setWargaSearchInput('');
    setIsCitizenDropdownOpen(false);
  };

  // Sync initialSelectedWarga if passed from parent
  useEffect(() => {
    if (initialSelectedWarga) {
      applyCitizenData(initialSelectedWarga);
      setIsCreateModalOpen(true);
    }
  }, [initialSelectedWarga]);

  // Filtered citizen suggestions for typed search
  const filteredCitizenSuggestions = useMemo(() => {
    const q = wargaSearchInput.trim().toLowerCase();
    if (!q) return [];
    return scopedWargaList
      .filter((w) => w.nama.toLowerCase().includes(q) || w.nik.includes(q))
      .slice(0, 10);
  }, [scopedWargaList, wargaSearchInput]);

  // Filtered letters
  const filteredSurat = useMemo(() => {
    return scopedSuratList.filter((s) => {
      // RT Filter
      if (selectedRt !== 'ALL' && !isMatchingRt(s.rt, selectedRt)) {
        return false;
      }

      // Type filter
      if (selectedTypeFilter !== 'ALL' && s.jenisSurat !== selectedTypeFilter) {
        return false;
      }

      // Search query
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;

      return (
        s.namaPemohon.toLowerCase().includes(q) ||
        s.nikPemohon.includes(q) ||
        s.noSurat.toLowerCase().includes(q) ||
        s.keperluan.toLowerCase().includes(q) ||
        s.jenisSurat.toLowerCase().includes(q) ||
        s.rt.includes(q) ||
        (s.catatan && s.catatan.toLowerCase().includes(q))
      );
    });
  }, [scopedSuratList, searchQuery, selectedTypeFilter, selectedRt]);

  // Handle citizen selection from dropdown
  const handleSelectCitizen = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedNik = e.target.value;
    if (!selectedNik) {
      handleClearCitizenSelection();
      return;
    }
    const found = scopedWargaList.find((w) => w.nik === selectedNik);
    if (found) {
      applyCitizenData(found);
    }
  };

  const handleOpenAdd = () => {
    setEditingSurat(null);
    setSelectedWarga(null);
    setWargaSearchInput('');
    setIsCitizenDropdownOpen(false);
    setFormData({
      ...initialForm,
      noSurat: getNextNoSurat(),
      jenisSurat: 'Surat Pengantar SKCK',
      rt: restrictedRt || (selectedRt !== 'ALL' ? selectedRt : profile.daftarRt[0] || '039'),
      keperluan: 'Persyaratan pengurusan surat di Kantor Kelurahan / Instansi Terkait',
      catatan: 'Orang tersebut di atas adalah benar warga RW 018 dan berkelakuan baik.',
      tanggalSurat: new Date().toISOString().slice(0, 10),
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenAduan = () => {
    setEditingSurat(null);
    setSelectedWarga(null);
    setWargaSearchInput('');
    setIsCitizenDropdownOpen(false);
    setFormData({
      ...initialForm,
      noSurat: getNextNoSurat(),
      jenisSurat: 'Surat Pengaduan & Aspirasi Warga',
      rt: restrictedRt || (selectedRt !== 'ALL' ? selectedRt : profile.daftarRt[0] || '039'),
      keperluan: 'Menyampaikan permohonan penanganan masalah lingkungan / fasilitas umum di wilayah RW 018',
      catatan: 'Diharapkan pengurus RT/RW dapat segera meninjau ke lokasi dan berkoordinasi.',
      tanggalSurat: new Date().toISOString().slice(0, 10),
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (item: SuratItem) => {
    setEditingSurat(item);
    setFormData({ ...item });
    const matching = scopedWargaList.find((w) => w.nik === item.nikPemohon);
    setSelectedWarga(matching || null);
    setWargaSearchInput(item.namaPemohon ? `${item.namaPemohon} (${item.nikPemohon})` : '');
    setIsCitizenDropdownOpen(false);
    setIsCreateModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaPemohon || !formData.nikPemohon || !formData.keperluan) {
      alert('Mohon lengkapi Nama Pemohon, NIK, dan Keperluan / Uraian Surat!');
      return;
    }

    const saved: SuratItem = {
      id: editingSurat ? editingSurat.id : generateId('srt'),
      noSurat: formData.noSurat || getNextNoSurat(),
      jenisSurat: (formData.jenisSurat as SuratType) || 'Surat Pengantar SKCK',
      nikPemohon: formData.nikPemohon || '',
      namaPemohon: formData.namaPemohon || '',
      tempatTglLahir: formData.tempatTglLahir || '-',
      pekerjaan: formData.pekerjaan || '-',
      agama: formData.agama || 'Islam',
      rt: restrictedRt || formData.rt || profile.daftarRt[0] || '039',
      alamat: formData.alamat || `RT ${formData.rt || profile.daftarRt[0] || '039'} ${profile.namaRw}`,
      keperluan: formData.keperluan || '',
      tanggalSurat: formData.tanggalSurat || new Date().toISOString().slice(0, 10),
      berlakuHingga: formData.berlakuHingga,
      namaKetuaRw: formData.namaKetuaRw || profile.namaKetuaRw,
      status: (formData.status as any) || 'Diterbitkan',
      catatan: formData.catatan || '',
    };

    onSaveSurat(saved);

    // If this is an aduan and onSavePengaduan is provided, also sync into pengaduan list
    if (
      (saved.jenisSurat === 'Surat Pengaduan & Aspirasi Warga' || saved.jenisSurat === 'Surat Aduan Lingkungan Warga') &&
      onSavePengaduan
    ) {
      const fullAspirasi = `${saved.keperluan}${saved.catatan ? ` (Catatan: ${saved.catatan})` : ''}`;
      onSavePengaduan({
        id: generateId('aduan'),
        namaPelapor: saved.namaPemohon || 'Warga RW 018',
        namaWarga: saved.namaPemohon || 'Warga RW 018',
        nikPelapor: saved.nikPemohon || '',
        nikWarga: saved.nikPemohon || '',
        rt: saved.rt || '039',
        tanggal: saved.tanggalSurat,
        tanggalLapor: saved.tanggalSurat,
        kategori: 'Fasilitas Umum & Jalan',
        judul: `Aduan Warga: ${saved.keperluan.slice(0, 50)}...`,
        deskripsi: fullAspirasi,
        isi: fullAspirasi,
        isiPengaduan: fullAspirasi,
        status: 'Masuk',
        prioritas: 'Sedang',
        tanggapan: 'Surat aduan resmi telah diterima sistem dan siap ditindaklanjuti pengurus.',
      });
    }

    setIsCreateModalOpen(false);
    // Immediately trigger printable modal
    onOpenPrintModal(saved);
  };

  // Export CSV Handler
  const handleExportCsv = () => {
    if (filteredSurat.length === 0) {
      alert('Tidak ada data surat untuk diekspor.');
      return;
    }

    const headers = [
      'No',
      'Nomor Surat',
      'Tanggal Surat',
      'Jenis Surat',
      'Nama Pemohon',
      'NIK Pemohon',
      'RT',
      'Pekerjaan',
      'Agama',
      'Alamat',
      'Keperluan',
      'Nama Ketua RW',
      'Status',
      'Catatan',
    ];

    const rows = filteredSurat.map((s, idx) => [
      idx + 1,
      `"${s.noSurat}"`,
      `"${s.tanggalSurat}"`,
      `"${s.jenisSurat}"`,
      `"${s.namaPemohon}"`,
      `'${s.nikPemohon}`,
      `"RT ${s.rt}"`,
      `"${s.pekerjaan || '-'}"`,
      `"${s.agama || '-'}"`,
      `"${s.alamat || '-'}"`,
      `"${(s.keperluan || '').replace(/"/g, '""')}"`,
      `"${s.namaKetuaRw}"`,
      `"${s.status}"`,
      `"${(s.catatan || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Arsip_Surat_Pengantar_RW018_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const allSuratTypes: SuratType[] = [
    'Surat Pengantar KTP / KK',
    'Surat Pengantar SKCK',
    'Surat Keterangan Domisili',
    'Surat Keterangan Tidak Mampu (SKTM)',
    'Surat Keterangan Usaha (SKU)',
    'Surat Keterangan Kematian',
    'Surat Pengantar Pindah / Datang',
    'Surat Keterangan Izin Keramaian',
    'Surat Keterangan Kelakuan Baik',
    'Surat Keterangan Belum Menikah',
    'Surat Pengaduan & Aspirasi Warga',
    'Surat Aduan Lingkungan Warga',
  ];

  const getSuratBadgeClass = (type: string) => {
    if (type.includes('Aduan') || type.includes('Pengaduan')) {
      return 'bg-rose-100 text-rose-800 border-rose-200';
    }
    if (type.includes('SKCK') || type.includes('Kelakuan Baik')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    if (type.includes('Domisili') || type.includes('KTP')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
    if (type.includes('SKTM') || type.includes('Tidak Mampu')) {
      return 'bg-amber-100 text-amber-800 border-amber-200';
    }
    if (type.includes('SKU') || type.includes('Usaha')) {
      return 'bg-purple-100 text-purple-800 border-purple-200';
    }
    if (type.includes('Kematian')) {
      return 'bg-slate-100 text-slate-800 border-slate-300';
    }
    return 'bg-teal-100 text-teal-800 border-teal-200';
  };

  return (
    <div className="space-y-3.5 p-3 sm:p-4 pb-16 max-w-6xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-1.5">
                <FileText className="w-5 h-5 text-emerald-700 shrink-0" />
                <span>Administrasi Surat Pengantar & Pelayanan Warga</span>
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                {scopedSuratList.length} Arsip Surat {restrictedRt ? `RT ${restrictedRt}` : ''}
              </span>
              {restrictedRt && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  RT {restrictedRt}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              {restrictedRt
                ? `Pengelolaan dan penerbitan surat pengantar khusus wilayah RT ${restrictedRt}. Dilengkapi penomoran otomatis & validasi QR Code.`
                : 'Layanan penerbitan surat pengantar resmi Ketua RW 018, surat aduan lingkungan, penomoran terpadu & arsip cetak digital.'}
            </p>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="grid grid-cols-3 sm:flex sm:items-center gap-1.5 self-stretch sm:self-center shrink-0">
            <button
              onClick={handleExportCsv}
              className="flex items-center justify-center gap-1 px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95"
              title="Ekspor Data Arsip Surat ke CSV / Excel"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Export</span>
              <span className="sm:hidden text-[11px]">CSV</span>
            </button>

            <button
              onClick={handleOpenAduan}
              className="flex items-center justify-center gap-1 px-2.5 sm:px-3 py-2 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95"
              title="Tulis Surat Pengaduan & Aspirasi Lingkungan"
            >
              <Megaphone className="w-3.5 h-3.5 text-amber-200 shrink-0" />
              <span className="truncate text-[11px] sm:text-xs">Aduan Warga</span>
            </button>

            <button
              onClick={handleOpenAdd}
              className="flex items-center justify-center gap-1 px-2.5 sm:px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95"
              title="Buat Surat Pengantar Baru"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate text-[11px] sm:text-xs">Buat Surat</span>
            </button>
          </div>
        </div>

        {/* Search Bar & Aligned Filters */}
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-2.5">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari Nomor Surat, Nama Pemohon, NIK (16 digit), Keperluan, atau RT..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                title="Hapus Pencarian"
              >
                ✕
              </button>
            )}
          </div>

          {/* Baris 1: Filter RT Sejajar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-xs">
            {restrictedRt ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 font-bold text-xs shadow-2xs shrink-0">
                <Lock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>Wilayah Tugas: RT {restrictedRt}</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-700 text-white text-[10px] font-black">{scopedSuratList.length} Surat</span>
              </div>
            ) : (
              <>
                <span className="text-slate-400 font-bold flex items-center gap-1 shrink-0 mr-0.5 text-[11px]">
                  <Filter className="w-3 h-3 text-emerald-600" /> RT:
                </span>
                <button
                  onClick={() => setSelectedRt('ALL')}
                  className={`px-2.5 py-1 rounded-xl font-bold transition-all text-xs shrink-0 ${
                    selectedRt === 'ALL'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Semua ({scopedSuratList.length})
                </button>
                {profile.daftarRt.map((rt) => {
                  const count = scopedSuratList.filter((s) => isMatchingRt(s.rt, rt)).length;
                  return (
                    <button
                      key={rt}
                      onClick={() => setSelectedRt(rt)}
                      className={`px-2.5 py-1 rounded-xl font-bold transition-all text-xs shrink-0 ${
                        selectedRt === rt
                          ? 'bg-emerald-700 text-white shadow-xs'
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

          {/* Baris 2: Sub-Filter Jenis Surat Sejajar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-xs">
            <span className="text-slate-400 font-bold shrink-0 text-[11px]">Jenis:</span>
            <button
              onClick={() => setSelectedTypeFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all shrink-0 ${
                selectedTypeFilter === 'ALL'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Jenis ({filteredSurat.length})
            </button>
            {allSuratTypes.map((type) => {
              const count = scopedSuratList.filter((s) => s.jenisSurat === type).length;
              if (count === 0 && selectedTypeFilter !== type) return null;
              const isAduan = type.includes('Aduan') || type.includes('Pengaduan');
              return (
                <button
                  key={type}
                  onClick={() => setSelectedTypeFilter(type)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all shrink-0 flex items-center gap-1 ${
                    selectedTypeFilter === type
                      ? isAduan
                        ? 'bg-rose-700 text-white shadow-xs'
                        : 'bg-emerald-700 text-white shadow-xs'
                      : isAduan
                      ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {isAduan && <Megaphone className="w-3 h-3 text-rose-500" />}
                  <span>
                    {type.replace('Surat Keterangan ', 'SK ').replace('Surat Pengantar ', 'SP ')} ({count})
                  </span>
                </button>
              );
            })}

            {(selectedTypeFilter !== 'ALL' || (selectedRt !== 'ALL' && !restrictedRt) || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedTypeFilter('ALL');
                  if (!restrictedRt) setSelectedRt('ALL');
                  onSearchChange('');
                }}
                className="px-2 py-1 text-[10px] font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg shrink-0 transition-colors"
                title="Reset Semua Filter"
              >
                ✕ Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table Card Layout */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredSurat.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <h4 className="text-sm font-bold text-slate-700">Tidak ada data surat yang sesuai kriteria</h4>
            <p className="text-xs text-slate-500 mt-1">
              Silakan sesuaikan kata kunci pencarian atau filter RT / Jenis Surat di atas.
            </p>
            <div className="flex justify-center gap-2 mt-3">
              <button
                onClick={() => {
                  setSelectedTypeFilter('ALL');
                  if (!restrictedRt) setSelectedRt('ALL');
                  onSearchChange('');
                }}
                className="px-3.5 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
              >
                Reset Filter
              </button>
              <button
                onClick={handleOpenAdd}
                className="px-3.5 py-1.5 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800"
              >
                + Buat Surat Baru
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-3.5 text-center w-12">No</th>
                  <th className="py-3 px-3.5 min-w-[200px]">Nomor & Tanggal Surat</th>
                  <th className="py-3 px-3.5 min-w-[190px]">Pemohon / Warga</th>
                  <th className="py-3 px-3.5 min-w-[260px]">Jenis Surat & Keperluan</th>
                  <th className="py-3 px-3.5 min-w-[120px] text-center">Status</th>
                  <th className="py-3 px-3.5 min-w-[150px] text-center">Aksi Administrasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSurat.map((surat, index) => {
                  const isAduan =
                    surat.jenisSurat.includes('Aduan') || surat.jenisSurat.includes('Pengaduan');
                  return (
                    <tr
                      key={surat.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Column 1: Index */}
                      <td className="py-3 px-3.5 text-center font-bold text-slate-400 text-xs">
                        {index + 1}
                      </td>

                      {/* Column 2: Nomor & Tanggal */}
                      <td className="py-3 px-3.5 align-top">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="font-mono font-bold text-slate-900 text-xs bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              {surat.noSurat}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500">
                            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{formatTanggalIndo(surat.tanggalSurat)}</span>
                          </div>
                        </div>
                      </td>

                      {/* Column 3: Pemohon & NIK */}
                      <td className="py-3 px-3.5 align-top">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-xs hover:text-emerald-800 transition-colors">
                              {surat.namaPemohon}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                              RT {surat.rt}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-500">
                            NIK: {surat.nikPemohon}
                          </div>
                          {surat.pekerjaan && surat.pekerjaan !== '-' && (
                            <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                              {surat.pekerjaan}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Column 4: Jenis Surat & Keperluan */}
                      <td className="py-3 px-3.5 align-top">
                        <div className="space-y-1.5">
                          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${getSuratBadgeClass(surat.jenisSurat)}`}>
                            {isAduan && <Megaphone className="w-3 h-3 shrink-0" />}
                            <span>{surat.jenisSurat}</span>
                          </div>
                          <p className="text-[11px] text-slate-700 font-medium leading-snug line-clamp-2">
                            {surat.keperluan}
                          </p>
                          {surat.catatan && (
                            <p className="text-[10px] text-slate-400 italic line-clamp-1">
                              Ket: {surat.catatan}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Column 5: Status */}
                      <td className="py-3 px-3.5 align-top text-center">
                        <div className="inline-flex flex-col items-center gap-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>{surat.status || 'Diterbitkan'}</span>
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono">
                            QR Valid
                          </span>
                        </div>
                      </td>

                      {/* Column 6: Action Buttons */}
                      <td className="py-3 px-3.5 align-top text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onOpenPrintModal(surat)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-2xs active:scale-95 transition-all"
                            title="Pratinjau & Cetak Surat Pengantar (PDF/Print)"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Cetak</span>
                          </button>

                          <button
                            onClick={() => handleOpenEdit(surat)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                            title="Edit Data Surat"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setDeleteConfirmId(surat.id)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors"
                            title="Hapus Arsip Surat"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer Summary */}
        <div className="bg-slate-50/80 px-4 py-2.5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            Menampilkan <span className="font-bold text-slate-800">{filteredSurat.length}</span> dari{' '}
            <span className="font-bold text-slate-800">{scopedSuratList.length}</span> total surat tercatat
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Valid & Terverifikasi
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span> Surat Aduan Warga
            </span>
          </div>
        </div>
      </div>

      {/* Form Buat / Edit Surat Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-xl overflow-hidden my-6">
            <div
              className={`p-3.5 sm:p-4 text-white flex items-center justify-between gap-3 ${
                formData.jenisSurat?.includes('Aduan') || formData.jenisSurat?.includes('Pengaduan')
                  ? 'bg-gradient-to-r from-amber-700 to-rose-700'
                  : 'bg-emerald-800'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-2.5 py-1.5 bg-black/20 hover:bg-black/35 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border border-white/20 shadow-2xs shrink-0 cursor-pointer active:scale-95"
                  title="Kembali ke menu sebelumnya"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-amber-300" />
                  <span>Kembali</span>
                </button>

                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold flex items-center gap-1.5 truncate">
                    {formData.jenisSurat?.includes('Aduan') || formData.jenisSurat?.includes('Pengaduan') ? (
                      <Megaphone className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300 shrink-0" />
                    ) : (
                      <FileCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-300 shrink-0" />
                    )}
                    <span className="truncate">
                      {editingSurat
                        ? 'Edit Surat'
                        : formData.jenisSurat?.includes('Aduan') || formData.jenisSurat?.includes('Pengaduan')
                        ? 'Formulir Surat Aduan & Aspirasi'
                        : 'Penerbitan Surat Pengantar & Keterangan'}
                    </span>
                  </h3>
                  <p className="text-[11px] text-white/80 truncate">
                    Kop Resmi {profile.namaRw} {profile.kelurahan.toUpperCase()}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsCreateModalOpen(false)}
                title="Tutup (Kembali)"
                className="p-1.5 rounded-xl hover:bg-black/20 text-white cursor-pointer shrink-0 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-3.5 text-xs max-h-[80vh] overflow-y-auto">
              {(formData.jenisSurat?.includes('Aduan') || formData.jenisSurat?.includes('Pengaduan')) && (
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-2.5">
                  <Megaphone className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div className="text-amber-950 text-xs leading-relaxed">
                    <p className="font-bold">Layanan Surat Aduan & Aspirasi Lingkungan Warga</p>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      Surat aduan ini dibuat resmi dengan Kop RW 018, dicatat dalam arsip administrasi, dan langsung diteruskan ke Ketua RT/RW untuk ditindaklanjuti secara berjenjang.
                    </p>
                  </div>
                </div>
              )}

              {/* Pilihan Warga Terdaftar (Pencarian Mode Ketik NIK atau Nama & Dropdown) */}
              <div className="p-3.5 sm:p-4 bg-emerald-50/90 dark:bg-slate-800/90 rounded-2xl border border-emerald-300 dark:border-emerald-700/80 shadow-2xs space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <label className="block text-xs font-black text-emerald-950 dark:text-emerald-300 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                    <span>Pencarian Data Warga Terdaftar (Mode Ketik NIK / Nama)</span>
                  </label>
                  {selectedWarga ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>Warga Terpilih: {selectedWarga.nama}</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                      Otomatis mengisi field formulir jika ditemukan
                    </span>
                  )}
                </div>

                {/* Input Pencarian Mode Ketik NIK atau Nama */}
                <div ref={citizenSearchRef} className="relative">
                  <div className="relative">
                    <Search className="w-4 h-4 text-emerald-700 dark:text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={wargaSearchInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setWargaSearchInput(val);
                        setIsCitizenDropdownOpen(true);
                        
                        // Cek kecocokan otomatis bila diketik 16 digit NIK
                        const cleanVal = val.trim().toLowerCase();
                        if (cleanVal.length === 16 && /^\d+$/.test(cleanVal)) {
                          const exactWarga = scopedWargaList.find((w) => w.nik === cleanVal);
                          if (exactWarga) {
                            applyCitizenData(exactWarga);
                          }
                        }
                      }}
                      onFocus={() => {
                        if (wargaSearchInput.trim().length > 0) {
                          setIsCitizenDropdownOpen(true);
                        }
                      }}
                      placeholder="Ketik NIK 16 digit atau Nama warga... (contoh: 1871... atau Budi)"
                      className="w-full pl-9 pr-9 py-2.5 bg-white dark:bg-slate-900 border-2 border-emerald-400 dark:border-emerald-600 rounded-xl font-medium text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 shadow-2xs"
                    />
                    {wargaSearchInput && (
                      <button
                        type="button"
                        onClick={handleClearCitizenSelection}
                        title="Hapus pencarian / ganti warga"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Dropdown Hasil Pencarian Otomatis saat mengetik */}
                  {isCitizenDropdownOpen && wargaSearchInput.trim().length > 0 && !selectedWarga && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-2xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                      {filteredCitizenSuggestions.length > 0 ? (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                          <div className="p-2 bg-emerald-100/70 dark:bg-emerald-950/70 text-[10px] font-bold text-emerald-900 dark:text-emerald-300 flex items-center justify-between">
                            <span>Ditemukan {filteredCitizenSuggestions.length} warga cocok:</span>
                            <span className="text-slate-500 font-normal">Klik untuk mengisi otomatis</span>
                          </div>
                          {filteredCitizenSuggestions.map((w) => (
                            <button
                              key={w.id}
                              type="button"
                              onClick={() => applyCitizenData(w)}
                              className="w-full p-2.5 text-left hover:bg-emerald-50 dark:hover:bg-slate-800/80 flex items-center justify-between gap-2.5 transition-colors group cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center text-xs shrink-0 border border-emerald-300/60 dark:border-emerald-800">
                                  {w.nama.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-slate-900 dark:text-slate-100 text-xs group-hover:text-emerald-700 dark:group-hover:text-emerald-300 truncate">
                                      {w.nama}
                                    </span>
                                    <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                      RT {w.rt}
                                    </span>
                                  </div>
                                  <div className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
                                    NIK: {w.nik}
                                  </div>
                                  <div className="text-[10px] text-slate-400 truncate max-w-[280px]">
                                    {w.alamat} • {w.pekerjaan || 'Warga'}
                                  </div>
                                </div>
                              </div>
                              <div className="shrink-0">
                                <span className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1 shadow-2xs">
                                  <span>Pilih</span>
                                  <Check className="w-3 h-3" />
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3.5 text-center text-xs text-slate-500 dark:text-slate-400">
                          <AlertCircle className="w-5 h-5 mx-auto text-amber-500 mb-1" />
                          <p className="font-semibold text-slate-700 dark:text-slate-200">
                            Warga Tidak Ditemukan
                          </p>
                          <p className="text-[11px] mt-0.5">
                            Tidak ada data dengan kata kunci &quot;{wargaSearchInput}&quot;. Anda tetap dapat mengisi data pemohon secara manual pada kolom di bawah.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Tampilan Data Warga Ketika Ditemukan & Terpilih */}
                {selectedWarga && (
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-300 dark:border-emerald-700 shadow-2xs space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white font-black flex items-center justify-center text-sm shadow-2xs shrink-0">
                          {selectedWarga.nama.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">
                              {selectedWarga.nama}
                            </h4>
                            <span className="px-1.5 py-0.2 rounded-md text-[9px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                              RT {selectedWarga.rt}
                            </span>
                            <span className="px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {selectedWarga.statusDomisili || 'Tetap'}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-emerald-800 dark:text-emerald-400 font-bold">
                            NIK: {selectedWarga.nik} • KK: {selectedWarga.noKk}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleClearCitizenSelection}
                        className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/60 dark:hover:text-rose-300 text-slate-600 dark:text-slate-300 text-[10px] font-bold flex items-center gap-1 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer shrink-0"
                        title="Ganti atau bersihkan pilihan warga"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Ganti Warga</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10.5px]">
                      <div>
                        <span className="text-slate-400 block text-[9.5px]">Tempat, Tgl Lahir:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200 truncate block">
                          {selectedWarga.tempatLahir}, {formatTanggalIndo(selectedWarga.tanggalLahir)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9.5px]">Pekerjaan & Agama:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200 truncate block">
                          {selectedWarga.pekerjaan || '-'} ({selectedWarga.agama})
                        </span>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-slate-400 block text-[9.5px]">Alamat Terdaftar:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200 truncate block">
                          {selectedWarga.alamat}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10.5px] text-emerald-800 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/70 p-1.5 rounded-lg font-semibold border border-emerald-200/80 dark:border-emerald-800/80">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Data warga di atas telah otomatis mengisi field Nama, NIK, TTL, Pekerjaan, Agama, RT, dan Alamat di bawah.</span>
                    </div>
                  </div>
                )}

                {/* Dropdown Alternatif Pilihan Langsung Semua Warga */}
                <div className="pt-1">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Atau pilih langsung dari daftar semua warga ({scopedWargaList.length} orang):
                  </label>
                  <select
                    value={selectedWarga?.nik || ''}
                    onChange={handleSelectCitizen}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >
                    <option value="">-- Pilih Warga Terdaftar (A-Z) --</option>
                    {scopedWargaList
                      .slice()
                      .sort((a, b) => a.nama.localeCompare(b.nama, 'id'))
                      .map((w) => (
                        <option key={w.id} value={w.nik}>
                          {w.nama} (NIK: {w.nik} - RT {w.rt})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor Surat *</label>
                  <input
                    type="text"
                    required
                    value={formData.noSurat || ''}
                    onChange={(e) => setFormData({ ...formData, noSurat: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-mono font-bold text-emerald-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jenis Surat *</label>
                  <select
                    value={formData.jenisSurat || 'Surat Pengantar SKCK'}
                    onChange={(e) =>
                      setFormData({ ...formData, jenisSurat: e.target.value as SuratType })
                    }
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                  >
                    {allSuratTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Pemohon / Pelapor *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama Lengkap Warga"
                    value={formData.namaPemohon || ''}
                    onChange={(e) => setFormData({ ...formData, namaPemohon: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">NIK Pemohon / Pelapor *</label>
                  <input
                    type="text"
                    required
                    maxLength={16}
                    placeholder="187102xxxxxxxxxx"
                    value={formData.nikPemohon || ''}
                    onChange={(e) => setFormData({ ...formData, nikPemohon: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tempat, Tanggal Lahir</label>
                  <input
                    type="text"
                    placeholder="Contoh: Bandar Lampung, 12 Maret 2004"
                    value={formData.tempatTglLahir || ''}
                    onChange={(e) => setFormData({ ...formData, tempatTglLahir: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pekerjaan</label>
                  <input
                    type="text"
                    placeholder="Wiraswasta / Mahasiswa / Karyawan"
                    value={formData.pekerjaan || ''}
                    onChange={(e) => setFormData({ ...formData, pekerjaan: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Agama</label>
                  <input
                    type="text"
                    value={formData.agama || 'Islam'}
                    onChange={(e) => setFormData({ ...formData, agama: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Wilayah RT * {restrictedRt && <span className="text-emerald-700 font-bold">(Terkunci RT {restrictedRt})</span>}
                  </label>
                  {restrictedRt ? (
                    <div className="w-full p-2 bg-slate-100 border border-slate-300 rounded-xl font-bold text-slate-800">
                      RT {restrictedRt}
                    </div>
                  ) : (
                    <select
                      value={formData.rt || profile.daftarRt[0] || '039'}
                      onChange={(e) => setFormData({ ...formData, rt: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                    >
                      {profile.daftarRt.map((rt) => (
                        <option key={rt} value={rt}>
                          RT {rt}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Alamat Lengkap</label>
                  <input
                    type="text"
                    placeholder="Jl. Cendrawasih No. 18, RT 003 RW 018"
                    value={formData.alamat || ''}
                    onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    {formData.jenisSurat?.includes('Aduan') || formData.jenisSurat?.includes('Pengaduan')
                      ? 'Uraian Pokok Aduan / Aspirasi Lingkungan Warga *'
                      : 'Maksud / Keperluan Pembuatan Surat *'}
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder={
                      formData.jenisSurat?.includes('Aduan') || formData.jenisSurat?.includes('Pengaduan')
                        ? 'Contoh: Melaporkan saluran drainase tersumbat di RT 039 yang menyebabkan genangan saat hujan lebat / Lampu penerangan jalan padam...'
                        : 'Contoh: Persyaratan melamar pekerjaan BUMN dan pengurusan SKCK di Polsek'
                    }
                    value={formData.keperluan || ''}
                    onChange={(e) => setFormData({ ...formData, keperluan: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Surat</label>
                  <input
                    type="date"
                    value={formData.tanggalSurat || ''}
                    onChange={(e) => setFormData({ ...formData, tanggalSurat: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Ketua RW</label>
                  <input
                    type="text"
                    value={formData.namaKetuaRw || profile.namaKetuaRw}
                    onChange={(e) => setFormData({ ...formData, namaKetuaRw: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    {formData.jenisSurat?.includes('Aduan') || formData.jenisSurat?.includes('Pengaduan')
                      ? 'Harapan Tindak Lanjut / Usulan Solusi Warga (Opsional)'
                      : 'Catatan Keterangan Tambahan'}
                  </label>
                  <input
                    type="text"
                    placeholder={
                      formData.jenisSurat?.includes('Aduan') || formData.jenisSurat?.includes('Pengaduan')
                        ? 'Contoh: Diharapkan pengurus RT/RW dapat meninjau ke lokasi dan mengagendakan kerja bakti.'
                        : 'Contoh: Orang tersebut di atas adalah benar warga RW 018 dan berkelakuan baik.'
                    }
                    value={formData.catatan || ''}
                    onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-white font-bold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer ${
                    formData.jenisSurat?.includes('Aduan') || formData.jenisSurat?.includes('Pengaduan')
                      ? 'bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700'
                      : 'bg-emerald-700 hover:bg-emerald-800'
                  }`}
                >
                  {editingSurat
                    ? 'Simpan Perubahan'
                    : formData.jenisSurat?.includes('Aduan') || formData.jenisSurat?.includes('Pengaduan')
                    ? 'Terbitkan & Cetak Surat Aduan'
                    : 'Terbitkan & Cetak Surat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-xl space-y-3 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-800">Hapus Arsip Surat?</h4>
            <p className="text-xs text-slate-500">
              Data arsip surat ini akan dihapus dari buku register administrasi.
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onDeleteSurat(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold"
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

