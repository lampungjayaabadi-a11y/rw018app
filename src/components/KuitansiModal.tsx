import React from 'react';
import { Printer, X, Receipt, CheckCircle2, ShieldCheck, ArrowLeft } from 'lucide-react';
import { IuranWargaRecord, RWProfile } from '../types';
import { formatRupiah, formatTanggalIndo, formatBulanTahunIndo } from '../utils/formatters';
import { LOGO_RW_018, handleLogoError } from '../constants/logo';

interface KuitansiModalProps {
  iuran: IuranWargaRecord | null;
  profile: RWProfile;
  onClose: () => void;
}

export const KuitansiModal: React.FC<KuitansiModalProps> = ({
  iuran,
  profile,
  onClose,
}) => {
  if (!iuran) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 print:p-0 print:bg-white print:static">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden my-4 flex flex-col print:shadow-none print:rounded-none print:w-full">
        {/* Modal Top Bar */}
        <div className="bg-slate-900 text-white p-3 px-4 sm:px-5 flex items-center justify-between gap-2 print:hidden">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-700 shadow-2xs shrink-0 cursor-pointer active:scale-95"
              title="Kembali ke menu sebelumnya"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
              <span>Kembali</span>
            </button>
            <div className="flex items-center gap-1.5 truncate">
              <Receipt className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-xs font-bold truncate">Kuitansi Resmi Iuran</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak</span>
            </button>
            <button
              onClick={onClose}
              title="Tutup Pratinjau (Kembali)"
              className="p-1 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div className="p-6 text-black bg-white text-xs select-text font-sans space-y-4 print:p-4">
          {/* Header */}
          <div className="border-b-2 border-slate-800 pb-3 flex justify-between items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-300">
                <img
                  src={profile.logoUrl || LOGO_RW_018}
                  alt="Logo RW 018"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  onError={handleLogoError}
                />
              </div>
              <div>
                <h3 className="font-black text-sm uppercase tracking-wide text-emerald-950 print:text-black">
                  {profile.namaRw} {profile.kelurahan.toUpperCase()}
                </h3>
                <p className="text-[10px] text-slate-600">
                  {profile.alamatKantor} • Telp: {profile.noHpKetuaRw}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-900 font-bold text-[10px] rounded uppercase">
                KUITANSI PEMBAYARAN
              </span>
              <p className="font-mono text-[10px] text-slate-500 mt-0.5">
                No: {iuran.kuitansiNo || `KWT/${iuran.rt}/${Date.now().toString().slice(-6)}`}
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2 py-2">
            <div className="grid grid-cols-3 gap-2">
              <span className="text-slate-500 font-medium">Telah Diterima Dari</span>
              <span className="col-span-2 font-bold text-slate-900 uppercase">
                {iuran.namaKepala} (RT {iuran.rt})
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-slate-500 font-medium">Nomor Kartu Keluarga</span>
              <span className="col-span-2 font-mono font-semibold text-slate-800">
                {iuran.noKk}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-slate-500 font-medium">Untuk Pembayaran</span>
              <span className="col-span-2 text-slate-800">
                Iuran Warga (Keamanan, Kebersihan, Kas Sosial RW) Periode{' '}
                <strong>{formatBulanTahunIndo(iuran.bulanTahun)}</strong>
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-slate-500 font-medium">Tanggal Pembayaran</span>
              <span className="col-span-2 text-slate-800">
                {formatTanggalIndo(iuran.tanggalBayar || new Date().toISOString())}
              </span>
            </div>
          </div>

          {/* Amount Box */}
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex justify-between items-center print:border-black print:bg-white">
            <span className="font-bold text-slate-700">Jumlah Terbayar:</span>
            <span className="text-base font-black text-emerald-900 font-mono print:text-black">
              {formatRupiah(iuran.nominal)}
            </span>
          </div>

          {/* Signature */}
          <div className="pt-4 flex justify-between items-end text-[11px]">
            <div>
              <span className="text-[10px] text-slate-400 block font-mono">
                STATUS: LUNAS & TERCATAT
              </span>
              <div className="flex items-center gap-1 text-emerald-700 font-bold text-xs mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>SAH SISTEM RW 018</span>
              </div>
            </div>

            <div className="text-center w-40">
              <p className="text-slate-600">Penerima / Kolektor RT</p>
              <div className="h-10"></div>
              <p className="font-bold underline">{iuran.penerima || 'Petugas RW 018'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
