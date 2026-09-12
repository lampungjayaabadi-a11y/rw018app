import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  X,
  Plus,
  Shield,
  KeyRound,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Crown,
  Lock,
  Phone,
  UserCheck,
  Camera,
  User,
  Fingerprint,
  ScanFace,
  Sparkles,
  ShieldCheck,
  Info
} from 'lucide-react';
import { AppUser, UserRole } from '../types';
import {
  getUsersList,
  saveUserAccount,
  deleteUserAccount,
  resetUsersToDefault,
  getRolePermission,
  getUserPhotoUrl,
  isUserSuperAdmin,
  isKetuaRWOrSuperAdmin
} from '../services/auth';
import { useToast } from '../context/ToastContext';
import { AvatarPicker } from './AvatarPicker';
import { BiometricAuthModal } from './BiometricAuthModal';
import { FaceIdRegistrationModal } from './FaceIdRegistrationModal';
import { registerDeviceFingerprint } from '../services/biometricService';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser | null;
  onUserChanged?: () => void;
  initialEditUserId?: string;
  onOpenHakAkses?: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChanged,
  initialEditUserId,
  onOpenHakAkses,
}) => {
  const { showSuccess, showDelete, showError } = useToast();
  const [users, setUsers] = useState<AppUser[]>(getUsersList());
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState('');
  const [showErrorToast, setShowErrorToast] = useState('');
  const [testingBiometricUser, setTestingBiometricUser] = useState<AppUser | null>(null);
  const [testingBiometricMode, setTestingBiometricMode] = useState<'fingerprint' | 'face'>('fingerprint');
  const [registeringFaceUser, setRegisteringFaceUser] = useState<AppUser | null>(null);

  const handleOpenFaceRegistration = (targetUser?: AppUser) => {
    if (targetUser) {
      setRegisteringFaceUser(targetUser);
      return;
    }
    if (editingUser) {
      setRegisteringFaceUser(editingUser);
      return;
    }
    // If adding a new user, create draft object
    const draftUser: AppUser = {
      id: `draft_user_${Date.now()}`,
      username: formData.username || 'user_baru',
      password: '',
      nama: formData.nama || 'Pengguna Baru',
      role: formData.role,
      roleLabel: getRolePermission(formData.role).roleLabel,
      rtAccess: formData.rtAccess,
      noHp: formData.noHp,
      avatarUrl: formData.avatarUrl,
      isActive: formData.isActive,
      description: formData.description,
      fingerprintEnabled: formData.fingerprintEnabled,
      faceRecognitionEnabled: true,
    };
    setRegisteringFaceUser(draftUser);
  };

  const [formData, setFormData] = useState<{
    username: string;
    nama: string;
    password: string;
    role: UserRole;
    rtAccess: string;
    noHp: string;
    avatarUrl: string;
    isActive: boolean;
    description: string;
    fingerprintEnabled: boolean;
    faceRecognitionEnabled: boolean;
  }>({
    username: '',
    nama: '',
    password: '',
    role: 'warga',
    rtAccess: 'ALL',
    noHp: '',
    avatarUrl: '',
    isActive: true,
    description: '',
    fingerprintEnabled: true,
    faceRecognitionEnabled: true,
  });

  const isPrivileged = isKetuaRWOrSuperAdmin(currentUser);

  const displayedUsers = useMemo(() => {
    if (isPrivileged) {
      return users;
    }
    // Level selain Ketua RW & Super Admin: Hanya bisa melihat data user aktif itu sendiri
    const self = users.filter(
      (u) =>
        u.id === currentUser?.id ||
        u.username.toLowerCase() === (currentUser?.username || '').toLowerCase()
    );
    if (self.length > 0) return self;
    return currentUser ? [currentUser] : [];
  }, [users, isPrivileged, currentUser]);

  useEffect(() => {
    if (isOpen) {
      const list = getUsersList();
      setUsers(list);
      const privileged = isKetuaRWOrSuperAdmin(currentUser);
      if (!privileged && currentUser) {
        // Otomatis membuka form edit foto & profil untuk akun aktif pengguna
        const self = list.find(
          (u) => u.id === currentUser.id || u.username.toLowerCase() === currentUser.username.toLowerCase()
        );
        if (self) {
          handleStartEdit(self);
        }
      } else if (initialEditUserId) {
        const target = list.find((u) => u.id === initialEditUserId || u.username === initialEditUserId);
        if (target) {
          handleStartEdit(target);
        }
      }
    }
  }, [isOpen, initialEditUserId, currentUser]);

  if (!isOpen) return null;

  if (currentUser?.role === 'warga') {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-white">Akses Dibatasi</h3>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Fungsi Ubah Foto Profil &amp; Kelola Akun dinonaktifkan untuk pengguna dengan level <strong>Warga</strong>. Menu ini hanya dapat diakses oleh Pengurus RT &amp; RW.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    );
  }

  const refreshList = () => {
    const fresh = getUsersList();
    setUsers(fresh);
    if (onUserChanged) onUserChanged();
  };

  const handleStartAdd = () => {
    if (!isPrivileged) {
      alert('Hanya Super Admin dan Ketua RW yang berwenang menambah akun baru.');
      return;
    }
    setEditingUser(null);
    setFormData({
      username: '',
      nama: '',
      password: '',
      role: 'warga',
      rtAccess: 'ALL',
      noHp: '',
      avatarUrl: '',
      isActive: true,
      description: '',
      fingerprintEnabled: true,
      faceRecognitionEnabled: true,
    });
    setIsAddingNew(true);
  };

  const handleStartEdit = (u: AppUser) => {
    if (!isPrivileged && currentUser) {
      const isSelf = u.id === currentUser.id || u.username.toLowerCase() === currentUser.username.toLowerCase();
      if (!isSelf) {
        alert('Anda hanya berwenang mengubah foto & biodata akun Anda sendiri.');
        return;
      }
    }
    setEditingUser(u);
    setFormData({
      username: u.username,
      nama: u.nama,
      password: '',
      role: u.role,
      rtAccess: u.rtAccess || 'ALL',
      noHp: u.noHp || '',
      avatarUrl: u.avatarUrl || '',
      isActive: u.isActive,
      description: u.description || '',
      fingerprintEnabled: u.fingerprintEnabled !== false,
      faceRecognitionEnabled: u.faceRecognitionEnabled !== false,
    });
    setIsAddingNew(false);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.nama.trim()) {
      alert('Username dan Nama Pengguna wajib diisi.');
      return;
    }

    // Hanya Super Admin & Ketua RW yang bisa mengubah Hak Akses / Peran (Role), rtAccess, dan status akun
    const finalRole: UserRole = isPrivileged
      ? formData.role
      : (editingUser ? editingUser.role : formData.role);
    const finalRtAccess = isPrivileged
      ? (finalRole === 'ketua_rt' ? formData.rtAccess : 'ALL')
      : (editingUser ? (editingUser.rtAccess || 'ALL') : 'ALL');
    const finalIsActive = isPrivileged
      ? formData.isActive
      : (editingUser ? editingUser.isActive : true);
    const finalUsername = isPrivileged
      ? formData.username.trim().toLowerCase()
      : (editingUser ? editingUser.username : formData.username.trim().toLowerCase());

    const perm = getRolePermission(finalRole);

    const userToSave: AppUser = {
      id: editingUser ? editingUser.id : `usr-${Date.now()}`,
      username: finalUsername,
      nama: formData.nama.trim(),
            role: finalRole,
      roleLabel: perm.roleLabel,
      rtAccess: finalRtAccess,
      noHp: formData.noHp.trim(),
      avatarUrl: formData.avatarUrl.trim() || undefined,
      isActive: finalIsActive,
      description: formData.description.trim() || perm.description,
      fingerprintEnabled: formData.fingerprintEnabled,
      faceRecognitionEnabled: formData.faceRecognitionEnabled,
      biometricRegisteredAt: editingUser?.biometricRegisteredAt || new Date().toISOString(),
    };

    saveUserAccount(userToSave);
    showSuccess(`Data profil ${userToSave.nama} beserta foto & opsi biometrik berhasil disimpan!`, 'Profil Akun Disimpan');
    setShowSuccessToast(`Data profil ${userToSave.nama} berhasil disimpan!`);
    setTimeout(() => setShowSuccessToast(''), 3000);
    setEditingUser(null);
    setIsAddingNew(false);
    refreshList();
  };

  const handleDelete = (userId: string, nama: string) => {
    if (!isPrivileged) {
      alert('Hanya Super Admin dan Ketua RW yang berwenang menghapus akun.');
      return;
    }
    if (confirm(`Apakah Anda yakin ingin menghapus akun user "${nama}"?`)) {
      const ok = deleteUserAccount(userId);
      if (ok) {
        showDelete(`Akun user "${nama}" berhasil dihapus dari sistem.`, 'Akun Berhasil Dihapus');
        setShowSuccessToast(`Akun ${nama} berhasil dihapus.`);
        setTimeout(() => setShowSuccessToast(''), 3000);
        refreshList();
      } else {
        showError('Akun Super Admin Ketua RW tidak dapat dihapus.', 'Gagal Menghapus Akun');
        alert('Akun Super Admin Ketua RW tidak dapat dihapus.');
      }
    }
  };

  const handleResetDefault = () => {
    if (!isPrivileged) {
      alert('Hanya Super Admin dan Ketua RW yang berwenang mereset akun.');
      return;
    }
    if (confirm('Kembalikan semua akun ke daftar akun default resmi RW 018?')) {
      resetUsersToDefault();
      showSuccess('Daftar akun pengurus berhasil dikembalikan ke standar awal.', 'Reset Akun Berhasil');
      setShowSuccessToast('Daftar akun pengurus berhasil dikembalikan ke standar awal.');
      setTimeout(() => setShowSuccessToast(''), 3000);
      refreshList();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-emerald-950 flex items-center justify-center font-bold shadow-md">
              {isPrivileged ? <KeyRound className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>{isPrivileged ? 'Manajemen Akun & Hak Akses User' : 'Foto & Profil Akun Saya'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/60 text-amber-300 border border-emerald-500/40">
                  {isPrivileged ? `${users.length} Akun Terdaftar` : '1 Akun Aktif'}
                </span>
              </h2>
              <p className="text-xs text-emerald-200">
                {isPrivileged
                  ? 'Kelola hak akses Ketua RW, Sekretaris, Bendahara, Ketua RT 039-042, Keamanan, RKM & Warga'
                  : `Pengaturan Foto Profil & Biodata Akun Pribadi (${currentUser?.roleLabel || currentUser?.nama || 'Pengguna'})`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-emerald-700/60 text-emerald-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {showSuccessToast && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{showSuccessToast}</span>
            </div>
          )}

          {showErrorToast && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{showErrorToast}</span>
            </div>
          )}

          {/* Banner Informasi Pembatasan Hak Akses untuk Non-Admin/Ketua RW */}
          {!isPrivileged && (
            <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 shadow-2xs">
              <div className="w-6 h-6 rounded-lg bg-amber-200/80 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <div className="space-y-0.5 min-w-0 flex-1">
                <p className="font-bold text-amber-950">Mode Akses Terbatas Pengguna</p>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Sesuai kebijakan keamanan, Anda hanya dapat melihat serta mengedit data akun Anda sendiri. Daftar akun orang lain disembunyikan dan opsi pilihan <strong>Hak Akses / Peran (Role)</strong> dinonaktifkan (hanya <strong>Ketua RW</strong> &amp; <strong>Super Admin</strong> yang berwenang mengubahnya).
                </p>
              </div>
            </div>
          )}

          {/* Action Bar - Ramping & Rata Kanan Kiri di Android */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
            <div className="text-xs text-slate-600 flex items-center gap-1.5 flex-wrap">
              <span>Pengguna Aktif:</span>
              <strong className="text-slate-900">{currentUser?.nama || 'Administrator'}</strong>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                {currentUser?.roleLabel}
              </span>
            </div>
            <div className={`grid ${isPrivileged ? 'grid-cols-2 sm:flex' : 'grid-cols-1 sm:flex'} sm:items-center gap-1.5 sm:gap-2 w-full sm:w-auto`}>
              {currentUser && (
                <button
                  type="button"
                  onClick={() => {
                    const self = users.find((u) => u.id === currentUser.id || u.username.toLowerCase() === currentUser.username.toLowerCase());
                    if (self) {
                      handleStartEdit(self);
                    }
                  }}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black shadow-2xs transition-all cursor-pointer"
                  title="Edit profil dan foto akun yang sedang login"
                >
                  <Camera className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Foto & Profil Saya</span>
                </button>
              )}
              {isPrivileged && isUserSuperAdmin(currentUser) && onOpenHakAkses && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenHakAkses();
                  }}
                  className="w-full sm:w-auto flex items-center justify-between sm:justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-2xs transition-all cursor-pointer border border-emerald-600/40"
                  title="Atur Hak Akses User Level & Visibilitas Menu"
                >
                  <div className="flex items-center gap-1 min-w-0">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span className="truncate">Hak Akses</span>
                  </div>
                  <span className="px-1.5 py-0.2 rounded-md text-[8.5px] font-black bg-amber-400 text-emerald-950 flex items-center gap-0.5 shrink-0">
                    <Crown className="w-2.5 h-2.5" />
                    <span>SA</span>
                  </span>
                </button>
              )}
              {isPrivileged && (
                <button
                  type="button"
                  onClick={handleResetDefault}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Reset Default</span>
                </button>
              )}
              {isPrivileged && (
                <button
                  type="button"
                  onClick={handleStartAdd}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Tambah Akun</span>
                </button>
              )}
            </div>
          </div>

          {/* Form Add / Edit */}
          {(isAddingNew || editingUser) && (
            <form onSubmit={handleSaveForm} className="bg-slate-50 border border-emerald-200 rounded-2xl p-4 sm:p-5 space-y-3.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-emerald-600" />
                  <span>{isAddingNew ? 'Tambah Akun Pengguna Baru' : `Edit Akun: ${editingUser?.nama}`}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNew(false);
                    setEditingUser(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 text-xs font-medium"
                >
                  Batal
                </button>
              </div>

              {/* Photo Picker Component from Camera / Gallery / URL */}
              <AvatarPicker
                value={formData.avatarUrl}
                onChange={(newAvatar) => setFormData((prev) => ({ ...prev, avatarUrl: newAvatar }))}
                userName={formData.nama || formData.username || 'Pengguna'}
                userRole={formData.role}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700">Username (Login ID) *</label>
                    {!isPrivileged && (
                      <span className="text-[10px] text-slate-500 font-medium">Tetap</span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    readOnly={!isPrivileged}
                    value={formData.username}
                    onChange={(e) => {
                      if (isPrivileged) {
                        setFormData({ ...formData, username: e.target.value });
                      }
                    }}
                    placeholder="Contoh: bendahara, rt039, hansip01"
                    className={`w-full px-3 py-2 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none ${
                      !isPrivileged
                        ? 'bg-slate-100 text-slate-600 border border-slate-200 cursor-not-allowed select-none'
                        : 'bg-white border border-slate-300'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Pengguna *</label>
                  <input
                    type="text"
                    required
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    placeholder="Contoh: Supriyadi (Ketua RT 039)"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  <strong>Login aman:</strong> password tidak lagi disimpan di aplikasi atau Firestore.
                  Akun login dibuat/dikelola melalui Firebase Authentication. Gunakan skrip migrasi di folder <code>scripts/</code> untuk membuat akun awal.
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700">Hak Akses / Peran (Role) *</label>
                    {!isPrivileged && (
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" />
                        Terkunci (Khusus SA &amp; Ketua RW)
                      </span>
                    )}
                  </div>
                  <select
                    disabled={!isPrivileged}
                    value={formData.role}
                    onChange={(e) => {
                      if (isPrivileged) {
                        setFormData({ ...formData, role: e.target.value as UserRole });
                      }
                    }}
                    className={`w-full px-3 py-2 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all ${
                      !isPrivileged
                        ? 'bg-slate-100 text-slate-500 border border-slate-200 cursor-not-allowed select-none font-medium'
                        : 'bg-white border border-slate-300'
                    }`}
                  >
                    <option value="super_admin">👑 Super Admin / SA (Akses Penuh Sistem)</option>
                    <option value="ketua_rw">🏛️ Ketua RW (Pimpinan Wilayah)</option>
                    <option value="sekretaris">📝 Sekretaris RW / SEK (Administrasi & Persuratan)</option>
                    <option value="bendahara">💰 Bendahara RW / BEN (Keuangan & Kas)</option>
                    <option value="ketua_rt">🏠 Ketua RT / RT (Wilayah RT)</option>
                    <option value="keamanan">🛡️ Petugas Keamanan / KAM (Siskamling & Ronda)</option>
                    <option value="rkm">🤝 Petugas RKM / RKM (Rukun Kematian)</option>
                    <option value="warga">👤 Warga / WARGA (Layanan Mandiri)</option>
                    <option value="admin_rw">⭐ Admin RW (Legacy Super Admin)</option>
                    <option value="pengurus_dkm">🕌 Pengurus DKM (Masjid & Keagamaan)</option>
                    <option value="pengurus_rkm">🤝 Pengurus RKM (Legacy)</option>
                  </select>
                  {!isPrivileged && (
                    <p className="mt-1 text-[10px] text-amber-700 flex items-center gap-1 font-medium">
                      <Info className="w-3 h-3 shrink-0" />
                      <span>Pilihan Hak Akses / Peran dinonaktifkan. Hanya Super Admin &amp; Ketua RW yang bisa mengganti.</span>
                    </p>
                  )}
                </div>

                {formData.role === 'ketua_rt' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Cakupan Wilayah RT *</label>
                    <select
                      disabled={!isPrivileged}
                      value={formData.rtAccess}
                      onChange={(e) => {
                        if (isPrivileged) {
                          setFormData({ ...formData, rtAccess: e.target.value });
                        }
                      }}
                      className={`w-full px-3 py-2 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none ${
                        !isPrivileged
                          ? 'bg-slate-100 text-slate-500 border border-slate-200 cursor-not-allowed select-none font-medium'
                          : 'bg-white border border-slate-300'
                      }`}
                    >
                      <option value="039">Rukun Tetangga 039 (RT 039)</option>
                      <option value="040">Rukun Tetangga 040 (RT 040)</option>
                      <option value="041">Rukun Tetangga 041 (RT 041)</option>
                      <option value="042">Rukun Tetangga 042 (RT 042)</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor WhatsApp / HP</label>
                  <input
                    type="text"
                    value={formData.noHp}
                    onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
                    placeholder="Contoh: 081234567890"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* 3. Pengaturan Autentikasi Biometrik (Sidik Jari & Pengenalan Wajah) */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-950/90 via-slate-900 to-teal-950 text-white border border-emerald-500/30 space-y-3 shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center shrink-0">
                      <Fingerprint className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5 flex-wrap">
                        <span>Opsi Input Biometrik (Sidik Jari & Pengenalan Wajah)</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold uppercase border border-emerald-500/30">
                          Terkoneksi Password
                        </span>
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Kredensial login sekarang dikelola oleh Firebase Authentication. Password tidak disimpan di aplikasi.
                      </p>
                    </div>
                  </div>

                  {/* Header Action Buttons: Daftarkan Sidik Jari, Daftarkan Face ID, Uji Sensor */}
                  <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                    {editingUser && (
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await registerDeviceFingerprint(editingUser);
                          if (res.success) {
                            setShowSuccessToast(`Sidik jari HP untuk ${editingUser.nama} berhasil didaftarkan!`);
                          } else {
                            setShowErrorToast(res.message);
                          }
                          setTimeout(() => {
                            setShowSuccessToast('');
                            setShowErrorToast('');
                          }, 3500);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-teal-700/90 hover:bg-teal-600 text-white text-[10px] font-bold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                        title="Daftarkan sensor sidik jari HP saat ini"
                      >
                        <Fingerprint className="w-3 h-3 text-emerald-300" />
                        <span>Daftarkan Sidik Jari HP</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenFaceRegistration()}
                      className="px-2.5 py-1 rounded-lg bg-teal-700/90 hover:bg-teal-600 text-white text-[10px] font-bold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                      title="Buka kamera & daftarkan Face ID pengguna"
                    >
                      <ScanFace className="w-3 h-3 text-teal-200" />
                      <span>Daftarkan Face Id</span>
                    </button>

                    {editingUser && (
                      <button
                        type="button"
                        onClick={() => {
                          setTestingBiometricUser(editingUser);
                          setTestingBiometricMode('fingerprint');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-700/80 hover:bg-emerald-600 text-white text-[10px] font-bold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                        title="Tes sensor sidik jari / face id"
                      >
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        <span>Uji Sensor</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {/* Opsi Sidik Jari */}
                  <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                    formData.fingerprintEnabled
                      ? 'bg-emerald-900/40 border-emerald-500/50 text-emerald-200'
                      : 'bg-slate-900/40 border-slate-700 text-slate-400'
                  }`}>
                    <input
                      type="checkbox"
                      checked={formData.fingerprintEnabled}
                      onChange={(e) => setFormData({ ...formData, fingerprintEnabled: e.target.checked })}
                      className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-800 border-slate-600"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-100">
                        <Fingerprint className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Input Sidik Jari (Fingerprint)</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                        Izinkan user masuk via sensor sidik jari perangkat (Android/PWA/PC).
                      </p>
                    </div>
                  </label>

                  {/* Opsi Pengenalan Wajah */}
                  <div className={`p-2.5 rounded-xl border transition-all flex flex-col justify-between gap-2 ${
                    formData.faceRecognitionEnabled
                      ? 'bg-teal-900/40 border-teal-500/50 text-teal-200'
                      : 'bg-slate-900/40 border-slate-700 text-slate-400'
                  }`}>
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.faceRecognitionEnabled}
                        onChange={(e) => setFormData({ ...formData, faceRecognitionEnabled: e.target.checked })}
                        className="mt-0.5 w-4 h-4 rounded text-teal-600 focus:ring-teal-500 bg-slate-800 border-slate-600"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-100">
                          <ScanFace className="w-3.5 h-3.5 text-teal-400" />
                          <span>Input Pengenalan Wajah (Face ID)</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                          Izinkan user masuk via pemindaian kamera biometrik wajah pengguna.
                        </p>
                      </div>
                    </label>
                    <div className="pt-1.5 border-t border-slate-700/60 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-medium">Registrasi Wajah</span>
                      <button
                        type="button"
                        onClick={() => handleOpenFaceRegistration()}
                        className="px-2 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                        title="Buka kamera & daftarkan Face ID"
                      >
                        <ScanFace className="w-3 h-3 text-teal-100" />
                        <span>Daftarkan Face Id</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Keterangan / Deskripsi Tugas</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Keterangan tugas dan wewenang akun..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNew(false);
                    setEditingUser(null);
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-100 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs"
                >
                  Simpan Akun Pengguna
                </button>
              </div>
            </form>
          )}

          {/* Table List of Users */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-3">Pengguna & Username</th>
                    <th className="p-3">Peran / Hak Akses</th>
                    <th className="p-3">Opsi Biometrik</th>
                    <th className="p-3">Wilayah</th>
                    <th className="p-3">Kontak</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedUsers.map((u) => {
                    const perm = getRolePermission(u.role);
                    const isSuperAdmin = u.role === 'admin_rw' && u.username === 'ketuarw';
                    const hasFingerprint = u.fingerprintEnabled !== false;
                    const hasFace = u.faceRecognitionEnabled !== false;

                    return (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-emerald-600 bg-slate-900 shrink-0 shadow-2xs">
                              <img
                                src={getUserPhotoUrl(u, u.nama)}
                                alt={u.nama}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.nama)}&background=047857&color=ffffff&bold=true`;
                                }}
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 truncate">{u.nama}</div>
                              <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                                <span>User: <strong>{u.username}</strong></span>
                                <span>•</span>
                                <span>Pass: <code className="text-slate-400">••••••••</code></span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${perm.roleColor}`}>
                            {perm.roleLabel}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                hasFingerprint
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                              }`}
                              title={hasFingerprint ? 'Login Sidik Jari Aktif' : 'Login Sidik Jari Nonaktif'}
                            >
                              <Fingerprint className="w-3 h-3 text-emerald-600" />
                              <span>Sidik Jari</span>
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                hasFace
                                  ? 'bg-teal-50 text-teal-800 border-teal-200'
                                  : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                              }`}
                              title={hasFace ? 'Login Pengenalan Wajah Aktif' : 'Login Pengenalan Wajah Nonaktif'}
                            >
                              <ScanFace className="w-3 h-3 text-teal-600" />
                              <span>Face ID</span>
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-slate-700">
                            {u.role === 'ketua_rt' ? `RT ${u.rtAccess}` : 'Semua RT (RW 018)'}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600">
                          {u.noHp || '-'}
                        </td>
                        <td className="p-3 text-center">
                          {u.isActive ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-bold text-[10px]">
                              Aktif
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-md font-bold text-[10px]">
                              Nonaktif
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenFaceRegistration(u)}
                              title="Daftarkan / Pindai Ulang Face ID Akun Ini"
                              className="p-1.5 rounded-lg text-teal-600 hover:text-teal-800 hover:bg-teal-50 transition-colors cursor-pointer"
                            >
                              <ScanFace className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setTestingBiometricUser(u);
                                setTestingBiometricMode('fingerprint');
                              }}
                              title="Uji Pemindai Biometrik Akun Ini"
                              className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition-colors cursor-pointer"
                            >
                              <Fingerprint className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleStartEdit(u)}
                              title={isPrivileged ? "Edit Akun & Biometrik" : "Edit Foto & Profil Saya"}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {isPrivileged && !isSuperAdmin && (
                              <button
                                onClick={() => handleDelete(u.id, u.nama)}
                                title="Hapus Akun"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Hak akses & biometrik secara ketat membatasi visibilitas dan wewenang aksi pada sistem RW 018.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Face ID Registration Camera Modal */}
      {registeringFaceUser && (
        <FaceIdRegistrationModal
          isOpen={!!registeringFaceUser}
          onClose={() => setRegisteringFaceUser(null)}
          user={registeringFaceUser}
          onSuccess={(updatedUser, snapshotUrl) => {
            const list = getUsersList();
            setUsers(list);
            if (editingUser && editingUser.id === updatedUser.id) {
              setEditingUser(updatedUser);
              setFormData((prev) => ({
                ...prev,
                faceRecognitionEnabled: true,
                avatarUrl: snapshotUrl || prev.avatarUrl,
              }));
            } else if (isAddingNew) {
              setFormData((prev) => ({
                ...prev,
                faceRecognitionEnabled: true,
                avatarUrl: snapshotUrl || prev.avatarUrl,
              }));
            }
            if (onUserChanged) onUserChanged();
            setShowSuccessToast(`Face ID untuk ${updatedUser.nama} berhasil didaftarkan dan aktif!`);
            setTimeout(() => setShowSuccessToast(''), 4000);
          }}
        />
      )}

      {/* Biometric Testing Simulator Modal */}
      {testingBiometricUser && (
        <BiometricAuthModal
          isOpen={!!testingBiometricUser}
          onClose={() => setTestingBiometricUser(null)}
          selectedUser={testingBiometricUser}
          initialMode={testingBiometricMode}
          onLoginSuccess={(u) => {
            setTestingBiometricUser(null);
            setShowSuccessToast(`Simulasi biometrik ${u.nama} berhasil divalidasi!`);
            setTimeout(() => setShowSuccessToast(''), 3000);
          }}
        />
      )}
    </div>
  );
};
