import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Gift,
  Wallet,
  FileText,
  Briefcase,
  ShoppingBag,
  CalendarDays,
  MessageSquareWarning,
  Database,
  PhoneCall,
  ShieldCheck,
  ChevronRight,
  MapPin,
  Building,
  UserCheck,
  Flame,
  Ambulance,
  Phone,
  Zap,
  Copy,
  Check,
  HeartHandshake,
  Download,
  Sparkles,
  User,
  KeyRound,
  LogIn,
  LogOut,
  Crown,
  Landmark,
  Lock,
  ShieldAlert,
  X,
  Camera,
  Compass,
  Map,
  BookOpen,
  Leaf
} from 'lucide-react';
import { NavTab, RWProfile, AppUser } from '../types';
import { FullscreenToggle } from './FullscreenToggle';
import { LOGO_RW_018, handleLogoError } from '../constants/logo';
import { getRolePermission, canUserAccessTab, getUserPhotoUrl, isUserSuperAdmin } from '../services/auth';
import { getCloudStorageMetrics } from '../services/storage';
import { ThemeToggle } from './ThemeToggle';

interface MenuViewProps {
  profile: RWProfile;
  currentTab: NavTab;
  onNavigate: (tab: NavTab) => void;
  onOpenSettings: () => void;
  onOpenAndroidModal?: () => void;
  onOpenEmergencyModal?: () => void;
  currentUser?: AppUser | null;
  onOpenLogin?: () => void;
  onLogout?: () => void;
  onOpenUserManagement?: () => void;
  onOpenHakAkses?: () => void;
  counts: {
    warga: number;
    kk: number;
    bansos: number;
    rkm: number;
    keamanan?: number;
    umkm: number;
    kas: number;
    pbb?: number;
    kegiatan: number;
    pengaduan: number;
    surat: number;
    laporanKejadian?: number;
  };
}

export const MenuView: React.FC<MenuViewProps> = ({
  profile,
  onNavigate,
  onOpenSettings,
  onOpenAndroidModal,
  onOpenEmergencyModal,
  currentUser,
  onOpenLogin,
  onLogout,
  onOpenUserManagement,
  onOpenHakAkses,
  counts,
}) => {
  const [copiedContactId, setCopiedContactId] = useState<string | null>(null);
  const [restrictedModalItem, setRestrictedModalItem] = useState<{ id: NavTab; label: string } | null>(null);

  const emergencyContacts = profile.kontakDarurat || [
    {
      id: 'kd-1',
      namaInstansi: 'Bhabinkamtibmas',
      petugas: 'Aipda Evodius (NRP. 84050233)',
      nomorTelepon: '081379712721',
      kategori: 'Keamanan Polisi'
    },
    {
      id: 'kd-2',
      namaInstansi: 'Babinsa Koramil',
      petugas: 'Serda Rusidi',
      nomorTelepon: '081269138684',
      kategori: 'TNI Koramil'
    },
    {
      id: 'kd-3',
      namaInstansi: 'Ambulan Kec Metro Timur',
      petugas: 'Hanan',
      nomorTelepon: '085266725346',
      kategori: 'Kesehatan & Ambulan'
    },
    {
      id: 'kd-4',
      namaInstansi: 'Damkar Metro',
      petugas: 'Yadi Danru',
      nomorTelepon: '081279707203',
      kategori: 'Pemadam Kebakaran'
    },
    {
      id: 'kd-5',
      namaInstansi: 'PLN Metro',
      petugas: 'Layanan Pengaduan Listrik',
      nomorTelepon: '08117901867',
      kategori: 'PLN & Kelistrikan'
    }
  ];

  const handleCopyContact = (id: string, num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedContactId(id);
    setTimeout(() => {
      setCopiedContactId(null);
    }, 2000);
  };

  const userPerm = currentUser ? getRolePermission(currentUser.role) : null;

  const handleItemClick = (item: { id: NavTab; label: string }) => {
    const isAllowed = canUserAccessTab(currentUser || null, item.id);
    if (isAllowed) {
      onNavigate(item.id);
    } else {
      setRestrictedModalItem(item);
    }
  };

  const menuSections = [
    {
      title: 'Kependudukan & Administrasi',
      items: [
        {
          id: 'warga' as NavTab,
          label: 'Data Induk Warga',
          desc: 'Pencatatan data penduduk, NIK 16 digit, filter RT 039-042 & administrasi surat',
          icon: Users,
          count: `${counts.warga} Jiwa`,
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        },
        {
          id: 'kk' as NavTab,
          label: 'Data Kartu Keluarga (KK)',
          desc: 'Nomor KK, kepala keluarga, klasifikasi ekonomi (Prasejahtera/Menengah/Mampu)',
          icon: CreditCard,
          count: `${counts.kk} KK`,
          color: 'bg-blue-50 text-blue-700 border-blue-200',
        },
        {
          id: 'surat' as NavTab,
          label: 'Administrasi Surat',
          desc: 'Surat pengantar SKCK, KTP, domisili, SKTM, SKU & cetak kop resmi',
          icon: FileText,
          count: `${counts.surat} Surat`,
          color: 'bg-amber-50 text-amber-700 border-amber-200',
        },
      ],
    },
    {
      title: 'Sosial, RKM & Kas Keuangan',
      items: [
        {
          id: 'rkm' as NavTab,
          label: 'Rukun Kematian Masyarakat (RKM)',
          desc: 'Iuran RKM warga, pencatatan warga meninggal, santunan & perlengkapan',
          icon: HeartHandshake,
          count: `Layanan RKM`,
          color: 'bg-rose-50 text-rose-800 border-rose-200',
        },
        {
          id: 'kas' as NavTab,
          label: 'Data Kas & Iuran RW',
          desc: 'Buku kas keuangan, iuran bulanan RT & kuitansi resmi',
          icon: Wallet,
          count: `${counts.kas} Trx`,
          color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        },
        {
          id: 'pbb' as NavTab,
          label: 'Data PBB & Pemilik SHM',
          desc: 'Pajak Bumi & Bangunan, rincian SHM, NOP, tagihan tahun berjalan & data tunggakan',
          icon: Landmark,
          count: counts.pbb !== undefined ? `${counts.pbb} Objek Pajak` : 'PBB & SHM',
          color: 'bg-amber-50 text-amber-800 border-amber-200',
        },
        {
          id: 'bansos' as NavTab,
          label: 'Data Bansos (Bantuan Sosial)',
          desc: 'Penyaluran beras CBP, PKH, BPNT, BLT & santunan warga',
          icon: Gift,
          count: `${counts.bansos} Penerima`,
          color: 'bg-amber-50 text-amber-800 border-amber-200',
        },
        {
          id: 'umkm' as NavTab,
          label: 'Data UMKM Warga',
          desc: 'Direktori kuliner, toko sembako, kerajinan & jasa usaha warga',
          icon: ShoppingBag,
          count: `${counts.umkm} Usaha`,
          color: 'bg-purple-50 text-purple-700 border-purple-200',
        },
      ],
    },
    {
      title: 'Keamanan, Pembangunan & Layanan Warga',
      items: [
        {
          id: 'peta' as NavTab,
          label: 'Peta Wilayah & Denah RW 018',
          desc: 'Denah interaktif RT 039-042, 16 titik CCTV, pos ronda, fasum, Google Maps satelit & cetak peta',
          icon: Compass,
          count: '4 RT • 16 CCTV',
          color: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        },
        {
          id: 'keamanan' as NavTab,
          label: 'Ronda Malam & Keamanan Lingkungan',
          desc: 'Jadwal ronda (Senin-Minggu 23:00-04:00), input Ketua & Anggota warga per RT, daftar hadir absensi RT/RW & CCTV',
          icon: ShieldCheck,
          count: 'Senin-Minggu • 23:00-04:00',
          color: 'bg-amber-50 text-amber-900 border-amber-300',
        },
        {
          id: 'laporan_kejadian' as NavTab,
          label: 'Laporan Kejadian RW 018',
          desc: 'Form data digital resmi laporan insiden/musibah wilayah kepada Lurah, Camat, Kapolsek, kronologi AI & cetak PDF',
          icon: FileText,
          count: counts.laporanKejadian !== undefined ? `${counts.laporanKejadian} Laporan` : 'Laporan Resmi',
          color: 'bg-rose-50 text-rose-800 border-rose-300',
        },
        {
          id: 'kegiatan' as NavTab,
          label: 'Data Kegiatan RW',
          desc: 'Jadwal gotong royong, posyandu, rapat musyawarah & notulen',
          icon: CalendarDays,
          count: `${counts.kegiatan} Agenda`,
          color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        },
        {
          id: 'pengaduan' as NavTab,
          label: 'Pengaduan & Aspirasi Warga',
          desc: 'Keluhan got, sampah, jalan, keamanan & status tindak lanjut',
          icon: MessageSquareWarning,
          count: `${counts.pengaduan} Laporan`,
          color: 'bg-rose-50 text-rose-700 border-rose-200',
        },
      ],
    },
  ];

  return (
    <div className="space-y-4 p-4 pb-16 max-w-5xl mx-auto">
      {/* Active User Profile & Role Info Card (Manajemen Akun & Hak Akses User) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-2xs space-y-3 transition-colors duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl overflow-hidden bg-slate-900 border-2 border-emerald-500 text-white flex items-center justify-center font-bold text-sm sm:text-base shadow-2xs shrink-0">
              {currentUser ? (
                <img
                  src={getUserPhotoUrl(currentUser, currentUser.nama)}
                  alt={currentUser.nama}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.nama)}&background=047857&color=ffffff&bold=true`;
                  }}
                />
              ) : (
                <User className="w-5 h-5 text-emerald-300" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/70 px-2 py-0.5 rounded-md w-fit border border-emerald-300/80 dark:border-emerald-800/80 mb-0.5">
                <KeyRound className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="truncate">Manajemen Akun & Hak Akses User</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 truncate">
                  {currentUser ? currentUser.nama : 'Belum Masuk Akun'}
                </h2>
                {currentUser && (
                  <>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold shadow-2xs ${userPerm?.badgeBg || 'bg-emerald-700 text-white'}`}>
                      {currentUser.roleLabel}
                    </span>
                    <span
                      className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800 flex items-center gap-1 shadow-2xs"
                      title="Keamanan Sesi: Otomatis Logout jika tidak aktif selama 5 menit untuk perlindungan data warga"
                    >
                      <ShieldCheck className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Auto-Logout 5m</span>
                    </span>
                  </>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {currentUser ? (
                  <>
                    Username: <code className="font-mono text-emerald-800 dark:text-emerald-300 font-semibold">{currentUser.username}</code>
                    {currentUser.rtAccess && currentUser.rtAccess !== 'ALL' && (
                      <span className="ml-1 text-purple-700 dark:text-purple-300 font-bold">• RT {currentUser.rtAccess}</span>
                    )}
                    {currentUser.description && ` • ${currentUser.description}`}
                  </>
                ) : (
                  'Masuk dengan akun pengurus atau warga untuk mengaktifkan seluruh fitur sesuai wewenang.'
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons Bar - Ramping & Rata Kanan Kiri di Layar Android */}
        <div className={`pt-2 border-t border-slate-100 dark:border-slate-800/80 w-full grid gap-1.5 sm:gap-2 ${
          isUserSuperAdmin(currentUser)
            ? 'grid-cols-2 sm:grid-cols-4'
            : (currentUser ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2')
        }`}>
          {onOpenHakAkses && (
            <button
              id="btn-menu-hak-akses"
              onClick={onOpenHakAkses}
              title={
                isUserSuperAdmin(currentUser)
                  ? 'Buka Menu Pengaturan Hak Akses Level User (Super Admin)'
                  : 'Hanya User SA yang bisa mengeklik menu ini dan mengaturnya'
              }
              className={`w-full py-2 px-2.5 rounded-xl text-[11px] sm:text-xs font-black flex items-center justify-between gap-1 shadow-2xs transition-all border cursor-pointer active:scale-95 ${
                isUserSuperAdmin(currentUser)
                  ? 'bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 hover:from-emerald-700 hover:to-teal-700 text-white border-emerald-600/50'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-600/60'
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span className="truncate">Hak Akses</span>
              </div>
              <span className="px-1.5 py-0.2 rounded-md text-[8.5px] sm:text-[9px] font-black bg-amber-400 text-emerald-950 flex items-center gap-0.5 shrink-0">
                <Crown className="w-2.5 h-2.5" />
                <span>{isUserSuperAdmin(currentUser) ? 'SA' : 'Khusus SA'}</span>
              </span>
            </button>
          )}

          {currentUser?.role === 'warga' ? (
            <div
              id="btn-menu-edit-photo-disabled"
              title="Fungsi menu Ubah Foto Profil & Kelola Akun dinonaktifkan untuk level Warga"
              className="w-full py-2 px-2.5 bg-slate-100 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700/60 cursor-not-allowed opacity-60 select-none shadow-2xs"
            >
              <Camera className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate line-through">Foto & Profil</span>
            </div>
          ) : currentUser && onOpenUserManagement ? (
            <button
              id="btn-menu-edit-photo"
              onClick={onOpenUserManagement}
              title="Ubah Foto Profil & Kelola Akun"
              className="w-full py-2 px-2.5 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 active:scale-95 text-amber-900 dark:text-amber-300 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-all border border-amber-300 dark:border-amber-700/60 cursor-pointer shadow-2xs"
            >
              <Camera className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
              <span className="truncate">Foto & Profil</span>
            </button>
          ) : null}

          <button
            id="btn-menu-switch-user"
            onClick={onOpenLogin}
            className={`w-full py-2 px-2.5 bg-emerald-800 dark:bg-emerald-700 hover:bg-emerald-700 dark:hover:bg-emerald-600 active:scale-95 text-white rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer ${
              !isUserSuperAdmin(currentUser) && currentUser ? 'col-span-2 sm:col-span-1' : ''
            }`}
          >
            <User className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="truncate">{currentUser ? 'Ganti Akun' : 'Login Masuk'}</span>
          </button>

          {isUserSuperAdmin(currentUser) && onOpenUserManagement && (
            <button
              id="btn-menu-manage-users"
              onClick={onOpenUserManagement}
              title="Kelola Pengguna & Akun RT (Super Admin)"
              className="w-full py-2 px-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-800 dark:text-slate-200 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-all border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="truncate">Kelola User</span>
            </button>
          )}
        </div>
      </div>

      {/* Theme Switcher Card (Dark / Light / System) */}
      <ThemeToggle variant="card" />

      {/* RW Profile Card */}
      <div className="bg-gradient-to-br from-emerald-800 to-teal-900 dark:from-slate-900 dark:to-emerald-950 text-white p-5 rounded-3xl shadow-sm border border-emerald-700/50 dark:border-slate-800 relative overflow-hidden transition-colors duration-200 space-y-4">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-900 border-2 border-amber-400 shadow-md shrink-0 flex items-center justify-center ring-2 ring-amber-400/30">
              <img
                src={profile.logoUrl || LOGO_RW_018}
                alt="Logo RW 018"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={handleLogoError}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-emerald-950 uppercase tracking-wide">
                  Struktur Pengurus RW 018
                </span>
                <span className="text-xs text-emerald-200">{profile.daftarRt.length} Rukun Tetangga (RT)</span>
              </div>
              <h2 className="text-lg font-black text-white mt-1">
                {profile.namaRw} {profile.kelurahan}
              </h2>
              <p className="text-xs text-emerald-100 mt-0.5">
                Kecamatan {profile.kecamatan}, {profile.kotaKab} • Periode {profile.periodeJabatan || '2024 - 2029'}
              </p>
            </div>
          </div>

          <div className="w-full sm:w-auto flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 self-stretch sm:self-center">
            <FullscreenToggle className="px-3 py-2 rounded-xl text-xs" />

            {isUserSuperAdmin(currentUser) && (
              <button
                id="btn-menu-open-settings"
                onClick={onOpenSettings}
                className="px-3 py-2 bg-white dark:bg-slate-800 text-emerald-900 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer border border-emerald-100 dark:border-slate-700"
              >
                <Database className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                <span className="truncate">Pengaturan & Database</span>
              </button>
            )}
          </div>
        </div>

        {/* Pengurus RW 018: Pimpinan Inti & Seksi Bidang */}
        <div className="space-y-2.5 pt-2.5 border-t border-emerald-700/60 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-200">
              Struktur Kepengurusan RW 018
            </span>
            <span className="text-[10px] text-amber-300 font-bold">
              Masa Bakti {profile.periodeJabatan || '2024 - 2029'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="p-2 rounded-2xl bg-emerald-900/60 dark:bg-slate-800/80 border border-emerald-600/40 dark:border-slate-700 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-amber-400 text-emerald-950 flex items-center justify-center font-black text-xs shrink-0">
                <Crown className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[8.5px] font-extrabold uppercase tracking-wider text-amber-300 block">
                  Ketua RW 018
                </span>
                <p className="text-xs font-bold text-white truncate">
                  {profile.namaKetuaRw || 'Eko Purwanto S.Kom'}
                </p>
                <span className="text-[9.5px] text-emerald-200 font-mono block">
                  {profile.noHpKetuaRw || '085383166999'}
                </span>
              </div>
            </div>

            <div className="p-2 rounded-2xl bg-emerald-900/60 dark:bg-slate-800/80 border border-emerald-600/40 dark:border-slate-700 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-teal-400 text-emerald-950 flex items-center justify-center font-black text-xs shrink-0">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[8.5px] font-extrabold uppercase tracking-wider text-teal-300 block">
                  Sekretaris RW 018
                </span>
                <p className="text-xs font-bold text-white truncate">
                  {profile.namaSekretarisRw || 'Agung Prayoga'}
                </p>
                <span className="text-[9.5px] text-emerald-200 font-mono block">
                  {profile.noHpSekretarisRw || '081272334455'}
                </span>
              </div>
            </div>

            <div className="p-2 rounded-2xl bg-emerald-900/60 dark:bg-slate-800/80 border border-emerald-600/40 dark:border-slate-700 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-amber-300 text-emerald-950 flex items-center justify-center font-black text-xs shrink-0">
                <Wallet className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[8.5px] font-extrabold uppercase tracking-wider text-amber-200 block">
                  Bendahara RW 018
                </span>
                <p className="text-xs font-bold text-white truncate">
                  {profile.namaBendaharaRw || 'Diah Ika Putri'}
                </p>
                <span className="text-[9.5px] text-emerald-200 font-mono block">
                  {profile.noHpBendaharaRw || '081369778899'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="p-2 rounded-2xl bg-emerald-950/40 dark:bg-slate-800/60 border border-emerald-600/30 dark:border-slate-700 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black text-xs shrink-0">
                <BookOpen className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[8.5px] font-extrabold uppercase tracking-wider text-emerald-300 block">
                  Seksi Keagamaan & Rohani
                </span>
                <p className="text-xs font-bold text-white truncate">
                  {profile.namaSeksiKeagamaan || 'Ust. Khaerudin'}
                </p>
                <span className="text-[9.5px] text-emerald-200 font-mono block">
                  {profile.noHpSeksiKeagamaan || '085269112233'}
                </span>
              </div>
            </div>

            <div className="p-2 rounded-2xl bg-emerald-950/40 dark:bg-slate-800/60 border border-emerald-600/30 dark:border-slate-700 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-lime-400 text-emerald-950 flex items-center justify-center font-black text-xs shrink-0">
                <Leaf className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[8.5px] font-extrabold uppercase tracking-wider text-lime-300 block">
                  Seksi Kebersihan & Lingkungan
                </span>
                <p className="text-xs font-bold text-white truncate">
                  {profile.namaSeksiKebersihan || 'Arif R Budiman'}
                </p>
                <span className="text-[9.5px] text-emerald-200 font-mono block">
                  {profile.noHpSeksiKebersihan || '081377889900'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Categories */}
      {menuSections.map((section, idx) => (
        <div key={idx} className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {section.title}
            </h3>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
              {section.items.length} Menu
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5">
            {section.items.map((item) => {
              const Icon = item.icon;
              const isAllowed = canUserAccessTab(currentUser || null, item.id);

              return (
                <button
                  key={item.id}
                  id={`btn-menu-item-${item.id}`}
                  onClick={() => handleItemClick(item)}
                  className={`w-full py-2.5 px-3 rounded-xl sm:rounded-2xl border text-left transition-all flex items-center justify-between group active:scale-[0.99] cursor-pointer ${
                    isAllowed
                      ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-600 shadow-2xs hover:shadow-xs'
                      : 'bg-slate-50/80 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 opacity-60 hover:opacity-90 hover:border-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center font-bold shrink-0 ${
                        isAllowed ? item.color : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className={`text-xs font-bold truncate ${isAllowed ? 'text-slate-800 dark:text-slate-100 group-hover:text-emerald-800 dark:group-hover:text-emerald-300' : 'text-slate-500 dark:text-slate-400'}`}>
                          {item.label}
                        </h4>
                        {!isAllowed && (
                          <span className="p-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 shrink-0" title="Akses Dibatasi">
                            <Lock className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                      <p className="text-[10.5px] text-slate-400 dark:text-slate-400 truncate mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 pl-2">
                    <span className="text-[9.5px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full whitespace-nowrap">
                      {item.count}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Cloud & Database Storage Capacity Overview Section */}
      {(() => {
        const cloudMetrics = getCloudStorageMetrics();
        return (
          <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-950 text-white p-4 sm:p-5 rounded-3xl border border-emerald-700/50 shadow-md space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-amber-300 shrink-0">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-black text-white text-xs sm:text-sm">
                      Kapasitas Penyimpanan Cloud & Database
                    </h4>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-400 text-emerald-950">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-950 animate-ping"></span>
                      <span>Real-Time Sync Online</span>
                    </span>
                  </div>
                  <p className="text-[10.5px] text-emerald-200/90 mt-0.5">
                    Google Cloud Firestore • Region: <code className="font-mono text-amber-300">{cloudMetrics.region}</code>
                  </p>
                </div>
              </div>

              {currentUser?.role === 'admin_rw' && (
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-emerald-950 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-xs self-start sm:self-center cursor-pointer"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Audit Detail Kapasitas</span>
                </button>
              )}
            </div>

            {/* Storage Progress Bar */}
            <div className="bg-black/40 p-3 rounded-2xl border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-300 font-semibold">Ukuran Data Tersimpan:</span>
                  <strong className="text-amber-300 font-mono font-black">{cloudMetrics.totalSizeFormatted}</strong>
                  <span className="text-slate-400 text-[10px]">({cloudMetrics.totalSizeKB} KB)</span>
                </div>
                <div className="text-[11px] text-slate-300">
                  <span>Batas Kuota: </span>
                  <strong className="text-white font-mono">{cloudMetrics.firestoreQuotaFormatted}</strong>
                </div>
              </div>

              {/* Progress gauge */}
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-white/10 flex">
                <div
                  className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(cloudMetrics.firestoreQuotaPercentUsed * 50, 1.5)}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-emerald-100/90 pt-0.5">
                <span>
                  Penggunaan: <strong className="text-amber-300 font-mono">{cloudMetrics.firestoreQuotaPercentUsed}%</strong>
                </span>
                <span>
                  Sisa Kuota: <strong className="text-emerald-300 font-mono">{cloudMetrics.remainingQuotaFormatted}</strong> (99.98% Tersedia)
                </span>
              </div>
            </div>

            {/* Quick 4 Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
              <div className="bg-white/10 p-2.5 rounded-2xl border border-white/10 text-center">
                <span className="text-[9.5px] text-emerald-200 block font-semibold">Total Dokumen</span>
                <span className="font-black text-white text-sm font-mono">{cloudMetrics.totalDocs}</span>
                <span className="text-[9px] text-emerald-200/80 block">Record Cloud</span>
              </div>

              <div className="bg-white/10 p-2.5 rounded-2xl border border-white/10 text-center">
                <span className="text-[9.5px] text-emerald-200 block font-semibold">Jumlah Koleksi</span>
                <span className="font-black text-white text-sm font-mono">{cloudMetrics.collections.length}</span>
                <span className="text-[9px] text-emerald-200/80 block">Tabel Firestore</span>
              </div>

              <div className="bg-white/10 p-2.5 rounded-2xl border border-white/10 text-center">
                <span className="text-[9.5px] text-emerald-200 block font-semibold">Maksimal / Dokumen</span>
                <span className="font-black text-white text-sm font-mono">{cloudMetrics.maxDocSizeFormatted}</span>
                <span className="text-[9px] text-emerald-200/80 block">Batas Standar</span>
              </div>

              <div className="bg-white/10 p-2.5 rounded-2xl border border-white/10 text-center">
                <span className="text-[9.5px] text-emerald-200 block font-semibold">Enkripsi & SLA</span>
                <span className="font-bold text-amber-300 text-[11px] block mt-0.5">TLS 1.3 / AES-256</span>
                <span className="text-[9px] text-emerald-200/80 block">99.99% Availability</span>
              </div>
            </div>

            {/* Top 4 Collections Capacity Badges */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-emerald-200/80 font-bold mr-1">Koleksi Terbesar:</span>
              {cloudMetrics.collections.slice(0, 4).map((c) => (
                <span
                  key={c.id}
                  className="px-2 py-0.5 rounded-lg bg-white/10 border border-white/15 text-[10px] text-white flex items-center gap-1"
                >
                  <span className="font-semibold text-amber-200">{c.name}:</span>
                  <strong className="font-mono text-emerald-300">{c.sizeFormatted}</strong>
                  <span className="text-slate-400 text-[9px]">({c.docCount} doc)</span>
                </span>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Emergency Contacts Section - Ramping & Elegan */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3 transition-colors duration-200">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60 flex items-center justify-center">
              <PhoneCall className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                Kontak Darurat & Pelayanan Publik
              </h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-400">Siaga cepat keamanan, medis & gangguan umum</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {onOpenEmergencyModal && (
              <button
                onClick={onOpenEmergencyModal}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-[10px] font-black uppercase tracking-wider shadow-xs animate-pulse transition-all active:scale-95 cursor-pointer"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                <span>🚨 Buka Pop Up Darurat</span>
              </button>
            )}
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200/70 dark:border-rose-800/70 text-[9px] font-extrabold text-rose-700 dark:text-rose-300 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
              <span>24 Jam</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {emergencyContacts.map((contact) => {
            const isCopied = copiedContactId === contact.id;
            const waPhone = contact.nomorTelepon.replace(/[^0-9]/g, '').replace(/^0/, '62');
            
            const isPolisi = contact.kategori?.toLowerCase().includes('polisi') || contact.namaInstansi.toLowerCase().includes('bhabin');
            const isTni = contact.kategori?.toLowerCase().includes('tni') || contact.namaInstansi.toLowerCase().includes('babinsa');
            const isAmbulan = contact.kategori?.toLowerCase().includes('kesehatan') || contact.namaInstansi.toLowerCase().includes('ambulan');
            const isDamkar = contact.kategori?.toLowerCase().includes('kebakaran') || contact.namaInstansi.toLowerCase().includes('damkar');
            
            const iconBg = isPolisi
              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200/70 dark:border-blue-800/60'
              : isTni
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-800/60'
              : isAmbulan
              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 border-rose-200/70 dark:border-rose-800/60'
              : isDamkar
              ? 'bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-300 border-orange-200/70 dark:border-orange-800/60'
              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200/70 dark:border-amber-800/60';

            const IconComp = isPolisi || isTni ? ShieldCheck : isAmbulan ? Ambulance : isDamkar ? Flame : Zap;

            return (
              <div
                key={contact.id}
                className="p-2.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-xs transition-all flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${iconBg}`}>
                    <IconComp className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-400 block uppercase tracking-wider truncate">
                      {contact.namaInstansi}
                    </span>
                    <h5 className="text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate leading-tight">
                      {contact.petugas ? contact.petugas : contact.namaInstansi}
                    </h5>
                    <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 block mt-0.5">
                      {contact.nomorTelepon}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={`tel:${contact.nomorTelepon}`}
                    className="p-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center justify-center transition-colors shadow-2xs"
                    title={`Hubungi ${contact.petugas || contact.namaInstansi}`}
                  >
                    <Phone className="w-3 h-3" />
                  </a>

                  {contact.nomorTelepon.startsWith('08') && (
                    <a
                      href={`https://wa.me/${waPhone}?text=Halo%20${encodeURIComponent(contact.petugas || contact.namaInstansi)}%2C%20saya%20warga%20RW%20018%20Kelurahan%20Iringmulyo%20Metro%20Timur`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-1.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900 rounded-lg text-[9px] font-extrabold transition-colors border border-emerald-300 dark:border-emerald-800"
                      title="Kirim WhatsApp"
                    >
                      WA
                    </a>
                  )}

                  <button
                    onClick={() => handleCopyContact(contact.id, contact.nomorTelepon)}
                    className="p-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-300 hover:text-slate-700 dark:hover:text-white rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                    title="Salin Nomor"
                  >
                    {isCopied ? (
                      <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Restricted Feature Modal Dialog */}
      {restrictedModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-rose-200 dark:border-rose-900/60 shadow-2xl space-y-4 text-center text-slate-800 dark:text-slate-100 transition-colors duration-200">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                Fitur Dibatasi
              </span>
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100 mt-2">
                {restrictedModalItem.label}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Fitur ini tidak masuk dalam kewenangan hak akses akun Anda ({currentUser?.roleLabel}).
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl text-left text-xs border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 space-y-1">
              <p><strong>Pengguna Aktif:</strong> {currentUser?.nama}</p>
              <p><strong>Peran:</strong> {currentUser?.roleLabel}</p>
              {currentUser?.rtAccess && currentUser.rtAccess !== 'ALL' && (
                <p><strong>Wilayah Kerja:</strong> RT {currentUser.rtAccess}</p>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setRestrictedModalItem(null)}
                className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  setRestrictedModalItem(null);
                  if (onOpenLogin) onOpenLogin();
                }}
                className="flex-1 py-2 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Ganti Akun
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
