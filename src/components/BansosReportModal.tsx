import React, { useState, useMemo } from 'react';
import {
  X,
  Printer,
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  Layers,
  Gift,
  CheckCircle2,
  Clock,
  Building,
  Calendar,
  UserCheck,
  Package,
  FileText,
  HeartHandshake,
  ArrowLeft
} from 'lucide-react';
import { BansosItem, BansosType, BansosStatus, RWProfile } from '../types';
import { formatTanggalIndo } from '../utils/formatters';
import { exportBansos } from '../utils/exportUtils';

interface BansosReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  bansosList: BansosItem[];
  profile: RWProfile;
}

export const BansosReportModal: React.FC<BansosReportModalProps> = ({
  isOpen,
  onClose,
  bansosList,
  profile,
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterRt, setFilterRt] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  // Summary per type for the comprehensive rekapitulasi table
  const rekapitulasi = useMemo(() => {
    return allBansosTypes.map((type) => {
      const items = bansosList.filter((b) => b.jenisBansos === type);
      const total = items.length;
      const disalurkan = items.filter((b) => b.status === 'Disalurkan').length;
      const menunggu = items.filter(
        (b) => b.status === 'Menunggu Verifikasi' || b.status === 'Belum Diambil'
      ).length;
      const persentase = total > 0 ? Math.round((disalurkan / total) * 100) : 0;
      return {
        type,
        total,
        disalurkan,
        menunggu,
        persentase,
      };
    });
  }, [bansosList]);

  const totalSemuaPenerima = bansosList.length;
  const totalDisalurkan = bansosList.filter((b) => b.status === 'Disalurkan').length;
  const totalMenunggu = bansosList.filter(
    (b) => b.status === 'Menunggu Verifikasi' || b.status === 'Belum Diambil'
  ).length;
  const overallPersentase =
    totalSemuaPenerima > 0
      ? Math.round((totalDisalurkan / totalSemuaPenerima) * 100)
      : 0;

  // Filtered detailed items
  const filteredData = useMemo(() => {
    return bansosList.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.namaPenerima.toLowerCase().includes(q) ||
        item.nik.includes(q) ||
        item.noKk.includes(q) ||
        item.jenisBansos.toLowerCase().includes(q) ||
        item.rt.includes(q) ||
        (item.nominalOrPaket && item.nominalOrPaket.toLowerCase().includes(q)) ||
        (item.petugasPenyalur && item.petugasPenyalur.toLowerCase().includes(q));

      const matchType = filterType === 'ALL' || item.jenisBansos === filterType;
      const matchRt = filterRt === 'ALL' || item.rt === filterRt || item.rt === filterRt.replace(/^0+/, '');
      const matchStatus = filterStatus === 'ALL' || item.status === filterStatus;

      return matchSearch && matchType && matchRt && matchStatus;
    });
  }, [bansosList, searchQuery, filterType, filterRt, filterStatus]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    exportBansos(filteredData, 'xlsx');
  };

  const handleExportCsv = () => {
    exportBansos(filteredData, 'csv');
  };

  const getBansosBadgeColor = (type: BansosType) => {
    switch (type) {
      case 'Santunan Yatim/Piatu':
        return 'bg-pink-100 text-pink-900 border-pink-300';
      case 'Beras CBP 10kg':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'PKH':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'BPNT (Sembako)':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'BLT Dana Desa':
        return 'bg-teal-100 text-teal-900 border-teal-300';
      case 'KIS / PBI':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'PIP Sekolah':
        return 'bg-indigo-100 text-indigo-900 border-indigo-300';
      case 'Santunan Kas RW':
      default:
        return 'bg-orange-100 text-orange-900 border-orange-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-3xl w-full max-w-6xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Header Dialog (Hidden on Print) */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 print:hidden">
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
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center font-black shrink-0 hidden sm:flex">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Laporan Lengkap & Rinci Bantuan Sosial (Bansos)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {profile.namaRw}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Rekapitulasi dan rincian tabel seluruh penerima bantuan sosial Kel. {profile.kelurahan}, {profile.kotaKab}.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all cursor-pointer"
              title="Cetak Laporan / Simpan PDF"
            >
              <Printer className="w-3.5 h-3.5 text-amber-300" />
              <span>Cetak / PDF</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              title="Ekspor ke Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              title="Tutup Laporan"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls Toolbar (Hidden on Print) */}
        <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 shrink-0 space-y-2.5 print:hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama, NIK, KK..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
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

            {/* Filter Jenis Bansos */}
            <div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full py-2 px-3 text-xs rounded-xl border border-slate-300 bg-white font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="ALL">Semua Program Bansos ({bansosList.length})</option>
                {allBansosTypes.map((t) => {
                  const count = bansosList.filter((b) => b.jenisBansos === t).length;
                  return (
                    <option key={t} value={t}>
                      {t} ({count})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Filter RT */}
            <div>
              <select
                value={filterRt}
                onChange={(e) => setFilterRt(e.target.value)}
                className="w-full py-2 px-3 text-xs rounded-xl border border-slate-300 bg-white font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="ALL">Semua Wilayah RT</option>
                {profile.daftarRt.map((rt) => (
                  <option key={rt} value={rt}>
                    RT {rt}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Status */}
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full py-2 px-3 text-xs rounded-xl border border-slate-300 bg-white font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="ALL">Semua Status Penyaluran</option>
                <option value="Disalurkan">Disalurkan</option>
                <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
                <option value="Belum Diambil">Belum Diambil</option>
              </select>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Content / Print Sheet */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-slate-800 print:overflow-visible print:p-0">
          
          {/* Printable Official Letterhead (Kop Surat) */}
          <div className="border-b-2 border-slate-800 pb-4 text-center">
            <div className="flex items-center justify-center gap-3 mb-1">
              <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center font-black text-xl shadow-xs print:border print:border-black">
                RW
              </div>
              <div className="text-left">
                <h1 className="text-base sm:text-lg font-black uppercase tracking-wide text-slate-900 leading-tight">
                  PENGURUS RUKUN WARGA {profile.nomorRw} (RW {profile.nomorRw})
                </h1>
                <p className="text-xs font-bold text-slate-700">
                  KELURAHAN {profile.kelurahan.toUpperCase()} &bull; KECAMATAN {profile.kecamatan.toUpperCase()}
                </p>
                <p className="text-[11px] text-slate-500">
                  {profile.kotaKab.toUpperCase()} - PROVINSI LAMPUNG &bull; KODE POS 34112
                </p>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-300">
              <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase underline tracking-wider">
                LAPORAN REKAPITULASI & RINCIAN PENYALURAN BANTUAN SOSIAL (BANSOS)
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Periode Data: {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })} &bull; Dicetak pada: {formatTanggalIndo(new Date().toISOString().slice(0, 10))}
              </p>
            </div>
          </div>

          {/* Section 1: Tabel Ringkasan Rekapitulasi Semua Jenis Bantuan */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-700" />
                <span>I. REKAPITULASI SEMUA PROGRAM BANTUAN SOSIAL</span>
              </h3>
              <span className="text-[11px] font-bold text-slate-500">
                Total {allBansosTypes.length} Jenis Program Bantuan
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-black border-b border-slate-200">
                    <th className="p-2.5 text-center w-10">No</th>
                    <th className="p-2.5">Nama Program / Jenis Bansos</th>
                    <th className="p-2.5 text-center">Total Kuota / Penerima</th>
                    <th className="p-2.5 text-center">Sudah Disalurkan</th>
                    <th className="p-2.5 text-center">Belum / Antrean</th>
                    <th className="p-2.5 text-center">Persentase (%)</th>
                    <th className="p-2.5 text-center">Status Realisasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rekapitulasi.map((item, idx) => (
                    <tr
                      key={item.type}
                      className={
                        filterType === item.type
                          ? 'bg-amber-50/70 font-semibold'
                          : 'hover:bg-slate-50/80 transition-colors'
                      }
                    >
                      <td className="p-2.5 text-center font-mono font-bold text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="p-2.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getBansosBadgeColor(
                              item.type
                            )}`}
                          >
                            {item.type}
                          </span>
                          {item.type === 'Santunan Yatim/Piatu' && (
                            <span className="text-[10px] text-pink-700 font-bold bg-pink-50 px-1.5 py-0.2 rounded">
                              Peduli Anak Yatim
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-2.5 text-center font-bold text-slate-800">
                        {item.total} Warga
                      </td>
                      <td className="p-2.5 text-center font-bold text-emerald-700">
                        {item.disalurkan} Paket/Org
                      </td>
                      <td className="p-2.5 text-center font-bold text-amber-700">
                        {item.menunggu}
                      </td>
                      <td className="p-2.5 text-center font-bold">
                        <div className="flex items-center justify-center gap-1.5">
                          <div className="w-12 bg-slate-200 h-2 rounded-full overflow-hidden hidden sm:block">
                            <div
                              className="bg-emerald-600 h-full rounded-full"
                              style={{ width: `${item.persentase}%` }}
                            />
                          </div>
                          <span>{item.persentase}%</span>
                        </div>
                      </td>
                      <td className="p-2.5 text-center">
                        {item.total === 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                            Belum Ada Data
                          </span>
                        ) : item.persentase === 100 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                            Tuntas (100%)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800">
                            Berjalan
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {/* Total Summary Row */}
                  <tr className="bg-slate-200/90 font-black text-slate-900 border-t-2 border-slate-300">
                    <td colSpan={2} className="p-2.5 text-right uppercase tracking-wider">
                      TOTAL KESELURUHAN BANSOS:
                    </td>
                    <td className="p-2.5 text-center text-sm">{totalSemuaPenerima} Warga</td>
                    <td className="p-2.5 text-center text-sm text-emerald-800">
                      {totalDisalurkan}
                    </td>
                    <td className="p-2.5 text-center text-sm text-amber-800">
                      {totalMenunggu}
                    </td>
                    <td className="p-2.5 text-center text-sm">{overallPersentase}%</td>
                    <td className="p-2.5 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-800 text-white">
                        {totalDisalurkan}/{totalSemuaPenerima} Tersalur
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Tabel Rincian Lengkap & Detail Penerima Bantuan */}
          <div className="space-y-2.5 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <h3 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2">
                <Gift className="w-4 h-4 text-amber-700" />
                <span>II. DAFTAR RINCI PENERIMA BANTUAN SOSIAL (SEMUA JENIS)</span>
              </h3>
              <span className="text-[11px] font-bold text-slate-500">
                Menampilkan {filteredData.length} dari {bansosList.length} data
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-black border-b border-slate-200">
                    <th className="p-2.5 text-center w-10">No</th>
                    <th className="p-2.5">Nama Penerima & NIK / KK</th>
                    <th className="p-2.5 text-center">RT</th>
                    <th className="p-2.5">Jenis Program Bansos</th>
                    <th className="p-2.5">Bentuk / Nominal Bantuan</th>
                    <th className="p-2.5 text-center">Periode</th>
                    <th className="p-2.5 text-center">Tgl Penyaluran</th>
                    <th className="p-2.5">Petugas Penyalur</th>
                    <th className="p-2.5 text-center">Status</th>
                    <th className="p-2.5">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-400 font-medium">
                        Tidak ada data bantuan sosial yang cocok dengan filter yang dipilih.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-2.5 text-center font-mono font-bold text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="p-2.5">
                          <div className="font-black text-slate-900">{item.namaPenerima}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            NIK: {item.nik} | KK: {item.noKk}
                          </div>
                        </td>
                        <td className="p-2.5 text-center">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-black text-[11px] border border-slate-200">
                            RT {item.rt}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border inline-block ${getBansosBadgeColor(
                              item.jenisBansos
                            )}`}
                          >
                            {item.jenisBansos}
                          </span>
                        </td>
                        <td className="p-2.5 font-bold text-slate-800">
                          {item.nominalOrPaket || '-'}
                        </td>
                        <td className="p-2.5 text-center text-slate-600 font-medium">
                          {item.periode || '-'}
                        </td>
                        <td className="p-2.5 text-center text-slate-600 font-medium">
                          {item.tanggalPenyaluran
                            ? formatTanggalIndo(item.tanggalPenyaluran)
                            : '-'}
                        </td>
                        <td className="p-2.5 text-slate-700 font-medium">
                          {item.petugasPenyalur || '-'}
                        </td>
                        <td className="p-2.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black inline-block ${
                              item.status === 'Disalurkan'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : item.status === 'Belum Diambil'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-blue-100 text-blue-800 border border-blue-300'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="p-2.5 text-[11px] text-slate-500 max-w-xs truncate" title={item.keterangan}>
                          {item.keterangan || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Lembar Pengesahan & Tanda Tangan Resmi */}
          <div className="pt-8 grid grid-cols-2 gap-6 text-center text-xs break-inside-avoid">
            <div>
              <p className="text-slate-600">Mengetahui / Menyetujui,</p>
              <p className="font-black text-slate-900 mt-0.5">Ketua RW {profile.nomorRw || '018'} Kel. {profile.kelurahan || 'Iringmulyo'}</p>
              <div className="h-16 flex items-center justify-center">
                <span className="text-[10px] text-slate-300 italic">( Tanda Tangan & Stempel )</span>
              </div>
              <p className="font-black text-slate-900 underline uppercase tracking-wide">
                {profile.namaKetuaRw || 'Eko Purwanto S.Kom'}
              </p>
              <p className="text-[10px] text-slate-500">NIK: {profile.nikKetuaRw || '1872021508820001'}</p>
            </div>

            <div>
              <p className="text-slate-600">{profile.kotaKab || 'Kota Metro'}, {formatTanggalIndo(new Date().toISOString().slice(0, 10))}</p>
              <p className="font-black text-slate-900 mt-0.5">Sekretaris RW {profile.nomorRw || '018'}</p>
              <div className="h-16 flex items-center justify-center">
                <span className="text-[10px] text-slate-300 italic">( Tanda Tangan )</span>
              </div>
              <p className="font-black text-slate-900 underline uppercase tracking-wide">
                {profile.namaSekretarisRw || 'Agung Prayoga'}
              </p>
              <p className="text-[10px] text-slate-500">Sekretaris RW 018</p>
            </div>
          </div>

        </div>

        {/* Modal Footer (Hidden on Print) */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0 print:hidden">
          <div className="flex items-center gap-2 text-slate-500 text-[11px]">
            <HeartHandshake className="w-4 h-4 text-pink-600 shrink-0" />
            <span>
              Laporan resmi penyaluran bantuan sosial, santunan yatim/piatu, dan dana pangan terintegrasi RW 018.
            </span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Laporan</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
export default BansosReportModal;
