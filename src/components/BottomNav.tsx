import React from 'react';
import {
  LayoutDashboard,
  Users,
  Gift,
  Wallet,
  Grid,
  FileText,
  ShieldCheck,
  CreditCard,
  HeartHandshake,
  CalendarDays,
  MessageSquareWarning,
  Landmark,
  User
} from 'lucide-react';
import { NavTab, AppUser } from '../types';
import { getRolePermission } from '../services/auth';

interface BottomNavProps {
  currentTab?: NavTab | string;
  activeTab?: string;
  onTabChange?: (tab: NavTab) => void;
  onSelectTab?: (tab: string) => void;
  unreadPengaduanCount?: number;
  pendingPengaduanCount?: number;
  currentUser?: AppUser | null;
  onOpenLogin?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  activeTab,
  onTabChange,
  onSelectTab,
  unreadPengaduanCount = 0,
  pendingPengaduanCount,
  currentUser,
  onOpenLogin,
}) => {
  const selectedTab = currentTab || activeTab || 'dashboard';
  const badgeCount = unreadPengaduanCount || pendingPengaduanCount || 0;

  const handleTabClick = (tabId: NavTab) => {
    if (onTabChange) onTabChange(tabId);
    if (onSelectTab) onSelectTab(tabId);
  };

  const role = currentUser?.role || 'admin_rw';
  const rtNum = currentUser?.rtAccess && currentUser.rtAccess !== 'ALL' ? currentUser.rtAccess : '';

  // Khusus Peran Warga
  if (role === 'warga') {
    return (
      <nav className="sticky bottom-0 z-40 bg-white dark:bg-slate-900 border-t border-emerald-200/80 dark:border-slate-800 shadow-lg px-2 sm:px-4 py-1.5 select-none transition-colors duration-200">
        <div className="max-w-md mx-auto grid grid-cols-5 items-center gap-1 sm:gap-1.5">
          <button
            id="btn-nav-warga-surat"
            onClick={() => handleTabClick('surat')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-center transition-all cursor-pointer ${
              selectedTab === 'surat'
                ? 'bg-emerald-800 dark:bg-emerald-700 text-white font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium'
            }`}
          >
            <FileText className={`w-4 h-4 mb-0.5 ${selectedTab === 'surat' ? 'text-amber-300' : 'text-slate-500 dark:text-slate-400'}`} />
            <span className="text-[10px] leading-tight line-clamp-1">Surat Mandiri</span>
          </button>

          <button
            id="btn-nav-warga-pengaduan"
            onClick={() => handleTabClick('pengaduan')}
            className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-center transition-all cursor-pointer ${
              selectedTab === 'pengaduan'
                ? 'bg-emerald-800 dark:bg-emerald-700 text-white font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium'
            }`}
          >
            <div className="relative">
              <MessageSquareWarning className={`w-4 h-4 mb-0.5 ${selectedTab === 'pengaduan' ? 'text-rose-300' : 'text-rose-600 dark:text-rose-400'}`} />
              {badgeCount > 0 && (
                <span className="absolute -top-1 -right-2 min-w-3.5 h-3.5 px-1 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                  {badgeCount}
                </span>
              )}
            </div>
            <span className="text-[10px] leading-tight line-clamp-1">Lapor Aduan</span>
          </button>

          <button
            id="btn-nav-warga-keamanan"
            onClick={() => handleTabClick('keamanan')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-center transition-all cursor-pointer ${
              selectedTab === 'keamanan'
                ? 'bg-emerald-800 dark:bg-emerald-700 text-white font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium'
            }`}
          >
            <ShieldCheck className={`w-4 h-4 mb-0.5 ${selectedTab === 'keamanan' ? 'text-cyan-300' : 'text-slate-500 dark:text-slate-400'}`} />
            <span className="text-[10px] leading-tight line-clamp-1">Keamanan</span>
          </button>

          <button
            id="btn-nav-warga-kegiatan"
            onClick={() => handleTabClick('kegiatan')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-center transition-all cursor-pointer ${
              selectedTab === 'kegiatan'
                ? 'bg-emerald-800 dark:bg-emerald-700 text-white font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium'
            }`}
          >
            <CalendarDays className={`w-4 h-4 mb-0.5 ${selectedTab === 'kegiatan' ? 'text-indigo-300' : 'text-slate-500 dark:text-slate-400'}`} />
            <span className="text-[10px] leading-tight line-clamp-1">Agenda</span>
          </button>

          <button
            id="btn-nav-warga-menu"
            onClick={() => handleTabClick('menu')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-center transition-all cursor-pointer ${
              selectedTab === 'menu'
                ? 'bg-emerald-800 dark:bg-emerald-700 text-white font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium'
            }`}
          >
            <Grid className={`w-4 h-4 mb-0.5 ${selectedTab === 'menu' ? 'text-amber-300' : 'text-slate-500 dark:text-slate-400'}`} />
            <span className="text-[10px] leading-tight line-clamp-1">Menu & Akun</span>
          </button>
        </div>
      </nav>
    );
  }

  // Generate dynamic tabs based on active role
  let roleTabs: { id: NavTab; label: string; icon: any; badge?: number }[] = [];

  switch (role) {
    case 'ketua_rt':
      roleTabs = [
        { id: 'dashboard', label: 'Beranda', icon: LayoutDashboard },
        { id: 'warga', label: rtNum ? `Warga RT ${rtNum}` : 'Warga RT', icon: Users },
        { id: 'kk', label: rtNum ? `KK RT ${rtNum}` : 'KK RT', icon: CreditCard },
        { id: 'pbb', label: rtNum ? `PBB RT ${rtNum}` : 'PBB RT', icon: Landmark },
        { id: 'surat', label: 'Surat RT', icon: FileText },
        { id: 'menu', label: 'Lainnya', icon: Grid, badge: badgeCount > 0 ? badgeCount : undefined },
      ];
      break;

    case 'sekretaris':
      roleTabs = [
        { id: 'dashboard', label: 'Beranda', icon: LayoutDashboard },
        { id: 'warga', label: 'Warga & KK', icon: Users },
        { id: 'surat', label: 'Surat RW', icon: FileText },
        { id: 'kegiatan', label: 'Agenda & Notulen', icon: CalendarDays },
        { id: 'pengaduan', label: 'Aduan', icon: MessageSquareWarning, badge: badgeCount > 0 ? badgeCount : undefined },
        { id: 'menu', label: 'Lainnya', icon: Grid },
      ];
      break;

    case 'bendahara':
      roleTabs = [
        { id: 'dashboard', label: 'Beranda', icon: LayoutDashboard },
        { id: 'kas', label: 'Kas RW', icon: Wallet },
        { id: 'pbb', label: 'PBB & SHM', icon: Landmark },
        { id: 'bansos', label: 'Bansos', icon: Gift },
        { id: 'rkm', label: 'Iuran RKM', icon: HeartHandshake },
        { id: 'menu', label: 'Lainnya', icon: Grid },
      ];
      break;

    case 'keamanan':
      roleTabs = [
        { id: 'dashboard', label: 'Beranda', icon: LayoutDashboard },
        { id: 'keamanan', label: 'Keamanan & CCTV', icon: ShieldCheck },
        { id: 'pengaduan', label: 'Aduan Warga', icon: MessageSquareWarning, badge: badgeCount > 0 ? badgeCount : undefined },
        { id: 'kegiatan', label: 'Agenda Ronda', icon: CalendarDays },
        { id: 'menu', label: 'Lainnya', icon: Grid },
      ];
      break;

    case 'pengurus_rkm':
      roleTabs = [
        { id: 'dashboard', label: 'Beranda', icon: LayoutDashboard },
        { id: 'rkm', label: 'Layanan RKM', icon: HeartHandshake },
        { id: 'warga', label: 'Cari Warga', icon: Users },
        { id: 'kk', label: 'Data KK', icon: CreditCard },
        { id: 'menu', label: 'Lainnya', icon: Grid },
      ];
      break;

    case 'admin_rw':
    default:
      roleTabs = [
        { id: 'dashboard', label: 'Beranda', icon: LayoutDashboard },
        { id: 'warga', label: 'Warga & KK', icon: Users },
        { id: 'bansos', label: 'Bansos', icon: Gift },
        { id: 'kas', label: 'Kas & Iuran', icon: Wallet },
        { id: 'surat', label: 'Surat', icon: FileText },
        { id: 'menu', label: 'Lainnya', icon: Grid, badge: badgeCount > 0 ? badgeCount : undefined },
      ];
      break;
  }

  const gridColsClass = 
    roleTabs.length === 5 
      ? 'grid-cols-5' 
      : roleTabs.length === 4 
      ? 'grid-cols-4' 
      : 'grid-cols-6';

  return (
    <nav className="sticky bottom-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-lg px-2 py-1 select-none transition-colors duration-200">
      <div className={`max-w-md mx-auto grid ${gridColsClass} gap-1`}>
        {roleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            selectedTab === tab.id ||
            (tab.id === 'warga' && selectedTab === 'kk') ||
            (tab.id === 'menu' && !roleTabs.some((t) => t.id === selectedTab) && selectedTab !== 'dashboard');

          return (
            <button
              key={tab.id}
              id={`btn-bottomnav-${tab.id}`}
              onClick={() => handleTabClick(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'text-emerald-800 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/70 shadow-2xs border border-emerald-200/50 dark:border-emerald-800/50'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'}`} />
                {tab.badge && (
                  <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 animate-pulse">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-full leading-tight font-medium">
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 bg-emerald-700 dark:bg-emerald-400 rounded-full mt-0.5"></span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
