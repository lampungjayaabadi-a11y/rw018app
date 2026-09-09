import React from 'react';
import {
  Printer,
  X,
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  Clock,
  QrCode,
  HeartHandshake,
  Check
} from 'lucide-react';
import { IuranRkmRecord, RWProfile, BulanIuranItem } from '../types';
import { formatRupiah, formatTanggalIndo } from '../utils/formatters';
import { LOGO_RW_018, handleLogoError } from '../constants/logo';

interface RkmCardModalProps {
  record: IuranRkmRecord | null;
  profile: RWProfile;
  onClose: () => void;
}

const NAMA_BULAN_INDONESIA = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember'
];

export const RkmCardModal: React.FC<RkmCardModalProps> = ({
  record,
  profile,
  onClose,
}) => {
  if (!record) return null;

  const handlePrint = () => {
    window.print();
  };

  const tahun = record.tahun || 2026;

  // Build 12-month data if not provided in record
  const rincian12Bulan: BulanIuranItem[] = (record.rincian12Bulan && record.rincian12Bulan.length === 12)
    ? record.rincian12Bulan
    : NAMA_BULAN_INDONESIA.map((namaBulan, idx) => {
        const monthNum = idx + 1;
        const isFree = record.nominal === 0;
        // If legacy single month record, check if it matches
        const matchesMonth = record.bulanTahun ? Number(record.bulanTahun.split('-')[1]) === monthNum : false;
        const isPaid = isFree || matchesMonth || (monthNum <= 8 && record.status === 'Lunas');
        
        return {
          bulan: monthNum,
          namaBulan,
          nominal: isFree ? 0 : (record.nominal !== undefined ? record.nominal : 10000),
          bayar: isPaid,
          tanggalBayar: isPaid ? (record.tanggalBayar || `${tahun}-${String(monthNum).padStart(2, '0')}-05`) : '',
          status: isFree ? 'Bebas Iuran (Dhuafa)' : isPaid ? 'Lunas' : 'Belum Lunas',
          keterangan: isFree ? 'Subsidi RKM RW 018' : isPaid ? 'Lunas Kolektor RT' : 'Belum Bayar',
          kolektor: record.penerima || `Ketua RT ${record.rt}`
        };
      });

  // Calculate totals
  const totalNominalTahun = rincian12Bulan.reduce((sum, item) => sum + item.nominal, 0);
  const totalTerbayar = rincian12Bulan.reduce((sum, item) => item.bayar ? sum + item.nominal : sum, 0);
  const sisaTunggakan = totalNominalTahun - totalTerbayar;
  const lunasCount = rincian12Bulan.filter((b) => b.bayar).length;

  // Determine collector name based on RT
  const getKolektorByRt = (rt: string) => {
    if (rt === '039') return { nama: 'Zaenal Fanani', jabatan: 'Ketua RT 039 / Petugas Kolektor' };
    if (rt === '040') return { nama: 'Epi', jabatan: 'Ketua RT 040 / Petugas Kolektor' };
    if (rt === '041') return { nama: 'Etty Herawati', jabatan: 'Ketua RT 041 / Petugas Kolektor' };
    if (rt === '042') return { nama: 'Sefrizal', jabatan: 'Ketua RT 042 / Petugas Kolektor' };
    return { nama: record.penerima || 'Petugas Kolektor RT', jabatan: `Kolektor RT ${rt}` };
  };

  const kolektor = getKolektorByRt(record.rt);
  const ketuaRkmNama = profile.pengurusRkm?.ketua || 'H. Daryanto';
  const noRekening = record.noRekening || record.kuitansiNo || `RKM-${record.rt}-${record.noKk.slice(-4)}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden my-4 flex flex-col print:shadow-none print:rounded-none print:w-full print:max-w-none">
        
        {/* Top Control Bar (Hidden on Print) */}
        <div className="bg-slate-900 text-white p-3 sm:px-5 flex items-center justify-between gap-3 print:hidden border-b border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-700 hover:border-slate-500 shadow-xs shrink-0 cursor-pointer active:scale-95"
              title="Kembali"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="hidden sm:inline">Kembali</span>
            </button>

            <div className="h-4 w-px bg-slate-700 hidden md:block shrink-0" />

            <div className="flex items-center gap-1.5 truncate">
              <HeartHandshake className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs sm:text-sm font-bold truncate">
                Kartu Iuran RKM 12 Bulan — {record.namaKepala} (RT {record.rt})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Kartu</span>
            </button>
            <button
              onClick={onClose}
              title="Tutup Kartu"
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Card Page */}
        <div className="p-6 sm:p-10 text-black bg-white overflow-y-auto select-text print:p-6 print:text-black">
          
          {/* Card Border Frame */}
          <div className="border-2 border-emerald-900/80 rounded-2xl p-5 sm:p-7 relative print:border-black print:rounded-lg">
            
            {/* Kop Kartu RKM Resmi */}
            <div className="text-center pb-3 border-b-4 border-double border-emerald-900 relative print:border-black">
              <div className="absolute left-1 top-0 w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden flex items-center justify-center">
                <img
                  src={profile.logoUrl || LOGO_RW_018}
                  alt="Logo RW 018"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                  onError={handleLogoError}
                />
              </div>

              <div className="px-14 sm:px-20">
                <h3 className="text-xs sm:text-sm font-bold tracking-wider uppercase font-sans text-slate-800 print:text-black">
                  PEMERINTAH {profile.kotaKab.toUpperCase()} • KECAMATAN {profile.kecamatan.toUpperCase()}
                </h3>
                <h4 className="text-[11px] sm:text-xs font-bold tracking-wider uppercase font-sans text-slate-700 print:text-black">
                  KELURAHAN {profile.kelurahan.toUpperCase()}
                </h4>
                <h1 className="text-base sm:text-lg font-black tracking-wide uppercase font-sans mt-0.5 text-emerald-950 print:text-black">
                  RUKUN KEMATIAN MASYARAKAT (RKM) {profile.namaRw.toUpperCase()}
                </h1>
                <p className="text-[10px] sm:text-[11px] text-slate-600 font-sans mt-0.5">
                  Sekretariat: {profile.alamatKantor} • Telp / WA: {profile.noHpKetuaRw} • RT 039 s/d RT 042
                </p>
              </div>
            </div>

            {/* Title & Rekening */}
            <div className="mt-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3 print:border-black">
              <div>
                <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-emerald-900 print:text-black">
                  KARTU IURAN RKM 12 BULAN (TAHUN {tahun})
                </h2>
                <p className="text-[11px] text-slate-500 font-sans">
                  Bukti Resmi Pembayaran Iuran Rukun Kematian Masyarakat {profile.namaRw}
                </p>
              </div>
              <div className="text-left sm:text-right bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 print:border-black print:bg-white">
                <span className="text-[10px] text-emerald-800 font-bold uppercase block print:text-black">
                  No. Kartu / Rekening RKM
                </span>
                <span className="font-mono font-black text-xs text-slate-900 print:text-black">
                  {noRekening}
                </span>
              </div>
            </div>

            {/* Resident Information Grid (Data Nama, NIK, RT, KK) */}
            <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-800 mb-4 print:bg-white print:border-black">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                <div className="flex items-center">
                  <span className="w-32 text-slate-600 font-medium shrink-0">Nama Kepala/Warga</span>
                  <span className="mr-2">:</span>
                  <span className="font-bold text-slate-900 uppercase">{record.namaKepala}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-32 text-slate-600 font-medium shrink-0">NIK (16 Digit)</span>
                  <span className="mr-2">:</span>
                  <span className="font-mono font-bold text-slate-900">{record.nik || '-'}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-32 text-slate-600 font-medium shrink-0">Wilayah RT</span>
                  <span className="mr-2">:</span>
                  <span className="font-bold text-slate-900">RT {record.rt} / {profile.namaRw}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-32 text-slate-600 font-medium shrink-0">No. Kartu Keluarga</span>
                  <span className="mr-2">:</span>
                  <span className="font-mono font-bold text-slate-900">{record.noKk}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-32 text-slate-600 font-medium shrink-0">Status Keanggotaan</span>
                  <span className="mr-2">:</span>
                  <span className="font-bold text-emerald-800 print:text-black">Warga Anggota RKM RW 018</span>
                </div>
                <div className="flex items-center">
                  <span className="w-32 text-slate-600 font-medium shrink-0">Petugas Kolektor RT</span>
                  <span className="mr-2">:</span>
                  <span className="font-semibold text-slate-900">{kolektor.nama}</span>
                </div>
              </div>
            </div>

            {/* 12-Month Contribution Table */}
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-left text-xs border-collapse border border-slate-300 print:border-black">
                <thead className="bg-emerald-800 text-white font-bold print:bg-slate-100 print:text-black">
                  <tr className="border-b border-emerald-900 print:border-black">
                    <th className="p-2 text-center w-10 border-r border-emerald-700/60 print:border-black">No</th>
                    <th className="p-2 border-r border-emerald-700/60 print:border-black">Bulan (Tahun {tahun})</th>
                    <th className="p-2 text-center border-r border-emerald-700/60 print:border-black w-20">Status Bayar</th>
                    <th className="p-2 text-right border-r border-emerald-700/60 print:border-black">Nominal (Rp)</th>
                    <th className="p-2 border-r border-emerald-700/60 print:border-black">Tanggal Bayar</th>
                    <th className="p-2 border-r border-emerald-700/60 print:border-black">Keterangan</th>
                    <th className="p-2 text-center w-28">Paraf Kolektor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 print:divide-black">
                  {rincian12Bulan.map((item, idx) => (
                    <tr
                      key={item.bulan}
                      className={idx % 2 === 1 ? 'bg-slate-50/70 print:bg-white' : 'bg-white'}
                    >
                      <td className="p-2 text-center font-bold text-slate-600 border-r border-slate-300 print:border-black">
                        {item.bulan}
                      </td>
                      <td className="p-2 font-bold text-slate-900 border-r border-slate-300 print:border-black">
                        {item.namaBulan}
                      </td>
                      <td className="p-2 text-center border-r border-slate-300 print:border-black">
                        {item.bayar ? (
                          <span className="inline-flex items-center gap-1 font-bold text-[11px] text-emerald-800 print:text-black">
                            <Check className="w-3.5 h-3.5 text-emerald-700 print:hidden" />
                            <span>☑ LUNAS</span>
                          </span>
                        ) : (
                          <span className="font-semibold text-[11px] text-rose-700 print:text-black">
                            ☐ BELUM
                          </span>
                        )}
                      </td>
                      <td className="p-2 text-right font-mono font-bold text-slate-800 border-r border-slate-300 print:border-black">
                        {item.nominal === 0 ? (
                          <span className="italic text-emerald-700 print:text-black">Rp 0 (Gratis)</span>
                        ) : (
                          formatRupiah(item.nominal)
                        )}
                      </td>
                      <td className="p-2 text-slate-700 border-r border-slate-300 font-mono text-[11px] print:border-black">
                        {item.tanggalBayar ? formatTanggalIndo(item.tanggalBayar) : '-'}
                      </td>
                      <td className="p-2 text-slate-600 border-r border-slate-300 text-[11px] print:border-black">
                        {item.keterangan || (item.bayar ? 'Lunas Kolektor RT' : 'Belum Bayar')}
                      </td>
                      <td className="p-2 text-center">
                        {item.bayar ? (
                          <div className="text-[10px] font-mono text-emerald-800 print:text-black border border-emerald-300 print:border-black rounded px-1.5 py-0.5 inline-block bg-emerald-50/50 print:bg-white">
                            ✓ {record.rt}
                          </div>
                        ) : (
                          <span className="text-slate-300 print:text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {/* Summary Rows */}
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 print:border-black text-slate-900 print:bg-white">
                    <td colSpan={3} className="p-2.5 text-right uppercase border-r border-slate-300 print:border-black">
                      Total Iuran 1 Tahun ({tahun})
                    </td>
                    <td className="p-2.5 text-right font-mono text-sm text-slate-900 border-r border-slate-300 print:border-black">
                      {formatRupiah(totalNominalTahun)}
                    </td>
                    <td colSpan={3} className="p-2.5 text-slate-600 text-xs">
                      {record.nominal === 0 ? 'Warga Dhuafa (Bebas Kas)' : `12 Bulan x ${formatRupiah(record.nominal !== undefined ? record.nominal : 10000)} / KK`}
                    </td>
                  </tr>

                  <tr className="bg-emerald-50 font-bold border-t border-slate-300 print:border-black text-emerald-900 print:text-black print:bg-white">
                    <td colSpan={3} className="p-2.5 text-right uppercase border-r border-slate-300 print:border-black">
                      Total Iuran Terbayar
                    </td>
                    <td className="p-2.5 text-right font-mono text-sm text-emerald-800 border-r border-slate-300 print:border-black">
                      {formatRupiah(totalTerbayar)}
                    </td>
                    <td colSpan={3} className="p-2.5 text-emerald-800 text-xs print:text-black">
                      {lunasCount} dari 12 Bulan Lunas {lunasCount === 12 ? '(Lunas Penuh)' : ''}
                    </td>
                  </tr>

                  {sisaTunggakan > 0 && (
                    <tr className="bg-rose-50 font-bold border-t border-slate-300 print:border-black text-rose-900 print:text-black print:bg-white">
                      <td colSpan={3} className="p-2.5 text-right uppercase border-r border-slate-300 print:border-black">
                        Sisa Tunggakan Belum Bayar
                      </td>
                      <td className="p-2.5 text-right font-mono text-sm text-rose-700 border-r border-slate-300 print:border-black">
                        {formatRupiah(sisaTunggakan)}
                      </td>
                      <td colSpan={3} className="p-2.5 text-rose-700 text-xs print:text-black">
                        {12 - lunasCount} Bulan Belum Lunas
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Hak & Ketentuan Anggota RKM */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[10.5px] text-slate-600 mb-6 print:bg-white print:border-black">
              <p className="font-bold text-slate-800 mb-0.5">Ketentuan & Hak Pelayanan Anggota RKM {profile.namaRw}:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Anggota berhak atas santunan duka kematian tunai sebesar Rp 1.500.000,- (Satu Juta Lima Ratus Ribu Rupiah).</li>
                <li>Pelayanan pengurusan jenazah lengkap: pemandian, kain kafan, penshalatan, penggalian liang lahat di TPU Muslim Iringmulyo, tenda duka, kursi, dan sound system.</li>
                <li>Iuran ditarik secara tertib setiap bulan oleh Petugas Kolektor / Ketua RT wilayah setempat.</li>
              </ul>
            </div>

            {/* Area Tanda Tangan: Petugas/Kolektor RT & Ketua RKM RW 018 */}
            <div className="pt-2 flex flex-col sm:flex-row justify-between items-end gap-6 text-xs font-sans">
              
              {/* Left: QR Verification Stamp */}
              <div className="flex items-center gap-3 border border-slate-200 rounded-xl p-2.5 bg-slate-50/50 print:border-black print:bg-white">
                <div className="w-14 h-14 bg-white flex items-center justify-center border border-slate-300 rounded print:border-black">
                  <QrCode className="w-10 h-10 text-slate-800" />
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase text-slate-500 block tracking-wider">
                    VALIDASI RESMI RKM
                  </span>
                  <span className="font-mono text-[10px] font-bold text-slate-800 block">
                    {noRekening}
                  </span>
                  <span className="text-[8px] text-emerald-800 font-bold block print:text-black">
                    TERCATAT SISTEM RW 018
                  </span>
                </div>
              </div>

              {/* Signatures Dual Block */}
              <div className="grid grid-cols-2 gap-8 text-center w-full sm:w-auto">
                
                {/* Kolom 1: Petugas / Kolektor */}
                <div className="w-44 text-center">
                  <p className="text-slate-600 text-[11px]">
                    Kota Metro, {formatTanggalIndo(new Date().toISOString().split('T')[0])}
                  </p>
                  <p className="font-bold text-slate-800 text-xs mt-0.5">
                    Petugas / Kolektor RT {record.rt}
                  </p>

                  <div className="h-16 flex items-center justify-center">
                    <span className="text-[10px] italic text-slate-400 print:text-slate-500">[ Tanda Tangan & Paraf ]</span>
                  </div>

                  <p className="font-bold text-slate-900 underline text-xs">
                    {kolektor.nama}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {kolektor.jabatan}
                  </p>
                </div>

                {/* Kolom 2: Ketua RKM RW 018 */}
                <div className="w-44 text-center relative">
                  <p className="text-slate-600 text-[11px]">
                    Mengetahui,
                  </p>
                  <p className="font-bold text-slate-800 text-xs mt-0.5">
                    Ketua RKM {profile.namaRw}
                  </p>

                  {/* Stamp & Signature simulation */}
                  <div className="h-16 flex items-center justify-center relative">
                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-emerald-700/60 text-emerald-800/80 flex flex-col items-center justify-center text-[6px] font-bold uppercase rotate-[-10deg] pointer-events-none print:text-black print:border-black absolute">
                      <span>STEMPEL RKM</span>
                      <span className="font-black text-[7px]">{profile.namaRw}</span>
                      <span>IRINGMULYO</span>
                    </div>
                    <span className="text-[10px] italic text-slate-400 print:text-slate-500 z-10">[ Tanda Tangan ]</span>
                  </div>

                  <p className="font-bold text-slate-900 underline text-xs">
                    {ketuaRkmNama}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Penanggung Jawab RKM
                  </p>
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
