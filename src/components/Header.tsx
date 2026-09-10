import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Database,
  ShieldCheck,
  Bell,
  Search,
  Wifi,
  WifiOff,
  Battery,
  Signal,
  User,
  LogIn,
  LogOut,
  Crown,
  KeyRound,
  ChevronDown,
  ArrowLeft,
  X,
  Sparkles,
  Layers,
  MapPin,
  Siren,
  PhoneCall,
  Camera,
  Compass
} from 'lucide-react';
import { RWProfile, NavTab, AppUser } from '../types';
import { getDatabaseStats } from '../services/storage';
import { LOGO_RW_018, handleLogoError } from '../constants/logo';
import { getRolePermission, getUserPhotoUrl, isUserSuperAdmin } from '../services/auth';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  profile: RWProfile;
  currentTab?: NavTab | string;
  activeTab?: string;
  onNavigate?: (tab: NavTab) => void;
  onBack?: () => void;
  canGoBack?: boolean;
  onOpenNotifications?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onQuickSearch?: (query: string) => void;
  onOpenSettings?: () => void;
  onOpenDatabaseModal?: () => void;
  onOpenAndroidModal?: () => void;
  onOpenEmergencyModal?: () => void;
  currentUser?: AppUser | null;
  onOpenLogin?: () => void;
  onLogout?: () => void;
  onOpenUserManagement?: () => void;
  onOpenHakAkses?: () => void;
  unreadPengaduanCount?: number;
  unreadCount?: number;
  isMobileFrame?: boolean;
  onToggleFrame?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  currentTab,
  activeTab,
  onNavigate,
  onBack,
  canGoBack = false,
  onOpenNotifications,
  searchQuery = '',
  onSearchChange,
  onQuickSearch,
  onOpenSettings,
  onOpenDatabaseModal,
  onOpenAndroidModal,
  onOpenEmergencyModal,
  currentUser,
  onOpenLogin,
  onLogout,
  onOpenUserManagement,
  onOpenHakAkses,
  unreadPengaduanCount = 0,
  unreadCount,
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [storageSize, setStorageSize] = useState('0');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const tabName = currentTab || activeTab || 'dashboard';
  const effectiveUnread = unreadPengaduanCount || unreadCount || 0;
  const userPerm = currentUser ? getRolePermission(currentUser.role) : null;

  const handleSearchInput = (val: string) => {
    if (onSearchChange) onSearchChange(val);
    if (onQuickSearch) onQuickSearch(val);
  };

  const handleSettingsClick = () => {
    if (currentUser?.role === 'warga') return;
    if (onOpenSettings) onOpenSettings();
    else if (onOpenDatabaseModal) onOpenDatabaseModal();
    else if (onNavigate) onNavigate('menu');
  };

  const handleBellClick = () => {
    if (onOpenNotifications) {
      onOpenNotifications();
    } else if (onNavigate) {
      onNavigate('pengaduan');
    }
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    try {
      const stats = getDatabaseStats();
      if (stats && stats.storageSizeKB) {
        setStorageSize(stats.storageSizeKB);
      }
    } catch (e) {
      console.warn('Could not read db stats:', e);
    }
  }, []);

  const getSearchPlaceholder = () => {
    switch (tabName) {
      case 'warga':
        return 'Cari NIK, Nama Warga, No. Rumah, Pekerjaan...';
      case 'kk':
        return 'Cari Nomor KK, Kepala Keluarga, Alamat...';
      case 'bansos':
        return 'Cari Penerima Bansos (PKH, BPNT, BLT)...';
      case 'pbb':
        return 'Cari NOP PBB, Nama Wajib Pajak, Blok...';
      case 'kas':
        return 'Cari Transaksi Kas / Iuran Warga...';
      case 'surat':
        return 'Cari Nomor Surat, Pemohon, Jenis...';
      case 'rkm':
        return 'Cari Data RKM, Iuran, Warga Meninggal...';
      case 'umkm':
        return 'Cari Nama Usaha, Pemilik UMKM, Produk...';
      case 'keamanan':
        return 'Cari Jadwal Ronda, Pos Kamling, Petugas...';
      case 'kegiatan':
        return 'Cari Nama Agenda / Kegiatan RW...';
      case 'pengaduan':
        return 'Cari Laporan Aduan Warga...';
      default:
        return 'Cari di sistem RW 018...';
    }
  };

  const isSearchableTab = [
    'warga',
    'kk',
    'bansos',
    'pbb',
    'kas',
    'surat',
    'rkm',
    'umkm',
    'keamanan',
    'kegiatan',
    'pengaduan',
  ].includes(tabName);

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white shadow-xl select-none border-b border-emerald-700/50">
      {/* 1. Android Top System Status Bar */}
      <div className="bg-emerald-950/95 backdrop-blur-md px-3.5 sm:px-5 py-1 flex items-center justify-between text-[11px] text-emerald-200/90 font-medium tracking-wide border-b border-emerald-900/60">
        {/* Left: Clock */}
        <div className="flex items-center gap-1.5 font-semibold">
          <span className="text-white font-mono tracking-tight">{timeStr || '12:00'}</span>
          <span className="text-[9px] text-emerald-400 font-bold hidden xs:inline uppercase">WITA</span>
        </div>

        {/* Right: Network status, Signal, Wifi, Battery */}
        <div className="flex items-center gap-2">
          {/* Online/Offline Status Indicator Pill */}
          <div
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold border transition-all duration-300 ${
              isOnline
                ? 'bg-emerald-900/90 text-emerald-300 border-emerald-600/60 shadow-2xs'
                : 'bg-rose-950 text-rose-300 border-rose-600 animate-pulse'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span className="tracking-tight">{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          <span className="text-[9px] font-black font-mono bg-emerald-800/80 text-amber-300 px-1 py-0.2 rounded border border-emerald-700/40">
            5G
          </span>

          <Signal className="w-3 h-3 text-emerald-200" />
          {isOnline ? (
            <Wifi className="w-3 h-3 text-emerald-300" />
          ) : (
            <WifiOff className="w-3 h-3 text-rose-400" />
          )}

          {/* Battery pill */}
          <div className="flex items-center gap-0.5 text-emerald-200 font-mono text-[9px] font-semibold">
            <span>98%</span>
            <Battery className="w-3.5 h-3.5 fill-emerald-400 text-emerald-300" />
          </div>
        </div>
      </div>

      {/* 2. Main Mobile App Bar */}
      <div className="px-3.5 sm:px-5 py-2.5">
        <div className="flex items-center justify-between gap-2.5">
          {/* Left: Back button (if inside sub-pages) + Official Logo + Identity Info */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {tabName !== 'dashboard' && (
              <button
                id="btn-header-back-button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onBack) onBack();
                  else if (onNavigate) onNavigate('dashboard');
                }}
                className="flex items-center justify-center w-8 h-8 sm:w-auto sm:px-2.5 sm:py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-emerald-950 font-black shadow-md border border-amber-300 transition-transform active:scale-90 shrink-0 group"
                title="Kembali ke Beranda"
                aria-label="Kembali ke halaman sebelumnya"
              >
                <ArrowLeft className="w-4 h-4 stroke-[3] group-hover:-translate-x-0.5 transition-transform" />
                <span className="hidden sm:inline text-xs uppercase tracking-tight ml-1">Kembali</span>
              </button>
            )}

            <div
              onClick={() => onNavigate && onNavigate('dashboard')}
              className="flex items-center gap-2 sm:gap-2.5 min-w-0 cursor-pointer group select-none"
            >
              {/* Logo with gold border ring */}
              <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-slate-950 border-2 border-amber-400 shadow-md shrink-0 flex items-center justify-center ring-2 ring-amber-400/30 group-hover:scale-105 transition-transform duration-200">
                <img
                  src={profile.logoUrl || LOGO_RW_018}
                  alt="Logo RW 018"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  onError={handleLogoError}
                />
              </div>

              {/* Title & Subtitle Info */}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h1 className="text-sm sm:text-base font-extrabold leading-none text-white tracking-tight truncate">
                    {profile.namaRw || 'RW 018'}
                  </h1>

                  {/* Role or RT Badge */}
                  {currentUser ? (
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold tracking-tight shadow-2xs truncate ${
                        userPerm?.badgeBg || 'bg-emerald-800 text-emerald-100 border border-emerald-600'
                      }`}
                    >
                      {currentUser.role === 'admin_rw' && (
                        <Crown className="w-2.5 h-2.5 mr-0.5 text-amber-300 shrink-0" />
                      )}
                      {currentUser.role === 'ketua_rt' && (
                        <ShieldCheck className="w-2.5 h-2.5 mr-0.5 text-amber-300 shrink-0" />
                      )}
                      <span>{currentUser.roleLabel}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-400 text-emerald-950 shadow-2xs">
                      <ShieldCheck className="w-2.5 h-2.5 mr-0.5" />
                      Resmi
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-emerald-200/90 font-medium truncate mt-0.5">
                  <MapPin className="w-2.5 h-2.5 text-amber-300 shrink-0" />
                  <span className="truncate">
                    {profile.kelurahan || 'Melayu'}, {profile.kotaKab || 'Banjarmasin'}
                  </span>
                  {currentUser && (
                    <span className="hidden sm:inline-flex items-center gap-1 text-white font-bold ml-1.5 pl-1.5 border-l border-emerald-600/70 text-[10px]">
                      <span className="text-amber-300 font-extrabold">User Aktif:</span>
                      <span className="truncate max-w-[140px] text-emerald-100">{currentUser.nama}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Actions Cluster (Emergency Button, Notifications, User Account / Login, Settings/APK) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Pulsing & Flashing Circular Emergency / SOS Icon Button */}
            {onOpenEmergencyModal && (
              <button
                id="btn-header-emergency-modal"
                onClick={onOpenEmergencyModal}
                title="Buka Menu Kontak Darurat & Pelayanan Publik Siaga 24 Jam"
                aria-label="Menu Kontak Darurat dan Pelayanan Publik"
                className="relative flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-rose-700 via-red-600 to-rose-500 hover:from-rose-600 hover:to-red-500 active:from-rose-800 text-white shadow-md shadow-rose-600/50 border border-rose-300 ring-2 ring-rose-400/80 animate-pulse transition-all active:scale-90 group shrink-0"
              >
                {/* Flashing Beacon Dot */}
                <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-90"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-300 border border-rose-700"></span>
                </span>
                <Siren className="w-4 h-4 text-white animate-bounce" />
              </button>
            )}

            {/* Quick Notification Bell */}
            <button
              id="btn-header-notifications"
              onClick={handleBellClick}
              title="Notifikasi Pengaduan Warga"
              className="relative p-2 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 active:bg-emerald-900 text-emerald-100 border border-emerald-600/50 shadow-xs transition-all active:scale-95 flex items-center justify-center"
              aria-label="Buka Notifikasi Pengaduan"
            >
              <Bell className="w-4 h-4 text-emerald-100" />
              {effectiveUnread > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-rose-500 text-white font-black text-[9px] rounded-full flex items-center justify-center border-2 border-emerald-950 animate-pulse">
                  {effectiveUnread > 99 ? '99+' : effectiveUnread}
                </span>
              )}
            </button>

            {/* Quick Peta Wilayah Button (Desktop & Tablet) */}
            {onNavigate && (
              <button
                id="btn-header-peta"
                onClick={() => onNavigate('peta')}
                title="Peta & Denah Spasial RW 018"
                className={`hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 ${
                  tabName === 'peta'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-emerald-900/90 hover:bg-emerald-800 text-emerald-100 border border-emerald-700/60'
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-amber-300" />
                <span>Peta RW</span>
              </button>
            )}

            {/* Theme Switcher Toggle */}
            <ThemeToggle variant="icon" />

            {/* Quick APK Button (Tablet/Desktop) */}
            {onOpenAndroidModal && (
              <button
                id="btn-header-apk-desktop"
                onClick={onOpenAndroidModal}
                title="Unduh / Jadikan Aplikasi APK Android"
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-emerald-950 text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>APK</span>
              </button>
            )}

            {/* User Account Capsule / Avatar & Menu Dropdown */}
            <div className="relative">
              {currentUser ? (
                <button
                  id="btn-header-user-menu"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-2 sm:px-2.5 py-1 rounded-xl bg-emerald-800/90 hover:bg-emerald-700/90 active:bg-emerald-900 border border-emerald-600/70 shadow-xs transition-all active:scale-95 cursor-pointer"
                  title={`User Aktif: ${currentUser.nama} (${currentUser.roleLabel})`}
                  aria-label="Buka Menu Akun"
                >
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full overflow-hidden border-2 border-amber-300/90 bg-slate-900 flex items-center justify-center font-black text-[11px] shadow-2xs shrink-0">
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
                  </div>
                  <div className="flex flex-col text-left leading-tight max-w-[90px] sm:max-w-[150px] md:max-w-[200px]">
                    <span className="text-[8px] sm:text-[9px] text-amber-300 font-extrabold uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block"></span>
                      <span>User Aktif</span>
                    </span>
                    <span className="text-[11px] sm:text-xs font-black truncate text-white" title={currentUser.nama}>
                      {currentUser.nama}
                    </span>
                  </div>
                  <ChevronDown className="w-3 h-3 text-emerald-300 shrink-0 ml-0.5" />
                </button>
              ) : (
                <button
                  id="btn-header-login"
                  onClick={onOpenLogin}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Login</span>
                </button>
              )}

              {/* User Dropdown / Bottom Sheet style on mobile */}
              {isUserMenuOpen && currentUser && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-2xs"
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 text-slate-800 dark:text-slate-100 p-2.5 text-xs divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* User Info Card */}
                    <div className="p-2.5 space-y-1 bg-gradient-to-br from-emerald-50 to-slate-50 dark:from-slate-800 dark:to-emerald-950/40 rounded-xl border border-emerald-100 dark:border-slate-700/80 mb-1.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-emerald-600 dark:border-emerald-400 bg-slate-900 flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
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
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[9px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                            <span>User Aktif</span>
                          </div>
                          <div className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                            {currentUser.nama}
                          </div>
                          <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1 mt-0.5">
                            <span>{currentUser.roleLabel}</span>
                            {currentUser.rtAccess && currentUser.rtAccess !== 'ALL' && (
                              <span className="bg-emerald-200/80 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 px-1 rounded text-[9px]">
                                RT {currentUser.rtAccess}
                              </span>
                            )}
                          </div>
                          {currentUser.wargaNik && (
                            <div className="text-[10px] text-slate-600 dark:text-slate-300 font-mono mt-0.5">
                              NIK: <strong>{currentUser.wargaNik}</strong>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono pt-1">
                        ID: {currentUser.username}
                      </div>
                    </div>

                    {/* Quick Theme Switcher Row in User Dropdown */}
                    <div className="py-1.5 flex items-center justify-between px-1">
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                        Tema Tampilan
                      </span>
                      <ThemeToggle variant="compact-pill" />
                    </div>

                    {/* Actions Menu */}
                    <div className="py-1.5 space-y-0.5">
                      {onOpenEmergencyModal && (
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onOpenEmergencyModal();
                          }}
                          className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 text-rose-700 dark:text-rose-300 font-bold transition-colors border border-rose-100 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 cursor-pointer"
                        >
                          <Siren className="w-4 h-4 text-rose-600 dark:text-rose-400 animate-pulse" />
                          <span>🚨 Kontak Darurat Siaga 24 Jam</span>
                        </button>
                      )}

                      {currentUser?.role === 'warga' ? (
                        <div
                          title="Fungsi menu Ubah Foto Profil & Kelola Akun dinonaktifkan untuk level Warga"
                          className="w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between text-slate-400 dark:text-slate-500 bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/80 cursor-not-allowed opacity-60 select-none"
                        >
                          <div className="flex items-center gap-2.5">
                            <Camera className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                            <span className="line-through decoration-slate-400 text-xs font-semibold">📸 Ubah Foto Profil & Kelola Akun</span>
                          </div>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            Nonaktif
                          </span>
                        </div>
                      ) : onOpenUserManagement ? (
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onOpenUserManagement();
                          }}
                          className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-2.5 text-amber-900 dark:text-amber-300 font-bold transition-colors border border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20 cursor-pointer"
                        >
                          <Camera className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          <span>📸 Ubah Foto Profil & Kelola Akun</span>
                        </button>
                      ) : null}

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          if (onOpenLogin) onOpenLogin();
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 text-slate-700 dark:text-slate-200 font-medium transition-colors cursor-pointer"
                      >
                        <User className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                        <span>Ganti Akun / Pilih Peran User</span>
                      </button>

                      {onOpenHakAkses && (
                        <button
                          id="btn-header-hak-akses"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onOpenHakAkses();
                          }}
                          className="w-full text-left px-2.5 py-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 flex items-center justify-between text-emerald-900 dark:text-emerald-200 font-bold transition-colors cursor-pointer border border-emerald-200/60 dark:border-emerald-800/60 my-0.5"
                        >
                          <div className="flex items-center gap-2.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span>Hak Akses User (Level)</span>
                          </div>
                          <span className="px-1.5 py-0.2 rounded-md text-[9px] font-black bg-amber-400 text-emerald-950 flex items-center gap-0.5">
                            <Crown className="w-2.5 h-2.5" />
                            <span>{isUserSuperAdmin(currentUser) ? 'SA' : 'Khusus SA'}</span>
                          </span>
                        </button>
                      )}

                      {isUserSuperAdmin(currentUser) && onOpenUserManagement && (
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onOpenUserManagement();
                          }}
                          className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-2.5 text-amber-800 dark:text-amber-300 font-semibold transition-colors cursor-pointer"
                        >
                          <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          <span>Kelola Akun RT & Pengguna</span>
                        </button>
                      )}

                      {onOpenAndroidModal && (
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onOpenAndroidModal();
                          }}
                          className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300 font-medium transition-colors cursor-pointer"
                        >
                          <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span>Pasang Aplikasi di HP Android (APK/PWA)</span>
                        </button>
                      )}

                      {currentUser?.role === 'warga' ? (
                        <div
                          title="Fungsi menu Status Database & Sinkronisasi dinonaktifkan untuk level Warga"
                          className="w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between text-slate-400 dark:text-slate-500 bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/80 cursor-not-allowed opacity-60 select-none"
                        >
                          <div className="flex items-center gap-2.5">
                            <Database className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                            <span className="line-through decoration-slate-400 text-xs font-medium">Status Database & Sinkronisasi</span>
                          </div>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            Nonaktif
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            handleSettingsClick();
                          }}
                          className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between text-slate-700 dark:text-slate-200 font-medium transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <Database className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                            <span>Status Database & Sinkronisasi</span>
                          </div>
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded font-mono font-bold">
                            {storageSize} KB
                          </span>
                        </button>
                      )}
                    </div>

                    {/* Auto-Logout Status Info */}
                    <div className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-[10px] mt-1">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>Auto-Logout Idle</span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-mono font-bold text-[9px] border border-emerald-300/60 dark:border-emerald-700">
                        5 Menit Aktif
                      </span>
                    </div>

                    {/* Logout button */}
                    <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 mt-1">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          if (onLogout) onLogout();
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center gap-2.5 font-bold transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>Keluar (Logout Akun)</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 3. Android Material 3 Floating Pill Search Bar for searchable tabs */}
        {isSearchableTab && (
          <div className="mt-2.5">
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-emerald-300 pointer-events-none flex items-center">
                <Search className="w-4 h-4" />
              </div>
              <input
                id="input-header-quick-search"
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                placeholder={getSearchPlaceholder()}
                className="w-full pl-10 pr-9 py-2 bg-emerald-950/70 hover:bg-emerald-950/90 focus:bg-emerald-950 border border-emerald-600/70 focus:border-amber-400 rounded-2xl text-xs text-white placeholder-emerald-300/70 focus:outline-none focus:ring-2 focus:ring-amber-400/50 shadow-inner transition-all"
              />
              {searchQuery && (
                <button
                  id="btn-header-clear-search"
                  onClick={() => handleSearchInput('')}
                  className="absolute right-3 p-1 rounded-full text-emerald-300 hover:text-white hover:bg-emerald-800/80 transition-colors"
                  title="Hapus Pencarian"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

