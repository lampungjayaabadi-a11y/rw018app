import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Users,
  Search,
  X,
  Check,
  UserCheck,
  AlertTriangle,
  Building,
  Sparkles,
  MapPin,
  IdCard,
  HeartHandshake,
  ShieldCheck,
  Tag,
  FileText,
  Clock
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
import { generateId, hitungUsia } from '../utils/formatters';

interface CadanganBansosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: CadanganBansosItem) => void;
  wargaList: Warga[];
  profile: RWProfile;
  editingItem?: CadanganBansosItem | null;
  currentUser?: AppUser | null;
}

export const CadanganBansosModal: React.FC<CadanganBansosModalProps> = ({
  isOpen,
  onClose,
  onSave,
  wargaList,
  profile,
  editingItem,
  currentUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchRtFilter, setSearchRtFilter] = useState('ALL');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedWarga, setSelectedWarga] = useState<Warga | null>(null);
  const [autoFillFeedback, setAutoFillFeedback] = useState<string | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<CadanganBansosItem>>({
    nik: '',
    nama: '',
    noKk: '',
    alamat: '',
    rt: profile.daftarRt[0] || '039',
    kategori: 'Prasejahtera',
    prioritas: 'Prioritas 1 (Mendesak / Sangat Layak)',
    status: 'Menunggu Kuota',
    targetJenisBansos: 'Beras CBP 10kg',
    alasanKelayakan: '',
    petugasPencatat: currentUser?.name ? `${currentUser.name} (${currentUser.role})` : `Ketua RW (${profile.namaKetuaRw})`,
  });

  // Populate form on edit or reset on open
  useEffect(() => {
    if (isOpen) {
      if (editingItem) {
        setFormData({ ...editingItem });
        const existing = wargaList.find((w) => w.nik === editingItem.nik);
        setSelectedWarga(existing || null);
        setSearchTerm('');
      } else {
        setFormData({
          nik: '',
          nama: '',
          noKk: '',
          alamat: '',
          rt: profile.daftarRt[0] || '039',
          kategori: 'Prasejahtera',
          prioritas: 'Prioritas 1 (Mendesak / Sangat Layak)',
          status: 'Menunggu Kuota',
          targetJenisBansos: 'Beras CBP 10kg',
          alasanKelayakan: '',
          petugasPencatat: currentUser?.name ? `${currentUser.name} (${currentUser.role})` : `Ketua RW (${profile.namaKetuaRw})`,
        });
        setSelectedWarga(null);
        setSearchTerm('');
        setAutoFillFeedback(null);
      }
    }
  }, [isOpen, editingItem, wargaList, profile, currentUser]);

  // Click outside to close search suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter citizens from Data Induk RW 018
  const searchedWarga = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return wargaList
      .filter((w) => {
        const matchRt =
          searchRtFilter === 'ALL' ||
          w.rt === searchRtFilter ||
          w.rt === searchRtFilter.replace(/^0+/, '');
        if (!matchRt) return false;

        if (!term) return true;
        const matchNama = w.nama.toLowerCase().includes(term);
        const matchNik = w.nik.includes(term);
        const matchKk = w.noKk ? w.noKk.includes(term) : false;
        const matchAlamat = w.alamat ? w.alamat.toLowerCase().includes(term) : false;

        return matchNama || matchNik || matchKk || matchAlamat;
      })
      .sort((a, b) => a.nama.localeCompare(b.nama, 'id'))
      .slice(0, 30);
  }, [wargaList, searchTerm, searchRtFilter]);

  // Handle citizen selection
  const handleSelectWarga = (w: Warga) => {
    setSelectedWarga(w);
    
    // Auto-detect category based on citizen profile
    let detectedKategori: KategoriCadanganBansos = 'Prasejahtera';
    const usia = hitungUsia(w.tanggalLahir);
    if (w.isDisabilitas) {
      detectedKategori = 'Disabilitas';
    } else if (w.isLansia || usia >= 60) {
      detectedKategori = 'Lansia';
    } else if (w.isDudaJanda || w.statusKawin === 'Cerai Mati' || w.statusKawin === 'Cerai Hidup') {
      detectedKategori = 'Duda / Janda';
    }

    setFormData((prev) => ({
      ...prev,
      nik: w.nik,
      nama: w.nama,
      noKk: w.noKk || '',
      alamat: w.alamat || `RT ${w.rt} RW 018`,
      rt: w.rt || profile.daftarRt[0] || '039',
      kategori: detectedKategori,
    }));

    setIsSearchFocused(false);
    setSearchTerm('');
    setAutoFillFeedback(
      `✓ Data warga "${w.nama}" (NIK: ${w.nik}, RT ${w.rt}) berhasil di-autofill dari Data Induk!`
    );
    setTimeout(() => setAutoFillFeedback(null), 4000);
  };

  // Direct NIK input auto-fill
  const handleNikChange = (nikVal: string) => {
    setFormData((prev) => ({ ...prev, nik: nikVal }));
    const cleanNik = nikVal.trim();
    if (cleanNik.length >= 8) {
      const match = wargaList.find((w) => w.nik === cleanNik);
      if (match) {
        handleSelectWarga(match);
      }
    }
  };

  // Direct Nama input auto-fill
  const handleNamaChange = (namaVal: string) => {
    setFormData((prev) => ({ ...prev, nama: namaVal }));
    const clean = namaVal.trim().toLowerCase();
    if (clean.length >= 3) {
      const exactMatches = wargaList.filter((w) => w.nama.toLowerCase() === clean);
      if (exactMatches.length === 1) {
        handleSelectWarga(exactMatches[0]);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nik?.trim() || !formData.nama?.trim() || !formData.rt) {
      alert('Mohon lengkapi NIK, Nama Warga, dan RT!');
      return;
    }

    // SYARAT WAJIB: Terdaftar di Data Induk Warga RW 018
    const isRegistered = wargaList.some((w) => w.nik === formData.nik?.trim());
    if (!isRegistered) {
      alert(
        `⚠️ PERINGATAN VALIDASI DATA INDUK:\n\nNIK "${formData.nik}" (${formData.nama}) TIDAK TERDAFTAR dalam Data Induk Kependudukan RW 018.\n\nSesuai SOP, warga cadangan penerima bansos wajib terdaftar di Data Induk RW 018. Silakan gunakan fitur pencarian untuk memilih warga yang valid.`
      );
      return;
    }

    const itemToSave: CadanganBansosItem = {
      id: editingItem ? editingItem.id : generateId('cdg'),
      nik: formData.nik.trim(),
      nama: formData.nama.trim(),
      noKk: formData.noKk?.trim() || '',
      alamat: formData.alamat?.trim() || `RT ${formData.rt} RW 018`,
      rt: formData.rt || '039',
      kategori: formData.kategori || 'Prasejahtera',
      prioritas: formData.prioritas || 'Prioritas 1 (Mendesak / Sangat Layak)',
      status: formData.status || 'Menunggu Kuota',
      targetJenisBansos: formData.targetJenisBansos || 'Beras CBP 10kg',
      alasanKelayakan: formData.alasanKelayakan?.trim() || 'Warga layak dan berhak mendapatkan bantuan sosial cadangan.',
      tanggalDaftar: editingItem?.tanggalDaftar || new Date().toISOString().slice(0, 10),
      petugasPencatat: formData.petugasPencatat || `Ketua RW (${profile.namaKetuaRw})`,
    };

    onSave(itemToSave);
    onClose();
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
  ];

  const prioritasOptions: PrioritasCadangan[] = [
    'Prioritas 1 (Mendesak / Sangat Layak)',
    'Prioritas 2 (Layak)',
    'Cadangan Reguler',
  ];

  const kategoriOptions: KategoriCadanganBansos[] = [
    'Lansia',
    'Disabilitas',
    'Duda / Janda',
    'Prasejahtera',
    'Yatim / Piatu',
    'Umum',
  ];

  const statusOptions: StatusCadanganBansos[] = [
    'Menunggu Kuota',
    'Dalam Proses Usulan',
    'Telah Dipromosikan',
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center font-bold text-white shadow-2xs">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                {editingItem ? 'Edit Data Cadangan Bansos' : 'Input Cadangan Penerima Bansos'}
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-bold border border-white/30">
                  Data Induk RW 018
                </span>
              </h3>
              <p className="text-xs text-amber-100 mt-0.5">
                Pencatatan warga terdaftar di data induk yang berhak & siap dipromosikan saat kuota bansos tersedia.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm">
          {/* 1. SMART LOOKUP DARI DATA INDUK */}
          <div className="bg-gradient-to-br from-amber-50/80 to-orange-50/60 p-3.5 sm:p-4 rounded-2xl border border-amber-200/90 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" />
                <span className="font-extrabold text-amber-950 text-xs uppercase tracking-wider">
                  Cari Warga di Data Induk RW 018 (Auto-Fill Cepat)
                </span>
              </div>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-md">
                {wargaList.length} Warga Terdaftar
              </span>
            </div>

            <div className="relative" ref={searchContainerRef}>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Ketik Nama, NIK, atau Alamat warga..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    className="w-full pl-9 pr-8 py-2 bg-white border border-amber-300/80 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <select
                  value={searchRtFilter}
                  onChange={(e) => setSearchRtFilter(e.target.value)}
                  className="bg-white border border-amber-300/80 rounded-xl px-2 py-2 font-bold text-slate-700 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="ALL">Semua RT</option>
                  {profile.daftarRt.map((rt) => (
                    <option key={rt} value={rt}>
                      RT {rt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Suggestions Dropdown */}
              {isSearchFocused && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-200 z-30 max-h-56 overflow-y-auto divide-y divide-slate-100">
                  {searchedWarga.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-500">
                      Tidak ditemukan warga dengan kata kunci "{searchTerm}".
                    </div>
                  ) : (
                    searchedWarga.map((w) => {
                      const usia = hitungUsia(w.tanggalLahir);
                      return (
                        <div
                          key={w.id}
                          onClick={() => handleSelectWarga(w)}
                          className="p-2.5 hover:bg-amber-50 flex items-center justify-between cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0">
                              {w.nama.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{w.nama}</span>
                                <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-800 font-bold rounded">
                                  RT {w.rt}
                                </span>
                                {usia >= 60 && (
                                  <span className="text-[9px] px-1 bg-purple-100 text-purple-700 font-bold rounded">
                                    Lansia ({usia} th)
                                  </span>
                                )}
                                {w.isDisabilitas && (
                                  <span className="text-[9px] px-1 bg-rose-100 text-rose-700 font-bold rounded">
                                    Disabilitas
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500">
                                NIK: {w.nik} • {w.alamat || `RT ${w.rt}`}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="px-2.5 py-1 bg-amber-600 text-white rounded-lg text-[10px] font-bold shrink-0"
                          >
                            Pilih
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Auto-fill notification */}
            {autoFillFeedback && (
              <div className="p-2 bg-emerald-100/80 border border-emerald-300 rounded-xl text-[11px] font-bold text-emerald-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{autoFillFeedback}</span>
              </div>
            )}
          </div>

          {/* 2. INFORMASI IDENTITAS WARGA */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <span className="font-black text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <IdCard className="w-4 h-4 text-amber-600" /> Identitas Warga Penerima
              </span>
              {selectedWarga ? (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Terverifikasi di Data Induk
                </span>
              ) : (
                <span className="text-[10px] text-slate-400">Pilih dari search di atas atau input manual</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Lengkap Warga *
                </label>
                <input
                  type="text"
                  placeholder="Nama sesuai KTP"
                  value={formData.nama || ''}
                  onChange={(e) => handleNamaChange(e.target.value)}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nomor Induk Kependudukan (NIK) *
                </label>
                <input
                  type="text"
                  placeholder="16 digit NIK"
                  value={formData.nik || ''}
                  onChange={(e) => handleNikChange(e.target.value)}
                  maxLength={16}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nomor Kartu Keluarga (KK)
                </label>
                <input
                  type="text"
                  placeholder="16 digit No KK"
                  value={formData.noKk || ''}
                  onChange={(e) => setFormData({ ...formData, noKk: e.target.value })}
                  maxLength={16}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Wilayah RT *
                </label>
                <select
                  value={formData.rt || '039'}
                  onChange={(e) => setFormData({ ...formData, rt: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none"
                >
                  {profile.daftarRt.map((rt) => (
                    <option key={rt} value={rt}>
                      RT {rt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Kategori Warga
                </label>
                <select
                  value={formData.kategori || 'Prasejahtera'}
                  onChange={(e) =>
                    setFormData({ ...formData, kategori: e.target.value as KategoriCadanganBansos })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none"
                >
                  {kategoriOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Alamat Lengkap Rumah *</span>
                <span className="text-[10px] text-slate-400 font-normal">Nama Jalan / Gang & No. Rumah</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Jl. Pala VII No. 12 RT 039 RW 018"
                value={formData.alamat || ''}
                onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* 3. DETAIL KELAYAKAN & USULAN BANSOS */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <span className="font-black text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <HeartHandshake className="w-4 h-4 text-orange-600" /> Detail Usulan & Skala Prioritas
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tingkat Prioritas Kelayakan *
                </label>
                <select
                  value={formData.prioritas || 'Prioritas 1 (Mendesak / Sangat Layak)'}
                  onChange={(e) =>
                    setFormData({ ...formData, prioritas: e.target.value as PrioritasCadangan })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-black text-amber-900 focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none"
                >
                  {prioritasOptions.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Target Program Bansos Usulan
                </label>
                <select
                  value={formData.targetJenisBansos || 'Beras CBP 10kg'}
                  onChange={(e) => setFormData({ ...formData, targetJenisBansos: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none"
                >
                  {allBansosTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Status Antrean Cadangan
                </label>
                <select
                  value={formData.status || 'Menunggu Kuota'}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as StatusCadanganBansos })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none"
                >
                  {statusOptions.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Petugas Pencatat / Pengusul
                </label>
                <input
                  type="text"
                  placeholder="Nama Pengurus RT/RW"
                  value={formData.petugasPencatat || ''}
                  onChange={(e) => setFormData({ ...formData, petugasPencatat: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Alasan Kelayakan / Kondisi Khusus Warga
              </label>
              <textarea
                rows={2}
                placeholder="Contoh: Lansia tinggal sendiri, belum tersentuh bantuan PKH/CBP, penghasilan tidak tetap..."
                value={formData.alasanKelayakan || ''}
                onChange={(e) => setFormData({ ...formData, alasanKelayakan: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition-colors text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-700 hover:to-orange-800 text-white rounded-xl font-black shadow-md shadow-amber-600/20 cursor-pointer transition-all active:scale-95 text-xs flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{editingItem ? 'Simpan Perubahan' : 'Simpan Data Cadangan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
