import React, { useEffect } from 'react';
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  LogOut,
  AlertTriangle,
  Lock,
  Activity
} from 'lucide-react';
import { AppUser } from '../types';
import { getUserPhotoUrl } from '../services/auth';

interface IdleTimeoutModalProps {
  isOpen: boolean;
  secondsRemaining: number;
  onStayLoggedIn: () => void;
  onLogoutNow: () => void;
  currentUser?: AppUser | null;
}

export const IdleTimeoutModal: React.FC<IdleTimeoutModalProps> = ({
  isOpen,
  secondsRemaining,
  onStayLoggedIn,
  onLogoutNow,
  currentUser,
}) => {
  if (!isOpen) return null;

  // Percentage for countdown progress (30 seconds max)
  const maxSeconds = 30;
  const progressPercent = Math.min(100, Math.max(0, (secondsRemaining / maxSeconds) * 100));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="idle-modal-title"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 border-2 border-amber-500/60 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative text-white">
        {/* Top ambient glow */}
        <div className="absolute -top-20 -left-20 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header Bar */}
        <div className="p-4 sm:p-5 pb-3 flex items-center gap-3 border-b border-slate-800 bg-slate-950/60 relative z-10">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 id="idle-modal-title" className="text-sm font-black tracking-tight text-white">
                Peringatan Keamanan Sesi Idle
              </h3>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-extrabold uppercase border border-amber-500/40 tracking-wider">
                5 Menit
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Perlindungan Otomatis Data Kependudukan Warga
            </p>
          </div>
        </div>

        {/* User Identity Card */}
        {currentUser && (
          <div className="px-5 pt-3.5 relative z-10">
            <div className="p-2.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full overflow-hidden border border-amber-400/60 bg-slate-950 shrink-0 shadow-md">
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
                <p className="text-xs font-bold text-slate-100 truncate">{currentUser.nama}</p>
                <p className="text-[10px] text-amber-300/90 font-medium truncate">
                  {currentUser.roleLabel} • @{currentUser.username}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="p-5 space-y-4 relative z-10 text-center">
          <p className="text-xs text-slate-300 leading-relaxed text-left">
            Aplikasi mendeteksi tidak ada aktivitas pengguna selama <strong>4,5 menit</strong>. Demi memastikan keamanan data pribadi warga saat perangkat ditinggalkan, sesi Anda akan ditutup otomatis.
          </p>

          {/* Big Countdown Timer Card */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span>Otomatis Keluar Dalam</span>
            </div>

            {/* Large Number */}
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black font-mono text-amber-400 drop-shadow-sm">
                {secondsRemaining}
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase">
                Detik
              </span>
            </div>

            {/* Countdown Progress Bar */}
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mt-1">
              <div
                className={`h-full transition-all duration-1000 ${
                  secondsRemaining <= 10
                    ? 'bg-gradient-to-r from-rose-500 to-red-600'
                    : 'bg-gradient-to-r from-amber-500 to-amber-400'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={onStayLoggedIn}
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:from-emerald-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 active:scale-98 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>Tetap Masuk (Lanjutkan Aktivitas)</span>
            </button>

            <button
              type="button"
              onClick={onLogoutNow}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-750 active:bg-slate-850 text-slate-300 hover:text-white font-semibold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-700/60"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Keluar Sekarang (Amankan Sesi)</span>
            </button>
          </div>
        </div>

        {/* Footer Security Notice */}
        <div className="p-3 bg-slate-950/90 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between px-5">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Keamanan Data Kependudukan RW 018</span>
          </span>
          <span className="text-slate-400 font-mono text-[9px]">IDLE-5MIN-ACTIVE</span>
        </div>
      </div>
    </div>
  );
};

export default IdleTimeoutModal;
