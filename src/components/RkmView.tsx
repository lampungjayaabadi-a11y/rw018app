import React, { useState, useMemo } from 'react';
import {
  HeartHandshake,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  AlertCircle,
  Download,
  Trash2,
  Edit2,
  X,
  Phone,
  Calendar,
  Layers,
  MapPin,
  FileText,
  User,
  Package,
  Clock,
  Printer,
  ShieldAlert,
  ArrowRightLeft,
  Users,
  Award,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Check
} from 'lucide-react';
import {
  IuranRkmRecord,
  WargaMeninggalRecord,
  PerlengkapanRkmItem,
  RWProfile,
  Gender
} from '../types';
import { formatRupiah, formatTanggalIndo, generateId } from '../utils/formatters';
import { exportRkmModule, exportToCsv, formatIuranRkmForExport, formatWargaMeninggalForExport, formatPerlengkapanRkmForExport } from '../utils/exportUtils';
import { ExportButton } from './ExportButton';

interface RkmViewProps {
  profile: RWProfile;
  iuranRkmList: IuranRkmRecord[];
  wargaMeninggalList: WargaMeninggalRecord[];
  perlengkapanRkmList: PerlengkapanRkmItem[];
  onSaveIuranRkm: (item: IuranRkmRecord) => void;
  onDeleteIuranRkm: (id: string) => void;
  onSaveWargaMeninggal: (item: WargaMeninggalRecord) => void;
  onDeleteWargaMeninggal: (id: string) => void;
  onSavePerlengkapanRkm: (item: PerlengkapanRkmItem) => void;
  onDeletePerlengkapanRkm: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onCreateSuratKematian?: (warga: { nama: string; nik: string; rt: string; alamat: string }) => void;
}

export const RkmView: React.FC<RkmViewProps> = ({
  profile,
  iuranRkmList = [],
  wargaMeninggalList = [],
  perlengkapanRkmList = [],
  onSaveIuranRkm,
  onDeleteIuranRkm,
  onSaveWargaMeninggal,
  onDeleteWargaMeninggal,
  onSavePerlengkapanRkm,
  onDeletePerlengkapanRkm,
  searchQuery,
  onSearchChange,
  onCreateSuratKematian,
}) => {
  // Active Sub-tab in RKM View: iuran | meninggal | perlengkapan | pengurus
  const [activeSubTab, setActiveSubTab] = useState<'iuran' | 'meninggal' | 'perlengkapan' | 'pengurus'>('iuran');

  // Filters
  const [selectedRt, setSelectedRt] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Helper to determine collector name by RT
  const getPetugasPenarikByRt = (rt: string) => {
    if (rt === '039') return 'Ketua RT 039 (Zaenal Fanani)';
    if (rt === '040') return 'Ketua RT 040 (Epi)';
    if (rt === '041') return 'Ketua RT 041 (Etty Herawati)';
    if (rt === '042') return 'Ketua RT 042 (Sefrizal)';
    return `Pengurus RKM ${profile.namaRw}`;
  };

  // Modal States
  const [isIuranModalOpen, setIsIuranModalOpen] = useState(false);
  const [editingIuran, setEditingIuran] = useState<IuranRkmRecord | null>(null);

  const [isMeninggalModalOpen, setIsMeninggalModalOpen] = useState(false);
  const [editingMeninggal, setEditingMeninggal] = useState<WargaMeninggalRecord | null>(null);

  const [isPerlengkapanModalOpen, setIsPerlengkapanModalOpen] = useState(false);
  const [editingPerlengkapan, setEditingPerlengkapan] = useState<PerlengkapanRkmItem | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'iuran' | 'meninggal' | 'perlengkapan';
    id: string;
    name: string;
  } | null>(null);

  // Forms
  const [iuranForm, setIuranForm] = useState<Partial<IuranRkmRecord>>({
    noKk: '',
    namaKepala: '',
    rt: '039',
    bulanTahun: '2026-08',
    nominal: 25000,
    status: 'Lunas',
    tanggalBayar: new Date().toISOString().split('T')[0],
    penerima: 'Ketua RT 039 (Zaenal Fanani)',
  });

  const [meninggalForm, setMeninggalForm] = useState<Partial<WargaMeninggalRecord>>({
    nik: '',
    nama: '',
    jenisKelamin: 'L',
    usia: 70,
    rt: '039',
    alamat: `Jl. Pala RT 039 ${profile.kelurahan}`,
    tanggalMeninggal: new Date().toISOString().split('T')[0],
    waktuMeninggal: '06.00 WIB',
    tempatMeninggal: 'Rumah Duka',
    penyebab: 'Sakit Usia Lanjut',
    lokasiPemakaman: 'TPU Muslim Iringmulyo',
    santunanRkm: 1500000,
    statusSantunan: 'Diserahkan',
    namaAhliWaris: '',
    hubunganWaris: 'Keluarga Kandung',
    noHpWaris: '',
    keterangan: '',
  });

  const [perlengkapanForm, setPerlengkapanForm] = useState<Partial<PerlengkapanRkmItem>>({
    namaBarang: '',
    kategori: 'Perawatan Jenazah',
    jumlah: 1,
    satuan: 'Unit',
    kondisi: 'Baik',
    status: 'Tersedia di Gudang',
    lokasiSimpan: `Gudang RKM Balai ${profile.namaRw}`,
    penanggungJawab: 'Koordinator RKM',
  });

  // Filtered lists
  const filteredIuran = useMemo(() => {
    return iuranRkmList.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.namaKepala.toLowerCase().includes(q) ||
        item.noKk.includes(q) ||
        item.rt.includes(q) ||
        item.bulanTahun.includes(q);
      const matchRt = selectedRt === 'ALL' || item.rt === selectedRt;
      const matchStatus = selectedStatus === 'ALL' || item.status === selectedStatus;
      return matchSearch && matchRt && matchStatus;
    });
  }, [iuranRkmList, searchQuery, selectedRt, selectedStatus]);

  const filteredMeninggal = useMemo(() => {
    return wargaMeninggalList.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.nama.toLowerCase().includes(q) ||
        item.nik.includes(q) ||
        item.namaAhliWaris.toLowerCase().includes(q) ||
        item.lokasiPemakaman.toLowerCase().includes(q);
      const matchRt = selectedRt === 'ALL' || item.rt === selectedRt;
      return matchSearch && matchRt;
    });
  }, [wargaMeninggalList, searchQuery, selectedRt]);

  const filteredPerlengkapan = useMemo(() => {
    return perlengkapanRkmList.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.namaBarang.toLowerCase().includes(q) ||
        item.lokasiSimpan.toLowerCase().includes(q) ||
        item.penanggungJawab.toLowerCase().includes(q) ||
        (item.peminjamSaatIni && item.peminjamSaatIni.toLowerCase().includes(q));
      return matchSearch;
    });
  }, [perlengkapanRkmList, searchQuery]);

  // Statistics
  const totalIuranTerkumpul = useMemo(() => {
    return iuranRkmList
      .filter((i) => i.status === 'Lunas')
      .reduce((acc, curr) => acc + (curr.nominal || 0), 0);
  }, [iuranRkmList]);

  const totalSantunanDisalurkan = useMemo(() => {
    return wargaMeninggalList.reduce((acc, curr) => acc + (curr.santunanRkm || 0), 0);
  }, [wargaMeninggalList]);

  // Handlers for Iuran
  const handleOpenAddIuran = () => {
    setEditingIuran(null);
    setIuranForm({
      noKk: '',
      namaKepala: '',
      rt: '039',
      bulanTahun: '2026-08',
      nominal: 25000,
      status: 'Lunas',
      tanggalBayar: new Date().toISOString().split('T')[0],
      penerima: `Pengurus RKM ${profile.namaRw}`,
    });
    setIsIuranModalOpen(true);
  };

  const handleOpenEditIuran = (item: IuranRkmRecord) => {
    setEditingIuran(item);
    setIuranForm({ ...item });
    setIsIuranModalOpen(true);
  };

  const handleSubmitIuran = (e: React.FormEvent) => {
    e.preventDefault();
    if (!iuranForm.namaKepala) {
      alert('Nama Kepala Keluarga wajib diisi');
      return;
    }
    const record: IuranRkmRecord = {
      id: editingIuran ? editingIuran.id : generateId('irkm'),
      noKk: iuranForm.noKk || '1872021001260000',
      namaKepala: iuranForm.namaKepala || '',
      rt: iuranForm.rt || '039',
      bulanTahun: iuranForm.bulanTahun || '2026-08',
      nominal: Number(iuranForm.nominal) || 0,
      status: (iuranForm.status as 'Lunas' | 'Belum Lunas') || 'Lunas',
      tanggalBayar: iuranForm.tanggalBayar || new Date().toISOString().split('T')[0],
      penerima: iuranForm.penerima || `Pengurus RKM ${profile.namaRw}`,
      kuitansiNo: editingIuran?.kuitansiNo || `RKM/${iuranForm.rt || '039'}/${Date.now().toString().slice(-4)}`
    };
    onSaveIuranRkm(record);
    setIsIuranModalOpen(false);
  };

  // Handlers for Meninggal
  const handleOpenAddMeninggal = () => {
    setEditingMeninggal(null);
    setMeninggalForm({
      nik: '',
      nama: '',
      jenisKelamin: 'L',
      usia: 70,
      rt: '039',
      alamat: `Jl. Pala RT 039 ${profile.kelurahan}`,
      tanggalMeninggal: new Date().toISOString().split('T')[0],
      waktuMeninggal: '06.00 WIB',
      tempatMeninggal: 'Rumah Duka',
      penyebab: 'Sakit Usia Lanjut',
      lokasiPemakaman: 'TPU Muslim Iringmulyo',
      santunanRkm: 1500000,
      statusSantunan: 'Diserahkan',
      namaAhliWaris: '',
      hubunganWaris: 'Keluarga Kandung',
      noHpWaris: '',
      keterangan: 'Layanan tenda, keranda, pemandian jenazah, dan santunan tunai dari RKM RW 018.',
    });
    setIsMeninggalModalOpen(true);
  };

  const handleOpenEditMeninggal = (item: WargaMeninggalRecord) => {
    setEditingMeninggal(item);
    setMeninggalForm({ ...item });
    setIsMeninggalModalOpen(true);
  };

  const handleSubmitMeninggal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meninggalForm.nama || !meninggalForm.tanggalMeninggal) {
      alert('Nama dan Tanggal Meninggal wajib diisi');
      return;
    }
    const record: WargaMeninggalRecord = {
      id: editingMeninggal ? editingMeninggal.id : generateId('wm'),
      nik: meninggalForm.nik || '1872020000000000',
      nama: meninggalForm.nama || '',
      jenisKelamin: (meninggalForm.jenisKelamin as Gender) || 'L',
      usia: Number(meninggalForm.usia) || 0,
      rt: meninggalForm.rt || '039',
      alamat: meninggalForm.alamat || `Jl. Pala ${profile.kelurahan}`,
      tanggalMeninggal: meninggalForm.tanggalMeninggal || '',
      waktuMeninggal: meninggalForm.waktuMeninggal || '',
      tempatMeninggal: meninggalForm.tempatMeninggal || 'Rumah Duka',
      penyebab: meninggalForm.penyebab || 'Sakit Usia Lanjut',
      lokasiPemakaman: meninggalForm.lokasiPemakaman || 'TPU Muslim Iringmulyo',
      santunanRkm: Number(meninggalForm.santunanRkm) || 1500000,
      statusSantunan: (meninggalForm.statusSantunan as any) || 'Diserahkan',
      namaAhliWaris: meninggalForm.namaAhliWaris || '',
      hubunganWaris: meninggalForm.hubunganWaris || 'Keluarga Kandung',
      noHpWaris: meninggalForm.noHpWaris || '',
      keterangan: meninggalForm.keterangan || '',
    };
    onSaveWargaMeninggal(record);
    setIsMeninggalModalOpen(false);
  };

  // Handlers for Perlengkapan
  const handleOpenAddPerlengkapan = () => {
    setEditingPerlengkapan(null);
    setPerlengkapanForm({
      namaBarang: '',
      kategori: 'Perawatan Jenazah',
      jumlah: 1,
      satuan: 'Unit',
      kondisi: 'Baik',
      status: 'Tersedia di Gudang',
      lokasiSimpan: `Gudang RKM Balai ${profile.namaRw}`,
      penanggungJawab: 'Koordinator RKM',
    });
    setIsPerlengkapanModalOpen(true);
  };

  const handleOpenEditPerlengkapan = (item: PerlengkapanRkmItem) => {
    setEditingPerlengkapan(item);
    setPerlengkapanForm({ ...item });
    setIsPerlengkapanModalOpen(true);
  };

  const handleSubmitPerlengkapan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!perlengkapanForm.namaBarang) {
      alert('Nama Perlengkapan RKM wajib diisi');
      return;
    }
    const record: PerlengkapanRkmItem = {
      id: editingPerlengkapan ? editingPerlengkapan.id : generateId('prkm'),
      namaBarang: perlengkapanForm.namaBarang || '',
      kategori: perlengkapanForm.kategori || 'Perawatan Jenazah',
      jumlah: Number(perlengkapanForm.jumlah) || 1,
      satuan: perlengkapanForm.satuan || 'Unit',
      kondisi: (perlengkapanForm.kondisi as any) || 'Baik',
      status: (perlengkapanForm.status as any) || 'Tersedia di Gudang',
      lokasiSimpan: perlengkapanForm.lokasiSimpan || `Gudang RKM ${profile.namaRw}`,
      peminjamSaatIni: perlengkapanForm.peminjamSaatIni || '',
      kontakPeminjam: perlengkapanForm.kontakPeminjam || '',
      tanggalPinjam: perlengkapanForm.tanggalPinjam || '',
      penanggungJawab: perlengkapanForm.penanggungJawab || 'Pengurus RKM',
    };
    onSavePerlengkapanRkm(record);
    setIsPerlengkapanModalOpen(false);
  };

  // Delete Action
  const handleConfirmDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'iuran') {
      onDeleteIuranRkm(deleteConfirm.id);
    } else if (deleteConfirm.type === 'meninggal') {
      onDeleteWargaMeninggal(deleteConfirm.id);
    } else if (deleteConfirm.type === 'perlengkapan') {
      onDeletePerlengkapanRkm(deleteConfirm.id);
    }
    setDeleteConfirm(null);
  };

  const handleExportExcel = () => {
    exportRkmModule(iuranRkmList, wargaMeninggalList, perlengkapanRkmList, 'xlsx');
  };

  const handleExportCSV = () => {
    if (activeSubTab === 'meninggal') {
      const data = formatWargaMeninggalForExport(wargaMeninggalList);
      exportToCsv(`Rekap_Warga_Meninggal_RKM_RW018_${new Date().toISOString().slice(0, 10)}`, data);
    } else if (activeSubTab === 'perlengkapan') {
      const data = formatPerlengkapanRkmForExport(perlengkapanRkmList);
      exportToCsv(`Inventaris_Perlengkapan_RKM_RW018_${new Date().toISOString().slice(0, 10)}`, data);
    } else {
      const data = formatIuranRkmForExport(iuranRkmList);
      exportToCsv(`Laporan_Iuran_RKM_RW018_${new Date().toISOString().slice(0, 10)}`, data);
    }
  };

  return (
    <div className="space-y-4 p-4 pb-12 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-800 to-teal-800 p-4 sm:p-5 rounded-3xl text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center text-amber-300 shrink-0 shadow-inner">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  Rukun Kematian Masyarakat (RKM) {profile.namaRw}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-emerald-950">
                  Sosial & Duka
                </span>
              </div>
              <p className="text-xs text-emerald-200 mt-1 max-w-xl">
                Pengelolaan iuran kematian, pencatatan warga wafat & santunan duka, serta inventaris perlengkapan jenazah (RT 039, RT 040, RT 041, RT 042).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
            <ExportButton
              label="Ekspor RKM"
              onExportExcel={handleExportExcel}
              onExportCsv={handleExportCSV}
              variant="subtle"
            />
            {activeSubTab === 'iuran' && (
              <button
                onClick={handleOpenAddIuran}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Input Iuran RKM</span>
              </button>
            )}
            {activeSubTab === 'meninggal' && (
              <button
                onClick={handleOpenAddMeninggal}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Catat Warga Wafat</span>
              </button>
            )}
            {activeSubTab === 'perlengkapan' && (
              <button
                onClick={handleOpenAddPerlengkapan}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Inventaris</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Stats Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-emerald-700/60 text-xs">
          <div className="bg-emerald-950/40 p-2.5 rounded-2xl border border-emerald-700/50">
            <span className="text-[11px] text-emerald-300 block">Total Iuran RKM Masuk</span>
            <span className="text-sm font-black text-amber-300">{formatRupiah(totalIuranTerkumpul)}</span>
          </div>
          <div className="bg-emerald-950/40 p-2.5 rounded-2xl border border-emerald-700/50">
            <span className="text-[11px] text-emerald-300 block">Total Santunan Disalurkan</span>
            <span className="text-sm font-black text-emerald-100">{formatRupiah(totalSantunanDisalurkan)}</span>
          </div>
          <div className="bg-emerald-950/40 p-2.5 rounded-2xl border border-emerald-700/50">
            <span className="text-[11px] text-emerald-300 block">Data Warga Meninggal</span>
            <span className="text-sm font-black text-white">{wargaMeninggalList.length} Jiwa</span>
          </div>
          <div className="bg-emerald-950/40 p-2.5 rounded-2xl border border-emerald-700/50">
            <span className="text-[11px] text-emerald-300 block">Perlengkapan Siaga</span>
            <span className="text-sm font-black text-white">{perlengkapanRkmList.length} Jenis Alat</span>
          </div>
        </div>
      </div>

      {/* Main Tab Selector (4 Sub-modules) */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-1.5">
        <button
          onClick={() => setActiveSubTab('iuran')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'iuran'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <HeartHandshake className="w-4 h-4" />
          <span>1. Data Iuran RKM Warga ({iuranRkmList.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('meninggal')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'meninggal'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <User className="w-4 h-4" />
          <span>2. Data Warga Yang Meninggal ({wargaMeninggalList.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('perlengkapan')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'perlengkapan'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>3. Data Perlengkapan RKM ({perlengkapanRkmList.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('pengurus')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'pengurus'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>4. Pengurus & Penarik Iuran</span>
        </button>
      </div>

      {/* Filter and Search Bar for active sub-tab */}
      {activeSubTab !== 'pengurus' && (
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
              <Filter className="w-3.5 h-3.5" />
              <span>Filter RT:</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSelectedRt('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                  selectedRt === 'ALL' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Semua RT
              </button>
              {['039', '040', '041', '042'].map((rt) => (
                <button
                  key={rt}
                  onClick={() => setSelectedRt(rt)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    selectedRt === rt ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  RT {rt}
                </button>
              ))}
            </div>

            {activeSubTab === 'iuran' && (
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="p-1.5 bg-slate-100 rounded-lg font-semibold text-slate-700 border-none text-xs"
              >
                <option value="ALL">Semua Status Bayar</option>
                <option value="Lunas">Lunas</option>
                <option value="Belum Lunas">Belum Lunas</option>
              </select>
            )}
          </div>

          <div className="text-slate-500 font-medium">
            Menampilkan {activeSubTab === 'iuran' ? filteredIuran.length : activeSubTab === 'meninggal' ? filteredMeninggal.length : filteredPerlengkapan.length} data
          </div>
        </div>
      )}

      {/* SUBTAB 1: DATA IURAN RKM WARGA */}
      {activeSubTab === 'iuran' && (
        <div className="space-y-3">
          {/* Banner Petugas Penarik Iuran RKM per RT */}
          <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-3.5">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-800 shrink-0" />
              <span className="font-bold text-emerald-950 text-xs">
                Seksi Penarik Iuran RKM: Ketua RT 039 - RT 042
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-emerald-100 shadow-2xs">
                <span className="text-[10px] font-bold text-emerald-700 uppercase block">Petugas RT 039</span>
                <span className="font-bold text-slate-800 text-xs block">Zaenal Fanani</span>
                <span className="text-[10px] text-slate-500">Ketua RT 039</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-emerald-100 shadow-2xs">
                <span className="text-[10px] font-bold text-emerald-700 uppercase block">Petugas RT 040</span>
                <span className="font-bold text-slate-800 text-xs block">Epi</span>
                <span className="text-[10px] text-slate-500">Ketua RT 040</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-emerald-100 shadow-2xs">
                <span className="text-[10px] font-bold text-emerald-700 uppercase block">Petugas RT 041</span>
                <span className="font-bold text-slate-800 text-xs block">Etty Herawati</span>
                <span className="text-[10px] text-slate-500">Ketua RT 041</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-emerald-100 shadow-2xs">
                <span className="text-[10px] font-bold text-emerald-700 uppercase block">Petugas RT 042</span>
                <span className="font-bold text-slate-800 text-xs block">Sefrizal</span>
                <span className="text-[10px] text-slate-500">Ketua RT 042</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">No. KK & Nama Kepala</th>
                    <th className="p-3">Wilayah RT</th>
                    <th className="p-3">Periode</th>
                    <th className="p-3">Nominal (Rp)</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Tgl Bayar & Kolektor</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredIuran.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3">
                        <span className="font-bold text-slate-800 block text-xs">{item.namaKepala}</span>
                        <span className="font-mono text-[10px] text-slate-400">KK: {item.noKk}</span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-100 text-slate-700">
                          RT {item.rt}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-slate-700">
                        {item.bulanTahun}
                      </td>
                      <td className="p-3 font-bold text-slate-800">
                        {item.nominal === 0 ? (
                          <span className="text-emerald-700 italic">Gratis (Dhuafa)</span>
                        ) : (
                          formatRupiah(item.nominal)
                        )}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            item.status === 'Lunas'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 text-[11px]">
                        <div>{item.tanggalBayar ? formatTanggalIndo(item.tanggalBayar) : '-'}</div>
                        <div className="text-[10px] text-slate-400">{item.penerima || '-'}</div>
                      </td>
                      <td className="p-3 text-right space-x-1">
                        <button
                          onClick={() => handleOpenEditIuran(item)}
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                          title="Edit Iuran"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteConfirm({
                              type: 'iuran',
                              id: item.id,
                              name: `Iuran RKM ${item.namaKepala} (${item.bulanTahun})`,
                            })
                          }
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                          title="Hapus Iuran"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredIuran.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs">
                Tidak ada data iuran RKM yang sesuai kriteria pencarian.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: DATA WARGA YANG MENINGGAL */}
      {activeSubTab === 'meninggal' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredMeninggal.map((wm) => (
            <div
              key={wm.id}
              className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-white mr-1.5">
                      RT {wm.rt}
                    </span>
                    <span className="text-[11px] text-slate-500 font-semibold">
                      Usia {wm.usia} Tahun ({wm.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'})
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Santunan: {formatRupiah(wm.santunanRkm)}
                  </span>
                </div>

                <h3 className="text-sm font-black text-slate-800 mt-2 leading-snug">
                  {wm.nama}
                </h3>
                <p className="font-mono text-[10px] text-slate-400">NIK: {wm.nik}</p>

                <div className="mt-3 space-y-1 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Wafat: {formatTanggalIndo(wm.tanggalMeninggal)} ({wm.waktuMeninggal || 'Pagi'})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">Pemakaman: {wm.lokasiPemakaman}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Ahli Waris: {wm.namaAhliWaris} ({wm.hubunganWaris})</span>
                  </div>
                  {wm.noHpWaris && (
                    <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      <span>{wm.noHpWaris}</span>
                    </div>
                  )}
                </div>

                {wm.keterangan && (
                  <p className="mt-2 text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    {wm.keterangan}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                {onCreateSuratKematian && (
                  <button
                    onClick={() =>
                      onCreateSuratKematian({
                        nama: wm.nama,
                        nik: wm.nik,
                        rt: wm.rt,
                        alamat: wm.alamat,
                      })
                    }
                    className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Buat Surat Kematian</span>
                  </button>
                )}

                <div className="flex items-center gap-1.5 ml-auto">
                  <button
                    onClick={() => handleOpenEditMeninggal(wm)}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs"
                    title="Edit Data"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() =>
                      setDeleteConfirm({
                        type: 'meninggal',
                        id: wm.id,
                        name: `Data Kematian: ${wm.nama}`,
                      })
                    }
                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs"
                    title="Hapus Data"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredMeninggal.length === 0 && (
            <div className="col-span-full p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
              Belum ada data warga meninggal yang tercatat.
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: DATA PERLENGKAPAN RKM */}
      {activeSubTab === 'perlengkapan' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredPerlengkapan.map((item) => (
            <div
              key={item.id}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                    {item.kategori}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.status === 'Tersedia di Gudang'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-800 mt-2">{item.namaBarang}</h3>

                <div className="mt-2.5 space-y-1 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Jumlah / Satuan:</span>
                    <span className="font-bold text-slate-800">
                      {item.jumlah} {item.satuan}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Kondisi Alat:</span>
                    <span
                      className={`font-bold ${
                        item.kondisi === 'Baik'
                          ? 'text-emerald-700'
                          : item.kondisi === 'Perlu Perbaikan'
                          ? 'text-amber-700'
                          : 'text-rose-700'
                      }`}
                    >
                      {item.kondisi}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Lokasi Simpan:</span>
                    <span className="font-semibold text-slate-700 text-right truncate max-w-[200px]">
                      {item.lokasiSimpan}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Penanggung Jawab:</span>
                    <span className="font-semibold text-slate-700">{item.penanggungJawab}</span>
                  </div>

                  {item.peminjamSaatIni && (
                    <div className="mt-2 p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
                      <div className="font-bold">Sedang Dipinjam Oleh:</div>
                      <div>{item.peminjamSaatIni} (Kontak: {item.kontakPeminjam || '-'})</div>
                      <div className="text-[10px] text-amber-700">Tgl Pinjam: {item.tanggalPinjam || '-'}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-1.5">
                <button
                  onClick={() => handleOpenEditPerlengkapan(item)}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs"
                  title="Edit Inventaris / Status Pinjam"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() =>
                    setDeleteConfirm({
                      type: 'perlengkapan',
                      id: item.id,
                      name: item.namaBarang,
                    })
                  }
                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs"
                  title="Hapus Inventaris"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {filteredPerlengkapan.length === 0 && (
            <div className="col-span-full p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
              Belum ada inventaris perlengkapan RKM yang tercatat.
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 4: DATA PENGURUS RKM & PETUGAS PENARIK IURAN */}
      {activeSubTab === 'pengurus' && (
        <div className="space-y-4">
          {/* Header Card Pengurus RKM */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Struktur Organisasi & Kepengurusan
                </span>
                <h3 className="text-base font-black text-slate-800 mt-2">
                  Pengurus Rukun Kematian Masyarakat (RKM) {profile.namaRw}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {profile.alamatRw}, Kelurahan {profile.kelurahan}, Kecamatan {profile.kecamatan}
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
            </div>

            {/* Pengurus Inti */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                Pengurus Inti RKM
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Ketua RKM
                    </span>
                    <Award className="w-3.5 h-3.5 text-emerald-700" />
                  </div>
                  <div className="font-black text-slate-800 text-sm mt-2">
                    {profile.pengurusRkm?.ketua || 'H. Daryanto'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Penanggung Jawab Umum RKM</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      Sekretaris RKM
                    </span>
                    <FileText className="w-3.5 h-3.5 text-blue-700" />
                  </div>
                  <div className="font-black text-slate-800 text-sm mt-2">
                    {profile.pengurusRkm?.sekretaris || 'Rafly'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Administrasi & Pencatatan Data Wafat</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      Bendahara RKM
                    </span>
                    <HeartHandshake className="w-3.5 h-3.5 text-amber-700" />
                  </div>
                  <div className="font-black text-slate-800 text-sm mt-2">
                    {profile.pengurusRkm?.bendahara || 'H. Yayat S. Nur'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Pengelolaan Kas & Santunan Duka</div>
                </div>
              </div>
            </div>

            {/* Seksi-Seksi RKM */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                Seksi - Seksi Pelayanan RKM
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                    <HeartHandshake className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Seksi Pengurusan & Pemakaman Jenazah</span>
                    <span className="font-bold text-slate-800 text-xs block">{profile.pengurusRkm?.seksiPengurusanPemakaman || 'Ust Khaerudin'}</span>
                    <span className="text-[10px] text-slate-500">Memandikan, mengafani, menyalatkan, & mendampingi pemakaman</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-800 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Seksi Penggali Kubur</span>
                    <span className="font-bold text-slate-800 text-xs block">{profile.pengurusRkm?.seksiPenggaliKubur || 'Husni Thamrin'}</span>
                    <span className="text-[10px] text-slate-500">Koordinasi penggalian liang lahat di TPU Muslim Iringmulyo</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Seksi Perlengkapan</span>
                    <span className="font-bold text-slate-800 text-xs block">{profile.pengurusRkm?.seksiPerlengkapan || 'Alan'}</span>
                    <span className="text-[10px] text-slate-500">Penyediaan keranda, tempat mandi, tenda duka, kursi & sound system</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Seksi Humas & Informasi</span>
                    <span className="font-bold text-slate-800 text-xs block">{profile.pengurusRkm?.seksiHumas || 'Muhammad Rifai'}</span>
                    <span className="text-[10px] text-slate-500">Pemberitahuan berita duka via toa masjid, grup WA warga & koordinasi takziah</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Seksi Penarik Iuran RKM per RT */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Kolektor Iuran Wilayah
                </span>
                <h4 className="text-sm font-bold text-slate-800 mt-2">
                  Petugas Penarik Iuran RKM ({profile.pengurusRkm?.seksiPenarikIuran || 'Ketua RT'})
                </h4>
                <p className="text-xs text-slate-500">
                  Penarikan iuran RKM Rp 25.000 / KK / bulan dilakukan langsung oleh masing-masing Ketua RT.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              {(profile.pengurusRkm?.petugasPenarik || [
                { rt: '039', namaPetugas: 'Zaenal Fanani', jabatan: 'Ketua RT 039', noHp: '0812-7890-0391' },
                { rt: '040', namaPetugas: 'Epi', jabatan: 'Ketua RT 040', noHp: '0813-6655-0402' },
                { rt: '041', namaPetugas: 'Etty Herawati', jabatan: 'Ketua RT 041', noHp: '0821-8899-0413' },
                { rt: '042', namaPetugas: 'Sefrizal', jabatan: 'Ketua RT 042', noHp: '0852-7711-0424' }
              ]).map((petugas) => {
                const iuranRtList = iuranRkmList.filter((i) => i.rt === petugas.rt);
                const lunasCount = iuranRtList.filter((i) => i.status === 'Lunas').length;
                return (
                  <div
                    key={petugas.rt}
                    className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200/70 hover:border-emerald-400 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-800 text-white">
                          Wilayah RT {petugas.rt}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                          {lunasCount} / {iuranRtList.length} KK Lunas
                        </span>
                      </div>

                      <h5 className="text-sm font-black text-slate-800 mt-2.5">
                        {petugas.namaPetugas}
                      </h5>
                      <p className="text-xs text-slate-600 font-semibold">{petugas.jabatan}</p>

                      <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-600">
                        <Phone className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span className="font-mono">{petugas.noHp}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-emerald-100 flex items-center justify-between gap-2">
                      <a
                        href={`https://wa.me/${petugas.noHp.replace(/[^0-9]/g, '').replace(/^0/, '62')}?text=Assalamu'alaikum%20${encodeURIComponent(petugas.namaPetugas)}%2C%20koordinasi%20iuran%20RKM%20RW%20018`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 text-center py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-2xs"
                      >
                        Hubungi WhatsApp
                      </a>
                      <button
                        onClick={() => {
                          setSelectedRt(petugas.rt);
                          setActiveSubTab('iuran');
                        }}
                        className="py-1.5 px-2.5 bg-white hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-300 transition-colors"
                      >
                        Lihat Data Iuran
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: FORM IURAN RKM */}
      {isIuranModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden my-6">
            <div className="bg-emerald-800 p-4 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">
                  {editingIuran ? 'Edit Iuran RKM' : 'Catat Iuran RKM Baru'}
                </h3>
                <p className="text-xs text-emerald-200">Rukun Kematian Masyarakat {profile.namaRw}</p>
              </div>
              <button
                onClick={() => setIsIuranModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-emerald-700 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitIuran} className="p-5 space-y-3 text-xs max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Kepala Keluarga *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Eko Purwanto"
                  value={iuranForm.namaKepala || ''}
                  onChange={(e) => setIuranForm({ ...iuranForm, namaKepala: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Wilayah RT</label>
                  <select
                    value={iuranForm.rt || '039'}
                    onChange={(e) => {
                      const newRt = e.target.value;
                      setIuranForm({
                        ...iuranForm,
                        rt: newRt,
                        penerima: getPetugasPenarikByRt(newRt)
                      });
                    }}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="039">RT 039 (Zaenal Fanani)</option>
                    <option value="040">RT 040 (Epi)</option>
                    <option value="041">RT 041 (Etty Herawati)</option>
                    <option value="042">RT 042 (Sefrizal)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Periode (Bulan-Tahun)</label>
                  <input
                    type="month"
                    value={iuranForm.bulanTahun || '2026-08'}
                    onChange={(e) => setIuranForm({ ...iuranForm, bulanTahun: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nominal Iuran (Rp)</label>
                  <input
                    type="number"
                    step={5000}
                    value={iuranForm.nominal || 0}
                    onChange={(e) => setIuranForm({ ...iuranForm, nominal: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold text-emerald-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Pembayaran</label>
                  <select
                    value={iuranForm.status || 'Lunas'}
                    onChange={(e) => setIuranForm({ ...iuranForm, status: e.target.value as any })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="Lunas">Lunas</option>
                    <option value="Belum Lunas">Belum Lunas</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Bayar</label>
                  <input
                    type="date"
                    value={iuranForm.tanggalBayar || ''}
                    onChange={(e) => setIuranForm({ ...iuranForm, tanggalBayar: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Penerima / Kolektor</label>
                  <input
                    type="text"
                    value={iuranForm.penerima || ''}
                    onChange={(e) => setIuranForm({ ...iuranForm, penerima: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsIuranModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 text-white rounded-xl font-bold"
                >
                  Simpan Iuran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: FORM WARGA MENINGGAL */}
      {isMeninggalModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl overflow-hidden my-6">
            <div className="bg-emerald-800 p-4 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">
                  {editingMeninggal ? 'Edit Data Kematian' : 'Catat Warga Yang Meninggal'}
                </h3>
                <p className="text-xs text-emerald-200">Pelayanan Duka & Santunan RKM RW 018</p>
              </div>
              <button
                onClick={() => setIsMeninggalModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-emerald-700 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitMeninggal} className="p-5 space-y-3 text-xs max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-bold text-slate-700 mb-1">Nama Almarhum/Almarhumah *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Alm. Suwandi bin Kartorejo"
                    value={meninggalForm.nama || ''}
                    onChange={(e) => setMeninggalForm({ ...meninggalForm, nama: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-bold text-slate-700 mb-1">NIK (16 Digit)</label>
                  <input
                    type="text"
                    maxLength={16}
                    placeholder="187202xxxxxxxxxx"
                    value={meninggalForm.nik || ''}
                    onChange={(e) => setMeninggalForm({ ...meninggalForm, nik: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Wilayah RT</label>
                  <select
                    value={meninggalForm.rt || '039'}
                    onChange={(e) => setMeninggalForm({ ...meninggalForm, rt: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="039">RT 039</option>
                    <option value="040">RT 040</option>
                    <option value="041">RT 041</option>
                    <option value="042">RT 042</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={meninggalForm.jenisKelamin || 'L'}
                    onChange={(e) => setMeninggalForm({ ...meninggalForm, jenisKelamin: e.target.value as Gender })}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Usia (Tahun)</label>
                  <input
                    type="number"
                    value={meninggalForm.usia || 0}
                    onChange={(e) => setMeninggalForm({ ...meninggalForm, usia: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Meninggal *</label>
                  <input
                    type="date"
                    required
                    value={meninggalForm.tanggalMeninggal || ''}
                    onChange={(e) => setMeninggalForm({ ...meninggalForm, tanggalMeninggal: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Waktu Meninggal</label>
                  <input
                    type="text"
                    placeholder="06.30 WIB"
                    value={meninggalForm.waktuMeninggal || ''}
                    onChange={(e) => setMeninggalForm({ ...meninggalForm, waktuMeninggal: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tempat Meninggal</label>
                  <input
                    type="text"
                    placeholder="Rumah Duka / RSUD Ahmad Yani"
                    value={meninggalForm.tempatMeninggal || ''}
                    onChange={(e) => setMeninggalForm({ ...meninggalForm, tempatMeninggal: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lokasi Pemakaman</label>
                  <input
                    type="text"
                    placeholder="TPU Muslim Iringmulyo"
                    value={meninggalForm.lokasiPemakaman || ''}
                    onChange={(e) => setMeninggalForm({ ...meninggalForm, lokasiPemakaman: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Santunan RKM (Rp)</label>
                  <input
                    type="number"
                    step={100000}
                    value={meninggalForm.santunanRkm || 1500000}
                    onChange={(e) => setMeninggalForm({ ...meninggalForm, santunanRkm: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold text-emerald-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Santunan</label>
                  <select
                    value={meninggalForm.statusSantunan || 'Diserahkan'}
                    onChange={(e) => setMeninggalForm({ ...meninggalForm, statusSantunan: e.target.value as any })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="Diserahkan">Diserahkan</option>
                    <option value="Proses Administrasi">Proses Administrasi</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Nama Ahli Waris</label>
                  <input
                    type="text"
                    placeholder="Nama anak / pasangan"
                    value={meninggalForm.namaAhliWaris || ''}
                    onChange={(e) => setMeninggalForm({ ...meninggalForm, namaAhliWaris: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hubungan</label>
                  <input
                    type="text"
                    placeholder="Anak / Istri / Suami"
                    value={meninggalForm.hubunganWaris || ''}
                    onChange={(e) => setMeninggalForm({ ...meninggalForm, hubunganWaris: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">No. Kontak / WA Ahli Waris</label>
                <input
                  type="text"
                  placeholder="0812-xxxx-xxxx"
                  value={meninggalForm.noHpWaris || ''}
                  onChange={(e) => setMeninggalForm({ ...meninggalForm, noHpWaris: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsMeninggalModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 text-white rounded-xl font-bold"
                >
                  Simpan Data Wafat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: FORM PERLENGKAPAN RKM */}
      {isPerlengkapanModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden my-6">
            <div className="bg-emerald-800 p-4 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">
                  {editingPerlengkapan ? 'Edit Perlengkapan RKM' : 'Tambah Perlengkapan RKM'}
                </h3>
                <p className="text-xs text-emerald-200">Inventaris Peralatan Jenazah & Duka RW 018</p>
              </div>
              <button
                onClick={() => setIsPerlengkapanModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-emerald-700 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPerlengkapan} className="p-5 space-y-3 text-xs max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Perlengkapan / Barang *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Keranda Jenazah Stainless"
                  value={perlengkapanForm.namaBarang || ''}
                  onChange={(e) => setPerlengkapanForm({ ...perlengkapanForm, namaBarang: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={perlengkapanForm.kategori || 'Perawatan Jenazah'}
                    onChange={(e) => setPerlengkapanForm({ ...perlengkapanForm, kategori: e.target.value as any })}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  >
                    <option value="Perawatan Jenazah">Perawatan Jenazah</option>
                    <option value="Tenda & Kursi">Tenda & Kursi</option>
                    <option value="Sound & Kelistrikan">Sound & Kelistrikan</option>
                    <option value="Kendaraan Jenazah">Kendaraan Jenazah</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kondisi</label>
                  <select
                    value={perlengkapanForm.kondisi || 'Baik'}
                    onChange={(e) => setPerlengkapanForm({ ...perlengkapanForm, kondisi: e.target.value as any })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="Baik">Baik</option>
                    <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                    <option value="Rusak">Rusak</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jumlah</label>
                  <input
                    type="number"
                    min={1}
                    value={perlengkapanForm.jumlah || 1}
                    onChange={(e) => setPerlengkapanForm({ ...perlengkapanForm, jumlah: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Satuan</label>
                  <input
                    type="text"
                    placeholder="Unit / Set / Pcs"
                    value={perlengkapanForm.satuan || 'Unit'}
                    onChange={(e) => setPerlengkapanForm({ ...perlengkapanForm, satuan: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Status Ketersediaan</label>
                <select
                  value={perlengkapanForm.status || 'Tersedia di Gudang'}
                  onChange={(e) => setPerlengkapanForm({ ...perlengkapanForm, status: e.target.value as any })}
                  className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                >
                  <option value="Tersedia di Gudang">Tersedia di Gudang</option>
                  <option value="Dipinjam Warga">Dipinjam Warga</option>
                </select>
              </div>

              {perlengkapanForm.status === 'Dipinjam Warga' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                  <div className="font-bold text-amber-900">Informasi Peminjaman:</div>
                  <div>
                    <label className="block text-slate-700 mb-0.5">Nama Peminjam / Keluarga</label>
                    <input
                      type="text"
                      placeholder="Nama Warga / RT"
                      value={perlengkapanForm.peminjamSaatIni || ''}
                      onChange={(e) => setPerlengkapanForm({ ...perlengkapanForm, peminjamSaatIni: e.target.value })}
                      className="w-full p-1.5 bg-white border border-amber-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-0.5">No Kontak WA Peminjam</label>
                    <input
                      type="text"
                      placeholder="0812-xxxx-xxxx"
                      value={perlengkapanForm.kontakPeminjam || ''}
                      onChange={(e) => setPerlengkapanForm({ ...perlengkapanForm, kontakPeminjam: e.target.value })}
                      className="w-full p-1.5 bg-white border border-amber-300 rounded-lg text-xs"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Lokasi Penyimpanan</label>
                <input
                  type="text"
                  placeholder="Gudang Balai RW 018"
                  value={perlengkapanForm.lokasiSimpan || ''}
                  onChange={(e) => setPerlengkapanForm({ ...perlengkapanForm, lokasiSimpan: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Penanggung Jawab (PJ)</label>
                <input
                  type="text"
                  placeholder="Koordinator RKM"
                  value={perlengkapanForm.penanggungJawab || ''}
                  onChange={(e) => setPerlengkapanForm({ ...perlengkapanForm, penanggungJawab: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsPerlengkapanModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 text-white rounded-xl font-bold"
                >
                  Simpan Inventaris
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
            <h4 className="text-base font-bold text-slate-800">Hapus Data RKM?</h4>
            <p className="text-xs text-slate-500">
              Apakah Anda yakin ingin menghapus data: <strong>{deleteConfirm.name}</strong>?
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
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
