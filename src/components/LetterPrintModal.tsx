import React from 'react';
import {
  Printer,
  Download,
  X,
  Building,
  CheckCircle2,
  QrCode,
  ShieldCheck,
  ArrowLeft
} from 'lucide-react';
import { SuratItem, RWProfile } from '../types';
import { formatTanggalIndo } from '../utils/formatters';
import { LOGO_RW_018, handleLogoError } from '../constants/logo';

interface LetterPrintModalProps {
  surat: SuratItem | null;
  profile: RWProfile;
  onClose: () => void;
}

export const LetterPrintModal: React.FC<LetterPrintModalProps> = ({
  surat,
  profile,
  onClose,
}) => {
  if (!surat) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden my-4 flex flex-col print:shadow-none print:rounded-none print:w-full print:max-w-none">
        {/* Modal Top Control Bar (Hidden on print) */}
        <div className="bg-slate-900 text-white p-3 sm:px-5 flex items-center justify-between gap-3 print:hidden border-b border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-700 hover:border-slate-500 shadow-xs shrink-0 cursor-pointer active:scale-95"
              title="Kembali ke menu sebelumnya"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="hidden sm:inline">Kembali ke Menu Sebelumnya</span>
              <span className="sm:hidden">Kembali</span>
            </button>

            <div className="h-4 w-px bg-slate-700 hidden md:block shrink-0" />

            <div className="flex items-center gap-1.5 truncate">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs sm:text-sm font-bold truncate">Pratinjau Surat Resmi RW 018</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / PDF</span>
            </button>
            <button
              onClick={onClose}
              title="Tutup Pratinjau (Kembali)"
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Paper Page */}
        <div className="p-8 sm:p-12 text-black bg-white overflow-y-auto font-serif text-[13px] leading-relaxed select-text print:p-8 print:text-black">
          {/* KOP SURAT RESMI */}
          <div className="text-center pb-3 border-b-4 border-double border-black relative">
            {/* Logo RW 018 */}
            <div className="absolute left-0 top-0 w-20 h-20 rounded-full overflow-hidden flex items-center justify-center">
              <img
                src={profile.logoUrl || LOGO_RW_018}
                alt="Logo RW 018"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
                onError={handleLogoError}
              />
            </div>

            <div className="px-16">
              <h3 className="text-sm font-bold tracking-wider uppercase font-sans">
                PEMERINTAH {profile.kotaKab.toUpperCase()}
              </h3>
              <h4 className="text-xs font-bold tracking-wider uppercase font-sans">
                KECAMATAN {profile.kecamatan.toUpperCase()} • {profile.kelurahan.toUpperCase()}
              </h4>
              <h1 className="text-lg font-black tracking-widest uppercase font-sans mt-0.5 text-emerald-950 print:text-black">
                PENGURUS {profile.namaRw.toUpperCase()}
              </h1>
              <p className="text-[11px] text-slate-700 font-sans mt-0.5">
                Sekretariat: {profile.alamatKantor} • Kode Pos: {profile.kodePos} • Telp: {profile.noHpKetuaRw}
              </p>
            </div>
          </div>

          {/* Letter Title & Number */}
          <div className="text-center mt-6 mb-6">
            <h2 className="text-base font-bold uppercase underline tracking-wider font-sans">
              {surat.jenisSurat}
            </h2>
            <p className="text-xs font-sans mt-1 font-mono">
              Nomor: {surat.noSurat}
            </p>
          </div>

          {/* Body content */}
          <div className="space-y-4 text-justify font-sans text-[13px]">
            {surat.jenisSurat === 'Surat Pengaduan & Aspirasi Warga' || surat.jenisSurat === 'Surat Aduan Lingkungan Warga' ? (
              <>
                <p>
                  Yang bertanda tangan di bawah ini warga pemohon/pelapor aduan dan aspirasi lingkungan di wilayah <strong>{profile.namaRw}</strong> {profile.kelurahan}, Kecamatan {profile.kecamatan}, {profile.kotaKab}:
                </p>

                <div className="pl-6 space-y-1.5 font-sans">
                  <div className="grid grid-cols-12 gap-1">
                    <span className="col-span-4 text-slate-700">Nama Pelapor</span>
                    <span className="col-span-1">:</span>
                    <span className="col-span-7 font-bold uppercase">{surat.namaPemohon}</span>
                  </div>
                  <div className="grid grid-cols-12 gap-1">
                    <span className="col-span-4 text-slate-700">NIK (KTP)</span>
                    <span className="col-span-1">:</span>
                    <span className="col-span-7 font-mono font-bold">{surat.nikPemohon}</span>
                  </div>
                  <div className="grid grid-cols-12 gap-1">
                    <span className="col-span-4 text-slate-700">Tempat / Tgl Lahir</span>
                    <span className="col-span-1">:</span>
                    <span className="col-span-7">{surat.tempatTglLahir}</span>
                  </div>
                  <div className="grid grid-cols-12 gap-1">
                    <span className="col-span-4 text-slate-700">Alamat Tempat Tinggal</span>
                    <span className="col-span-1">:</span>
                    <span className="col-span-7 font-medium">
                      {surat.alamat} (Wilayah RT {surat.rt} / {profile.namaRw})
                    </span>
                  </div>
                </div>

                <div className="bg-rose-50/40 p-3.5 rounded-lg border border-slate-300 font-sans my-2 print:border-black print:bg-white">
                  <p className="font-bold text-slate-900 mb-1">
                    Uraian Pokok Aduan / Aspirasi Lingkungan Warga:
                  </p>
                  <p className="text-slate-900 italic font-serif text-[14px] leading-relaxed">
                    &quot;{surat.keperluan}&quot;
                  </p>
                </div>

                {surat.catatan && (
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-xs font-sans print:border-black print:bg-white">
                    <span className="font-bold text-slate-800">Catatan / Usulan Tindak Lanjut: </span>
                    <span className="text-slate-700">{surat.catatan}</span>
                  </div>
                )}

                <p>
                  Demikian surat aduan dan aspirasi warga ini disampaikan dengan sebenarnya, agar dapat menjadi perhatian bersama dan segera ditindaklanjuti oleh Pengurus {profile.namaRw} serta pihak-pihak berwenang terkait demi kenyamanan, kebersihan, dan keamanan lingkungan.
                </p>
              </>
            ) : (
              <>
                <p>
                  Yang bertanda tangan di bawah ini, Ketua {profile.namaRw} {profile.kelurahan}, Kecamatan {profile.kecamatan}, {profile.kotaKab}, dengan ini menerangkan bahwa:
                </p>

                <div className="pl-6 space-y-1.5 font-sans">
                  <div className="grid grid-cols-12 gap-1">
                    <span className="col-span-4 text-slate-700">Nama Lengkap</span>
                    <span className="col-span-1">:</span>
                    <span className="col-span-7 font-bold uppercase">{surat.namaPemohon}</span>
                  </div>
                  <div className="grid grid-cols-12 gap-1">
                    <span className="col-span-4 text-slate-700">NIK (KTP)</span>
                    <span className="col-span-1">:</span>
                    <span className="col-span-7 font-mono font-bold">{surat.nikPemohon}</span>
                  </div>
                  <div className="grid grid-cols-12 gap-1">
                    <span className="col-span-4 text-slate-700">Tempat / Tanggal Lahir</span>
                    <span className="col-span-1">:</span>
                    <span className="col-span-7">{surat.tempatTglLahir}</span>
                  </div>
                  <div className="grid grid-cols-12 gap-1">
                    <span className="col-span-4 text-slate-700">Agama</span>
                    <span className="col-span-1">:</span>
                    <span className="col-span-7">{surat.agama}</span>
                  </div>
                  <div className="grid grid-cols-12 gap-1">
                    <span className="col-span-4 text-slate-700">Pekerjaan</span>
                    <span className="col-span-1">:</span>
                    <span className="col-span-7">{surat.pekerjaan}</span>
                  </div>
                  <div className="grid grid-cols-12 gap-1">
                    <span className="col-span-4 text-slate-700">Alamat KTP / Domisili</span>
                    <span className="col-span-1">:</span>
                    <span className="col-span-7 font-medium">
                      {surat.alamat} (Wilayah RT {surat.rt} / {profile.namaRw})
                    </span>
                  </div>
                </div>

                <p>
                  Adalah benar yang bersangkutan merupakan warga yang bertempat tinggal dan berdomisili sah di lingkungan <strong>{profile.namaRw}</strong> {profile.kelurahan}.
                </p>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 font-sans my-2 print:border-black print:bg-white">
                  <p className="font-semibold text-slate-800">
                    Surat ini diberikan kepada yang bersangkutan untuk keperluan:
                  </p>
                  <p className="text-slate-900 mt-1 italic font-serif text-[14px]">
                    &quot;{surat.keperluan}&quot;
                  </p>
                </div>

                {surat.catatan && (
                  <p className="text-slate-700 italic text-xs">
                    Catatan: {surat.catatan}
                  </p>
                )}

                <p>
                  Demikian surat pengantar / keterangan ini dibuat dengan sebenarnya dengan penuh rasa tanggung jawab, untuk dapat dipergunakan sebagaimana mestinya oleh instansi yang berwenang.
                </p>
              </>
            )}
          </div>

          {/* Signature Block */}
          <div className="mt-8 pt-4 flex justify-between items-end font-sans text-xs">
            {/* Left: QR Code Verification */}
            <div className="flex flex-col items-center text-center p-2 border border-slate-200 rounded-xl max-w-[140px] print:border-black">
              <div className="w-16 h-16 bg-slate-100 flex items-center justify-center border border-slate-300 rounded print:border-black">
                <QrCode className="w-12 h-12 text-slate-800" />
              </div>
              <span className="text-[9px] text-slate-500 font-mono mt-1">
                VERIFIKASI DIGITAL RW 018
              </span>
              <span className="text-[8px] text-slate-400">
                {surat.noSurat}
              </span>
            </div>

            {/* Right: Signature & Stamp */}
            <div className="text-center w-56 relative">
              <p>
                {profile.kotaKab.replace('Kota ', '')}, {formatTanggalIndo(surat.tanggalSurat)}
              </p>
              <p className="font-bold mt-1">
                Ketua {profile.namaRw}
              </p>

              {/* Digital Stamp Simulation */}
              <div className="my-2 h-16 flex items-center justify-center relative">
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-emerald-700/60 text-emerald-800/80 flex flex-col items-center justify-center text-[7px] font-bold uppercase rotate-[-12deg] pointer-events-none print:text-black print:border-black">
                  <span>STEMPEL RESMI</span>
                  <span className="font-black text-[8px]">{profile.namaRw}</span>
                  <span>{profile.kelurahan}</span>
                </div>
              </div>

              <p className="font-bold underline text-sm tracking-wide mt-1">
                {profile.namaKetuaRw}
              </p>
              <p className="font-mono text-[11px] text-slate-600">
                NIK: {profile.nikKetuaRw}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Bottom Bar (Hidden on print) */}
        <div className="bg-slate-100 border-t border-slate-200 px-5 py-3 flex items-center justify-between gap-3 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 bg-white hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Kembali ke Menu Sebelumnya</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Dokumen Sekarang</span>
          </button>
        </div>
      </div>
    </div>
  );
};
