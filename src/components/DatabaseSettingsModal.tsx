import React, { useState, useRef, useEffect } from 'react';
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  HardDrive,
  Save,
  X,
  Building,
  ShieldCheck,
  FileCode,
  Info,
  Cloud,
  CloudUpload,
  Layers,
  Palette,
  Moon,
  Sun,
  Monitor,
  ArrowLeft,
  Smartphone,
  Phone,
  User,
  MapPin,
  Check,
  Sparkles,
  Wifi,
  Radio,
  FileJson,
  RotateCcw,
  Server,
  Cpu,
  BarChart3,
  PieChart,
  Activity,
  FileText,
  Lock,
  Globe,
  Copy,
  ExternalLink,
  Search,
  Users,
  CreditCard,
  Wallet,
  Receipt,
  HeartHandshake,
  BookOpen,
  Landmark,
  Gift,
  ShoppingBag,
  Calendar,
  MessageSquareWarning,
  Key,
  Shield
} from 'lucide-react';
import { RWProfile, AppDatabase, AppUser } from '../types';
import { LOGO_RW_018, handleLogoError } from '../constants/logo';
import {
  exportDatabaseJSON,
  importDatabaseJSON,
  resetToInitialData,
  getFullDatabaseState,
  saveRWProfile,
  uploadEntireDatabaseToFirestore,
  getCloudStorageMetrics,
  CloudStorageMetrics,
  CollectionStorageInfo,
  formatBytes
} from '../services/storage';
import { getCurrentUser } from '../services/auth';
import { ThemeToggle } from './ThemeToggle';

interface DatabaseSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: RWProfile;
  onUpdateProfile: (newProfile: RWProfile) => void;
  onRefreshData: () => void;
  currentUser?: AppUser | null;
}

export const DatabaseSettingsModal: React.FC<DatabaseSettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
  onRefreshData,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'cloud' | 'storage' | 'appearance' | 'profile'>('cloud');
  const [profileForm, setProfileForm] = useState<RWProfile>({ ...profile });
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);
  const [collectionSearch, setCollectionSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const [metrics, setMetrics] = useState<CloudStorageMetrics>(() => getCloudStorageMetrics());

  const activeUser = currentUser || getCurrentUser();
  const isSuperAdmin = activeUser?.role === 'admin_rw';

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Recalculate metrics when opening or on tab change
  useEffect(() => {
    if (isOpen) {
      setMetrics(getCloudStorageMetrics());
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  if (activeUser?.role === 'warga') {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-white">Akses Dibatasi</h3>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Fungsi Status Database &amp; Sinkronisasi dinonaktifkan untuk pengguna dengan level <strong>Warga</strong>. Menu ini hanya dapat diakses oleh Pengurus RT &amp; RW.
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

  const currentDb = getFullDatabaseState();
  const storageSizeBytes = new Blob([JSON.stringify(currentDb)]).size;
  const storageSizeKB = (storageSizeBytes / 1024).toFixed(2);

  const handleRecalculate = () => {
    setIsRecalculating(true);
    setTimeout(() => {
      setMetrics(getCloudStorageMetrics());
      setIsRecalculating(false);
      setSaveSuccessMsg('Kapasitas dan ukuran seluruh koleksi Cloud Firestore berhasil dihitung ulang!');
      setTimeout(() => setSaveSuccessMsg(null), 3500);
    }, 350);
  };

  const handleBackup = () => {
    exportDatabaseJSON();
    setSaveSuccessMsg('File backup database (JSON) berhasil diunduh ke memori perangkat!');
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  const handleCloudSync = async () => {
    setIsSyncingCloud(true);
    try {
      const res = await uploadEntireDatabaseToFirestore();
      if (res.success) {
        setMetrics(getCloudStorageMetrics());
        setSaveSuccessMsg(`Berhasil sinkronisasi ${res.totalSynced} dokumen ke Google Cloud Firestore!`);
      } else {
        alert('Gagal sinkronisasi: ' + (res.error || 'Terjadi kesalahan'));
      }
    } catch (err) {
      alert('Gagal: ' + (err as Error).message);
    } finally {
      setIsSyncingCloud(false);
      setTimeout(() => setSaveSuccessMsg(null), 5000);
    }
  };

  const handleCopyAuditReport = () => {
    const text = `=== LAPORAN AUDIT KAPASITAS CLOUD FIRESTORE RW 018 ===\n` +
      `Waktu Audit: ${new Date().toLocaleString('id-ID')}\n` +
      `ID Database: ${metrics.databaseId}\n` +
      `Region Cloud: ${metrics.region}\n` +
      `Total Dokumen Cloud: ${metrics.totalDocs} Dokumen (${metrics.collections.length} Koleksi)\n` +
      `Total Kapasitas Terpakai: ${metrics.totalSizeFormatted} (${metrics.totalSizeKB} KB / ${metrics.totalSizeMB} MB)\n` +
      `Batas Kuota Gratis Firestore: ${metrics.firestoreQuotaFormatted}\n` +
      `Persentase Penggunaan Kuota: ${metrics.firestoreQuotaPercentUsed}%\n` +
      `Sisa Kuota Cloud Tersedia: ${metrics.remainingQuotaFormatted}\n` +
      `Batas Maksimal per Dokumen: ${metrics.maxDocSizeFormatted}\n\n` +
      `RINCIAN UKURAN PER KOLEKSI:\n` +
      metrics.collections.map((c, i) => `${i + 1}. [${c.firestorePath}] ${c.name} (${c.category}): ${c.docCount} Dokumen | ${c.sizeFormatted} (${c.percentageOfTotal}% total) | Rata-rata ${c.avgDocSizeFormatted}/doc`).join('\n') +
      `\n\nSPESIFIKASI OPERASIONAL:\n` +
      `- Kuota Baca Harian: 50.000 Dokumen/hari\n` +
      `- Kuota Tulis Harian: 20.000 Dokumen/hari\n` +
      `- Kuota Hapus Harian: 20.000 Dokumen/hari\n` +
      `- Protokol Enkripsi: TLS 1.3 & Google Cloud AES-256\n` +
      `- Status Replikasi: Terkoneksi & Real-Time Sync Aktif`;

    navigator.clipboard.writeText(text);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonContent = event.target?.result as string;
        const success = importDatabaseJSON(jsonContent);
        if (success) {
          onRefreshData();
          setMetrics(getCloudStorageMetrics());
          setSaveSuccessMsg('Database lokal berhasil dipulihkan dari file backup!');
          setTimeout(() => setSaveSuccessMsg(null), 4000);
        } else {
          alert('Format file JSON tidak valid untuk database RW 018!');
        }
      } catch (err) {
        alert('Gagal memproses file backup: ' + (err as Error).message);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleReset = () => {
    resetToInitialData();
    onRefreshData();
    setMetrics(getCloudStorageMetrics());
    setConfirmReset(false);
    setSaveSuccessMsg('Database berhasil direset kembali ke data default simulasi!');
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    saveRWProfile(profileForm);
    onUpdateProfile(profileForm);
    setSaveSuccessMsg('Profil Kepengurusan RW 018 berhasil diperbarui!');
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  const renderCollectionIcon = (iconType: string) => {
    switch (iconType) {
      case 'users': return <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'credit-card': return <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'wallet': return <Wallet className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />;
      case 'receipt': return <Receipt className="w-4 h-4 text-teal-600 dark:text-teal-400" />;
      case 'heart-handshake': return <HeartHandshake className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case 'book-open': return <BookOpen className="w-4 h-4 text-amber-700 dark:text-amber-400" />;
      case 'layers': return <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      case 'landmark': return <Landmark className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'gift': return <Gift className="w-4 h-4 text-amber-700 dark:text-amber-400" />;
      case 'shopping-bag': return <ShoppingBag className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'shield-check': return <ShieldCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
      case 'calendar': return <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      case 'message-square-warning': return <MessageSquareWarning className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case 'file-text': return <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'building': return <Building className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'key': return <Key className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      default: return <Database className="w-4 h-4 text-slate-600 dark:text-slate-400" />;
    }
  };

  const categories = ['ALL', 'Kependudukan', 'Keuangan', 'Sosial & RKM', 'Pajak & Aset', 'Lainnya'];

  const filteredCollections = metrics.collections.filter((col) => {
    const matchesSearch =
      col.name.toLowerCase().includes(collectionSearch.toLowerCase()) ||
      col.firestorePath.toLowerCase().includes(collectionSearch.toLowerCase()) ||
      col.description.toLowerCase().includes(collectionSearch.toLowerCase());

    if (selectedCategory === 'ALL') return matchesSearch;
    if (selectedCategory === 'Lainnya') {
      return (
        matchesSearch &&
        !['Kependudukan', 'Keuangan', 'Sosial & RKM', 'Pajak & Aset'].includes(col.category)
      );
    }
    return matchesSearch && col.category === selectedCategory;
  });

  const tabs = [
    { id: 'cloud', label: 'Cloud Firestore', icon: Cloud },
    { id: 'storage', label: 'Database Lokal', icon: HardDrive },
    { id: 'appearance', label: 'Tema Tampilan', icon: Palette },
    { id: 'profile', label: 'Profil RW 018', icon: Building },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      {/* Android Mobile Frame Container */}
      <div className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 w-full sm:max-w-2xl md:max-w-3xl h-full sm:h-auto sm:max-h-[94vh] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border-0 sm:border border-slate-200/80 dark:border-slate-800 transition-all duration-200">
        
        {/* Android Top App Bar / Header */}
        <div className="bg-emerald-800 dark:bg-slate-900 text-white px-4 sm:px-6 pt-3.5 sm:pt-4 pb-3 flex items-center justify-between border-b border-emerald-700/60 dark:border-slate-800 shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 -ml-1 rounded-full hover:bg-white/10 active:bg-white/20 text-white transition-colors cursor-pointer"
              title="Kembali"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black tracking-tight leading-none text-white">
                  Penyimpanan & Pengaturan
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-emerald-950 shadow-xs">
                  <Cloud className="w-3 h-3" />
                  <span>Kapasitas Cloud & Database</span>
                </span>
              </div>
              <p className="text-[11px] text-emerald-100/90 dark:text-slate-400 mt-1">
                Kapasitas Data Cloud Firestore, Rincian Koleksi, Backup & Profil RW 018
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 active:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Android Mobile Navigation Segmented Pills */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-2 sm:px-5 py-2.5 shrink-0 shadow-xs">
          <div className="grid grid-cols-4 gap-1 sm:gap-2 w-full">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1.5 sm:px-3 rounded-2xl text-center flex items-center justify-center gap-1.5 transition-all cursor-pointer select-none ${
                    isActive
                      ? 'bg-emerald-700 dark:bg-emerald-600 text-white shadow-xs font-black ring-1 ring-emerald-600'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200/80 dark:hover:bg-slate-800 font-bold hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isActive ? 'text-amber-300' : 'text-slate-500 dark:text-slate-400'}`} />
                  <span className="text-xs tracking-tight truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Success Alert Banner */}
        {saveSuccessMsg && (
          <div className="mx-3 sm:mx-5 mt-3 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 rounded-2xl text-xs flex items-center gap-2.5 animate-fadeIn shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-bold flex-1">{saveSuccessMsg}</span>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 text-xs">
          
          {/* TAB 1: CLOUD FIRESTORE STORAGE & CAPACITY AUDIT */}
          {activeTab === 'cloud' && (
            <div className="space-y-4">
              
              {/* Card 1: Hero Cloud Storage & Free Tier Quota Gauge */}
              <div className="bg-gradient-to-br from-emerald-850 via-teal-900 to-slate-900 text-white p-4 sm:p-5 rounded-3xl border border-emerald-700/50 shadow-md relative overflow-hidden space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 shadow-inner shrink-0">
                      <Cloud className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-black text-white text-base sm:text-lg">
                          Google Cloud Firestore
                        </h4>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-400 text-emerald-950 shadow-xs">
                          <span className="w-2 h-2 rounded-full bg-emerald-900 animate-ping"></span>
                          <span>Real-Time Sync Online</span>
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-100/90 flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span>Database:</span>
                        <code className="font-mono text-amber-300 bg-white/10 px-1.5 py-0.5 rounded text-[10px]">
                          {metrics.databaseId}
                        </code>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-start sm:self-center">
                    <button
                      type="button"
                      onClick={handleRecalculate}
                      disabled={isRecalculating}
                      className="px-3 py-1.5 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-white/20"
                      title="Hitung Ulang Ukuran Kapasitas Data"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRecalculating ? 'animate-spin' : ''}`} />
                      <span>{isRecalculating ? 'Menghitung...' : 'Hitung Ulang'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyAuditReport}
                      className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-emerald-950 rounded-xl text-[11px] font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                      title="Salin Rincian Audit Kapasitas Database"
                    >
                      {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-950" /> : <Copy className="w-3.5 h-3.5 text-emerald-950" />}
                      <span>{copiedReport ? 'Tersalin!' : 'Salin Laporan'}</span>
                    </button>
                  </div>
                </div>

                {/* Progress Bar Kapasitas Kuota Cloud */}
                <div className="bg-black/30 p-3.5 rounded-2xl border border-white/10 space-y-2 relative z-10">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <div className="flex items-center gap-1.5">
                      <HardDrive className="w-4 h-4 text-emerald-300" />
                      <span>Kapasitas Tersimpan di Cloud:</span>
                      <strong className="text-amber-300 font-mono text-sm">{metrics.totalSizeFormatted}</strong>
                      <span className="text-emerald-200/80 text-[11px]">({metrics.totalSizeKB} KB)</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-emerald-200">Batas Kuota: </span>
                      <strong className="text-white font-mono">{metrics.firestoreQuotaFormatted}</strong>
                    </div>
                  </div>

                  {/* Visual Multi-step Bar */}
                  <div className="w-full bg-slate-800/80 h-3 rounded-full overflow-hidden p-0.5 border border-white/10 flex">
                    <div
                      className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(metrics.firestoreQuotaPercentUsed * 50, 1.5)}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-emerald-100/90 pt-0.5">
                    <span>
                      Penggunaan Kuota: <strong className="text-amber-300 font-mono">{metrics.firestoreQuotaPercentUsed}%</strong>
                    </span>
                    <span>
                      Sisa Ruang Bebas: <strong className="text-emerald-300 font-mono">{metrics.remainingQuotaFormatted}</strong> (99.98% Tersedia)
                    </span>
                  </div>
                </div>

                {/* 4 Summary Stat Tiles */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 relative z-10">
                  <div className="bg-white/10 p-3 rounded-2xl border border-white/10 text-center">
                    <span className="text-[10px] text-emerald-200 block font-semibold">Total Dokumen Cloud</span>
                    <span className="font-black text-white text-base font-mono">{metrics.totalDocs}</span>
                    <span className="text-[9.5px] text-emerald-200 block">Record Dokumen</span>
                  </div>

                  <div className="bg-white/10 p-3 rounded-2xl border border-white/10 text-center">
                    <span className="text-[10px] text-emerald-200 block font-semibold">Jumlah Koleksi Aktif</span>
                    <span className="font-black text-white text-base font-mono">{metrics.collections.length}</span>
                    <span className="text-[9.5px] text-emerald-200 block">Koleksi Firestore</span>
                  </div>

                  <div className="bg-white/10 p-3 rounded-2xl border border-white/10 text-center">
                    <span className="text-[10px] text-emerald-200 block font-semibold">Maksimal / Dokumen</span>
                    <span className="font-black text-white text-base font-mono">1.024 KB</span>
                    <span className="text-[9.5px] text-emerald-200 block">1 MB per Dokumen</span>
                  </div>

                  <div className="bg-white/10 p-3 rounded-2xl border border-white/10 text-center">
                    <span className="text-[10px] text-emerald-200 block font-semibold">Lokasi Region Cloud</span>
                    <span className="font-bold text-white text-xs block truncate mt-0.5">Jakarta / SG</span>
                    <span className="text-[9.5px] text-emerald-200 block">asia-southeast1</span>
                  </div>
                </div>
              </div>

              {/* Action Banner: 1-Tap Real-time Sync */}
              <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                    <CloudUpload className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 dark:text-slate-100 text-xs sm:text-sm">
                      Sinkronkan Seluruh Data Lokal ke Cloud Firestore
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Memastikan seluruh {metrics.totalDocs} dokumen di {metrics.collections.length} koleksi tersinkron sempurna ke cloud server.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCloudSync}
                  disabled={isSyncingCloud}
                  className="px-5 py-3 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 disabled:bg-emerald-400 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer text-xs shrink-0"
                >
                  {isSyncingCloud ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menyinkronkan...</span>
                    </>
                  ) : (
                    <>
                      <CloudUpload className="w-4 h-4" />
                      <span>Sinkronkan Sekarang</span>
                    </>
                  )}
                </button>
              </div>

              {/* Card 2: Rincian Detail Ukuran Kapasitas Per Koleksi (Tabel Interaktif) */}
              <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 dark:text-slate-100 text-sm">
                        Rincian Ukuran Kapasitas Per Koleksi
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Distribusi kapasitas dokumen dan ukuran data tersimpan di Google Cloud Firestore
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {filteredCollections.length} dari {metrics.collections.length} Koleksi
                    </span>
                  </div>
                </div>

                {/* Filter & Search Controls */}
                <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                  <div className="relative flex-1 w-full">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari nama koleksi atau path Firestore..."
                      value={collectionSearch}
                      onChange={(e) => setCollectionSearch(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    {collectionSearch && (
                      <button
                        onClick={() => setCollectionSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Category Pills */}
                  <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                          selectedCategory === cat
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {cat === 'ALL' ? 'Semua Kategori' : cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Collection Items List */}
                <div className="space-y-2.5 pt-1">
                  {filteredCollections.map((col) => (
                    <div
                      key={col.id}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50/40 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 transition-all space-y-2"
                    >
                      <div className="flex items-start sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
                            {renderCollectionIcon(col.iconType)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h5 className="font-black text-slate-800 dark:text-slate-100 text-xs">
                                {col.name}
                              </h5>
                              <span className="font-mono text-[9px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-300 dark:border-emerald-800">
                                /{col.firestorePath}
                              </span>
                              <span className="text-[9px] text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-1.5 py-0.2 rounded border border-slate-200 dark:border-slate-700">
                                {col.category}
                              </span>
                            </div>
                            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                              {col.description}
                            </p>
                          </div>
                        </div>

                        {/* Size & Doc Count Badge */}
                        <div className="text-right shrink-0">
                          <div className="flex items-center gap-1.5 justify-end">
                            <span className="font-black text-slate-900 dark:text-slate-100 text-xs font-mono">
                              {col.sizeFormatted}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                              {col.docCount} Doc
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
                            Rata-rata {col.avgDocSizeFormatted}/doc • {col.percentageOfTotal}%
                          </span>
                        </div>
                      </div>

                      {/* Percentage Visual Bar per collection */}
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 dark:bg-emerald-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.max(col.percentageOfTotal, 2)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}

                  {filteredCollections.length === 0 && (
                    <div className="p-6 text-center text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                      Tidak ada koleksi data yang cocok dengan pencarian.
                    </div>
                  )}
                </div>
              </div>

              {/* Card 3: Spesifikasi & Batas Operasional Kuota Cloud */}
              <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 flex items-center justify-center">
                    <Shield className="w-4 h-4" />
                  </div>
                  <h4 className="font-black text-slate-800 dark:text-slate-100 text-xs">
                    Spesifikasi & Keamanan Google Cloud Firestore
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-100 dark:border-slate-700/60 space-y-1">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
                      Batas Operasi Baca Harian
                    </span>
                    <strong className="text-slate-800 dark:text-slate-100 text-xs font-mono block">
                      50.000 Dokumen / Hari
                    </strong>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Kuota free tier harian untuk read query seluruh pengurus & warga.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-100 dark:border-slate-700/60 space-y-1">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
                      Batas Operasi Tulis Harian
                    </span>
                    <strong className="text-slate-800 dark:text-slate-100 text-xs font-mono block">
                      20.000 Dokumen / Hari
                    </strong>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Cukup untuk pencatatan kas, warga baru, iuran, surat & pengaduan.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-100 dark:border-slate-700/60 space-y-1">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
                      Enkripsi & Ketersediaan
                    </span>
                    <strong className="text-slate-800 dark:text-slate-100 text-xs font-mono block">
                      TLS 1.3 / AES-256 (99.99%)
                    </strong>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Data dienkripsi end-to-end dengan kepatuhan standar zero-trust Firestore.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: STORAGE & BACKUP (LOCAL STORAGE MANAGER) */}
          {activeTab === 'storage' && (
            <div className="space-y-4">
              {/* Storage Meter Card */}
              <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
                      <HardDrive className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 dark:text-slate-100 text-sm">
                        Memori Lokal Browser & Cache Offline
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Status penyimpanan data offline aplikasi di memori browser Android
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    {storageSizeKB} KB
                  </span>
                </div>

                {/* Storage Metric Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div className="bg-slate-50 dark:bg-slate-800/70 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/60 text-center">
                    <span className="text-[10px] text-slate-400 dark:text-slate-400 block font-semibold">Total Warga</span>
                    <span className="font-black text-slate-800 dark:text-slate-100 text-sm">{currentDb.warga.length}</span>
                    <span className="text-[9px] text-slate-400 block">Jiwa</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/70 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/60 text-center">
                    <span className="text-[10px] text-slate-400 dark:text-slate-400 block font-semibold">Kartu Keluarga</span>
                    <span className="font-black text-slate-800 dark:text-slate-100 text-sm">{currentDb.kk.length}</span>
                    <span className="text-[9px] text-slate-400 block">KK</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/70 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/60 text-center">
                    <span className="text-[10px] text-slate-400 dark:text-slate-400 block font-semibold">Buku Kas</span>
                    <span className="font-black text-slate-800 dark:text-slate-100 text-sm">{currentDb.kas.length}</span>
                    <span className="text-[9px] text-slate-400 block">Transaksi</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/70 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/60 text-center">
                    <span className="text-[10px] text-slate-400 dark:text-slate-400 block font-semibold">Arsip Surat</span>
                    <span className="font-black text-slate-800 dark:text-slate-100 text-sm">{currentDb.surat.length}</span>
                    <span className="text-[9px] text-slate-400 block">Surat</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 text-[11px] text-slate-600 dark:text-slate-400 bg-emerald-50/50 dark:bg-slate-800/50 p-3 rounded-2xl border border-emerald-100 dark:border-slate-700/50">
                  <Info className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    Aplikasi mendukung mode offline penuh. Data tetap tersimpan aman di HP meskipun tidak ada sinyal internet.
                  </span>
                </div>
              </div>

              {/* Action Buttons: Download & Upload Backup */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Download Backup */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                        <Download className="w-4 h-4" />
                      </div>
                      <h4 className="font-black text-slate-800 dark:text-slate-100 text-xs">
                        Download Backup (JSON)
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-snug">
                      Simpan salinan cadangan seluruh data warga dan keuangan ke folder Unduhan HP Anda.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleBackup}
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer text-xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download File JSON</span>
                  </button>
                </div>

                {/* Restore Backup */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center">
                        <Upload className="w-4 h-4" />
                      </div>
                      <h4 className="font-black text-slate-800 dark:text-slate-100 text-xs">
                        Pulihkan Database (Restore)
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-snug">
                      Muat ulang seluruh data RW dari file cadangan .json yang pernah diunduh sebelumnya.
                    </p>
                  </div>

                  <label className="w-full py-3 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer text-xs">
                    <Upload className="w-4 h-4" />
                    <span>Pilih File Backup JSON</span>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".json"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Reset to Initial (Super Admin Only) */}
              {isSuperAdmin && (
                <div className="bg-rose-50/60 dark:bg-rose-950/30 p-4 rounded-3xl border border-rose-200 dark:border-rose-900/60 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-black text-rose-800 dark:text-rose-300 block text-xs">
                        Reset ke Data Default Simulasi
                      </span>
                      <span className="text-[11px] text-rose-600/90 dark:text-rose-400 leading-snug block mt-0.5">
                        Khusus Admin RW: Mengembalikan seluruh data ke sampel awal RW 018.
                      </span>
                    </div>

                    {confirmReset ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setConfirmReset(false)}
                          className="px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer border border-slate-200 dark:border-slate-700"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={handleReset}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
                        >
                          Ya, Reset
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmReset(true)}
                        className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset Data</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
              {/* Card Keamanan & Perlindungan Sesi Idle */}
              <div className="bg-slate-50 dark:bg-slate-900/80 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center text-emerald-800 dark:text-emerald-300">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 dark:text-slate-100 text-sm">
                        Keamanan Sesi & Auto-Logout Otomatis
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Perlindungan data kependudukan dan privasi warga RW 018
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-mono">
                    5 Menit Idle Aktif
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Sistem dilengkapi sensor inaktivitas otomatis. Jika perangkat tidak disentuh, digerakkan, atau ditekan tombol selama <strong>5 menit (300 detik)</strong>, aplikasi akan mengunci sesi dan melakukan logout secara otomatis demi mencegah penyalahgunaan data warga saat perangkat ditinggalkan.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: TEMA TAMPILAN */}
          {activeTab === 'appearance' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
                      <Palette className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 dark:text-slate-100 text-sm">
                        Mode Tampilan Layar
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Pilih suasana visual terbaik untuk perangkat Android / Ponsel Anda
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-1">
                  <ThemeToggle variant="segmented" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold">
                    <Moon className="w-4 h-4" />
                    <span className="text-xs">Kenyamanan Mata</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    Mencegah silau saat memantau data di malam hari atau waktu ronda pos kamling.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                    <Monitor className="w-4 h-4" />
                    <span className="text-xs">Sinkron Sistem HP</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    Mode Sistem otomatis menyesuaikan tema dengan pengaturan Android Anda.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 font-bold">
                    <Smartphone className="w-4 h-4" />
                    <span className="text-xs">Hemat Baterai</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    Optimalisasi pixel gelap menghemat konsumsi baterai layar AMOLED ponsel.
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-100/80 dark:bg-slate-900/60 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  Pengaturan tema langsung diterapkan seketika tanpa perlu memuat ulang (refresh) halaman.
                </span>
              </div>
            </div>
          )}

          {/* TAB 4: PROFIL KEPENGURUSAN RW */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3.5">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-900 border-2 border-amber-400 shrink-0 shadow-sm flex items-center justify-center ring-2 ring-amber-400/20">
                    <img
                      src={profileForm.logoUrl || LOGO_RW_018}
                      alt="Logo RW 018"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      onError={handleLogoError}
                    />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 px-2 py-0.5 rounded-full uppercase">
                      Identitas Wilayah RW
                    </span>
                    <h4 className="font-black text-slate-800 dark:text-slate-100 text-sm mt-1">
                      {profileForm.namaRw || 'RW 018'} - {profileForm.kelurahan || 'Kelurahan'}
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Dicetak pada kop surat pengantar, kuitansi kas, dan banner Android.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">Nama RW *</label>
                    <input
                      type="text"
                      required
                      value={profileForm.namaRw}
                      onChange={(e) => setProfileForm({ ...profileForm, namaRw: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">Kelurahan / Desa *</label>
                    <input
                      type="text"
                      required
                      value={profileForm.kelurahan}
                      onChange={(e) => setProfileForm({ ...profileForm, kelurahan: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">Kecamatan</label>
                    <input
                      type="text"
                      value={profileForm.kecamatan}
                      onChange={(e) => setProfileForm({ ...profileForm, kecamatan: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">Kota / Kabupaten</label>
                    <input
                      type="text"
                      value={profileForm.kotaKab}
                      onChange={(e) => setProfileForm({ ...profileForm, kotaKab: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Pengurus Inti RW 018 */}
              <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <h4 className="font-black text-slate-800 dark:text-slate-100 text-xs">
                    Pengurus Inti RW 018
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">Nama Ketua RW *</label>
                    <input
                      type="text"
                      required
                      value={profileForm.namaKetuaRw}
                      onChange={(e) => setProfileForm({ ...profileForm, namaKetuaRw: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">No. WhatsApp / HP Ketua</label>
                    <input
                      type="text"
                      value={profileForm.noHpKetuaRw}
                      onChange={(e) => setProfileForm({ ...profileForm, noHpKetuaRw: e.target.value })}
                      placeholder="0812xxxxxxxx"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">Nama Sekretaris RW</label>
                    <input
                      type="text"
                      value={profileForm.namaSekretarisRw || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, namaSekretarisRw: e.target.value })}
                      placeholder="Contoh: Agung Prayoga"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">No. HP Sekretaris RW</label>
                    <input
                      type="text"
                      value={profileForm.noHpSekretarisRw || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, noHpSekretarisRw: e.target.value })}
                      placeholder="0812xxxxxxxx"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">Nama Bendahara RW</label>
                    <input
                      type="text"
                      value={profileForm.namaBendaharaRw || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, namaBendaharaRw: e.target.value })}
                      placeholder="Contoh: Diah Ika Putri"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">No. HP Bendahara RW</label>
                    <input
                      type="text"
                      value={profileForm.noHpBendaharaRw || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, noHpBendaharaRw: e.target.value })}
                      placeholder="0813xxxxxxxx"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Seksi Wilayah & Alamat */}
              <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <h4 className="font-black text-slate-800 dark:text-slate-100 text-xs">
                    Seksi Wilayah & Kantor Sekretariat
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">Seksi Keagamaan RW</label>
                    <input
                      type="text"
                      value={profileForm.namaSeksiKeagamaan || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, namaSeksiKeagamaan: e.target.value })}
                      placeholder="Contoh: Ust. Khaerudin"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">No. HP Seksi Keagamaan</label>
                    <input
                      type="text"
                      value={profileForm.noHpSeksiKeagamaan || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, noHpSeksiKeagamaan: e.target.value })}
                      placeholder="0852xxxxxxxx"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">Seksi Kebersihan & Lingkungan</label>
                    <input
                      type="text"
                      value={profileForm.namaSeksiKebersihan || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, namaSeksiKebersihan: e.target.value })}
                      placeholder="Contoh: Arif R Budiman"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">No. HP Seksi Kebersihan</label>
                    <input
                      type="text"
                      value={profileForm.noHpSeksiKebersihan || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, noHpSeksiKebersihan: e.target.value })}
                      placeholder="0813xxxxxxxx"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">Alamat Sekretariat / Kantor RW</label>
                  <textarea
                    rows={2}
                    value={profileForm.alamatKantor}
                    onChange={(e) => setProfileForm({ ...profileForm, alamatKantor: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-700/20 transition-all cursor-pointer text-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan Profil RW 018</span>
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Android Bottom Navigation Bar / Footer */}
        <div className="bg-white dark:bg-slate-900 px-4 sm:px-6 py-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[11px]">
            <Radio className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
            <span className="font-semibold">
              Kapasitas: <strong className="text-emerald-700 dark:text-emerald-400 font-mono">{metrics.totalSizeFormatted}</strong> • {metrics.totalDocs} Dokumen ({metrics.collections.length} Koleksi)
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:bg-slate-300 dark:active:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl font-bold transition-colors cursor-pointer text-xs"
          >
            Selesai
          </button>
        </div>

      </div>
    </div>
  );
};

