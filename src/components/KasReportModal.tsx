import React, { useState, useMemo } from 'react';
import {
  X,
  Printer,
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  Layers,
  Wallet,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  Building,
  Calendar,
  UserCheck,
  FileText,
  ArrowLeft,
  DollarSign,
  ShieldCheck,
  PieChart,
  Sparkles,
  Scale,
  RefreshCw
} from 'lucide-react';
import { TransaksiKas, KasCategory, TransaksiType, RWProfile } from '../types';
import { formatRupiah, formatTanggalIndo } from '../utils/formatters';
import { exportKas } from '../utils/exportUtils';
import { LOGO_RW_018, handleLogoError } from '../constants/logo';

interface KasReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  kasList: TransaksiKas[];
  profile: RWProfile;
  initialPrintMode?: boolean;
}

export const KasReportModal: React.FC<KasReportModalProps> = ({
  isOpen,
  onClose,
  kasList,
  profile,
  initialPrintMode = false,
}) => {
  const [filterTipe, setFilterTipe] = useState<'ALL' | 'Pemasukan' | 'Pengeluaran'>('ALL');
  const [filterKategori, setFilterKategori] = useState<string>('ALL');
  const [filterRt, setFilterRt] = useState<string>('ALL');
  const [filterPeriode, setFilterPeriode] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const allCategories: KasCategory[] = [
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

  // Auto trigger print if opened in initialPrintMode
  React.useEffect(() => {
    if (isOpen && initialPrintMode) {
      const timer = setTimeout(() => {
        window.print();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialPrintMode]);

  // Filtered dataset
  const filteredData = useMemo(() => {
    return kasList.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.keterangan.toLowerCase().includes(q) ||
        item.kode.toLowerCase().includes(q) ||
        item.kategori.toLowerCase().includes(q) ||
        item.penanggungJawab.toLowerCase().includes(q) ||
        (item.buktiRef && item.buktiRef.toLowerCase().includes(q));

      const matchTipe = filterTipe === 'ALL' || item.tipe === filterTipe;
      const matchKategori = filterKategori === 'ALL' || item.kategori === filterKategori;
      const matchRt =
        filterRt === 'ALL' ||
        (filterRt === 'UMUM' && !item.rt) ||
        item.rt === filterRt ||
        item.rt === filterRt.replace(/^0+/, '');

      // Periode filter
      let matchPeriode = true;
      if (filterPeriode === 'BULAN_INI') {
        const currentMonth = new Date().toISOString().slice(0, 7);
        matchPeriode = item.tanggal.startsWith(currentMonth);
      } else if (filterPeriode === 'TAHUN_INI') {
        const currentYear = new Date().toISOString().slice(0, 4);
        matchPeriode = item.tanggal.startsWith(currentYear);
      }

      return matchSearch && matchTipe && matchKategori && matchRt && matchPeriode;
    });
  }, [kasList, searchQuery, filterTipe, filterKategori, filterRt, filterPeriode]);

  // Sorted by date ascending for sequential calculation of running balance
  const sortedTransactions = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const dateA = new Date(a.tanggal).getTime();
      const dateB = new Date(b.tanggal).getTime();
      if (dateA !== dateB) return dateA - dateB;
      return a.kode.localeCompare(b.kode);
    });
  }, [filteredData]);

  // Overall and filtered financial metrics
  const totalMasukAll = useMemo(
    () => kasList.filter((k) => k.tipe === 'Pemasukan').reduce((sum, k) => sum + k.jumlah, 0),
    [kasList]
  );
  const totalKeluarAll = useMemo(
    () => kasList.filter((k) => k.tipe === 'Pengeluaran').reduce((sum, k) => sum + k.jumlah, 0),
    [kasList]
  );
  const saldoKasAll = totalMasukAll - totalKeluarAll;

  const totalMasukFiltered = useMemo(
    () => filteredData.filter((k) => k.tipe === 'Pemasukan').reduce((sum, k) => sum + k.jumlah, 0),
    [filteredData]
  );
  const totalKeluarFiltered = useMemo(
    () => filteredData.filter((k) => k.tipe === 'Pengeluaran').reduce((sum, k) => sum + k.jumlah, 0),
    [filteredData]
  );
  const surplusDefisitFiltered = totalMasukFiltered - totalKeluarFiltered;

  // Breakdown per category for Rekapitulasi Table
  const rekapitulasiKategori = useMemo(() => {
    return allCategories.map((cat) => {
      const itemsInCat = kasList.filter((k) => k.kategori === cat);
      const masuk = itemsInCat
        .filter((k) => k.tipe === 'Pemasukan')
        .reduce((sum, k) => sum + k.jumlah, 0);
      const keluar = itemsInCat
        .filter((k) => k.tipe === 'Pengeluaran')
        .reduce((sum, k) => sum + k.jumlah, 0);
      const selisih = masuk - keluar;
      const count = itemsInCat.length;
      return {
        kategori: cat,
        masuk,
        keluar,
        selisih,
        count,
      };
    });
  }, [kasList, allCategories]);

  // Running balance calculation array
  const transactionsWithBalance = useMemo(() => {
    let currentBalance = 0;
    return sortedTransactions.map((trx) => {
      if (trx.tipe === 'Pemasukan') {
        currentBalance += trx.jumlah;
      } else {
        currentBalance -= trx.jumlah;
      }
      return {
        ...trx,
        runningBalance: currentBalance,
      };
    });
  }, [sortedTransactions]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    exportKas(filteredData, 'xlsx');
  };

  const handleExportCsv = () => {
    exportKas(filteredData, 'csv');
  };

  const handleResetFilters = () => {
    setFilterTipe('ALL');
    setFilterKategori('ALL');
    setFilterRt('ALL');
    setFilterPeriode('ALL');
    setSearchQuery('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-3xl w-full max-w-6xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Header Dialog (Hidden on Print) */}
        <div className="p-3.5 sm:p-5 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 print:hidden border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border border-white/20 shadow-2xs shrink-0 cursor-pointer active:scale-95"
              title="Kembali ke menu sebelumnya"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-amber-300" />
              <span>Kembali</span>
            </button>
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/40 text-teal-300 flex items-center justify-center font-black shrink-0 hidden sm:flex">
              <Wallet className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black tracking-tight text-white truncate">
                  Laporan Lengkap & Rincian Buku Kas RW
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {profile.namaRw}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 truncate">
                Laporan pertanggungjawaban arus kas keuangan Kel. {profile.kelurahan}, {profile.kotaKab}.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
              title="Cetak Laporan / Simpan PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / PDF</span>
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              title="Ekspor ke Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Excel</span>
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all cursor-pointer"
              title="Ekspor ke CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CSV</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Tutup Laporan"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls Toolbar (Hidden on Print) */}
        <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 shrink-0 space-y-2.5 print:hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari transaksi, kode, PIC..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
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

            {/* Filter Tipe Transaksi */}
            <div>
              <select
                value={filterTipe}
                onChange={(e) => setFilterTipe(e.target.value as any)}
                className="w-full py-2 px-3 text-xs rounded-xl border border-slate-300 bg-white font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="ALL">Semua Jenis (Masuk & Keluar)</option>
                <option value="Pemasukan">Pemasukan Saja (+)</option>
                <option value="Pengeluaran">Pengeluaran Saja (-)</option>
              </select>
            </div>

            {/* Filter Kategori Kas */}
            <div>
              <select
                value={filterKategori}
                onChange={(e) => setFilterKategori(e.target.value)}
                className="w-full py-2 px-3 text-xs rounded-xl border border-slate-300 bg-white font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="ALL">Semua Kategori Kas</option>
                {allCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Wilayah RT */}
            <div>
              <select
                value={filterRt}
                onChange={(e) => setFilterRt(e.target.value)}
                className="w-full py-2 px-3 text-xs rounded-xl border border-slate-300 bg-white font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="ALL">Semua Wilayah</option>
                <option value="UMUM">Kas Umum RW (Non-RT)</option>
                {profile.daftarRt.map((rt) => (
                  <option key={rt} value={rt}>
                    Wilayah RT {rt}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Periode */}
            <div className="flex items-center gap-1.5">
              <select
                value={filterPeriode}
                onChange={(e) => setFilterPeriode(e.target.value)}
                className="w-full py-2 px-3 text-xs rounded-xl border border-slate-300 bg-white font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="ALL">Semua Periode</option>
                <option value="BULAN_INI">Bulan Berjalan Ini</option>
                <option value="TAHUN_INI">Tahun Berjalan (2026)</option>
              </select>

              {(filterTipe !== 'ALL' ||
                filterKategori !== 'ALL' ||
                filterRt !== 'ALL' ||
                filterPeriode !== 'ALL' ||
                searchQuery) && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold shrink-0 transition-colors"
                  title="Reset Filter"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal Scrollable Content / Print Sheet */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-slate-800 print:overflow-visible print:p-0">
          
          {/* Printable Official Letterhead (Kop Surat Resmi) */}
          <div className="border-b-2 border-slate-800 pb-4 text-center">
            <div className="flex items-center justify-center gap-3.5 mb-1.5">
              <img
                src={LOGO_RW_018}
                alt="Logo RW 018"
                onError={handleLogoError}
                className="w-14 h-14 object-contain shrink-0"
              />
              <div className="text-left">
                <h1 className="text-base sm:text-lg font-black uppercase tracking-wide text-slate-900 leading-tight">
                  PENGURUS RUKUN WARGA {profile.nomorRw} ({profile.namaRw})
                </h1>
                <p className="text-xs font-bold text-slate-700">
                  KELURAHAN {profile.kelurahan.toUpperCase()} &bull; KECAMATAN {profile.kecamatan.toUpperCase()}
                </p>
                <p className="text-[11px] text-slate-600">
                  {profile.kotaKab.toUpperCase()} &bull; PROVINSI LAMPUNG &bull; KODE POS 34112
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Alamat Sekretariat: {profile.alamatSekretariat} &bull; Telp/WA: {profile.kontakSekretariat}
                </p>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-300">
              <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wider">
                LAPORAN PERTANGGUNGJAWABAN ARUS KAS & KEUANGAN RW 018
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Nomor: LPJ-KAS/{profile.nomorRw}/{new Date().getFullYear()}/
                {new Date().getMonth() + 1} &bull; Dicetak pada:{' '}
                {formatTanggalIndo(new Date().toISOString().slice(0, 10))}
              </p>
            </div>
          </div>

          {/* Section 1: Ringkasan Eksekutif Keuangan Kas RW */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2">
                <Scale className="w-4 h-4 text-teal-700" />
                <span>I. RINGKASAN EKSEKUTIF KEUANGAN KAS RW</span>
              </h3>
              <span className="text-[11px] font-bold text-slate-500">
                Total {kasList.length} Transaksi Tercatat
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-emerald-800 tracking-wider">
                    Total Pemasukan
                  </span>
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="mt-1 text-base sm:text-lg font-black text-emerald-700">
                  {formatRupiah(totalMasukFiltered)}
                </div>
                <span className="text-[10px] text-emerald-600 block mt-0.5">
                  {filteredData.filter((k) => k.tipe === 'Pemasukan').length} Transaksi Masuk
                </span>
              </div>

              <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-rose-800 tracking-wider">
                    Total Pengeluaran
                  </span>
                  <TrendingDown className="w-4 h-4 text-rose-600" />
                </div>
                <div className="mt-1 text-base sm:text-lg font-black text-rose-700">
                  {formatRupiah(totalKeluarFiltered)}
                </div>
                <span className="text-[10px] text-rose-600 block mt-0.5">
                  {filteredData.filter((k) => k.tipe === 'Pengeluaran').length} Transaksi Keluar
                </span>
              </div>

              <div className="bg-teal-50/80 border border-teal-200 rounded-2xl p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-teal-800 tracking-wider">
                    Saldo Kas RW (Total)
                  </span>
                  <Wallet className="w-4 h-4 text-teal-600" />
                </div>
                <div className="mt-1 text-base sm:text-lg font-black text-teal-900">
                  {formatRupiah(saldoKasAll)}
                </div>
                <span className="text-[10px] text-teal-700 block mt-0.5 font-semibold">
                  Kas Siap Pakai & Tersedia
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-slate-700 tracking-wider">
                    Surplus / Defisit
                  </span>
                  <DollarSign className="w-4 h-4 text-slate-600" />
                </div>
                <div
                  className={`mt-1 text-base sm:text-lg font-black ${
                    surplusDefisitFiltered >= 0 ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  {surplusDefisitFiltered >= 0 ? '+' : ''}
                  {formatRupiah(surplusDefisitFiltered)}
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Hasil Periode Terfilter
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Rekapitulasi Per Kategori Kas */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-teal-700" />
                <span>II. REKAPITULASI REALISASI ALOKASI KAS PER KATEGORI</span>
              </h3>
              <span className="text-[11px] font-bold text-slate-500">
                9 Pos Kategori Keuangan
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-black border-b border-slate-200">
                    <th className="p-2.5 text-center w-10">No</th>
                    <th className="p-2.5">Pos / Kategori Kas</th>
                    <th className="p-2.5 text-center w-20">Frekuensi</th>
                    <th className="p-2.5 text-right">Total Penerimaan (Masuk)</th>
                    <th className="p-2.5 text-right">Total Pengeluaran (Keluar)</th>
                    <th className="p-2.5 text-right">Saldo Bersih Kategori</th>
                    <th className="p-2.5 text-center w-28">Status Alokasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rekapitulasiKategori.map((item, idx) => (
                    <tr
                      key={item.kategori}
                      className={
                        filterKategori === item.kategori
                          ? 'bg-teal-50 font-semibold'
                          : 'hover:bg-slate-50/80 transition-colors'
                      }
                    >
                      <td className="p-2.5 text-center font-mono font-bold text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="p-2.5 font-bold text-slate-800">{item.kategori}</td>
                      <td className="p-2.5 text-center font-mono font-semibold text-slate-600">
                        {item.count} trx
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-emerald-700">
                        {item.masuk > 0 ? formatRupiah(item.masuk) : '-'}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-rose-600">
                        {item.keluar > 0 ? formatRupiah(item.keluar) : '-'}
                      </td>
                      <td
                        className={`p-2.5 text-right font-mono font-black ${
                          item.selisih >= 0 ? 'text-emerald-800' : 'text-rose-700'
                        }`}
                      >
                        {item.selisih >= 0 ? '+' : ''}
                        {formatRupiah(item.selisih)}
                      </td>
                      <td className="p-2.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.selisih >= 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {item.selisih >= 0 ? 'Surplus (+)' : 'Defisit (-)'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                    <td colSpan={3} className="p-2.5 text-center uppercase tracking-wider">
                      TOTAL AKUMULASI KESELURUHAN
                    </td>
                    <td className="p-2.5 text-right font-mono text-emerald-700">
                      {formatRupiah(totalMasukAll)}
                    </td>
                    <td className="p-2.5 text-right font-mono text-rose-700">
                      {formatRupiah(totalKeluarAll)}
                    </td>
                    <td className="p-2.5 text-right font-mono text-teal-900 text-sm">
                      {formatRupiah(saldoKasAll)}
                    </td>
                    <td className="p-2.5 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-teal-100 text-teal-900 font-extrabold">
                        SEIMBANG
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Tabel Rincian Buku Kas Transaksi Detail */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-700" />
                <span>III. RINCIAN BUKU KAS TRANSAKSI DETAIL</span>
              </h3>
              <span className="text-[11px] font-bold text-slate-500">
                Menampilkan {transactionsWithBalance.length} Transaksi
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-black border-b border-slate-200">
                    <th className="p-2.5 text-center w-8 sm:w-10">No</th>
                    <th className="p-2.5 text-center w-24 sm:w-28 whitespace-nowrap">Kode & Tgl</th>
                    <th className="p-2.5 min-w-[280px] lg:min-w-[360px]">Uraian / Keterangan Transaksi</th>
                    <th className="p-2.5 w-28 sm:w-32">Kategori & RT</th>
                    <th className="p-2.5 text-right w-24 sm:w-28 whitespace-nowrap">Penerimaan (+)</th>
                    <th className="p-2.5 text-right w-24 sm:w-28 whitespace-nowrap">Pengeluaran (-)</th>
                    <th className="p-2.5 text-right w-24 sm:w-28 whitespace-nowrap">Saldo Kas</th>
                    <th className="p-2 text-center w-20 sm:w-24 text-[11px]">Penanggung Jawab</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactionsWithBalance.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-400 font-semibold">
                        Tidak ada transaksi kas yang sesuai dengan filter yang dipilih.
                      </td>
                    </tr>
                  ) : (
                    transactionsWithBalance.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/90 transition-colors">
                        <td className="p-2.5 text-center font-mono font-bold text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="p-2.5 text-center whitespace-nowrap">
                          <span className="font-mono font-bold text-[11px] text-slate-700 block">
                            {item.kode}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {formatTanggalIndo(item.tanggal)}
                          </span>
                        </td>
                        <td className="p-2.5 min-w-[280px] lg:min-w-[360px]">
                          <div className="font-bold text-slate-800 break-words leading-relaxed">{item.keterangan}</div>
                          {item.buktiRef && (
                            <span className="text-[10px] text-slate-500 italic block mt-0.5">
                              Ref/Bukti: {item.buktiRef}
                            </span>
                          )}
                        </td>
                        <td className="p-2.5">
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded text-[10px] block truncate">
                            {item.kategori}
                          </span>
                          <span className="text-[10px] text-slate-500 mt-0.5 block">
                            {item.rt ? `Wilayah RT ${item.rt}` : 'Kas Umum RW'}
                          </span>
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                          {item.tipe === 'Pemasukan' ? formatRupiah(item.jumlah) : '-'}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-rose-600 whitespace-nowrap">
                          {item.tipe === 'Pengeluaran' ? formatRupiah(item.jumlah) : '-'}
                        </td>
                        <td className="p-2.5 text-right font-mono font-black text-slate-900 whitespace-nowrap">
                          {formatRupiah(item.runningBalance)}
                        </td>
                        <td className="p-2 w-20 sm:w-24 text-center">
                          <div className="font-semibold text-[10px] text-slate-600 leading-tight break-words max-w-[95px] mx-auto">
                            {item.penanggungJawab}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}

                  {transactionsWithBalance.length > 0 && (
                    <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                      <td colSpan={4} className="p-2.5 text-center uppercase tracking-wider">
                        TOTAL REKAPITULASI TABEL
                      </td>
                      <td className="p-2.5 text-right font-mono text-emerald-700 whitespace-nowrap">
                        {formatRupiah(totalMasukFiltered)}
                      </td>
                      <td className="p-2.5 text-right font-mono text-rose-700 whitespace-nowrap">
                        {formatRupiah(totalKeluarFiltered)}
                      </td>
                      <td className="p-2.5 text-right font-mono text-teal-900 text-sm whitespace-nowrap">
                        {formatRupiah(
                          transactionsWithBalance[transactionsWithBalance.length - 1]
                            ?.runningBalance || 0
                        )}
                      </td>
                      <td className="p-2 text-center font-mono text-[10px] text-slate-500">
                        {transactionsWithBalance.length} Trx
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Catatan & Keterangan Transparansi */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-600 space-y-1">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              <span>Catatan Transparansi & Audit Keuangan:</span>
            </h4>
            <p className="text-[11px] leading-relaxed">
              1. Laporan ini disusun secara otomatis oleh Sistem Informasi Administrasi Digital RUKUN
              WARGA {profile.nomorRw} berdasarkan seluruh pembukuan transaksi kas penerimaan dan
              pengeluaran yang terverifikasi.
            </p>
            <p className="text-[11px] leading-relaxed">
              2. Seluruh bukti fisik nota, kuitansi, dan slip transfer tersimpan di arsip digital
              Bendahara RW 018 dan dapat ditinjau dalam musyawarah pertanggungjawaban warga.
            </p>
          </div>

          {/* Section 5: Lembar Pengesahan Tanda Tangan Resmi */}
          <div className="pt-6 border-t border-slate-200 grid grid-cols-3 gap-4 text-center text-xs text-slate-800 break-inside-avoid">
            <div>
              <p className="font-semibold text-slate-600">Mengetahui,</p>
              <p className="font-bold text-slate-900">Ketua RW {profile.nomorRw}</p>
              <div className="h-20 flex items-center justify-center">
                <div className="w-16 h-16 border border-emerald-300 rounded-xl bg-emerald-50/50 flex flex-col items-center justify-center p-1 text-[8px] font-bold text-emerald-800">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 mb-0.5" />
                  <span>TERVERIFIKASI</span>
                </div>
              </div>
              <p className="font-black text-slate-900 underline uppercase">
                {profile.namaKetuaRw || 'Eko Purwanto S.Kom'}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">NIK: {profile.nikKetuaRw || '1872021508820001'}</p>
            </div>

            <div>
              <p className="font-semibold text-slate-600">Disusun Oleh,</p>
              <p className="font-bold text-slate-900">Bendahara RW {profile.nomorRw || '018'}</p>
              <div className="h-20 flex items-center justify-center">
                <div className="w-16 h-16 border border-teal-300 rounded-xl bg-teal-50/50 flex flex-col items-center justify-center p-1 text-[8px] font-bold text-teal-800">
                  <CheckCircle2 className="w-5 h-5 text-teal-600 mb-0.5" />
                  <span>PEMBUKUAN SAH</span>
                </div>
              </div>
              <p className="font-black text-slate-900 underline uppercase">
                {profile.namaBendaharaRw || 'Diah Ika Putri'}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">Bendahara RW 018</p>
            </div>

            <div>
              <p className="font-semibold text-slate-600">
                {profile.kelurahan || 'Iringmulyo'}, {formatTanggalIndo(new Date().toISOString().slice(0, 10))}
              </p>
              <p className="font-bold text-slate-900">Sekretaris RW {profile.nomorRw || '018'}</p>
              <div className="h-20 flex items-center justify-center">
                <div className="w-16 h-16 border border-slate-300 rounded-xl bg-slate-50 flex flex-col items-center justify-center p-1 text-[8px] font-bold text-slate-700">
                  <Building className="w-5 h-5 text-slate-600 mb-0.5" />
                  <span>ARSIP RESMI</span>
                </div>
              </div>
              <p className="font-black text-slate-900 underline uppercase">
                {profile.namaSekretarisRw || 'Agung Prayoga'}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">Sekretaris RW 018</p>
            </div>
          </div>
        </div>

        {/* Modal Bottom Bar (Hidden on print) */}
        <div className="bg-slate-100 border-t border-slate-200 px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 bg-white hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95 w-full sm:w-auto justify-center"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Kembali ke Menu Sebelumnya</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3.5 py-2 bg-white hover:bg-teal-50 text-teal-800 border border-teal-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4 text-teal-600" />
              <span>Ekspor Excel</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Laporan Kas</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KasReportModal;
