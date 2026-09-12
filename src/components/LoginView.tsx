import React, { useState, useRef } from 'react';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  X,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Fingerprint,
  ScanFace,
  Sparkles,
  CreditCard,
  UserCheck
} from 'lucide-react';
import { AppUser, RWProfile } from '../types';
import { getUsersList, loginUser, getRolePermission, getUserPhotoUrl } from '../services/auth';
import { safeStorage } from '../utils/safeStorage';
import { LOGO_RW_018, handleLogoError } from '../constants/logo';
import { BiometricAuthModal } from './BiometricAuthModal';

interface LoginViewProps {
  profile: RWProfile;
  onLoginSuccess: (user: AppUser) => void;
  isModal?: boolean;
  onClose?: () => void;
  currentUser?: AppUser | null;
  autoLogoutMessage?: string | null;
}

export const LoginView: React.FC<LoginViewProps> = ({
  profile,
  onLoginSuccess,
  isModal = false,
  onClose,
  currentUser,
  autoLogoutMessage,
}) => {
  const allUsers = getUsersList().filter((u) => u.role !== 'warga');
  
  const initialSelectedUser = allUsers.find(
    (u) => u.username.toLowerCase() === (currentUser?.username || 'ketuarw').toLowerCase()
  ) || allUsers[0];

  const [selectedUsername, setSelectedUsername] = useState<string>(
    currentUser?.username || (allUsers.length > 0 ? allUsers[0].username : 'ketuarw')
  );
  
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isBiometricOpen, setIsBiometricOpen] = useState(false);
  const [biometricMode, setBiometricMode] = useState<'fingerprint' | 'face'>('fingerprint');

  const passwordInputRef = useRef<HTMLInputElement | null>(null);

  const [autoLogoutNotice, setAutoLogoutNotice] = useState<string | null>(() => {
    if (autoLogoutMessage) return autoLogoutMessage;
    try {
      const reason = safeStorage.getItem('rw018_auto_logout_reason');
      if (reason === 'idle_5_minutes') {
        safeStorage.removeItem('rw018_auto_logout_reason');
        return 'Sesi Anda telah dikeluarkan secara otomatis karena tidak ada aktivitas selama 5 menit. Fitur keamanan ini aktif untuk melindungi kerahasiaan data kependudukan & kas warga RW 018 saat perangkat ditinggalkan tanpa pengawasan.';
      }
    } catch {}
    return null;
  });

  const selectedUserObj = allUsers.find(
    (u) => u.username.toLowerCase() === selectedUsername.toLowerCase()
  ) || allUsers[0];
  const selectedRolePerm = selectedUserObj ? getRolePermission(selectedUserObj.role) : null;
  const isWargaRole = false; // Resident/NIK login requires secure Firebase enrollment and is intentionally disabled in this build.

  const handleUserSelectChange = (newUsername: string) => {
    setSelectedUsername(newUsername);
    setErrorMessage('');
    setPassword('');
  };

  const handleOpenBiometric = (mode: 'fingerprint' | 'face' = 'fingerprint') => {
    setBiometricMode(mode);
    setIsBiometricOpen(true);
  };

  const handleFormLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedUsername.trim()) {
      setErrorMessage('Silakan pilih akun pengguna terlebih dahulu.');
      return;
    }

    const result = await loginUser(selectedUsername, password);
    if (result.success && result.user) {
      onLoginSuccess(result.user);
    } else {
      setErrorMessage(result.message || (isWargaRole ? 'Anda Bukan warga RW 018' : 'Login gagal. Periksa kata sandi Anda.'));
    }
  };

  const content = (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Header Logo & Title */}
      <div className="text-center space-y-3">
        <div className="inline-flex relative">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-slate-950 border-3 border-amber-400 shadow-xl mx-auto flex items-center justify-center ring-4 ring-amber-400/20">
            <img
              src={profile.logoUrl || LOGO_RW_018}
              alt="Logo RW 018"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={handleLogoError}
            />
          </div>
          <span className="absolute -bottom-1 right-0 px-2 py-0.5 rounded-md bg-amber-400 text-emerald-950 text-[10px] font-black uppercase tracking-wider shadow-sm">
            LOGIN
          </span>
        </div>

        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            Sistem Informasi {profile.namaRw || 'RW 018'}
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            {profile.kelurahan}, {profile.kecamatan}, {profile.kotaKab}
          </p>
        </div>

        {currentUser && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Aktif: <strong>{currentUser.nama}</strong> ({currentUser.roleLabel})</span>
          </div>
        )}
      </div>

      {/* Auto-Logout Idle Warning Notification Banner */}
      {(autoLogoutNotice || autoLogoutMessage) && (
        <div className="p-4 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-rose-500/10 border-2 border-amber-400 dark:border-amber-500 rounded-3xl shadow-md text-left space-y-2 animate-in fade-in duration-300">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-black text-xs sm:text-sm">
              <div className="w-7 h-7 rounded-xl bg-amber-400 text-emerald-950 flex items-center justify-center shrink-0 shadow-xs">
                <ShieldAlert className="w-4 h-4 animate-bounce" />
              </div>
              <span>Sesi Ditutup Otomatis (5 Menit Idle)</span>
            </div>
            <button
              type="button"
              onClick={() => setAutoLogoutNotice(null)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-black/5"
              title="Tutup pemberitahuan"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            {autoLogoutNotice || autoLogoutMessage}
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-amber-800 dark:text-amber-400 font-mono font-semibold pt-1 border-t border-amber-200 dark:border-amber-900/60">
            <Clock className="w-3 h-3" />
            <span>Standar Keamanan Data Warga: ISO/IEC 27001 Auto-Lock</span>
          </div>
        </div>
      )}

      {/* Form Login */}
      <form onSubmit={handleFormLogin} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-lg space-y-4">
        {errorMessage && (
          <div className="p-3 bg-rose-50 border-2 border-rose-300 text-rose-900 text-xs rounded-xl flex items-center gap-2.5 font-bold animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        {/* Pilihan Mode Login: Pengurus vs Warga */}
        <div className="flex rounded-2xl bg-slate-100 p-1 border border-slate-200 shadow-2xs">
          <button
            type="button"
            onClick={() => {
              const pengurus = allUsers.find((u) => u.role !== 'warga');
              if (pengurus) handleUserSelectChange(pengurus.username);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              !isWargaRole
                ? 'bg-white text-emerald-950 shadow-xs border border-slate-200 font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Pengurus RW / RT</span>
          </button>

        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-900">
          Login warga berbasis NIK dinonaktifkan pada build aman ini. Akun warga harus dibuat melalui enrollment Firebase Authentication agar NIK tidak dipakai sebagai password.
        </div>

        {/* 1. User Selection & Profile Card */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1.5">
            {isWargaRole ? 'Level Login' : 'Nama Pengguna (User Name)'}
          </label>

          {/* Selected User Profile Card with Photo */}
          {selectedUserObj && (
            <div className="mb-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3 shadow-2xs">
              <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-emerald-600 bg-slate-900 shrink-0 shadow-xs">
                <img
                  src={getUserPhotoUrl(selectedUserObj, selectedUserObj.nama)}
                  alt={selectedUserObj.nama}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUserObj.nama)}&background=047857&color=ffffff&bold=true`;
                  }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">{selectedUserObj.nama}</p>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">{selectedUserObj.roleLabel} • @{selectedUserObj.username}</span>
                </div>
              </div>
            </div>
          )}

          {!isWargaRole && (
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedUsername}
                onChange={(e) => handleUserSelectChange(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 appearance-none transition-all cursor-pointer shadow-2xs"
              >
                {allUsers.map((u) => (
                  <option key={u.id} value={u.username}>
                    {u.nama} — [{u.roleLabel}]
                  </option>
                ))}
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs font-bold">
                ▼
              </div>
            </div>
          )}
        </div>

        {/* 2. Input Password / NIK Warga */}
        {!isWargaRole ? (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Kata Sandi / PIN
              </label>
              <button
                type="button"
                onClick={() => handleOpenBiometric('fingerprint')}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer transition-colors"
                title="Login Cepat Sidik Jari / Face ID"
              >
                <Fingerprint className="w-3.5 h-3.5 text-emerald-600" />
                <span>Opsi Biometrik</span>
              </button>
            </div>
            
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={passwordInputRef}
                type={showPassword ? 'text' : 'password'}
                placeholder="Masukkan kata sandi atau PIN..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-20 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
                autoComplete="current-password"
              />
              
              {/* Tombol Aksi di Ujung Kolom Password */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {/* Tombol Show/Hide Password */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                  title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>

                {/* Simbol Sidik Jari di Ujung Kolom Password */}
                <button
                  type="button"
                  onClick={() => handleOpenBiometric('fingerprint')}
                  className="p-1.5 rounded-lg bg-emerald-100/80 hover:bg-emerald-200 text-emerald-800 hover:text-emerald-950 transition-all cursor-pointer shadow-xs active:scale-90 border border-emerald-300/60"
                  title="Login dengan Sidik Jari / Pengenalan Wajah"
                  aria-label="Login dengan Sidik Jari atau Face ID"
                >
                  <Fingerprint className="w-4 h-4 text-emerald-700 animate-pulse" />
                </button>
              </div>
            </div>

            {/* Quick Biometric Access Bar */}
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
              <span className="text-[10px] text-slate-500 font-medium">Login Cepat:</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleOpenBiometric('fingerprint')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 text-[11px] font-bold transition-all cursor-pointer"
                >
                  <Fingerprint className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Sidik Jari</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenBiometric('face')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 text-[11px] font-bold transition-all cursor-pointer"
                >
                  <ScanFace className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Face ID (3s)</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-700" />
                <span>Password (NIK Warga Terdaftar)</span>
              </label>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                Wajib 16 Digit NIK
              </span>
            </div>

            <div className="relative">
              <CreditCard className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={passwordInputRef}
                type={showPassword ? 'text' : 'password'}
                inputMode="numeric"
                maxLength={16}
                placeholder="Masukkan 16 digit NIK terdaftar di Data Induk Warga..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-2.5 text-xs font-mono font-medium tracking-wider bg-emerald-50/50 border-2 border-emerald-500/70 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all text-slate-900"
                autoComplete="current-password"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                title={showPassword ? 'Sembunyikan NIK' : 'Lihat NIK'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="mt-2.5 p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-[11px] text-emerald-900 leading-relaxed shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Verifikasi Identitas Warga RW 018:</p>
                <p className="text-emerald-800 mt-0.5">
                  Wajib memasukkan kata sandi yaitu <strong>NIK yang terdaftar di Data Induk Warga RW 018</strong>. Apabila NIK tidak ditemukan dalam data warga induk, sistem akan menolak akses dengan pesan: <em>"Anda Bukan warga RW 018"</em>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 3. Tombol Masuk */}
        <div className="pt-1">
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.99] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <LogIn className="w-4 h-4 text-amber-300" />
            <span>
              {isWargaRole ? 'Masuk Layanan Warga (Verifikasi NIK)' : 'Masuk ke Sistem'}
            </span>
          </button>
        </div>
      </form>

      {/* Footer Info */}
      <div className="text-center text-[11px] text-slate-500">
        <p>Sekretariat: {profile.alamatKantor}</p>
        <p className="text-[10px] text-slate-400 mt-0.5">Kontak WhatsApp: {profile.noHpKetuaRw}</p>
      </div>

      {/* Biometric Scan Modal */}
      {selectedUserObj && (
        <BiometricAuthModal
          isOpen={isBiometricOpen}
          onClose={() => setIsBiometricOpen(false)}
          selectedUser={selectedUserObj}
          initialMode={biometricMode}
          onLoginSuccess={(user) => {
            setIsBiometricOpen(false);
            onLoginSuccess(user);
          }}
          onSwitchToPassword={() => {
            setIsBiometricOpen(false);
            setErrorMessage('Verifikasi wajah tidak berhasil (batas 3 detik). Silakan masukkan kata sandi atau PIN Anda.');
            setTimeout(() => {
              passwordInputRef.current?.focus();
            }, 100);
          }}
        />
      )}
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 sm:p-6 w-full max-w-md relative shadow-2xl my-auto">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute right-4 top-4 p-2 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors z-10"
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-900 via-emerald-950 to-slate-950 p-4 sm:p-6 flex items-center justify-center">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl p-5 sm:p-7 shadow-2xl border border-emerald-500/30">
        {content}
      </div>
    </div>
  );
};
