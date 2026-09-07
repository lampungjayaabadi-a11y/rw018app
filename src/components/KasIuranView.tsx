import React, { useState, useMemo } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  Download,
  Trash2,
  Edit2,
  X,
  CreditCard,
  Receipt,
  FileSpreadsheet,
  Building,
  Check,
  FileText
} from 'lucide-react';
import {
  TransaksiKas,
  IuranWargaRecord,
  KasCategory,
  TransaksiType,
  KartuKeluarga,
  RWProfile
} from '../types';
import { formatRupiah, formatTanggalIndo, formatBulanTahunIndo, generateId } from '../utils/formatters';
import { exportKas, exportIuran } from '../utils/exportUtils';
import { ExportButton } from './ExportButton';
import { KasReportModal } from './KasReportModal';

interface KasIuranViewProps {
  profile: RWProfile;
  kasList: TransaksiKas[];
  iuranList: IuranWargaRecord[];
  kkList: KartuKeluarga[];
  onSaveKas: (item: TransaksiKas) => void;
  onDeleteKas: (id: string) => void;
  onSaveIuran: (item: IuranWargaRecord) => void;
  onOpenKuitansi: (iuran: IuranWargaRecord) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const KasIuranView: React.FC<KasIuranViewProps> = ({
  profile,
  kasList,
  iuranList,
  kkList,
  onSaveKas,
  onDeleteKas,
  onSaveIuran,
  onOpenKuitansi,
  searchQuery,
  onSearchChange,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'kas' | 'iuran'>('kas');

  // Filters for Kas
  const [kasFilterTipe, setKasFilterTipe] = useState<'ALL' | 'Pemasukan' | 'Pengeluaran'>('ALL');
  const [kasFilterKategori, setKasFilterKategori] = useState<string>('ALL');

  // Filters for Iuran
  const [iuranFilterBulan, setIuranFilterBulan] = useState<string>('2026-08');
  const [iuranFilterStatus, setIuranFilterStatus] = useState<string>('ALL');
  const [iuranFilterRt, setIuranFilterRt] = useState<string>('ALL');

  // Modals
  const [isKasModalOpen, setIsKasModalOpen] = useState(false);
  const [editingKas, setEditingKas] = useState<TransaksiKas | null>(null);
  const [deleteKasId, setDeleteKasId] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isReportPrintMode, setIsReportPrintMode] = useState(false);

  // Quick Pay Modal for Iuran
  const [payingIuran, setPayingIuran] = useState<IuranWargaRecord | null>(null);
  const [iuranNominalInput, setIuranNominalInput] = useState<number>(50000);
  const [iuranPenerimaInput, setIuranPenerimaInput] = useState<string>('Bendahara RW 018');

  // Form Kas
  const initialKasForm: Partial<TransaksiKas> = {
    kode: `TRX-${new Date().toISOString().slice(0, 7).replace('-', '')}-00${kasList.length + 1}`,
    tipe: 'Pemasukan',
    kategori: 'Iuran Warga Bulanan',
    jumlah: 100000,
    tanggal: new Date().toISOString().slice(0, 10),
    keterangan: '',
    penanggungJawab: 'Bendahara RW (Suryadi, SE)',
  };
  const [kasFormData, setKasFormData] = useState<Partial<TransaksiKas>>(initialKasForm);

  // Calculations
  const totalMasuk = kasList
    .filter((k) => k.tipe === 'Pemasukan')
    .reduce((acc, k) => acc + k.jumlah, 0);
  const totalKeluar = kasList
    .filter((k) => k.tipe === 'Pengeluaran')
    .reduce((acc, k) => acc + k.jumlah, 0);
  const saldoKas = totalMasuk - totalKeluar;

  // Filtered Kas
  const filteredKas = useMemo(() => {
    return kasList.filter((k) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        k.keterangan.toLowerCase().includes(q) ||
        k.kode.toLowerCase().includes(q) ||
        k.kategori.toLowerCase().includes(q) ||
        k.penanggungJawab.toLowerCase().includes(q);

      const matchTipe = kasFilterTipe === 'ALL' || k.tipe === kasFilterTipe;
      const matchKategori = kasFilterKategori === 'ALL' || k.kategori === kasFilterKategori;

      return matchSearch && matchTipe && matchKategori;
    });
  }, [kasList, searchQuery, kasFilterTipe, kasFilterKategori]);

  // Filtered Iuran
  const filteredIuran = useMemo(() => {
    return iuranList.filter((i) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        i.namaKepala.toLowerCase().includes(q) ||
        i.noKk.includes(q) ||
        i.rt.includes(q);

      const matchBulan = !iuranFilterBulan || i.bulanTahun === iuranFilterBulan;
      const matchStatus = iuranFilterStatus === 'ALL' || i.status === iuranFilterStatus;
      const matchRt = iuranFilterRt === 'ALL' || i.rt === iuranFilterRt;

      return matchSearch && matchBulan && matchStatus && matchRt;
    });
  }, [iuranList, searchQuery, iuranFilterBulan, iuranFilterStatus, iuranFilterRt]);

  // Iuran Summary
  const iuranLunasCount = filteredIuran.filter((i) => i.status === 'Lunas').length;
  const iuranBelumCount = filteredIuran.filter((i) => i.status === 'Belum Lunas').length;
  const totalIuranTerkumpul = filteredIuran
    .filter((i) => i.status === 'Lunas')
    .reduce((acc, i) => acc + i.nominal, 0);

  const handleOpenAddKas = () => {
    setEditingKas(null);
    setKasFormData({
      ...initialKasForm,
      kode: `TRX-${new Date().toISOString().slice(0, 7).replace('-', '')}-${Date.now().toString().slice(-4)}`,
      tanggal: new Date().toISOString().slice(0, 10),
    });
    setIsKasModalOpen(true);
  };

  const handleOpenEditKas = (k: TransaksiKas) => {
    setEditingKas(k);
    setKasFormData({ ...k });
    setIsKasModalOpen(true);
  };

  const handleKasFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kasFormData.keterangan || !kasFormData.jumlah) {
      alert('Mohon isi keterangan dan jumlah transaksi!');
      return;
    }

    const saved: TransaksiKas = {
      id: editingKas ? editingKas.id : generateId('kas'),
      kode: kasFormData.kode || `TRX-${Date.now()}`,
      tipe: (kasFormData.tipe as TransaksiType) || 'Pemasukan',
      kategori: (kasFormData.kategori as KasCategory) || 'Lain-lain',
      jumlah: Number(kasFormData.jumlah) || 0,
      tanggal: kasFormData.tanggal || new Date().toISOString().slice(0, 10),
      keterangan: kasFormData.keterangan || '',
      rt: kasFormData.rt,
      penanggungJawab: kasFormData.penanggungJawab || 'Bendahara RW 018',
      buktiRef: kasFormData.buktiRef,
    };

    onSaveKas(saved);
    setIsKasModalOpen(false);
  };

  const handleConfirmPayIuran = () => {
    if (!payingIuran) return;
    const updated: IuranWargaRecord = {
      ...payingIuran,
      status: 'Lunas',
      nominal: iuranNominalInput,
      tanggalBayar: new Date().toISOString().slice(0, 10),
      penerima: iuranPenerimaInput,
      kuitansiNo: `KWT/${payingIuran.rt}/${payingIuran.bulanTahun.replace('-', '')}/${Date.now().toString().slice(-4)}`,
    };

    onSaveIuran(updated);
    setPayingIuran(null);
  };

  const handleExportKasExcel = () => {
    exportKas(filteredKas, 'xlsx');
  };

  const handleExportKasCSV = () => {
    exportKas(filteredKas, 'csv');
  };

  const handleExportIuranExcel = () => {
    const bulanLabel = iuranFilterBulan ? iuranFilterBulan.replace('-', '_') : '';
    exportIuran(filteredIuran, 'xlsx', bulanLabel);
  };

  const handleExportIuranCSV = () => {
    const bulanLabel = iuranFilterBulan ? iuranFilterBulan.replace('-', '_') : '';
    exportIuran(filteredIuran, 'csv', bulanLabel);
  };

  const allKasCategories: KasCategory[] = [
    'Iuran Warga Bulanan',
    'Iuran Sampah & Kebersihan',
    'Iuran Keamanan / Siskamling',
    'Dana Sosial / Kematian',
    'Donasi / Sumbangan',
    'Operasional Kantor RW',
    'Kegiatan / Acara Warga',
    'Pemeliharaan Fasum',
    'Lain-lain',
  ];

  return (
    <div className="space-y-4 p-4 pb-12 max-w-5xl mx-auto">
      {/* Financial Overview Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-emerald-800 to-teal-900 text-white p-4 rounded-2xl shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-emerald-200 font-semibold uppercase tracking-wider">
                Saldo Kas RW 018
              </span>
              <Wallet className="w-5 h-5 text-amber-300" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-white">{formatRupiah(saldoKas)}</span>
            </div>
            <p className="text-[11px] text-emerald-200/90 mt-1">
              Status Keuangan RW Aktif & Transparan
            </p>
          </div>

          {/* Action Menu: Laporan Lengkap & Detail + Cetak */}
          <div className="mt-3 pt-2.5 border-t border-emerald-700/60 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsReportPrintMode(false);
                setIsReportModalOpen(true);
              }}
              className="flex-1 py-1.5 px-2.5 bg-white/15 hover:bg-white/25 text-white border border-white/20 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95"
              title="Buka Laporan Lengkap & Detail Kas RW 018"
            >
              <FileText className="w-3.5 h-3.5 text-amber-300" />
              <span>Laporan Lengkap & Detail</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsReportPrintMode(true);
                setIsReportModalOpen(true);
              }}
              className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0"
              title="Cetak Laporan Kas RW 018 (PDF/Print)"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak</span>
            </button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase">Total Pemasukan</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-black text-emerald-700">+{formatRupiah(totalMasuk)}</span>
          </div>
          <span className="text-[10px] text-slate-400">Termasuk iuran & donasi warga</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase">Total Pengeluaran</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-black text-rose-600">-{formatRupiah(totalKeluar)}</span>
          </div>
          <span className="text-[10px] text-slate-400">Operasional, fasum & kegiatan</span>
        </div>
      </div>

      {/* Main Sub Tabs (Buku Kas vs Iuran Warga) */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveSubTab('kas')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'kas'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Buku Kas RW</span>
          </button>
          <button
            onClick={() => setActiveSubTab('iuran')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'iuran'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Iuran Bulanan Warga</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === 'kas' ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setIsReportPrintMode(false);
                  setIsReportModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer active:scale-95"
                title="Laporan Lengkap & Cetak Dokumen"
              >
                <FileText className="w-3.5 h-3.5 text-teal-600" />
                <span>Laporan Kas & Cetak</span>
              </button>
              <ExportButton
                label="Ekspor Kas"
                onExportExcel={handleExportKasExcel}
                onExportCsv={handleExportKasCSV}
                variant="secondary"
              />
              <button
                onClick={handleOpenAddKas}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Catat Transaksi</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <span>Bulan:</span>
                <input
                  type="month"
                  value={iuranFilterBulan}
                  onChange={(e) => setIuranFilterBulan(e.target.value)}
                  className="p-1.5 border border-slate-300 rounded-lg text-xs font-bold"
                />
              </div>
              <ExportButton
                label="Ekspor Iuran"
                onExportExcel={handleExportIuranExcel}
                onExportCsv={handleExportIuranCSV}
                variant="secondary"
              />
            </div>
          )}
        </div>
      </div>

      {/* SUB TAB 1: BUKU KAS */}
      {activeSubTab === 'kas' && (
        <div className="space-y-3">
          {/* Kas Filters */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setKasFilterTipe('ALL')}
                className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${
                  kasFilterTipe === 'ALL' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'
                }`}
              >
                Semua Transaksi
              </button>
              <button
                onClick={() => setKasFilterTipe('Pemasukan')}
                className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${
                  kasFilterTipe === 'Pemasukan' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500'
                }`}
              >
                Pemasukan
              </button>
              <button
                onClick={() => setKasFilterTipe('Pengeluaran')}
                className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${
                  kasFilterTipe === 'Pengeluaran' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-500'
                }`}
              >
                Pengeluaran
              </button>
            </div>

            <select
              value={kasFilterKategori}
              onChange={(e) => setKasFilterKategori(e.target.value)}
              className="p-1.5 bg-slate-100 rounded-lg font-semibold text-slate-700 border-none text-xs"
            >
              <option value="ALL">Semua Kategori</option>
              {allKasCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Kas List */}
          <div className="space-y-2">
            {filteredKas.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl text-center border border-slate-200 text-slate-400 text-xs">
                Tidak ada catatan transaksi kas ditemukan.
              </div>
            ) : (
              filteredKas.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-3.5 rounded-2xl border border-slate-200 hover:border-slate-300 shadow-xs flex items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                        item.tipe === 'Pemasukan'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {item.tipe === 'Pemasukan' ? (
                        <TrendingUp className="w-5 h-5" />
                      ) : (
                        <TrendingDown className="w-5 h-5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          {item.kode}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">
                          {item.kategori}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatTanggalIndo(item.tanggal)}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 mt-0.5 leading-snug break-words">
                        {item.keterangan}
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">PJ: {item.penanggungJawab}</span>
                        {item.buktiRef && <span>• Ref: {item.buktiRef}</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-sm font-black ${
                        item.tipe === 'Pemasukan' ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {item.tipe === 'Pemasukan' ? '+' : '-'}
                      {formatRupiah(item.jumlah)}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditKas(item)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg"
                        title="Edit Transaksi"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteKasId(item.id)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg"
                        title="Hapus Transaksi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SUB TAB 2: IURAN WARGA */}
      {activeSubTab === 'iuran' && (
        <div className="space-y-3">
          {/* Summary Iuran */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div>
                <span className="text-slate-400 block text-[10px]">Periode Iuran</span>
                <span className="font-bold text-slate-800">
                  {formatBulanTahunIndo(iuranFilterBulan)}
                </span>
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <div>
                <span className="text-slate-400 block text-[10px]">Terkumpul</span>
                <span className="font-bold text-emerald-700">
                  {formatRupiah(totalIuranTerkumpul)}
                </span>
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <div>
                <span className="text-slate-400 block text-[10px]">Status Pembayaran</span>
                <span className="font-semibold text-slate-700">
                  <strong className="text-emerald-700">{iuranLunasCount} Lunas</strong> /{' '}
                  <strong className="text-rose-600">{iuranBelumCount} Belum</strong>
                </span>
              </div>
            </div>

            {/* Filter status & RT */}
            <div className="flex items-center gap-2">
              <select
                value={iuranFilterStatus}
                onChange={(e) => setIuranFilterStatus(e.target.value)}
                className="p-1.5 bg-slate-100 rounded-lg font-semibold text-slate-700 border-none text-xs"
              >
                <option value="ALL">Semua Status</option>
                <option value="Lunas">Lunas</option>
                <option value="Belum Lunas">Belum Lunas</option>
              </select>

              <select
                value={iuranFilterRt}
                onChange={(e) => setIuranFilterRt(e.target.value)}
                className="p-1.5 bg-slate-100 rounded-lg font-semibold text-slate-700 border-none text-xs"
              >
                <option value="ALL">Semua RT</option>
                {profile.daftarRt.map((rt) => (
                  <option key={rt} value={rt}>
                    RT {rt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Iuran List */}
          <div className="space-y-2">
            {filteredIuran.map((item) => (
              <div
                key={item.id}
                className="bg-white p-3.5 rounded-2xl border border-slate-200 hover:border-slate-300 shadow-xs flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-800">{item.namaKepala}</h4>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                      RT {item.rt}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">KK: {item.noKk}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {item.status === 'Lunas' ? (
                      <span className="text-emerald-700">
                        Lunas ({formatRupiah(item.nominal)}) • Tgl: {formatTanggalIndo(item.tanggalBayar)}
                      </span>
                    ) : (
                      <span className="text-rose-600 font-medium">
                        Belum Lunas (Kewajiban: {formatRupiah(item.nominal || 50000)})
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.status === 'Lunas' ? (
                    <button
                      onClick={() => onOpenKuitansi(item)}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                      title="Cetak Kuitansi Resmi"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Kuitansi</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setPayingIuran(item);
                        setIuranNominalInput(item.nominal || 50000);
                      }}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Bayar</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form Modal Transaksi Kas */}
      {isKasModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl overflow-hidden">
            <div className="bg-emerald-800 p-4 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">
                  {editingKas ? 'Edit Transaksi Kas' : 'Pencatatan Buku Kas RW 018'}
                </h3>
                <p className="text-xs text-emerald-200">Arsip Keuangan Terpadu</p>
              </div>
              <button
                onClick={() => setIsKasModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-emerald-700 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleKasFormSubmit} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipe Transaksi *</label>
                  <select
                    value={kasFormData.tipe || 'Pemasukan'}
                    onChange={(e) =>
                      setKasFormData({ ...kasFormData, tipe: e.target.value as TransaksiType })
                    }
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="Pemasukan">Pemasukan (Masuk)</option>
                    <option value="Pengeluaran">Pengeluaran (Keluar)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori Kas *</label>
                  <select
                    value={kasFormData.kategori || 'Iuran Warga Bulanan'}
                    onChange={(e) =>
                      setKasFormData({ ...kasFormData, kategori: e.target.value as KasCategory })
                    }
                    className="w-full p-2 border border-slate-300 rounded-xl font-semibold"
                  >
                    {allKasCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jumlah (Rp) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={1000}
                    value={kasFormData.jumlah || 0}
                    onChange={(e) => setKasFormData({ ...kasFormData, jumlah: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold text-emerald-800 text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Transaksi</label>
                  <input
                    type="date"
                    value={kasFormData.tanggal || ''}
                    onChange={(e) => setKasFormData({ ...kasFormData, tanggal: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Uraian / Keterangan Transaksi *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Contoh: Pembelian 1 rim kertas HVS & tinta stempel RW"
                  value={kasFormData.keterangan || ''}
                  onChange={(e) => setKasFormData({ ...kasFormData, keterangan: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Penanggung Jawab</label>
                  <input
                    type="text"
                    value={kasFormData.penanggungJawab || ''}
                    onChange={(e) => setKasFormData({ ...kasFormData, penanggungJawab: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. Bukti / Kuitansi Ref</label>
                  <input
                    type="text"
                    placeholder="Contoh: NOTA-123 / KWT-08"
                    value={kasFormData.buktiRef || ''}
                    onChange={(e) => setKasFormData({ ...kasFormData, buktiRef: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsKasModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold"
                >
                  Simpan Transaksi Kas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Iuran Modal */}
      {payingIuran && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-xl overflow-hidden p-5 space-y-3 text-xs">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
                <Receipt className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-800">Penerimaan Iuran Warga</h4>
              <p className="text-slate-500 mt-0.5">
                KK: <strong>{payingIuran.namaKepala}</strong> (RT {payingIuran.rt})
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Nominal Iuran (Rp)</label>
              <input
                type="number"
                step={5000}
                value={iuranNominalInput}
                onChange={(e) => setIuranNominalInput(Number(e.target.value))}
                className="w-full p-2 border border-slate-300 rounded-xl font-bold text-emerald-800 text-base"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Diterima Oleh (Petugas)</label>
              <input
                type="text"
                value={iuranPenerimaInput}
                onChange={(e) => setIuranPenerimaInput(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-xl font-medium"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setPayingIuran(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmPayIuran}
                className="px-4 py-2 bg-emerald-700 text-white rounded-xl font-bold shadow-xs"
              >
                Tandai Lunas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Kas Confirmation Modal */}
      {deleteKasId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-xl space-y-3 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-800">Hapus Catatan Kas?</h4>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteKasId(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onDeleteKas(deleteKasId);
                  setDeleteKasId(null);
                }}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Laporan Lengkap & Detail Kas RW */}
      <KasReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        kasList={kasList}
        profile={profile}
        initialPrintMode={isReportPrintMode}
      />
    </div>
  );
};
