import React, { useState } from 'react';
import {
  PhoneCall,
  Phone,
  Siren,
  ShieldAlert,
  Flame,
  Ambulance,
  Zap,
  Building,
  MapPin,
  Copy,
  Check,
  X,
  MessageCircle,
  AlertTriangle,
  UserCheck,
  Search,
  ExternalLink,
  ShieldCheck,
  HeartHandshake
} from 'lucide-react';
import { RWProfile, RTInfo } from '../types';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: RWProfile;
  onNavigateToPengaduan?: () => void;
}

interface EmergencyContactItem {
  id: string;
  nama: string;
  instansi: string;
  kategori: 'nasional' | 'aparat' | 'medis' | 'damkar_pln' | 'rt_rw' | 'publik';
  kategoriLabel: string;
  nomor: string;
  nomorDisplay: string;
  isHotline?: boolean;
  keterangan?: string;
  warnaBadge: string;
  icon: React.ComponentType<{ className?: string }>;
  waNumber?: string; // numbers without + or dashes for direct WhatsApp wa.me
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({
  isOpen,
  onClose,
  profile,
  onNavigateToPengaduan
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('semua');

  if (!isOpen) return null;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const cleanWaNumber = (num: string) => {
    let clean = num.replace(/\D/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    }
    return clean;
  };

  // Comprehensive emergency and public service list
  const emergencyList: EmergencyContactItem[] = [
    // 1. Hotline Siaga Nasional 24 Jam
    {
      id: 'hotline-112',
      nama: 'Call Center Darurat Terpadu',
      instansi: 'Pemerintah Kota / BPBD (Layanan Bebas Pulsa 24 Jam)',
      kategori: 'nasional',
      kategoriLabel: 'Hotline 24 Jam',
      nomor: '112',
      nomorDisplay: '112',
      isHotline: true,
      keterangan: 'Panggilan darurat terintegrasi (Ambulan, Bencana, Polisi, Damkar)',
      warnaBadge: 'bg-rose-100 text-rose-800 border-rose-200',
      icon: Siren
    },
    {
      id: 'hotline-110',
      nama: 'Kepolisian Republik Indonesia',
      instansi: 'Call Center Polri Siaga Kriminal & Keamanan',
      kategori: 'nasional',
      kategoriLabel: 'Hotline 24 Jam',
      nomor: '110',
      nomorDisplay: '110',
      isHotline: true,
      keterangan: 'Layanan cepat tanggap laporan tindak pidana, kecelakaan & gangguan keamanan',
      warnaBadge: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: ShieldAlert
    },
    {
      id: 'hotline-113',
      nama: 'Pemadam Kebakaran (Damkar)',
      instansi: 'Dinas Pemadam Kebakaran & Penyelamatan',
      kategori: 'nasional',
      kategoriLabel: 'Hotline 24 Jam',
      nomor: '113',
      nomorDisplay: '113',
      isHotline: true,
      keterangan: 'Kebakaran rumah, korsleting, evakuasi hewan berbisa & pertolongan darurat',
      warnaBadge: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: Flame
    },
    {
      id: 'hotline-119',
      nama: 'Layanan Darurat Medis & Ambulan',
      instansi: 'PSC 119 Kemenkes RI Siaga Medis 24 Jam',
      kategori: 'nasional',
      kategoriLabel: 'Hotline 24 Jam',
      nomor: '119',
      nomorDisplay: '119',
      isHotline: true,
      keterangan: 'Pertolongan pertama serangan jantung, kecelakaan darurat & ambulans medis',
      warnaBadge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      icon: Ambulance
    },
    {
      id: 'hotline-123',
      nama: 'Pengaduan Listrik PLN 123',
      instansi: 'PT PLN (Persero) Pusat Bantuan Kelistrikan',
      kategori: 'nasional',
      kategoriLabel: 'Hotline 24 Jam',
      nomor: '123',
      nomorDisplay: '123 / (Kode Area) 123',
      isHotline: true,
      keterangan: 'Tiang listrik tumbang, ledakan trafo, korsleting gardu & pemadaman mendadak',
      warnaBadge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: Zap
    },

    // 2. Aparat Wilayah & Keamanan RW
    {
      id: 'aparat-bhabin',
      nama: 'Aipda Evodius (NRP. 84050233)',
      instansi: 'Bhabinkamtibmas Polsek Metro (Pembina Keamanan RW 018)',
      kategori: 'aparat',
      kategoriLabel: 'Aparat Wilayah',
      nomor: '081379712721',
      nomorDisplay: '0813-7971-2721',
      waNumber: '081379712721',
      keterangan: 'Petugas Pembina Kamtibmas Kelurahan & Penanganan Konflik Warga',
      warnaBadge: 'bg-blue-100 text-blue-900 border-blue-300',
      icon: ShieldCheck
    },
    {
      id: 'aparat-babinsa',
      nama: 'Serda Rusidi',
      instansi: 'Babinsa Koramil Metro (Pembina Desa/Kelurahan TNI-AD)',
      kategori: 'aparat',
      kategoriLabel: 'Aparat Wilayah',
      nomor: '081269138684',
      nomorDisplay: '0812-6913-8684',
      waNumber: '081269138684',
      keterangan: 'Bintara Pembina Desa Koramil, Mitigasi Bencana & Keamanan Teritorial',
      warnaBadge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      icon: ShieldAlert
    },

    // 3. Ambulan & Kesehatan
    {
      id: 'medis-ambulan-kecamatan',
      nama: 'Bpk. Hanan',
      instansi: 'Layanan Ambulan Siaga Kec. Metro Timur',
      kategori: 'medis',
      kategoriLabel: 'Kesehatan & Medis',
      nomor: '085266725346',
      nomorDisplay: '0852-6672-5346',
      waNumber: '085266725346',
      keterangan: 'Antar-jemput pasien gawat darurat & rujukan rumah sakit warga RW 018',
      warnaBadge: 'bg-rose-100 text-rose-900 border-rose-300',
      icon: Ambulance
    },
    {
      id: 'medis-rsud',
      nama: 'IGD RSUD Jend. Ahmad Yani Metro',
      instansi: 'Rumah Sakit Umum Daerah - Layanan IGD 24 Jam',
      kategori: 'medis',
      kategoriLabel: 'Kesehatan & Medis',
      nomor: '072541820',
      nomorDisplay: '(0725) 41820',
      keterangan: 'Instalasi Gawat Darurat (IGD) dan Kamar Rawat Inap RSUD',
      warnaBadge: 'bg-teal-100 text-teal-900 border-teal-300',
      icon: Building
    },
    {
      id: 'medis-puskesmas',
      nama: 'Puskesmas Rawat Inap Metro Timur',
      instansi: 'Pelayanan Kesehatan Tingkat Pertama (BPJS/Umum)',
      kategori: 'medis',
      kategoriLabel: 'Kesehatan & Medis',
      nomor: '072542567',
      nomorDisplay: '(0725) 42567',
      keterangan: 'Pemeriksaan dokter, faskes 1, imunisasi & surat keterangan dokter',
      warnaBadge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      icon: HeartHandshake
    },

    // 4. Damkar & PLN Petugas Lapangan
    {
      id: 'damkar-lapangan',
      nama: 'Bpk. Yadi (Danru)',
      instansi: 'Pos Damkar Metro Siaga Kebakaran',
      kategori: 'damkar_pln',
      kategoriLabel: 'Damkar & PLN',
      nomor: '081279707203',
      nomorDisplay: '0812-7970-7203',
      waNumber: '081279707203',
      keterangan: 'Komandan Regu Tim Pemadam Kebakaran & Evakuasi Cepat',
      warnaBadge: 'bg-amber-100 text-amber-900 border-amber-300',
      icon: Flame
    },
    {
      id: 'pln-lapangan',
      nama: 'Layanan Pengaduan Cepat PLN Metro',
      instansi: 'Posko Pelayanan Gangguan Kelistrikan',
      kategori: 'damkar_pln',
      kategoriLabel: 'Damkar & PLN',
      nomor: '08117901867',
      nomorDisplay: '0811-7901-867',
      waNumber: '08117901867',
      keterangan: 'Pengaduan kabel putus, meteran terbakar, trafo meledak & gangguan listrik',
      warnaBadge: 'bg-yellow-100 text-yellow-900 border-yellow-300',
      icon: Zap
    },

    // 5. Pengurus Wilayah RW & RT Siaga
    {
      id: 'rt-rw-ketua-rw',
      nama: profile.ketuaRw || 'Ketua RW 018',
      instansi: `Pengurus Inti ${profile.namaRw}`,
      kategori: 'rt_rw',
      kategoriLabel: 'Pengurus RT / RW',
      nomor: profile.noHp || '081234567890',
      nomorDisplay: profile.noHp || '0812-3456-7890',
      waNumber: profile.noHp || '081234567890',
      keterangan: 'Ketua RW 018 - Koordinasi Keamanan, Surat Pengantar & Pelayanan Warga',
      warnaBadge: 'bg-emerald-100 text-emerald-950 border-emerald-400 font-bold',
      icon: UserCheck
    },
    ...(profile.daftarRt || []).map((rt: RTInfo) => ({
      id: `rt-${rt.rt}`,
      nama: rt.ketuaRt,
      instansi: `Ketua RT ${rt.rt} - ${profile.namaRw}`,
      kategori: 'rt_rw' as const,
      kategoriLabel: 'Pengurus RT / RW',
      nomor: rt.noHp,
      nomorDisplay: rt.noHp,
      waNumber: rt.noHp,
      keterangan: `Pelayanan surat pengantar, data warga, iuran & laporan wilayah RT ${rt.rt}`,
      warnaBadge: 'bg-slate-100 text-slate-800 border-slate-300',
      icon: MapPin
    })),

    // 6. Instansi Publik Pemerintahan
    {
      id: 'publik-kelurahan',
      nama: `Kantor Kelurahan ${profile.kelurahan}`,
      instansi: 'Pemerintah Kelurahan - Layanan Kependudukan & Administrasi',
      kategori: 'publik',
      kategoriLabel: 'Pelayanan Publik',
      nomor: '072541110',
      nomorDisplay: '(0725) 41110',
      keterangan: 'Pengurusan KTP, KK, Surat Domisili, Ahli Waris & Administrasi Kelurahan',
      warnaBadge: 'bg-indigo-100 text-indigo-900 border-indigo-300',
      icon: Building
    },
    {
      id: 'publik-kecamatan',
      nama: `Kantor Kecamatan ${profile.kecamatan}`,
      instansi: 'Pemerintah Kecamatan - Layanan Administrasi Terpadu',
      kategori: 'publik',
      kategoriLabel: 'Pelayanan Publik',
      nomor: '072541220',
      nomorDisplay: '(0725) 41220',
      keterangan: 'Legalisir dokumen, rekomendasi izin, verifikasi bansos & pelayanan publik',
      warnaBadge: 'bg-indigo-100 text-indigo-900 border-indigo-300',
      icon: Building
    }
  ];

  // Filtering based on active category tab & search query
  const filteredList = emergencyList.filter((item) => {
    const matchesCategory =
      activeCategory === 'semua' || item.kategori === activeCategory;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesCategory;

    const matchesSearch =
      item.nama.toLowerCase().includes(query) ||
      item.instansi.toLowerCase().includes(query) ||
      item.nomor.includes(query) ||
      item.nomorDisplay.toLowerCase().includes(query) ||
      (item.keterangan && item.keterangan.toLowerCase().includes(query)) ||
      item.kategoriLabel.toLowerCase().includes(query);

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      {/* Background click to dismiss */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Main Modal Container */}
      <div
        id="modal-emergency-contacts"
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border-2 border-rose-500/80 overflow-hidden flex flex-col max-h-[90vh] z-10 animate-in zoom-in-95 duration-150"
      >
        {/* Flashing Top Alert Banner */}
        <div className="bg-gradient-to-r from-rose-700 via-red-600 to-rose-800 text-white px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-md relative overflow-hidden">
          {/* Pulsing light effect in header */}
          <div className="absolute -left-10 -top-10 w-32 h-32 bg-white/20 rounded-full blur-xl pointer-events-none animate-pulse" />

          <div className="flex items-center gap-3 min-w-0">
            {/* Pulsing Siren Icon Beacon */}
            <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-white text-rose-600 shadow-md shrink-0">
              <span className="absolute -inset-1 rounded-2xl bg-rose-300 animate-ping opacity-75" />
              <Siren className="w-6 h-6 relative z-10 animate-bounce" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white uppercase flex items-center gap-1.5 truncate">
                  <span>Kontak Darurat & Publik</span>
                </h2>
                <span className="bg-amber-400 text-rose-950 font-black text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs animate-pulse shrink-0">
                  Siaga 24 Jam
                </span>
              </div>
              <p className="text-xs text-rose-100 font-medium truncate mt-0.5">
                {profile.namaRw} • {profile.kelurahan}, {profile.kecamatan}
              </p>
            </div>
          </div>

          {/* Close Button Top */}
          <button
            id="btn-close-emergency-modal-top"
            onClick={onClose}
            className="flex items-center justify-center w-9 h-9 rounded-2xl bg-white/15 hover:bg-white/30 active:bg-white/40 text-white transition-all shadow-xs shrink-0 border border-white/20 active:scale-95 ml-2"
            title="Tutup Menu Darurat (Esc)"
            aria-label="Tutup Menu Kontak Darurat"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Quick Emergency Action Callouts */}
        <div className="bg-rose-50 border-b border-rose-200 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 text-rose-900 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Kondisi darurat? Tekan tombol <strong>Telepon</strong> untuk langsung tersambung.</span>
          </div>

          {onNavigateToPengaduan && (
            <button
              onClick={() => {
                onClose();
                onNavigateToPengaduan();
              }}
              className="text-[11px] font-bold text-rose-700 hover:text-rose-900 bg-white px-2.5 py-1 rounded-lg border border-rose-300 shadow-2xs hover:bg-rose-100 flex items-center gap-1 transition-all"
            >
              <span>📢 Buat Laporan Pengaduan</span>
            </button>
          )}
        </div>

        {/* Search & Category Filter Controls */}
        <div className="p-3.5 sm:p-5 border-b border-slate-200 bg-slate-50 space-y-3 shrink-0">
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-emergency-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari polisi, ambulan, damkar, PLN, ketua RT, RSUD..."
              className="w-full pl-10 pr-9 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
                title="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {[
              { id: 'semua', label: 'Semua Kontak' },
              { id: 'nasional', label: '🚨 Hotline 24 Jam' },
              { id: 'aparat', label: '👮 Bhabin & Babinsa' },
              { id: 'medis', label: '🚑 Medis & RSUD' },
              { id: 'damkar_pln', label: '🔥 Damkar & PLN' },
              { id: 'rt_rw', label: '🏛️ Ketua RW & RT' },
              { id: 'publik', label: '🏢 Kelurahan & Kec' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all shadow-2xs ${
                  activeCategory === cat.id
                    ? 'bg-rose-600 text-white shadow-rose-600/30'
                    : 'bg-white text-slate-600 hover:bg-slate-200/80 border border-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contact List Content */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-2.5 bg-slate-100/70">
          {filteredList.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 p-6">
              <ShieldAlert className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">Kontak Tidak Ditemukan</p>
              <p className="text-xs text-slate-500 mt-1">
                Silakan coba kata kunci lain atau gunakan kategori "Semua Kontak".
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('semua');
                }}
                className="mt-3 px-3.5 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700"
              >
                Reset Pencarian
              </button>
            </div>
          ) : (
            filteredList.map((contact) => {
              const IconComp = contact.icon;
              const isCopied = copiedId === contact.id;

              return (
                <div
                  key={contact.id}
                  className={`bg-white rounded-2xl p-3.5 sm:p-4 border transition-all duration-150 shadow-xs hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    contact.isHotline
                      ? 'border-rose-300 bg-gradient-to-r from-white via-rose-50/30 to-white'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Left Info */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs border ${
                        contact.isHotline
                          ? 'bg-rose-600 text-white border-rose-700'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      <IconComp className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                          {contact.nama}
                        </h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${contact.warnaBadge}`}
                        >
                          {contact.kategoriLabel}
                        </span>
                      </div>

                      <p className="text-xs font-medium text-slate-600 mt-0.5">
                        {contact.instansi}
                      </p>

                      {contact.keterangan && (
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                          {contact.keterangan}
                        </p>
                      )}

                      {/* Display Number */}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="font-mono text-sm font-black text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-200 inline-block">
                          {contact.nomorDisplay}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Action Buttons (Call, WhatsApp, Copy) */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 w-full sm:w-auto justify-end">
                    {/* Copy Button */}
                    <button
                      onClick={() => handleCopy(contact.id, contact.nomor)}
                      className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-xs font-semibold border border-slate-200 transition-all active:scale-95"
                      title="Salin Nomor Telepon"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-bold">Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>

                    {/* WhatsApp Button if available */}
                    {contact.waNumber && (
                      <a
                        href={`https://wa.me/${cleanWaNumber(contact.waNumber)}?text=Halo%20${encodeURIComponent(
                          contact.nama
                        )},%20saya%20warga%20${encodeURIComponent(
                          profile.namaRw
                        )}%20membutuhkan%20informasi/bantuan%20darurat.`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95"
                        title="Chat WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WA</span>
                      </a>
                    )}

                    {/* Direct Call Button */}
                    <a
                      href={`tel:${contact.nomor}`}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 active:from-rose-700 active:to-red-700 text-white text-xs font-extrabold shadow-md shadow-rose-600/30 transition-all active:scale-95"
                      title="Panggil Sekarang"
                    >
                      <Phone className="w-3.5 h-3.5 fill-current animate-pulse" />
                      <span>Telepon</span>
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer with Close Button */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-500 font-medium hidden sm:block">
            Tekan tombol <strong>Tutup</strong> atau klik di luar kotak untuk kembali ke aplikasi.
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              id="btn-close-emergency-modal-bottom"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 active:bg-black text-white text-xs font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
              <span>Tutup Menu Darurat</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
