import React, { useState, useMemo } from 'react';
import {
  X,
  User,
  Home,
  CreditCard,
  Phone,
  MessageCircle,
  FileText,
  Copy,
  Check,
  Printer,
  HeartHandshake,
  Shield,
  Calendar,
  MapPin,
  Briefcase,
  GraduationCap,
  Droplet,
  Users,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Landmark,
  BadgeCheck,
  AlertCircle
} from 'lucide-react';
import { Warga, KartuKeluarga, BansosItem, PbbRecord, RWProfile, AppUser } from '../types';
import { formatTanggalIndo, hitungUsia, getCleanWaNumber, formatRupiah } from '../utils/formatters';
import { getRtLogo } from '../constants/logo';

interface DashboardResidentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  warga: Warga | null;
  allWarga: Warga[];
  kkList: KartuKeluarga[];
  bansosList?: BansosItem[];
  pbbList?: PbbRecord[];
  profile: RWProfile;
  currentUser?: AppUser | null;
  onCreateSurat?: (warga: Warga) => void;
  onSelectKk?: (noKk: string) => void;
  onSelectWarga?: (warga: Warga) => void;
  onNavigateTab?: (tab: string) => void;
}

export const DashboardResidentDetailModal: React.FC<DashboardResidentDetailModalProps> = ({
  isOpen,
  onClose,
  warga,
  allWarga,
  kkList,
  bansosList = [],
  pbbList = [],
  profile,
  currentUser,
  onCreateSurat,
  onSelectKk,
  onSelectWarga,
  onNavigateTab,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'biodata' | 'keluarga' | 'layanan'>('biodata');

  if (!isOpen || !warga) return null;

  const usia = hitungUsia(warga.tanggalLahir);
  const cleanWa = warga.noHp ? getCleanWaNumber(warga.noHp) : '';

  // Get matching Kartu Keluarga
  const matchedKk = useMemo(() => {
    if (!kkList || !warga.noKk) return undefined;
    return kkList.find((k) => k.noKk === warga.noKk);
  }, [kkList, warga.noKk]);

  // Get all family members in the same KK
  const familyMembers = useMemo(() => {
    if (!allWarga || !warga.noKk) return [];
    return allWarga.filter((w) => w.noKk === warga.noKk);
  }, [allWarga, warga.noKk]);

  // Get Kepala Keluarga info
  const kepalaKeluargaInfo = useMemo(() => {
    const currentName = (warga.nama || '').toLowerCase().trim();
    if (matchedKk && matchedKk.kepalaKeluarga) {
      const kkName = (matchedKk.kepalaKeluarga || '').toLowerCase().trim();
      const isSelf =
        (kkName && currentName && kkName === currentName) ||
        warga.statusKeluarga === 'Kepala Keluarga';
      return { nama: matchedKk.kepalaKeluarga, isSelf };
    }
    if (warga.statusKeluarga === 'Kepala Keluarga') {
      return { nama: warga.nama || '-', isSelf: true };
    }
    const kepala = familyMembers.find(
      (m) => m.statusKeluarga === 'Kepala Keluarga' || (m.statusKeluarga && m.statusKeluarga.toLowerCase().includes('kepala'))
    );
    if (kepala) {
      return { nama: kepala.nama || '-', isSelf: kepala.id === warga.id };
    }
    return { nama: warga.nama || '-', isSelf: true };
  }, [matchedKk, warga, familyMembers]);

  // Bansos check for this resident or KK
  const matchedBansos = useMemo(() => {
    if (!bansosList || bansosList.length === 0) return [];
    const wNik = (warga.nik || '').trim();
    const wKk = (warga.noKk || '').trim();
    const wNama = (warga.nama || '').toLowerCase().trim();

    return bansosList.filter((b) => {
      if (!b) return false;
      const bNik = (b.nik || '').trim();
      const bKk = (b.noKk || '').trim();
      const bNama = (b.nama || '').toLowerCase().trim();
      return (
        (wNik && bNik && bNik === wNik) ||
        (wKk && bKk && bKk === wKk) ||
        (wNama && bNama && bNama === wNama)
      );
    });
  }, [bansosList, warga]);

  // PBB check for this resident's KK / RT / Address
  const matchedPbb = useMemo(() => {
    if (!pbbList || pbbList.length === 0) return [];
    const wNik = (warga.nik || '').trim();
    const wKk = (warga.noKk || '').trim();
    const wNama = (warga.nama || '').toLowerCase().trim();

    return pbbList.filter((p) => {
      if (!p) return false;
      const pNik = (p.nik || '').trim();
      const pKk = (p.noKk || '').trim();
      const pWp = (p.namaWajibPajak || '').toLowerCase().trim();
      return (
        (wKk && pKk && pKk === wKk) ||
        (wNik && pNik && pNik === wNik) ||
        (wNama && pWp && (pWp.includes(wNama) || wNama.includes(pWp)))
      );
    });
  }, [pbbList, warga]);

  // Copy helper
  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Full formatted bio text for WhatsApp / sharing
  const handleCopyFullBio = () => {
    const text = `*BIODATA WARGA RW 018*\n*Kelurahan ${profile.kelurahan}, ${profile.kotaKab}*\n` +
      `---------------------------------\n` +
      `👤 *Nama*: ${warga.nama}\n` +
      `🪪 *NIK*: ${warga.nik}\n` +
      `🏠 *No. KK*: ${warga.noKk}\n` +
      `👑 *Kepala Keluarga*: ${kepalaKeluargaInfo.nama}\n` +
      `📍 *RT / RW*: RT ${warga.rt} / RW 018\n` +
      `🏡 *Alamat*: ${warga.alamat}\n` +
      `🎂 *Tempat, Tgl Lahir*: ${warga.tempatLahir}, ${formatTanggalIndo(warga.tanggalLahir)} (${usia} Thn)\n` +
      `🚻 *Jenis Kelamin*: ${warga.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}\n` +
      `🕌 *Agama*: ${warga.agama}\n` +
      `💍 *Status Kawin*: ${warga.statusKawin}\n` +
      `💼 *Pekerjaan*: ${warga.pekerjaan}\n` +
      `🎓 *Pendidikan*: ${warga.pendidikan || '-'}\n` +
      `🩸 *Gol. Darah*: ${warga.golDarah || '-'}\n` +
      `📱 *No. HP/WA*: ${warga.noHp || '-'}\n` +
      `🏢 *Status Domisili*: ${warga.statusDomisili}\n` +
      `---------------------------------\n` +
      `_Dicetak via Aplikasi Digital RW 018 Iringmulyo_`;

    handleCopyText(text, 'all');
  };

  // Quick print handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col my-auto max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header with Background Banner */}
        <div className="relative bg-gradient-to-r from-slate-900 via-emerald-950 to-teal-950 text-white p-5 sm:p-6 border-b border-emerald-900/50">
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white/80 hover:text-white flex items-center justify-center transition-all cursor-pointer z-10"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Resident Profile Header */}
          <div className="relative z-1 flex flex-col sm:flex-row items-center sm:items-start gap-4">
            {/* Resident Photo / Avatar */}
            <div className="relative group shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-slate-800 border-2 border-amber-400/80 shadow-lg ring-4 ring-amber-400/20 flex items-center justify-center">
                {warga.foto || warga.fotoUrl ? (
                  <img
                    src={warga.foto || warga.fotoUrl}
                    alt={warga.nama}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        warga.nama
                      )}&background=${warga.jenisKelamin === 'L' ? '0284c7' : 'e11d48'}&color=ffffff&bold=true&size=160`;
                    }}
                  />
                ) : (
                  <div
                    className={`w-full h-full flex flex-col items-center justify-center font-black text-xl text-white ${
                      warga.jenisKelamin === 'L' ? 'bg-sky-700' : 'bg-rose-700'
                    }`}
                  >
                    <span>{(warga.nama || 'W').charAt(0).toUpperCase()}</span>
                    <span className="text-[10px] font-medium opacity-80 mt-0.5">
                      {warga.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                    </span>
                  </div>
                )}
              </div>

              {/* Gender Dot */}
              <div
                className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-slate-900 flex items-center justify-center text-[10px] font-black text-white shadow-xs ${
                  warga.jenisKelamin === 'L' ? 'bg-blue-600' : 'bg-rose-600'
                }`}
                title={warga.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
              >
                {warga.jenisKelamin}
              </div>
            </div>

            {/* Resident Name & Headline Info */}
            <div className="min-w-0 text-center sm:text-left flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-800 text-amber-300 border border-amber-400/40">
                  RT {warga.rt}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-emerald-200 border border-white/10">
                  {warga.statusKeluarga}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                    warga.statusDomisili === 'Tetap'
                      ? 'bg-emerald-900/80 text-emerald-200 border-emerald-600/40'
                      : warga.statusDomisili === 'Kontrak / Kost'
                      ? 'bg-amber-900/80 text-amber-200 border-amber-600/40'
                      : 'bg-rose-900/80 text-rose-200 border-rose-600/40'
                  }`}
                >
                  {warga.statusDomisili}
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-black text-white tracking-tight leading-snug">
                {warga.nama}
              </h3>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-emerald-200/90 font-mono">
                <span className="bg-black/30 px-2 py-0.5 rounded border border-white/10">
                  NIK: <strong>{warga.nik}</strong>
                </span>
                <span className="bg-black/30 px-2 py-0.5 rounded border border-white/10">
                  KK: <strong>{warga.noKk}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons Row inside Header */}
          <div className="relative z-1 mt-4 pt-3 border-t border-emerald-800/60 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {onCreateSurat && (
                <button
                  type="button"
                  onClick={() => {
                    onCreateSurat(warga);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-emerald-950 font-black text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Buat Surat Pengantar</span>
                </button>
              )}

              {cleanWa ? (
                <a
                  href={`https://wa.me/${cleanWa}?text=${encodeURIComponent(
                    `Halo Bapak/Ibu ${warga.nama}, kami dari Pengurus RW 018 Iringmulyo...`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Kirim WhatsApp</span>
                </a>
              ) : null}

              {warga.noHp ? (
                <a
                  href={`tel:${warga.noHp}`}
                  className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/15 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5 text-amber-300" />
                  <span>Panggil</span>
                </a>
              ) : null}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopyFullBio}
                className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                title="Salin Seluruh Biodata Lengkap Warga"
              >
                {copiedField === 'all' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-amber-300" />
                    <span>Salin Bio</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                title="Cetak Biodata Warga"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-300" />
                <span className="hidden sm:inline">Cetak</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-4 pt-2 gap-2 text-xs font-bold overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveDetailTab('biodata')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeDetailTab === 'biodata'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Biodata Lengkap</span>
          </button>

          <button
            onClick={() => setActiveDetailTab('keluarga')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeDetailTab === 'keluarga'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Keluarga 1 KK ({familyMembers.length} Jiwa)</span>
          </button>

          <button
            onClick={() => setActiveDetailTab('layanan')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeDetailTab === 'layanan'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Layanan & Bansos/PBB ({matchedBansos.length + matchedPbb.length})</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: BIODATA LENGKAP */}
          {activeDetailTab === 'biodata' && (
            <div className="space-y-4">
              {/* Special Category Badges Banner */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold text-slate-500 text-[11px] mr-1">Kategori Khusus:</span>
                {warga.isLansia || usia >= 60 ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 font-extrabold border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                    👴 Lansia ({usia} Thn)
                  </span>
                ) : null}

                {warga.isDisabilitas ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/70 text-purple-900 dark:text-purple-300 font-extrabold border border-purple-300 dark:border-purple-800 flex items-center gap-1">
                    ♿ Disabilitas
                  </span>
                ) : null}

                {warga.isDudaJanda || warga.statusKawin === 'Cerai Mati' || warga.statusKawin === 'Cerai Hidup' ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/70 text-rose-900 dark:text-rose-300 font-extrabold border border-rose-300 dark:border-rose-800 flex items-center gap-1">
                    🤍 Duda / Janda ({warga.statusKawin})
                  </span>
                ) : null}

                {usia >= 16 && usia <= 59 ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-900 dark:text-blue-300 font-bold border border-blue-300 dark:border-blue-800 flex items-center gap-1">
                    💼 Usia Produktif ({usia} Thn)
                  </span>
                ) : null}

                {usia <= 15 ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/70 text-teal-900 dark:text-teal-300 font-bold border border-teal-300 dark:border-teal-800 flex items-center gap-1">
                    👶 Anak-anak / Balita ({usia} Thn)
                  </span>
                ) : null}

                {warga.statusKeluarga === 'Kepala Keluarga' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-300 font-extrabold border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                    👑 Kepala Keluarga
                  </span>
                )}
              </div>

              {/* Structured Key-Value Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* NIK with Copy */}
                <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">
                      Nomor Induk Kependudukan (NIK)
                    </span>
                    <span className="font-mono font-black text-slate-900 dark:text-white text-sm">
                      {warga.nik}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopyText(warga.nik, 'nik')}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 rounded-lg transition-colors cursor-pointer"
                    title="Salin NIK"
                  >
                    {copiedField === 'nik' ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* No KK with Copy & Link */}
                <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">
                      Nomor Kartu Keluarga (No. KK)
                    </span>
                    <span className="font-mono font-black text-blue-900 dark:text-blue-300 text-sm">
                      {warga.noKk}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopyText(warga.noKk, 'nokk')}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 rounded-lg transition-colors cursor-pointer"
                      title="Salin No KK"
                    >
                      {copiedField === 'nokk' ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    {onSelectKk && (
                      <button
                        onClick={() => {
                          onSelectKk(warga.noKk);
                          onClose();
                        }}
                        className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg transition-colors cursor-pointer"
                        title="Buka Tab Kartu Keluarga"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Kepala Keluarga */}
                <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">
                    Nama Kepala Keluarga
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {kepalaKeluargaInfo.nama}
                    </span>
                    {kepalaKeluargaInfo.isSelf && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        (Diri Sendiri)
                      </span>
                    )}
                  </div>
                </div>

                {/* Hubungan Keluarga */}
                <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">
                    Status Hubungan Dalam Keluarga
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
                    {warga.statusKeluarga}
                  </span>
                </div>

                {/* TTL & Usia */}
                <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">
                    Tempat, Tanggal Lahir & Usia
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
                    {warga.tempatLahir}, {formatTanggalIndo(warga.tanggalLahir)} ({usia} Tahun)
                  </span>
                </div>

                {/* Jenis Kelamin & Gol Darah */}
                <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">
                    Jenis Kelamin & Golongan Darah
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
                    {warga.jenisKelamin === 'L' ? 'Laki-laki (L)' : 'Perempuan (P)'} • Gol. Darah: {warga.golDarah || 'Tidak Tahu'}
                  </span>
                </div>

                {/* Agama & Status Kawin */}
                <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">
                    Agama & Status Pernikahan
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
                    {warga.agama} • {warga.statusKawin}
                  </span>
                </div>

                {/* Pekerjaan & Pendidikan */}
                <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">
                    Pekerjaan & Pendidikan Terakhir
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
                    {warga.pekerjaan || 'Belum / Tidak Bekerja'} • {warga.pendidikan || '-'}
                  </span>
                </div>

                {/* Alamat Lengkap */}
                <div className="sm:col-span-2 p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">
                    Alamat Domisili Lengkap
                  </span>
                  <div className="flex items-start gap-2 mt-1">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {warga.alamat}
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        RT {warga.rt} / RW 018, Kelurahan {profile.kelurahan}, {profile.kecamatan}, {profile.kotaKab}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Kontak WhatsApp / HP */}
                <div className="sm:col-span-2 p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">
                      Nomor Kontak Telepon / WhatsApp
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                      {warga.noHp || 'Belum dicantumkan'}
                    </span>
                  </div>
                  {cleanWa && (
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`https://wa.me/${cleanWa}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Chat WA</span>
                      </a>
                      <button
                        onClick={() => handleCopyText(warga.noHp, 'nohp')}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 rounded-lg transition-colors cursor-pointer"
                        title="Salin Nomor HP"
                      >
                        {copiedField === 'nohp' ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KELUARGA 1 KK */}
          {activeDetailTab === 'keluarga' && (
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-blue-900 dark:text-blue-300">
                      Kartu Keluarga No: <span className="font-mono">{warga.noKk}</span>
                    </h4>
                    {matchedKk?.desil && matchedKk.desil !== 'Non-Desil' && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-bold text-[10px] border border-amber-300">
                        {matchedKk.desil}
                      </span>
                    )}
                    {matchedKk?.statusEkonomi && (
                      <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-900 dark:text-blue-200 font-bold text-[10px]">
                        {matchedKk.statusEkonomi}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-blue-700 dark:text-blue-400 mt-0.5">
                    Kepala Keluarga: <strong>{kepalaKeluargaInfo.nama}</strong> • Wilayah RT {warga.rt}
                  </p>
                </div>
                {onSelectKk && (
                  <button
                    onClick={() => {
                      onSelectKk(warga.noKk);
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 self-start sm:self-center shadow-xs cursor-pointer"
                  >
                    <span>Buka Tab KK</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase px-1 block">
                  Daftar Anggota Keluarga ({familyMembers.length} Jiwa Terdata)
                </span>

                {familyMembers.length === 0 ? (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-center text-xs text-slate-500">
                    Belum ada anggota keluarga lain yang terdaftar dalam No. KK ini.
                  </div>
                ) : (
                  familyMembers.map((member, idx) => {
                    const memberUsia = hitungUsia(member.tanggalLahir);
                    const isCurrent = member.id === warga.id;

                    return (
                      <div
                        key={member.id || idx}
                        className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                          isCurrent
                            ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 ring-2 ring-emerald-500/20'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-xs shrink-0 ${
                              member.jenisKelamin === 'L' ? 'bg-sky-600' : 'bg-rose-600'
                            }`}
                          >
                            {(member.nama || 'W').charAt(0).toUpperCase()}
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-slate-900 dark:text-white">
                                {member.nama}
                              </span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-extrabold text-[9px]">
                                  Sedang Dilihat
                                </span>
                              )}
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px]">
                                {member.statusKeluarga}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                              <span>NIK: {member.nik}</span>
                              <span>•</span>
                              <span>{memberUsia} Thn ({member.jenisKelamin === 'L' ? 'L' : 'P'})</span>
                              <span>•</span>
                              <span>{member.pekerjaan || 'Belum Bekerja'}</span>
                            </div>
                          </div>
                        </div>

                        {!isCurrent && onSelectWarga && (
                          <button
                            onClick={() => onSelectWarga(member)}
                            className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-slate-700 dark:text-slate-200 hover:text-emerald-900 dark:hover:text-emerald-100 font-bold text-xs rounded-xl self-end sm:self-center transition-colors cursor-pointer"
                          >
                            Lihat Biodata
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: LAYANAN, BANSOS & PBB */}
          {activeDetailTab === 'layanan' && (
            <div className="space-y-4">
              {/* BANSOS STATUS */}
              <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HeartHandshake className="w-4 h-4 text-emerald-600" />
                    <h4 className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                      Status Program Bantuan Sosial (Bansos)
                    </h4>
                  </div>
                  {onNavigateTab && (
                    <button
                      onClick={() => {
                        onNavigateTab('bansos');
                        onClose();
                      }}
                      className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
                    >
                      Buka Modul Bansos
                    </button>
                  )}
                </div>

                {matchedBansos.length === 0 ? (
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl text-xs text-slate-500 border border-dashed border-slate-200 dark:border-slate-700">
                    Warga atau KK ini belum tercatat dalam daftar penerima bantuan sosial terpadu RW 018.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {matchedBansos.map((b) => (
                      <div
                        key={b.id}
                        className="p-2.5 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-emerald-900 dark:text-emerald-200">
                              {b.jenisBansos}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-bold text-[9px]">
                              {b.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono">
                            Periode: {b.periode} • Nominal/Bentuk: {b.keterangan || '-'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* PBB STATUS */}
              <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-blue-600" />
                    <h4 className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                      Objek Pajak Bumi & Bangunan (PBB-P2)
                    </h4>
                  </div>
                  {onNavigateTab && (
                    <button
                      onClick={() => {
                        onNavigateTab('pbb');
                        onClose();
                      }}
                      className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      Buka Modul PBB
                    </button>
                  )}
                </div>

                {matchedPbb.length === 0 ? (
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl text-xs text-slate-500 border border-dashed border-slate-200 dark:border-slate-700">
                    Tidak ditemukan NOP / Objek PBB yang tertaut langsung dengan NIK/No KK ini.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {matchedPbb.map((p) => (
                      <div
                        key={p.id}
                        className="p-2.5 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-blue-900 dark:text-blue-200">
                              NOP: {p.nop}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                p.statusBayarTahunBerjalan === 'Lunas'
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-rose-600 text-white'
                              }`}
                            >
                              {p.statusBayarTahunBerjalan}
                            </span>
                          </div>
                          <p className="text-[11px] text-blue-700 dark:text-blue-400">
                            Wajib Pajak: {p.namaWajibPajak} • Alamat OP: {p.alamatObjekPajak}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="font-mono font-bold text-slate-800 dark:text-white">
                            {formatRupiah(p.nominalPbbTahunBerjalan)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            Sistem Informasi Manajemen RW 018 Iringmulyo
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
