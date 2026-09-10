import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Crown,
  Lock,
  RotateCcw,
  Save,
  Search,
  Users,
  CreditCard,
  FileText,
  Wallet,
  Landmark,
  Gift,
  HeartHandshake,
  Compass,
  ShoppingBag,
  CalendarDays,
  MessageSquareWarning,
  LayoutDashboard,
  FileEdit,
  Home,
  User,
  X,
  Info,
  Check,
  AlertTriangle,
  Table as TableIcon,
  Sliders,
  SlidersHorizontal,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { AppUser, RolePermission, UserRole, NavTab } from '../types';
import {
  getAllRolePermissions,
  saveRolePermissions,
  resetRolePermissionsToDefault,
  isUserSuperAdmin
} from '../services/auth';
import { useToast } from '../context/ToastContext';
import {
  HAK_AKSES_ROLES,
  HAK_AKSES_CHECKLIST,
  getStatusBadge,
  AccessStatus,
  HakAksesItem
} from '../data/hakAksesMatrix';

interface HakAksesUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser | null;
  onOpenUserManagement?: () => void;
}

// All menu cards available in the application for granular toggle configuration
interface MenuCardDefinition {
  id: NavTab;
  label: string;
  shortDesc: string;
  category: 'Eksekutif' | 'Kependudukan' | 'Keuangan & Sosial' | 'Keamanan & Layanan';
  icon: any;
  colorClass: string;
}

const ALL_MENU_CARDS: MenuCardDefinition[] = [
  {
    id: 'dashboard',
    label: 'Dashboard Ringkasan',
    shortDesc: 'Ringkasan data, statistik kependudukan, grafik kas, rekap PBB & CCTV',
    category: 'Eksekutif',
    icon: LayoutDashboard,
    colorClass: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800',
  },
  {
    id: 'warga',
    label: 'Data Induk Warga',
    shortDesc: 'Master data penduduk seluruh RT, NIK 16 digit, filter wilayah & status keluarga',
    category: 'Kependudukan',
    icon: Users,
    colorClass: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800',
  },
  {
    id: 'kk',
    label: 'Data Kartu Keluarga (KK)',
    shortDesc: 'Arsip Nomor KK, kepala keluarga, anggota keluarga & klasifikasi ekonomi',
    category: 'Kependudukan',
    icon: CreditCard,
    colorClass: 'text-blue-600 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800',
  },
  {
    id: 'surat',
    label: 'Administrasi Surat Pengantar',
    shortDesc: 'Pembuatan & verifikasi surat pengantar resmi: SKCK, KTP, Domisili, SKTM, SKU',
    category: 'Kependudukan',
    icon: FileText,
    colorClass: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800',
  },
  {
    id: 'kas',
    label: 'Data Kas & Iuran RW',
    shortDesc: 'Buku kas keuangan RW, mutasi masuk/keluar, penerimaan iuran bulanan RT 039-042',
    category: 'Keuangan & Sosial',
    icon: Wallet,
    colorClass: 'text-teal-600 bg-teal-50 dark:bg-teal-950/50 border-teal-200 dark:border-teal-800',
  },
  {
    id: 'pbb',
    label: 'Data PBB & Pemilik SHM',
    shortDesc: 'Pajak Bumi & Bangunan, kepemilikan SHM warga, NOP, tagihan & status lunas',
    category: 'Keuangan & Sosial',
    icon: Landmark,
    colorClass: 'text-violet-600 bg-violet-50 dark:bg-violet-950/50 border-violet-200 dark:border-violet-800',
  },
  {
    id: 'bansos',
    label: 'Data Bansos (Bantuan Sosial)',
    shortDesc: 'Penyaluran beras CBP, PKH, BPNT, BLT & data santunan warga prasejahtera',
    category: 'Keuangan & Sosial',
    icon: Gift,
    colorClass: 'text-rose-600 bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800',
  },
  {
    id: 'rkm',
    label: 'Pengurus DKM & RKM (Kematian)',
    shortDesc: 'Iuran kematian warga, santunan duka cita, inventaris jenazah & kegiatan keagamaan DKM',
    category: 'Keuangan & Sosial',
    icon: HeartHandshake,
    colorClass: 'text-red-600 bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800',
  },
  {
    id: 'peta',
    label: 'Peta Wilayah & Denah RW 018',
    shortDesc: 'Denah interaktif batas RT 039-042, 16 titik CCTV, pos ronda, fasum & Maps',
    category: 'Keamanan & Layanan',
    icon: Compass,
    colorClass: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/50 border-cyan-200 dark:border-cyan-800',
  },
  {
    id: 'keamanan',
    label: 'Ronda Malam & Keamanan Lingkungan',
    shortDesc: 'Jadwal siskamling 23:00-04:00, absensi kehadiran regu ronda & log keamanan CCTV',
    category: 'Keamanan & Layanan',
    icon: ShieldCheck,
    colorClass: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800',
  },
  {
    id: 'umkm',
    label: 'Data UMKM Warga',
    shortDesc: 'Direktori kuliner, toko sembako, kerajinan, bengkel & etalase usaha warga RW 018',
    category: 'Keuangan & Sosial',
    icon: ShoppingBag,
    colorClass: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800',
  },
  {
    id: 'kegiatan',
    label: 'Data Kegiatan RW',
    shortDesc: 'Agenda gotong royong, posyandu, musyawarah warga, peringatan hari besar & notulen',
    category: 'Keamanan & Layanan',
    icon: CalendarDays,
    colorClass: 'text-teal-600 bg-teal-50 dark:bg-teal-950/50 border-teal-200 dark:border-teal-800',
  },
  {
    id: 'pengaduan',
    label: 'Pengaduan & Aspirasi Warga',
    shortDesc: 'Keluhan got, jalan rusak, sampah, lampu jalan & pemantauan status tindak lanjut',
    category: 'Keamanan & Layanan',
    icon: MessageSquareWarning,
    colorClass: 'text-orange-600 bg-orange-50 dark:bg-orange-950/50 border-orange-200 dark:border-orange-800',
  },
];

export const HakAksesUserModal: React.FC<HakAksesUserModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenUserManagement
}) => {
  const { showSuccess, showError, showInfo } = useToast();
  const [activeTabMode, setActiveTabMode] = useState<'matrix' | 'config'>('matrix');
  const [permissionsState, setPermissionsState] = useState<Record<string, RolePermission>>({});
  const [selectedRole, setSelectedRole] = useState<UserRole>('super_admin');
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('Semua');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Authority check: Only Super Admin (SA) can adjust
  const isSA = isUserSuperAdmin(currentUser);

  // Load permissions
  const reloadPermissions = () => {
    const all = getAllRolePermissions();
    setPermissionsState(all);
    setHasChanges(false);
  };

  React.useEffect(() => {
    if (isOpen) {
      reloadPermissions();
    }
  }, [isOpen]);

  // Categories for checklist matrix
  const categories = ['Semua', 'Utama', 'Kependudukan', 'Persuratan', 'Keuangan', 'Keamanan', 'RKM (Kematian)', 'Sistem & User'];

  // Filter checklist items
  const filteredChecklist = useMemo(() => {
    return HAK_AKSES_CHECKLIST.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        item.desc.toLowerCase().includes(searchFilter.toLowerCase()) ||
        item.category.toLowerCase().includes(searchFilter.toLowerCase());
      const matchCategory = categoryFilter === 'Semua' || item.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [searchFilter, categoryFilter]);

  if (!isOpen) return null;

  // Selected role config for Tab 2
  const currentRoleConfig = HAK_AKSES_ROLES.find((r) => r.role === selectedRole) || HAK_AKSES_ROLES[0];
  const currentRolePerm = permissionsState[selectedRole] || {
    role: selectedRole,
    roleLabel: currentRoleConfig.name,
    roleColor: 'text-slate-800',
    badgeBg: currentRoleConfig.badgeColor,
    iconName: 'Shield',
    description: currentRoleConfig.desc,
    allowedTabs: ['dashboard', 'warga', 'kk', 'peta', 'menu'],
    canEditWarga: false,
    canDeleteWarga: false,
    canManageKas: false,
    canManageSurat: false,
    canManageBansos: false,
    canManageRkm: false,
    canManageKeamanan: false,
    canManageSettings: false,
    scopeRtOnly: selectedRole === 'ketua_rt',
  };

  // Toggle tab in config mode
  const handleToggleTab = (tabId: NavTab) => {
    if (!isSA) {
      showError('Hanya Super Admin (SA) yang berwenang mengubah hak akses.', 'Akses Ditolak');
      return;
    }
    if (selectedRole === 'super_admin' || selectedRole === 'admin_rw') {
      showInfo('Role Super Admin (SA) memiliki hak akses penuh permanen ke seluruh menu.', 'Hak Penuh Terkunci');
      return;
    }
    if (tabId === 'dashboard' || tabId === 'menu') {
      showInfo('Tab Dashboard dan Menu wajib terbuka untuk navigasi aplikasi.', 'Wajib Terbuka');
      return;
    }

    const currentTabs = currentRolePerm.allowedTabs || [];
    const exists = currentTabs.includes(tabId);
    const updatedTabs = exists ? currentTabs.filter((t) => t !== tabId) : [...currentTabs, tabId];

    setPermissionsState((prev) => ({
      ...prev,
      [selectedRole]: {
        ...currentRolePerm,
        allowedTabs: updatedTabs,
      },
    }));
    setHasChanges(true);
  };

  // Toggle boolean capability
  const handleToggleCapability = (field: keyof RolePermission) => {
    if (!isSA) {
      showError('Hanya Super Admin (SA) yang berwenang mengubah hak akses.', 'Akses Ditolak');
      return;
    }
    if (selectedRole === 'super_admin' || selectedRole === 'admin_rw') {
      showInfo('Role Super Admin (SA) memiliki wewenang penuh permanen untuk semua fitur.', 'Wewenang Penuh SA');
      return;
    }

    setPermissionsState((prev) => ({
      ...prev,
      [selectedRole]: {
        ...currentRolePerm,
        [field]: !currentRolePerm[field],
      },
    }));
    setHasChanges(true);
  };

  // Save changes
  const handleSave = () => {
    if (!isSA) {
      showError('Hanya Super Admin (SA) yang dapat menyimpan pengaturan hak akses.', 'Akses Ditolak');
      return;
    }
    setIsSaving(true);
    try {
      saveRolePermissions(permissionsState);
      setHasChanges(false);
      showSuccess(
        'Pengaturan Hak Akses Level User berhasil disimpan dan disinkronkan ke sistem.',
        'Hak Akses Diperbarui'
      );
    } catch (err) {
      showError('Gagal menyimpan perubahan hak akses: ' + String(err), 'Kesalahan');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to default
  const handleReset = () => {
    if (!isSA) {
      showError('Hanya Super Admin (SA) yang dapat mereset hak akses.', 'Akses Ditolak');
      return;
    }
    if (window.confirm('Kembalikan seluruh hak akses level user ke standar checklist resmi RW 018?')) {
      resetRolePermissionsToDefault();
      reloadPermissions();
      showSuccess('Seluruh hak akses berhasil dikembalikan ke standar matriks checklist resmi RW 018.', 'Reset Berhasil');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl max-h-[92vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header Modal */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 text-white border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-inner shrink-0">
              <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                  <span>Pengaturan Hak Akses Level User</span>
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 flex items-center gap-1 shadow-sm">
                  <Crown className="w-3 h-3" />
                  Khusus Super Admin (SA)
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">
                Matriks Checklist Otorisasi 8 Level Pengguna & Pembatasan Fitur RW 018 Iringmulyo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white transition-all border border-slate-700 cursor-pointer"
              title="Tutup Modal"
              aria-label="Tutup Modal Hak Akses"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Bar / Authority Warning */}
        <div className={`px-4 sm:px-5 py-2.5 flex items-center justify-between gap-3 text-xs border-b ${
          isSA
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200'
            : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {isSA ? (
              <>
                <Crown className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="font-bold">
                  Login: <span className="underline font-black">{currentUser?.nama || 'Super Admin'}</span> ({currentUser?.roleLabel})
                </span>
                <span className="hidden md:inline text-[11px] opacity-80">
                  — Anda memiliki wewenang penuh untuk mengatur matriks dan switch hak akses pengguna.
                </span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span className="font-bold">
                  Mode Terkunci (Lihat Saja): Hanya akun Super Admin (SA) yang berwenang membuka dan mengatur menu ini.
                </span>
              </>
            )}
          </div>

          {onOpenUserManagement && (
            <button
              onClick={() => {
                onClose();
                onOpenUserManagement();
              }}
              className="hidden sm:flex items-center gap-1 font-bold text-xs hover:underline text-emerald-700 dark:text-emerald-300 shrink-0 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Kelola Akun Pengguna</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Primary View Mode Tabs */}
        <div className="px-4 sm:px-5 pt-3 pb-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between gap-2 flex-wrap shrink-0">
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 dark:bg-slate-800/80 rounded-2xl">
            <button
              onClick={() => setActiveTabMode('matrix')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTabMode === 'matrix'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>1. Tabel Checklist Hak Akses (8 Level & 24 Fitur)</span>
            </button>
            <button
              onClick={() => setActiveTabMode('config')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTabMode === 'config'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>2. Pengaturan Per Level User (Interaktif)</span>
              {hasChanges && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden md:block">
            {activeTabMode === 'matrix'
              ? 'Format resmi matriks wewenang operasional RW 018'
              : 'Konfigurasi kartu menu dan batas fungsional per level'}
          </div>
        </div>

        {/* Tab Content Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* TAB 1: TABEL CHECKLIST HAK AKSES */}
          {activeTabMode === 'matrix' && (
            <div className="space-y-4">
              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari fitur atau menu..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  />
                  {searchFilter && (
                    <button
                      onClick={() => setSearchFilter('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        categoryFilter === cat
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* 1. DAFTAR LEVEL USER (8 LEVEL) */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                <div className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>1. Daftar 8 Level Pengguna Resmi</span>
                  </h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Struktur Wewenang RW 018
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 divide-y sm:divide-y-0 divide-x divide-slate-100 dark:divide-slate-800">
                  {HAK_AKSES_ROLES.map((r) => (
                    <div
                      key={r.role}
                      onClick={() => {
                        setSelectedRole(r.role);
                        setActiveTabMode('config');
                      }}
                      className="p-2.5 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors cursor-pointer group flex flex-col justify-between"
                      title={`Klik untuk mengatur level ${r.name}`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[10px] font-mono font-black text-slate-400">
                            #{r.number}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {r.code}
                          </span>
                        </div>
                        <div className="font-black text-xs text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors truncate">
                          {r.name}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 truncate mt-0.5">
                          {r.role}
                        </div>
                      </div>
                      <div className="mt-2">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] ${r.badgeColor}`}>
                          {r.code === 'SA' ? '👑 SA' : r.alias}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. TABEL CHECKLIST HAK AKSES */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                <div className="px-4 py-3 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <TableIcon className="w-4 h-4 text-emerald-600" />
                      <span>2. Tabel Checklist Hak Akses (Matriks Lengkap)</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Menampilkan {filteredChecklist.length} dari 24 fitur operasional RW 018
                    </p>
                  </div>

                  <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                    <span>Geser tabel ke kanan untuk melihat semua kolom level</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-200/90 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[11px] font-black uppercase tracking-wider border-b border-slate-300 dark:border-slate-700">
                        <th className="py-2.5 px-3 w-10 text-center">No</th>
                        <th className="py-2.5 px-3 min-w-[180px]">Menu / Fitur</th>
                        <th className="py-2.5 px-2.5 text-center min-w-[70px] bg-amber-100/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-x border-amber-300 dark:border-amber-800/60">
                          SA
                        </th>
                        <th className="py-2.5 px-2.5 text-center min-w-[70px]">RW</th>
                        <th className="py-2.5 px-2.5 text-center min-w-[70px]">SEK</th>
                        <th className="py-2.5 px-2.5 text-center min-w-[70px]">BEN</th>
                        <th className="py-2.5 px-2.5 text-center min-w-[70px]">RT</th>
                        <th className="py-2.5 px-2.5 text-center min-w-[70px]">KAM</th>
                        <th className="py-2.5 px-2.5 text-center min-w-[75px]">RKM</th>
                        <th className="py-2.5 px-2.5 text-center min-w-[80px]">WARGA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {filteredChecklist.map((item, idx) => {
                        const saBadge = getStatusBadge(item.access.super_admin);
                        const rwBadge = getStatusBadge(item.access.ketua_rw);
                        const sekBadge = getStatusBadge(item.access.sekretaris);
                        const benBadge = getStatusBadge(item.access.bendahara);
                        const rtBadge = getStatusBadge(item.access.ketua_rt);
                        const kamBadge = getStatusBadge(item.access.keamanan);
                        const rkmBadge = getStatusBadge(item.access.rkm);
                        const wargaBadge = getStatusBadge(item.access.warga);

                        return (
                          <tr
                            key={item.id}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                          >
                            <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                              {idx + 1}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span>{item.name}</span>
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                                {item.desc}
                              </div>
                            </td>

                            {/* SA Column */}
                            <td className="py-2.5 px-2 text-center bg-amber-50/40 dark:bg-amber-950/20 border-x border-amber-200 dark:border-amber-900/40">
                              <span
                                className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[11px] font-black border ${saBadge.bgClass} ${saBadge.colorClass} ${saBadge.borderClass}`}
                                title={`${item.name} untuk SA: ${saBadge.label}`}
                              >
                                {saBadge.symbol}
                              </span>
                            </td>

                            {/* RW Column */}
                            <td className="py-2.5 px-2 text-center">
                              <span
                                className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[11px] font-bold border ${rwBadge.bgClass} ${rwBadge.colorClass} ${rwBadge.borderClass}`}
                                title={`${item.name} untuk RW: ${rwBadge.label}`}
                              >
                                {rwBadge.symbol}
                              </span>
                            </td>

                            {/* SEK Column */}
                            <td className="py-2.5 px-2 text-center">
                              <span
                                className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[11px] font-bold border ${sekBadge.bgClass} ${sekBadge.colorClass} ${sekBadge.borderClass}`}
                                title={`${item.name} untuk SEK: ${sekBadge.label}`}
                              >
                                {sekBadge.symbol}
                              </span>
                            </td>

                            {/* BEN Column */}
                            <td className="py-2.5 px-2 text-center">
                              <span
                                className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[11px] font-bold border ${benBadge.bgClass} ${benBadge.colorClass} ${benBadge.borderClass}`}
                                title={`${item.name} untuk BEN: ${benBadge.label}`}
                              >
                                {benBadge.symbol}
                              </span>
                            </td>

                            {/* RT Column */}
                            <td className="py-2.5 px-2 text-center">
                              <span
                                className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[11px] font-bold border ${rtBadge.bgClass} ${rtBadge.colorClass} ${rtBadge.borderClass}`}
                                title={`${item.name} untuk RT: ${rtBadge.label}`}
                              >
                                {rtBadge.symbol}
                              </span>
                            </td>

                            {/* KAM Column */}
                            <td className="py-2.5 px-2 text-center">
                              <span
                                className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[11px] font-bold border ${kamBadge.bgClass} ${kamBadge.colorClass} ${kamBadge.borderClass}`}
                                title={`${item.name} untuk KAM: ${kamBadge.label}`}
                              >
                                {kamBadge.symbol}
                              </span>
                            </td>

                            {/* RKM Column */}
                            <td className="py-2.5 px-2 text-center">
                              <span
                                className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[11px] font-bold border ${rkmBadge.bgClass} ${rkmBadge.colorClass} ${rkmBadge.borderClass}`}
                                title={`${item.name} untuk RKM: ${rkmBadge.label}`}
                              >
                                {rkmBadge.symbol}
                              </span>
                            </td>

                            {/* WARGA Column */}
                            <td className="py-2.5 px-2 text-center">
                              <span
                                className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[11px] font-bold border ${wargaBadge.bgClass} ${wargaBadge.colorClass} ${wargaBadge.borderClass}`}
                                title={`${item.name} untuk WARGA: ${wargaBadge.label}`}
                              >
                                {wargaBadge.symbol}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* KETERANGAN & CATATAN MATRIKS */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-emerald-600" />
                  <span>Keterangan Simbol & Catatan Hak Akses</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-base">✅</span>
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">Akses Penuh</div>
                      <div className="text-[10px] text-slate-500">Lihat, input, ubah, kelola</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-base">👁️</span>
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">Lihat Saja</div>
                      <div className="text-[10px] text-slate-500">Hanya membaca (read-only)</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-base">✏️</span>
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">Input / Edit Terbatas</div>
                      <div className="text-[10px] text-slate-500">Sesuai wewenang tugas</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-base">❌</span>
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">Tidak Ada Akses</div>
                      <div className="text-[10px] text-slate-500">Menu/fitur disembunyikan</div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl text-xs space-y-1 text-amber-900 dark:text-amber-200">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Catatan Khusus Wilayah & Mandiri:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-700 dark:text-slate-300 pl-1">
                    <li>
                      <span className="font-bold">RT:</span> Hanya dapat melihat atau mengelola data warga di lingkungan RT setempat (RT 039 s.d. RT 042).
                    </li>
                    <li>
                      <span className="font-bold">Sendiri:</span> Hanya dapat melihat data milik akun pribadi (data profil / KK sendiri).
                    </li>
                    <li>
                      <span className="font-bold">Sendiri*:</span> Warga dapat mengajukan perubahan data, tetapi perubahan penting menunggu verifikasi ketua RT/RW.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PENGATURAN PER LEVEL USER (INTERAKTIF) */}
          {activeTabMode === 'config' && (
            <div className="space-y-4">
              {/* Role Level Tabs Selector */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                {HAK_AKSES_ROLES.map((r) => {
                  const isSelected = selectedRole === r.role;
                  return (
                    <button
                      key={r.role}
                      onClick={() => setSelectedRole(r.role)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all border cursor-pointer ${
                        isSelected
                          ? `${r.badgeColor} shadow-md scale-102 ring-2 ring-emerald-500`
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-full bg-black/20 flex items-center justify-center text-[10px] font-mono font-black">
                        {r.number}
                      </span>
                      <span>{r.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Active Role Card Header */}
              <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl text-white border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 font-black text-lg">
                    {currentRoleConfig.number}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-white">{currentRoleConfig.name}</h3>
                      <span className={`px-2 py-0.5 rounded text-[10px] ${currentRoleConfig.badgeColor}`}>
                        {currentRoleConfig.code}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">{currentRoleConfig.desc}</p>
                  </div>
                </div>

                {selectedRole === 'super_admin' || selectedRole === 'admin_rw' ? (
                  <div className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-200 text-xs font-bold flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span>Akses Penuh Seluruh Fitur (Permanen SA)</span>
                  </div>
                ) : (
                  <div className="text-xs text-slate-300 font-medium">
                    Status: <span className="text-emerald-400 font-bold">{isSA ? 'Dapat Diedit oleh SA' : 'Read-Only'}</span>
                  </div>
                )}
              </div>

              {/* Functional Permission Switches */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-emerald-600" />
                  <span>Wewenang Operasional & Modifikasi Data</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Can Edit Warga */}
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Edit Data Warga</div>
                      <div className="text-[10px] text-slate-500">Ubah biodata & NIK warga</div>
                    </div>
                    <button
                      disabled={!isSA || selectedRole === 'super_admin' || selectedRole === 'admin_rw'}
                      onClick={() => handleToggleCapability('canEditWarga')}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                        currentRolePerm.canEditWarga ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                      } ${!isSA ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          currentRolePerm.canEditWarga ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Can Delete Warga */}
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Hapus Data Warga</div>
                      <div className="text-[10px] text-slate-500">Hapus penduduk permanen</div>
                    </div>
                    <button
                      disabled={!isSA || selectedRole === 'super_admin' || selectedRole === 'admin_rw'}
                      onClick={() => handleToggleCapability('canDeleteWarga')}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                        currentRolePerm.canDeleteWarga ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                      } ${!isSA ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          currentRolePerm.canDeleteWarga ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Can Manage Kas */}
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Kelola Kas & Iuran</div>
                      <div className="text-[10px] text-slate-500">Input pemasukan & keluar</div>
                    </div>
                    <button
                      disabled={!isSA || selectedRole === 'super_admin' || selectedRole === 'admin_rw'}
                      onClick={() => handleToggleCapability('canManageKas')}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                        currentRolePerm.canManageKas ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                      } ${!isSA ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          currentRolePerm.canManageKas ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Can Manage Surat */}
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Kelola Persuratan</div>
                      <div className="text-[10px] text-slate-500">Penerbitan surat pengantar</div>
                    </div>
                    <button
                      disabled={!isSA || selectedRole === 'super_admin' || selectedRole === 'admin_rw'}
                      onClick={() => handleToggleCapability('canManageSurat')}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                        currentRolePerm.canManageSurat ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                      } ${!isSA ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          currentRolePerm.canManageSurat ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Cards Access Toggle List */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <TableIcon className="w-4 h-4 text-emerald-600" />
                    <span>Visibilitas Kartu Menu Utama ({currentRolePerm.allowedTabs?.length || 0} Terbuka)</span>
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Klik kartu untuk membuka / menutup akses menu
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {ALL_MENU_CARDS.map((card) => {
                    const isAllowed = (currentRolePerm.allowedTabs || []).includes(card.id);
                    const isLocked =
                      card.id === 'dashboard' ||
                      card.id === 'menu' ||
                      selectedRole === 'super_admin' ||
                      selectedRole === 'admin_rw';

                    return (
                      <div
                        key={card.id}
                        onClick={() => !isLocked && handleToggleTab(card.id)}
                        className={`p-3 rounded-2xl border transition-all flex items-start justify-between gap-2.5 ${
                          isAllowed
                            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/80 shadow-2xs'
                            : 'bg-slate-50/50 dark:bg-slate-850/40 border-slate-200 dark:border-slate-800 opacity-60'
                        } ${!isLocked && isSA ? 'cursor-pointer hover:border-emerald-500' : 'cursor-default'}`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className={`p-2 rounded-xl border shrink-0 ${card.colorClass}`}>
                            <card.icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                              {card.label}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                              {card.shortDesc}
                            </div>
                          </div>
                        </div>

                        <div>
                          {isAllowed ? (
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 text-white shadow-xs">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </span>
                          ) : (
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500">
                              <X className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 flex-wrap">
          <div className="flex items-center gap-2">
            {isSA && (
              <button
                type="button"
                onClick={handleReset}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
                title="Kembalikan ke standar resmi RW 018"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Reset Standar Resmi</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all cursor-pointer"
            >
              Tutup
            </button>

            {isSA && (
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Menyimpan...' : 'Simpan Hak Akses'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
