import React, { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Printer,
  X,
  ArrowLeft,
  Download,
  FileSpreadsheet,
  HeartHandshake,
  Scale,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Wallet,
  Users,
  CheckCircle2,
  Filter,
  Calendar,
  Building,
  UserCheck,
  AlertCircle,
  Share2,
  FileDown,
  Loader2,
  FileText
} from 'lucide-react';
import { RWProfile, IuranRkmRecord, WargaMeninggalRecord } from '../types';
import { formatRupiah, formatTanggalIndo } from '../utils/formatters';
import { LOGO_RW_018, handleLogoError } from '../constants/logo';
import { calculateSaldoRkmSummary, SaldoRkmRtItem } from '../utils/rkmUtils';
import { exportToExcel, exportToCsv } from '../utils/exportUtils';

interface RkmReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  iuranList: IuranRkmRecord[];
  meninggalList: WargaMeninggalRecord[];
  profile: RWProfile;
  initialRt?: string;
  initialTahun?: number;
}

export const RkmReportModal: React.FC<RkmReportModalProps> = ({
  isOpen,
  onClose,
  iuranList,
  meninggalList,
  profile,
  initialRt = 'ALL',
  initialTahun = 2026,
}) => {
  const [selectedRt, setSelectedRt] = useState<string>(initialRt);
  const [selectedTahun, setSelectedTahun] = useState<number>(initialTahun);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfProgressMsg, setPdfProgressMsg] = useState('');
  const [pdfSuccessToast, setPdfSuccessToast] = useState<string | null>(null);

  // Sync state if initialRt changes
  React.useEffect(() => {
    if (initialRt) {
      setSelectedRt(initialRt);
    }
  }, [initialRt]);

  // Compute Full Summary
  const summary = useMemo(() => {
    return calculateSaldoRkmSummary(
      iuranList,
      meninggalList,
      ['039', '040', '041', '042'],
      selectedTahun > 0 ? selectedTahun : undefined
    );
  }, [iuranList, meninggalList, selectedTahun]);

  // Filtered RT items to show in the table
  const displayedRtItems = useMemo(() => {
    if (selectedRt === 'ALL') {
      return summary.perRt;
    }
    return summary.perRt.filter((r) => r.rt === selectedRt);
  }, [summary, selectedRt]);

  // Filtered Santunan Duka List
  const filteredSantunan = useMemo(() => {
    return meninggalList.filter((m) => {
      const matchRt = selectedRt === 'ALL' || m.rt === selectedRt;
      let matchTahun = true;
      if (selectedTahun > 0 && m.tanggalMeninggal) {
        matchTahun = m.tanggalMeninggal.startsWith(String(selectedTahun));
      }
      return matchRt && matchTahun;
    });
  }, [meninggalList, selectedRt, selectedTahun]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  // Generate and Share / Download Official A4 PDF Document
  const handleGeneratePdf = async (mode: 'download' | 'share' = 'download') => {
    try {
      setIsGeneratingPdf(true);
      setPdfProgressMsg('Menyiapkan dokumen resmi format A4...');

      const targetElement = document.getElementById('rkm-report-printable-document');
      if (!targetElement) {
        throw new Error('Elemen dokumen tidak ditemukan');
      }

      setPdfProgressMsg('Memproses render halaman beresolusi tinggi...');
      await new Promise((resolve) => setTimeout(resolve, 300));

      const canvas = await html2canvas(targetElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: targetElement.scrollWidth,
      });

      setPdfProgressMsg('Menyusun berkas PDF resmi A4...');
      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // Page 1
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const dateStr = new Date().toISOString().slice(0, 10);
      const rtSuffix = selectedRt === 'ALL' ? 'Total_RW018' : `RT${selectedRt}`;
      const fileName = `Laporan_Saldo_Kas_RKM_${rtSuffix}_${dateStr}.pdf`;

      if (mode === 'share') {
        const pdfBlob = pdf.output('blob');
        const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

        if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
          setPdfProgressMsg('Membuka menu bagikan perangkat...');
          await navigator.share({
            files: [pdfFile],
            title: `Laporan Saldo Kas RKM ${rtSuffix}`,
            text: `Berikut kami sampaikan berkas resmi Laporan Saldo Kas RKM RW 018 Kampung Banten (Format Kertas A4 Siap Cetak).`,
          });
          setPdfSuccessToast('Berkas PDF berhasil dibagikan');
        } else {
          pdf.save(fileName);
          setPdfSuccessToast('Fitur berbagi file tidak didukung browser ini, berkas PDF telah diunduh.');
        }
      } else {
        pdf.save(fileName);
        setPdfSuccessToast(`Berkas PDF ${fileName} berhasil diunduh.`);
      }
    } catch (err: any) {
      console.error('Gagal generate PDF:', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
      setPdfProgressMsg('');
      setTimeout(() => setPdfSuccessToast(null), 4000);
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `Laporan_Saldo_Kas_RKM_RW018_${dateStr}`;

    const dataSaldo = summary.perRt.map((r, idx) => ({
      No: idx + 1,
      Wilayah: r.namaRt,
      'Petugas Kolektor': r.namaPetugas,
      'Total KK Terdaftar': r.totalKk,
      'KK Lunas': r.totalKkLunas,
      'KK Belum Lunas': r.totalKkBelumLunas,
      'KK Dhuafa Bebas Iuran': r.totalKkDhuafa,
      'Total Penerimaan Iuran (Rp)': r.totalPenerimaanIuran,
      'Total Tunggakan Iuran (Rp)': r.totalTunggakanIuran,
      'Total Santunan Disalurkan (Rp)': r.totalSantunanDisalurkan,
      'Warga Meninggal (Jiwa)': r.totalWargaMeninggal,
      'Saldo Kas Bersih (Rp)': r.saldoBersih,
      'Realisasi Lunas (%)': `${r.persentaseLunas}%`,
    }));

    // Add Grand Total Row
    dataSaldo.push({
      No: dataSaldo.length + 1,
      Wilayah: 'TOTAL RW 018',
      'Petugas Kolektor': 'Pengurus RKM RW 018',
      'Total KK Terdaftar': summary.totalKk,
      'KK Lunas': summary.totalKkLunas,
      'KK Belum Lunas': summary.totalKkBelumLunas,
      'KK Dhuafa Bebas Iuran': summary.totalKkDhuafa,
      'Total Penerimaan Iuran (Rp)': summary.totalPenerimaanIuran,
      'Total Tunggakan Iuran (Rp)': summary.totalTunggakanIuran,
      'Total Santunan Disalurkan (Rp)': summary.totalSantunanDisalurkan,
      'Warga Meninggal (Jiwa)': summary.totalWargaMeninggal,
      'Saldo Kas Bersih (Rp)': summary.totalSaldoBersih,
      'Realisasi Lunas (%)': `${summary.persentaseLunas}%`,
    });

    const dataSantunan = filteredSantunan.map((m, idx) => ({
      No: idx + 1,
      'Nama Almarhum/ah': m.nama,
      'NIK': ` ${m.nik}`,
      'Wilayah RT': `RT ${m.rt}`,
      'Tanggal Wafat': m.tanggalMeninggal,
      'Lokasi Pemakaman': m.lokasiPemakaman,
      'Ahli Waris': m.namaAhliWaris,
      'Hubungan Waris': m.hubunganWaris,
      'Santunan Duka (Rp)': m.santunanRkm,
      'Status Santunan': m.statusSantunan,
    }));

    exportToExcel(fileName, [
      { sheetName: 'Saldo Kas RKM per RT', data: dataSaldo },
      { sheetName: 'Rincian Santunan Duka', data: dataSantunan },
    ]);
  };

  // Export to CSV
  const handleExportCsv = () => {
    const dateStr = new Date().toISOString().slice(0, 10);
    const dataSaldo = summary.perRt.map((r, idx) => ({
      No: idx + 1,
      Wilayah: r.namaRt,
      Petugas: r.namaPetugas,
      'Total KK': r.totalKk,
      'Penerimaan (Rp)': r.totalPenerimaanIuran,
      'Tunggakan (Rp)': r.totalTunggakanIuran,
      'Santunan (Rp)': r.totalSantunanDisalurkan,
      'Warga Meninggal': r.totalWargaMeninggal,
      'Saldo Bersih (Rp)': r.saldoBersih,
      'Tertib (%)': `${r.persentaseLunas}%`,
    }));

    exportToCsv(`Rekap_Saldo_RKM_RW018_${dateStr}`, dataSaldo);
  };

  const ketuaRkm = profile.pengurusRkm?.ketua || 'H. Daryanto';
  const bendaharaRkm = profile.pengurusRkm?.bendahara || 'H. Yayat S. Nur';
  const ketuaRw = profile.namaKetuaRw || 'Eko Purwanto';
  const nikKetuaRw = profile.nikKetuaRw || '1872021505720001';

  // Specific RT statistics when filtered
  const activeRtStat = selectedRt !== 'ALL'
    ? summary.perRt.find((r) => r.rt === selectedRt)
    : null;

  const displayPenerimaan = activeRtStat ? activeRtStat.totalPenerimaanIuran : summary.totalPenerimaanIuran;
  const displaySantunan = activeRtStat ? activeRtStat.totalSantunanDisalurkan : summary.totalSantunanDisalurkan;
  const displaySaldo = activeRtStat ? activeRtStat.saldoBersih : summary.totalSaldoBersih;
  const displayWafat = activeRtStat ? activeRtStat.totalWargaMeninggal : summary.totalWargaMeninggal;
  const displayKk = activeRtStat ? activeRtStat.totalKk : summary.totalKk;
  const displayTunggakan = activeRtStat ? activeRtStat.totalTunggakanIuran : summary.totalTunggakanIuran;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:z-auto">
      <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] print:max-h-none print:shadow-none print:border-none print:rounded-none print:w-full">

        {/* Top Floating Action Bar (Hidden in Print) */}
        <div className="p-3.5 sm:p-4 bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 print:hidden border-b border-emerald-800">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-emerald-600/40 shadow-xs shrink-0 cursor-pointer active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-amber-300" />
              <span>Kembali</span>
            </button>
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-300/30 text-amber-300 flex items-center justify-center font-black shrink-0 hidden sm:flex">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black tracking-tight text-white truncate">
                  Laporan Saldo Kas RKM per RT & Total RW 018
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-emerald-950">
                  {profile.namaRw}
                </span>
              </div>
              <p className="text-[11px] text-emerald-200 truncate">
                Rekapitulasi iuran warga, penyaluran santunan duka kematian & sisa saldo kas RKM.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => handleGeneratePdf('share')}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              title="Bagikan Dokumen Resmi Format PDF Kertas A4"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Bagikan PDF (A4)</span>
            </button>

            <button
              type="button"
              onClick={() => handleGeneratePdf('download')}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              title="Unduh Berkas PDF Kertas A4 Siap Cetak"
            >
              <FileDown className="w-3.5 h-3.5 text-blue-300" />
              <span className="hidden sm:inline">Unduh PDF</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-emerald-950 text-xs font-black rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
              title="Cetak Langsung ke Printer atau Simpan PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Laporan</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all cursor-pointer active:scale-95"
              title="Unduh Spreadsheet Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
              <span className="hidden sm:inline">Excel</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all cursor-pointer active:scale-95"
              title="Unduh Format CSV"
            >
              <Download className="w-3.5 h-3.5 text-teal-300" />
              <span className="hidden sm:inline">CSV</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-emerald-800/80 text-emerald-200 hover:text-white cursor-pointer transition-colors"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls (Hidden in Print) */}
        <div className="p-3 sm:px-6 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 print:hidden">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 text-slate-500 font-bold">
              <Filter className="w-3.5 h-3.5" />
              <span>Pilih Wilayah:</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSelectedRt('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedRt === 'ALL'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Semua RT (Total RW 018)
              </button>
              {['039', '040', '041', '042'].map((rt) => (
                <button
                  key={rt}
                  type="button"
                  onClick={() => setSelectedRt(rt)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedRt === rt
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  RT {rt}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-slate-500 font-bold">
              <Calendar className="w-3.5 h-3.5" />
              <span>Tahun Buku:</span>
            </div>
            <select
              value={selectedTahun}
              onChange={(e) => setSelectedTahun(Number(e.target.value))}
              className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 cursor-pointer shadow-2xs"
            >
              <option value={2026}>Tahun 2026</option>
              <option value={2025}>Tahun 2025</option>
              <option value={0}>Semua Periode</option>
            </select>
          </div>
        </div>

        {/* Printable Document Container (Standard A4) */}
        <div
          id="rkm-report-printable-document"
          className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 text-slate-900 print:overflow-visible print:p-0 print:space-y-4 bg-white font-sans"
        >
          {/* Official Letterhead (KOP SURAT RESMI RW 018 KAMPUNG BANTEN) */}
          <div className="border-b-4 border-double border-black pb-4 text-slate-900">
            <div className="flex items-center justify-between">
              {/* Logo Kiri Resmi RW 018 (Diperbesar w-20 sm:w-28 md:w-30) */}
              <div className="w-20 sm:w-28 md:w-30 shrink-0 flex items-center justify-center print:w-30">
                <img
                  src={profile.logoUrl || LOGO_RW_018}
                  alt="Logo Resmi RW 018"
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 sm:w-28 sm:h-28 md:w-30 md:h-30 print:w-30 print:h-30 object-contain drop-shadow-xs"
                  onError={handleLogoError}
                />
              </div>

              {/* Teks Kop Surat Tengah - Proporsional & Rapi */}
              <div className="flex-1 text-center px-1.5 sm:px-4 space-y-0.5 sm:space-y-1">
                <h2 className="text-base sm:text-xl md:text-2xl font-black tracking-wider uppercase m-0 font-sans text-slate-900 leading-tight">
                  PEMERINTAH {profile.kotaKab?.toUpperCase() || 'KOTA METRO'}
                </h2>
                <h3 className="text-xs sm:text-base md:text-lg font-bold tracking-wider uppercase m-0 font-sans text-slate-800 leading-snug">
                  KECAMATAN {profile.kecamatan?.toUpperCase() || 'METRO TIMUR'}
                </h3>
                <h3 className="text-xs sm:text-base md:text-lg font-bold tracking-wider uppercase m-0 font-sans text-slate-800 leading-snug">
                  KELURAHAN {profile.kelurahan?.toUpperCase() || 'IRINGMULYO'}
                </h3>
                <h1 className="text-sm sm:text-lg md:text-xl font-black tracking-widest uppercase m-0 text-slate-900 font-sans leading-tight whitespace-nowrap">
                  RW 018 KAMPUNG BANTEN
                </h1>
                <h4 className="text-xs sm:text-sm font-bold tracking-wider uppercase m-0 text-emerald-800 font-sans">
                  RUKUN KEMATIAN MASYARAKAT (RKM)
                </h4>
                <p className="text-[10px] sm:text-xs font-sans text-slate-700 tracking-normal m-0 italic pt-0.5 leading-snug">
                  Sekretariat: Jl. Pala Nomor 1 RT 039 RW 018 Kampung Banten Kelurahan Iringmulyo, Metro Timur 34112
                </p>
              </div>

              {/* Balancer Kanan (Memastikan Proporsional Presisi Kanan-Kiri) */}
              <div className="w-20 sm:w-28 md:w-30 shrink-0 flex items-center justify-center opacity-0 pointer-events-none print:w-30" aria-hidden="true">
                <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-30 md:h-30 print:w-30 print:h-30" />
              </div>
            </div>

            {/* Title & Document Identifier */}
            <div className="mt-3 pt-2 border-t border-slate-300 text-center">
              <h2 className="text-sm sm:text-base font-black text-slate-950 uppercase tracking-wide">
                LAPORAN SALDO KAS RUKUN KEMATIAN MASYARAKAT (RKM)
              </h2>
              <p className="text-xs font-bold text-emerald-900 mt-0.5">
                {selectedRt === 'ALL'
                  ? 'REKAPITULASI IURAN & SANTUNAN PER RT SERTA TOTAL KONSOLIDASI RW 018'
                  : `REKAPITULASI IURAN & SANTUNAN WILAYAH RT ${selectedRt} (RW 018)`}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                No. Dokumen: 018/RKM-KEU/RW-18/YSD/{selectedTahun > 0 ? selectedTahun : new Date().getFullYear()} &bull; Dicetak: {formatTanggalIndo(new Date().toISOString().slice(0, 10))}
              </p>
            </div>
          </div>

          {/* Section I: Ringkasan Eksekutif Kas RKM */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5 uppercase">
                <Scale className="w-4 h-4 text-emerald-700" />
                <span>I. Ringkasan Eksekutif Kas RKM {selectedRt === 'ALL' ? 'RW 018' : `RT ${selectedRt}`}</span>
              </h3>
              <span className="text-[11px] font-bold text-slate-500">
                Periode: {selectedTahun > 0 ? `Tahun ${selectedTahun}` : 'Semua Periode'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-emerald-50/90 border border-emerald-300/80 rounded-2xl p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase text-emerald-900 tracking-wider">
                    Total Penerimaan Iuran
                  </span>
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="mt-1 text-sm sm:text-base font-black text-emerald-800">
                  {formatRupiah(displayPenerimaan)}
                </div>
                <span className="text-[10px] text-emerald-700 block mt-0.5">
                  Dari {displayKk} Kepala Keluarga (KK)
                </span>
              </div>

              <div className="bg-rose-50/90 border border-rose-300/80 rounded-2xl p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase text-rose-900 tracking-wider">
                    Total Santunan Duka
                  </span>
                  <TrendingDown className="w-4 h-4 text-rose-600" />
                </div>
                <div className="mt-1 text-sm sm:text-base font-black text-rose-800">
                  {formatRupiah(displaySantunan)}
                </div>
                <span className="text-[10px] text-rose-700 block mt-0.5">
                  Santunan {displayWafat} Jiwa Warga Wafat
                </span>
              </div>

              <div className="bg-teal-50 border-2 border-teal-500 rounded-2xl p-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-teal-950 tracking-wider">
                    Saldo Kas Bersih RKM
                  </span>
                  <Wallet className="w-4 h-4 text-teal-700" />
                </div>
                <div className="mt-1 text-sm sm:text-base font-black text-teal-900">
                  {formatRupiah(displaySaldo)}
                </div>
                <span className="text-[10px] text-teal-800 block mt-0.5 font-bold">
                  Sisa Saldo Kas Siap Pakai
                </span>
              </div>

              <div className="bg-amber-50/90 border border-amber-300/80 rounded-2xl p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase text-amber-900 tracking-wider">
                    Sisa Piutang / Tunggakan
                  </span>
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                </div>
                <div className="mt-1 text-sm sm:text-base font-black text-amber-900">
                  {formatRupiah(displayTunggakan)}
                </div>
                <span className="text-[10px] text-amber-700 block mt-0.5">
                  Perlu Ditagih Petugas Kolektor
                </span>
              </div>
            </div>
          </div>

          {/* Section II: Tabel Rekapitulasi Saldo Kas RKM per RT & RW 018 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5 uppercase">
                <Building className="w-4 h-4 text-emerald-700" />
                <span>II. Rekapitulasi Saldo Kas RKM per Wilayah RT (RW 018)</span>
              </h3>
              <span className="text-[11px] font-bold text-slate-500">
                Standar Iuran: Rp 10.000 / KK / Bulan
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-300">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-black border-b border-slate-300">
                    <th className="p-2.5 text-center w-8">No</th>
                    <th className="p-2.5">Wilayah</th>
                    <th className="p-2.5">Petugas Kolektor (Ketua RT)</th>
                    <th className="p-2.5 text-center">KK</th>
                    <th className="p-2.5 text-center">Lunas</th>
                    <th className="p-2.5 text-center">Tunggak</th>
                    <th className="p-2.5 text-right">Penerimaan (Rp)</th>
                    <th className="p-2.5 text-right">Santunan (Rp)</th>
                    <th className="p-2.5 text-center">Wafat</th>
                    <th className="p-2.5 text-right">Saldo Kas Bersih</th>
                    <th className="p-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {displayedRtItems.map((r, idx) => (
                    <tr key={r.rt} className="hover:bg-slate-50">
                      <td className="p-2.5 text-center font-bold text-slate-600">{idx + 1}</td>
                      <td className="p-2.5 font-black text-slate-900 whitespace-nowrap">
                        {r.namaRt}
                      </td>
                      <td className="p-2.5 text-slate-700">
                        <div className="font-bold text-slate-900">{r.namaPetugas}</div>
                        <div className="text-[10px] text-slate-500">{r.noHpPetugas || r.jabatanPetugas}</div>
                      </td>
                      <td className="p-2.5 text-center font-bold text-slate-800">{r.totalKk}</td>
                      <td className="p-2.5 text-center font-bold text-emerald-700">{r.totalKkLunas}</td>
                      <td className="p-2.5 text-center font-bold text-amber-700">{r.totalKkBelumLunas}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-emerald-800 whitespace-nowrap">
                        {formatRupiah(r.totalPenerimaanIuran)}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-rose-800 whitespace-nowrap">
                        {formatRupiah(r.totalSantunanDisalurkan)}
                      </td>
                      <td className="p-2.5 text-center font-bold text-slate-800">{r.totalWargaMeninggal}</td>
                      <td className="p-2.5 text-right font-mono font-black text-teal-950 whitespace-nowrap bg-teal-50/50">
                        {formatRupiah(r.saldoBersih)}
                      </td>
                      <td className="p-2.5 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          r.saldoBersih >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {r.saldoBersih >= 0 ? 'Surplus' : 'Defisit'} ({r.persentaseLunas}%)
                        </span>
                      </td>
                    </tr>
                  ))}

                  {/* Grand Total Row RW 018 */}
                  <tr className="bg-emerald-50/90 font-black text-slate-950 border-t-2 border-emerald-700">
                    <td colSpan={3} className="p-3 text-center uppercase tracking-wider text-emerald-950">
                      TOTAL KONSOLIDASI RW 018 (SEMUA RT)
                    </td>
                    <td className="p-3 text-center font-bold">{summary.totalKk} KK</td>
                    <td className="p-3 text-center text-emerald-800 font-bold">{summary.totalKkLunas} KK</td>
                    <td className="p-3 text-center text-amber-800 font-bold">{summary.totalKkBelumLunas} KK</td>
                    <td className="p-3 text-right font-mono text-emerald-900 text-sm whitespace-nowrap">
                      {formatRupiah(summary.totalPenerimaanIuran)}
                    </td>
                    <td className="p-3 text-right font-mono text-rose-900 text-sm whitespace-nowrap">
                      {formatRupiah(summary.totalSantunanDisalurkan)}
                    </td>
                    <td className="p-3 text-center font-bold text-slate-900">{summary.totalWargaMeninggal} Jiwa</td>
                    <td className="p-3 text-right font-mono text-teal-950 text-sm font-black whitespace-nowrap bg-teal-100/70">
                      {formatRupiah(summary.totalSaldoBersih)}
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-1 rounded-md text-[11px] font-black bg-emerald-700 text-white shadow-2xs">
                        SURPLUS ({summary.persentaseLunas}%)
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section III: Rincian Penyaluran Santunan Duka Kematian */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5 uppercase">
                <HeartHandshake className="w-4 h-4 text-emerald-700" />
                <span>III. Rincian Penyaluran Santunan Duka Kematian Warga</span>
              </h3>
              <span className="text-[11px] font-bold text-slate-500">
                Santunan Tunai Rp 1.500.000 / Jiwa
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-300">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-black border-b border-slate-300">
                    <th className="p-2.5 text-center w-8">No</th>
                    <th className="p-2.5">Nama Almarhum/ah</th>
                    <th className="p-2.5 text-center">RT</th>
                    <th className="p-2.5">Tanggal Wafat</th>
                    <th className="p-2.5">Lokasi Pemakaman</th>
                    <th className="p-2.5">Ahli Waris Penerima</th>
                    <th className="p-2.5 text-right">Nominal Santunan</th>
                    <th className="p-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredSantunan.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-4 text-center text-slate-500 italic">
                        Tidak ada data warga meninggal pada filter periode ini.
                      </td>
                    </tr>
                  ) : (
                    filteredSantunan.map((m, idx) => (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="p-2.5 text-center font-bold text-slate-600">{idx + 1}</td>
                        <td className="p-2.5 font-black text-slate-900">
                          {m.nama}
                          <span className="block text-[10px] font-normal text-slate-500">
                            NIK: {m.nik} &bull; Usia: {m.usia} Thn
                          </span>
                        </td>
                        <td className="p-2.5 text-center font-bold text-slate-700">RT {m.rt}</td>
                        <td className="p-2.5 text-slate-700 whitespace-nowrap">
                          {formatTanggalIndo(m.tanggalMeninggal)}
                        </td>
                        <td className="p-2.5 text-slate-700">{m.lokasiPemakaman}</td>
                        <td className="p-2.5 text-slate-800">
                          <div className="font-bold">{m.namaAhliWaris}</div>
                          <div className="text-[10px] text-slate-500">Hub: {m.hubunganWaris}</div>
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-rose-800 whitespace-nowrap">
                          {formatRupiah(m.santunanRkm)}
                        </td>
                        <td className="p-2.5 text-center whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {m.statusSantunan}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section IV: Ketentuan & Catatan Operasional RKM */}
          <div className="bg-slate-50 border border-slate-300 rounded-2xl p-3.5 text-xs text-slate-700 space-y-1">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Dasar Operasional & Ketentuan Kas RKM RW 018:</span>
            </h4>
            <ul className="text-[11px] leading-relaxed list-disc list-inside space-y-0.5 text-slate-600">
              <li>
                <strong>Iuran Wajib RKM</strong>: Sebesar <strong>Rp 10.000,- / KK / bulan</strong> ditarik oleh Ketua RT masing-masing (RT 039, RT 040, RT 041, RT 042) dan disetorkan ke Bendahara RKM RW 018.
              </li>
              <li>
                <strong>Warga Dhuafa</strong>: Diberikan pembebasan biaya iuran kas dan disubsidi penuh oleh kas RKM RW 018.
              </li>
              <li>
                <strong>Santunan Duka Kematian</strong>: Sebesar <strong>Rp 1.500.000,-</strong> diserahkan tunai kepada ahli waris almarhum/ah yang berdomisili di RW 018.
              </li>
              <li>
                <strong>Fasilitas Pemakaman</strong>: Penyediaan tenda duka, keranda jenazah, pemandian jenazah, kain kafan, dan biaya penggalian kubur disediakan bebas biaya bagi anggota RKM.
              </li>
            </ul>
          </div>

          {/* Section V: Lembar Pengesahan Tanda Tangan 3 Pihak */}
          <div className="pt-4 border-t border-slate-300 grid grid-cols-3 gap-3 text-center text-xs text-slate-800 break-inside-avoid">
            <div>
              <p className="font-semibold text-slate-600">Mengetahui,</p>
              <p className="font-black text-slate-950">Ketua RW 018</p>
              <div className="h-16 flex items-center justify-center">
                <div className="w-14 h-14 border border-emerald-300 rounded-xl bg-emerald-50/60 flex flex-col items-center justify-center p-1 text-[8px] font-bold text-emerald-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 mb-0.5" />
                  <span>TERVERIFIKASI</span>
                </div>
              </div>
              <p className="font-black text-slate-950 underline uppercase">
                {ketuaRw}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">NIK: {nikKetuaRw}</p>
            </div>

            <div>
              <p className="font-semibold text-slate-600">Menyetujui,</p>
              <p className="font-black text-slate-950">Ketua RKM RW 018</p>
              <div className="h-16 flex items-center justify-center">
                <div className="w-14 h-14 border border-teal-300 rounded-xl bg-teal-50/60 flex flex-col items-center justify-center p-1 text-[8px] font-bold text-teal-800">
                  <UserCheck className="w-4 h-4 text-teal-600 mb-0.5" />
                  <span>PENGURUS</span>
                </div>
              </div>
              <p className="font-black text-slate-950 underline uppercase">
                {ketuaRkm}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">Rukun Kematian Masyarakat</p>
            </div>

            <div>
              <p className="font-semibold text-slate-600">Disusun Oleh,</p>
              <p className="font-black text-slate-950">Bendahara RKM RW 018</p>
              <div className="h-16 flex items-center justify-center">
                <div className="w-14 h-14 border border-slate-300 rounded-xl bg-slate-50 flex flex-col items-center justify-center p-1 text-[8px] font-bold text-slate-600">
                  <Wallet className="w-4 h-4 text-slate-500 mb-0.5" />
                  <span>KASIR / BUKU KAS</span>
                </div>
              </div>
              <p className="font-black text-slate-950 underline uppercase">
                {bendaharaRkm}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">Keuangan Kas RKM</p>
            </div>
          </div>

        </div>
      </div>

      {/* OVERLAY LOADING PEMBUATAN FILE PDF RESMI (A4) */}
      {isGeneratingPdf && (
        <div className="fixed inset-0 z-60 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full text-center space-y-4 border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base">Membuat File PDF Resmi (A4)</h4>
              <p className="text-xs text-slate-600 mt-1">
                {pdfProgressMsg || 'Menyiapkan berkas dokumen resmi RKM RW 018...'}
              </p>
            </div>
            <div className="text-[11px] text-slate-400 font-sans">
              Standar Kertas A4 Siap Cetak ke Printer / Dibagikan
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFIKASI SUKSES PDF */}
      {pdfSuccessToast && (
        <div className="fixed bottom-6 right-6 z-60 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 text-xs animate-in slide-in-from-bottom duration-300 max-w-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="leading-snug">{pdfSuccessToast}</span>
        </div>
      )}
    </div>
  );
};
