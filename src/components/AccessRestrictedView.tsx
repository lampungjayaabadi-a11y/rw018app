import React from 'react';
import {
  ShieldAlert,
  Lock,
  ArrowLeft,
  User,
  CheckCircle2,
  AlertTriangle,
  LogIn,
  Home,
  FileText,
  Wallet,
  Users,
  Grid
} from 'lucide-react';
import { AppUser, NavTab } from '../types';
import { getRolePermission } from '../services/auth';

interface AccessRestrictedViewProps {
  currentUser: AppUser | null;
  requestedTab: NavTab | string;
  onNavigateHome: () => void;
  onNavigateTab: (tab: NavTab) => void;
  onOpenLogin: () => void;
}

const TAB_LABELS: Record<string, string> = {
  dashboard: 'Beranda & Dashboard RW',
  warga: 'Data Kependudukan Warga',
  kk: 'Data Kartu Keluarga (KK)',
  kas: 'Keuangan & Buku Kas RW',
  pbb: 'Data PBB & Sertifikat SHM',
  bansos: 'Data Bantuan Sosial (Bansos)',
  surat: 'Administrasi Surat Pengantar',
  rkm: 'Rukun Kematian Masyarakat (RKM)',
  keamanan: 'Keamanan, CCTV & Pos Ronda',
  umkm: 'Direktori UMKM Warga',
  kegiatan: 'Agenda & Laporan Kegiatan',
  pengaduan: 'Pengaduan & Aspirasi Warga',
  menu: 'Semua Menu & Pengaturan',
};

export const AccessRestrictedView: React.FC<AccessRestrictedViewProps> = ({
  currentUser,
  requestedTab,
  onNavigateHome,
  onNavigateTab,
  onOpenLogin,
}) => {
  const perm = currentUser ? getRolePermission(currentUser.role) : null;
  const tabName = TAB_LABELS[requestedTab] || requestedTab.toUpperCase();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-rose-200 shadow-xl overflow-hidden text-center p-6 space-y-5">
        {/* Shield Icon Header */}
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
          <ShieldAlert className="w-8 h-8 animate-pulse" />
        </div>

        {/* Title & Warning */}
        <div>
          <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200 mb-2">
            Akses Fitur Dibatasi
          </span>
          <h2 className="text-lg font-black text-slate-800">
            Hak Akses Tidak Sesuai
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Anda tidak memiliki wewenang untuk membuka modul <strong className="text-slate-800">"{tabName}"</strong>.
          </p>
        </div>

        {/* Current User Role Identity Card */}
        {currentUser && (
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Akun Pengguna:</span>
              <span className="font-bold text-slate-800">{currentUser.nama}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Peran / Tugas:</span>
              <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${perm?.badgeBg || 'bg-slate-700 text-white'}`}>
                {currentUser.roleLabel}
              </span>
            </div>
            {currentUser.rtAccess && currentUser.rtAccess !== 'ALL' && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Wilayah RT:</span>
                <span className="font-bold text-purple-700">RT {currentUser.rtAccess}</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-200/80">
              <span className="text-[11px] text-slate-600 leading-relaxed block">
                {perm?.description || 'Fitur dibatasi sesuai tugas dan fungsi yang telah ditetapkan.'}
              </span>
            </div>
          </div>
        )}

        {/* Permitted Menus Shortcut */}
        {perm && perm.allowedTabs && perm.allowedTabs.length > 0 && (
          <div className="space-y-2 text-left">
            <span className="text-[11px] font-bold text-slate-600 block uppercase tracking-wider">
              Fitur Yang Dapat Anda Buka:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {perm.allowedTabs.slice(0, 5).map((t) => (
                <button
                  key={t}
                  onClick={() => onNavigateTab(t)}
                  className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl text-[11px] border border-emerald-200 transition-colors flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>{TAB_LABELS[t] || t}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Navigation Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row gap-2">
          <button
            onClick={onNavigateHome}
            className="flex-1 py-2.5 px-4 bg-emerald-800 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Kembali ke Beranda Saya</span>
          </button>

          <button
            onClick={onOpenLogin}
            className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-slate-200 transition-all cursor-pointer"
          >
            <LogIn className="w-4 h-4 text-slate-600" />
            <span>Ganti Akun Pengguna</span>
          </button>
        </div>
      </div>
    </div>
  );
};
