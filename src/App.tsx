import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  NavTab,
  RWProfile,
  Warga,
  KartuKeluarga,
  BansosItem,
  CadanganBansosItem,
  RkmItem,
  IuranRkmRecord,
  WargaMeninggalRecord,
  PerlengkapanRkmItem,
  KeamananProgramItem,
  JadwalRonda,
  AbsensiRondaRecord,
  UmkmItem,
  TransaksiKas,
  IuranWargaRecord,
  KegiatanItem,
  PengaduanItem,
  SuratItem,
  PbbRecord,
  AppUser,
  LaporanKejadian
} from './types';
import {
  getRWProfile,
  getWargaList,
  getKkList,
  getBansosList,
  getCadanganBansosList,
  getRkmList,
  getIuranRkmList,
  getWargaMeninggalList,
  getPerlengkapanRkmList,
  getKeamananList,
  getJadwalRondaList,
  getAbsensiRondaList,
  getUmkmList,
  getKasList,
  getIuranList,
  getKegiatanList,
  getPengaduanList,
  getSuratList,
  getPbbList,
  getLaporanKejadianList,
  saveWarga,
  deleteWarga,
  saveKk,
  deleteKk,
  saveBansos,
  deleteBansos,
  saveCadanganBansos,
  deleteCadanganBansos,
  saveRkm,
  deleteRkm,
  saveIuranRkm,
  deleteIuranRkm,
  saveWargaMeninggal,
  deleteWargaMeninggal,
  savePerlengkapanRkm,
  deletePerlengkapanRkm,
  saveKeamanan,
  deleteKeamanan,
  saveJadwalRonda,
  deleteJadwalRonda,
  saveAbsensiRonda,
  deleteAbsensiRonda,
  saveUmkm,
  deleteUmkm,
  saveKas,
  deleteKas,
  saveIuran,
  saveKegiatan,
  deleteKegiatan,
  savePengaduan,
  deletePengaduan,
  saveSurat,
  deleteSurat,
  savePbb,
  deletePbb,
  bayarPbbTahunBerjalan,
  bayarTunggakanPbb,
  saveLaporanKejadian,
  deleteLaporanKejadian,
  subscribeToStorage
} from './services/storage';
import {
  getCurrentUser,
  setCurrentUser,
  logoutUser,
  subscribeToAuth,
  canUserAccessTab,
  getRolePermission,
  isUserSuperAdmin
} from './services/auth';
import { useToast } from './context/ToastContext';

// UI Components
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { WargaView } from './components/WargaView';
import { KkView } from './components/KkView';
import { BansosView } from './components/BansosView';
import { KasIuranView } from './components/KasIuranView';
import { SuratView } from './components/SuratView';
import { RkmView } from './components/RkmView';
import { KeamananView } from './components/KeamananView';
import { UmkmView } from './components/UmkmView';
import { KegiatanView } from './components/KegiatanView';
import { PengaduanView } from './components/PengaduanView';
import { PbbView } from './components/PbbView';
import { PetaWilayahView } from './components/PetaWilayahView';
import { LaporanKejadianView } from './components/LaporanKejadianView';
import { MenuView } from './components/MenuView';
import { LoginView } from './components/LoginView';
import { AccessRestrictedView } from './components/AccessRestrictedView';

// Modals
import { DatabaseSettingsModal } from './components/DatabaseSettingsModal';
import { UserManagementModal } from './components/UserManagementModal';
import { HakAksesUserModal } from './components/HakAksesUserModal';
import { LetterPrintModal } from './components/LetterPrintModal';
import { KuitansiModal } from './components/KuitansiModal';
import { AndroidApkModal } from './components/AndroidApkModal';
import { EmergencyModal } from './components/EmergencyModal';
import { PetaWilayahModal } from './components/PetaWilayahModal';
import { IdleTimeoutModal } from './components/IdleTimeoutModal';
import { OfflineStatusBanner } from './components/OfflineStatusBanner';
import { useIdleAutoLogout } from './hooks/useIdleAutoLogout';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { Siren } from 'lucide-react';

export default function App() {
  const { showError, showInfo } = useToast();
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [tabHistory, setTabHistory] = useState<NavTab[]>(['dashboard']);
  const [searchQuery, setSearchQuery] = useState('');
  
  // User Authentication State
  const [currentUser, setCurrentUserState] = useState<AppUser | null>(getCurrentUser());
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [isHakAksesModalOpen, setIsHakAksesModalOpen] = useState(false);
  const [isPetaModalOpen, setIsPetaModalOpen] = useState(false);

  // Akses Khusus Super Admin (SA) untuk Hak Akses User
  const handleOpenHakAkses = () => {
    if (!isUserSuperAdmin(currentUser)) {
      showError(
        'Hanya User Super Admin (SA) yang bisa mengeklik menu ini dan mengaturnya.',
        'Akses Ditolak (Khusus SA)'
      );
      return;
    }
    setIsHakAksesModalOpen(true);
  };

  // Akses Pengaturan Database & Sinkronisasi (Dinonaktifkan untuk level Warga)
  const handleOpenSettings = () => {
    if (currentUser?.role === 'warga') {
      showError(
        'Fungsi Status Database & Sinkronisasi dinonaktifkan untuk pengguna level Warga.',
        'Akses Dinonaktifkan'
      );
      return;
    }
    setIsSettingsOpen(true);
  };

  // Akses Ubah Foto Profil & Kelola Akun (Dinonaktifkan untuk level Warga)
  const handleOpenUserManagement = () => {
    if (currentUser?.role === 'warga') {
      showError(
        'Fungsi Ubah Foto Profil & Kelola Akun dinonaktifkan untuk pengguna level Warga.',
        'Akses Dinonaktifkan'
      );
      return;
    }
    setIsUserManagementOpen(true);
  };

  // Data states
  const [profile, setProfile] = useState<RWProfile>(getRWProfile());
  const [wargaList, setWargaList] = useState<Warga[]>([]);
  const [kkList, setKkList] = useState<KartuKeluarga[]>([]);
  const [bansosList, setBansosList] = useState<BansosItem[]>([]);
  const [cadanganBansosList, setCadanganBansosList] = useState<CadanganBansosItem[]>([]);
  const [rkmList, setRkmList] = useState<RkmItem[]>([]);
  const [iuranRkmList, setIuranRkmList] = useState<IuranRkmRecord[]>([]);
  const [wargaMeninggalList, setWargaMeninggalList] = useState<WargaMeninggalRecord[]>([]);
  const [perlengkapanRkmList, setPerlengkapanRkmList] = useState<PerlengkapanRkmItem[]>([]);
  const [keamananList, setKeamananList] = useState<KeamananProgramItem[]>([]);
  const [jadwalRondaList, setJadwalRondaList] = useState<JadwalRonda[]>([]);
  const [absensiRondaList, setAbsensiRondaList] = useState<AbsensiRondaRecord[]>([]);
  const [umkmList, setUmkmList] = useState<UmkmItem[]>([]);
  const [kasList, setKasList] = useState<TransaksiKas[]>([]);
  const [iuranList, setIuranList] = useState<IuranWargaRecord[]>([]);
  const [kegiatanList, setKegiatanList] = useState<KegiatanItem[]>([]);
  const [pengaduanList, setPengaduanList] = useState<PengaduanItem[]>([]);
  const [suratList, setSuratList] = useState<SuratItem[]>([]);
  const [pbbList, setPbbList] = useState<PbbRecord[]>([]);
  const [laporanKejadianList, setLaporanKejadianList] = useState<LaporanKejadian[]>([]);

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAndroidModalOpen, setIsAndroidModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [selectedSuratForPrint, setSelectedSuratForPrint] = useState<SuratItem | null>(null);
  const [selectedIuranForPrint, setSelectedIuranForPrint] = useState<IuranWargaRecord | null>(null);
  const [initialWargaForSurat, setInitialWargaForSurat] = useState<Warga | null>(null);

  // Load all data from storage
  const refreshAllData = () => {
    setProfile(getRWProfile());
    setWargaList(getWargaList());
    setKkList(getKkList());
    setBansosList(getBansosList());
    setCadanganBansosList(getCadanganBansosList());
    setRkmList(getRkmList());
    setIuranRkmList(getIuranRkmList());
    setWargaMeninggalList(getWargaMeninggalList());
    setPerlengkapanRkmList(getPerlengkapanRkmList());
    setKeamananList(getKeamananList());
    setJadwalRondaList(getJadwalRondaList());
    setAbsensiRondaList(getAbsensiRondaList());
    setUmkmList(getUmkmList());
    setKasList(getKasList());
    setIuranList(getIuranList());
    setKegiatanList(getKegiatanList());
    setPengaduanList(getPengaduanList());
    setSuratList(getSuratList());
    setPbbList(getPbbList());
    setLaporanKejadianList(getLaporanKejadianList());
  };

  useEffect(() => {
    refreshAllData();
    const unsubscribeStorage = subscribeToStorage(() => {
      refreshAllData();
    });
    const unsubscribeAuth = subscribeToAuth((user) => {
      setCurrentUserState(user);
    });
    return () => {
      unsubscribeStorage();
      unsubscribeAuth();
    };
  }, []);

  // Cegah penutupan tab/browser tidak sengaja saat aplikasi aktif
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (currentUser) {
        e.preventDefault();
        e.returnValue = 'Aplikasi RW 018 sedang berjalan aktif. Apakah Anda yakin ingin keluar?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentUser]);

  const [autoLogoutNoticeMsg, setAutoLogoutNoticeMsg] = useState<string | null>(null);

  const handleLoginSuccess = (user: AppUser) => {
    setCurrentUserState(user);
    setIsLoginModalOpen(false);
    setAutoLogoutNoticeMsg(null);
    
    // Khusus peran warga langsung diarahkan ke menu surat
    if (user.role === 'warga') {
      setCurrentTab('surat');
      setTabHistory(['dashboard', 'surat']);
    } else if (!canUserAccessTab(user, currentTab)) {
      const perm = getRolePermission(user.role);
      const targetTab = perm.allowedTabs[0] || 'dashboard';
      setCurrentTab(targetTab);
      setTabHistory(['dashboard', targetTab]);
    }
  };

  // Logout Pengguna (Manual atau Auto-Logout Idle)
  const handleLogout = (reason?: string) => {
    logoutUser();
    setCurrentUserState(null);
    setCurrentTab('dashboard');
    setTabHistory(['dashboard']);
    setIsLoginModalOpen(false);

    if (reason === 'idle_5_minutes') {
      setAutoLogoutNoticeMsg(
        'Sesi Anda telah dikeluarkan secara otomatis karena tidak ada aktivitas selama 5 menit. Fitur keamanan ini aktif untuk melindungi kerahasiaan data kependudukan & kas warga RW 018 saat perangkat ditinggalkan tanpa pengawasan.'
      );
    } else {
      setAutoLogoutNoticeMsg(null);
    }
  };

  // Auto-Logout Otomatis Jika Idle Selama 5 Menit
  const {
    isWarningOpen: isIdleWarningOpen,
    secondsRemaining: idleSecondsRemaining,
    resetTimer: resetIdleTimer,
  } = useIdleAutoLogout({
    enabled: !!currentUser,
    onAutoLogout: () => handleLogout('idle_5_minutes'),
  });

  // Pemantau Koneksi & Status Mode Offline Pengurus RW
  const {
    isOnline,
    wasOffline,
    dismissBackOnlineNotice,
  } = useOnlineStatus();

  // Quick navigation helpers
  const handleNavigate = (tab: NavTab) => {
    // If logged in, check role permission
    if (currentUser && !canUserAccessTab(currentUser, tab)) {
      const perm = getRolePermission(currentUser.role);
      showError(
        `Fitur "${tab.toUpperCase()}" hanya dapat diakses oleh peran: ${perm.roleLabel}.`,
        'Akses Dibatasi'
      );
      return;
    }

    if (tab !== currentTab) {
      setTabHistory((prev) => [...prev, tab]);
    }
    setCurrentTab(tab);
    setSearchQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Back / Kembali ke halaman sebelumnya
  const handleBack = () => {
    if (tabHistory.length > 1) {
      const newHistory = [...tabHistory];
      newHistory.pop(); // remove current tab
      const previousTab = newHistory[newHistory.length - 1] || 'dashboard';
      setTabHistory(newHistory);
      setCurrentTab(previousTab);
    } else {
      setCurrentTab('dashboard');
      setTabHistory(['dashboard']);
    }
    setSearchQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateSuratForWarga = (warga: Warga) => {
    setInitialWargaForSurat(warga);
    handleNavigate('surat');
  };

  const unreadPengaduanCount = useMemo(() => {
    return pengaduanList.filter((p) => p.status === 'Masuk').length;
  }, [pengaduanList]);

  // If user is not authenticated, display full-screen LoginView to select role / enter credentials
  if (!currentUser) {
    return (
      <LoginView
        profile={profile}
        onLoginSuccess={handleLoginSuccess}
        currentUser={currentUser}
        autoLogoutMessage={autoLogoutNoticeMsg}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex justify-center text-slate-900 dark:text-slate-100 selection:bg-emerald-200 dark:selection:bg-emerald-900 transition-colors duration-200">
      {/* Mobile-first simulated container - expands nicely to tablet/desktop */}
      <div className="w-full max-w-5xl min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col relative shadow-xl border-x border-slate-200 dark:border-slate-800 transition-colors duration-200">
        {/* Sticky App Header */}
        <Header
          profile={profile}
          currentTab={currentTab}
          onNavigate={handleNavigate}
          onBack={handleBack}
          canGoBack={tabHistory.length > 1 || currentTab !== 'dashboard'}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenSettings={handleOpenSettings}
          onOpenAndroidModal={() => setIsAndroidModalOpen(true)}
          onOpenEmergencyModal={() => setIsEmergencyModalOpen(true)}
          currentUser={currentUser}
          onOpenLogin={() => setIsLoginModalOpen(true)}
          onLogout={handleLogout}
          onOpenUserManagement={handleOpenUserManagement}
          onOpenHakAkses={handleOpenHakAkses}
          unreadPengaduanCount={unreadPengaduanCount}
        />

        {/* Banner Mode Offline & Notifikasi Status Koneksi Pengurus RW */}
        <OfflineStatusBanner
          isOnline={isOnline}
          wasOffline={wasOffline}
          onDismissOnlineNotice={dismissBackOnlineNotice}
          cachedCounts={{
            warga: wargaList.length,
            kk: kkList.length,
            kas: kasList.length,
            bansos: bansosList.length,
          }}
          onRefreshData={refreshAllData}
        />

        {/* Main Content Area based on active tab with smooth motion transition */}
        <main className="flex-1 pb-20 pt-1 overflow-x-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
              className="w-full"
            >
              {currentUser && !canUserAccessTab(currentUser, currentTab) ? (
                <AccessRestrictedView
                  currentUser={currentUser}
                  requestedTab={currentTab}
                  onNavigateHome={() => handleNavigate('dashboard')}
                  onNavigateTab={handleNavigate}
                  onOpenLogin={() => setIsLoginModalOpen(true)}
                />
              ) : (
                <>
                  {currentTab === 'dashboard' && (
                <DashboardView
                  profile={profile}
                  wargaList={wargaList}
                  kkList={kkList}
                  bansosList={bansosList}
                  rkmList={rkmList}
                  umkmList={umkmList}
                  kasList={kasList}
                  iuranList={iuranList}
                  kegiatanList={kegiatanList}
                  pengaduanList={pengaduanList}
                  suratList={suratList}
                  pbbList={pbbList}
                  currentUser={currentUser}
                  onNavigate={handleNavigate}
                  onNavigateTab={(tab) => handleNavigate(tab as NavTab)}
                  onCreateSurat={handleCreateSuratForWarga}
                  onSelectKk={(noKk) => {
                    setSearchQuery(noKk);
                    handleNavigate('kk');
                  }}
                  onNavigateWargaWithSearch={(query) => {
                    setSearchQuery(query);
                    handleNavigate('warga');
                  }}
                  onOpenNewSurat={() => handleNavigate('surat')}
                  onOpenNewWarga={() => handleNavigate('warga')}
                  onOpenNewKas={() => handleNavigate('kas')}
                  onOpenDatabaseModal={() => setIsSettingsOpen(true)}
                  onOpenAndroidModal={() => setIsAndroidModalOpen(true)}
                  onOpenLogin={() => setIsLoginModalOpen(true)}
                />
              )}

              {currentTab === 'warga' && (
                <WargaView
                  profile={profile}
                  wargaList={wargaList}
                  kkList={kkList}
                  onSaveWarga={saveWarga}
                  onDeleteWarga={deleteWarga}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onSelectKk={(noKk) => {
                    setSearchQuery(noKk);
                    handleNavigate('kk');
                  }}
                  onCreateSurat={handleCreateSuratForWarga}
                  currentUser={currentUser}
                />
              )}

              {currentTab === 'kk' && (
                <KkView
                  profile={profile}
                  kkList={kkList}
                  wargaList={wargaList}
                  bansosList={bansosList}
                  onSaveKk={saveKk}
                  onDeleteKk={deleteKk}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onSelectWarga={(warga) => {
                    setSearchQuery(warga.nik);
                    handleNavigate('warga');
                  }}
                  currentUser={currentUser}
                />
              )}

              {currentTab === 'bansos' && (
                <BansosView
                  profile={profile}
                  bansosList={bansosList}
                  cadanganBansosList={cadanganBansosList}
                  wargaList={wargaList}
                  onSaveBansos={saveBansos}
                  onDeleteBansos={deleteBansos}
                  onSaveCadanganBansos={saveCadanganBansos}
                  onDeleteCadanganBansos={deleteCadanganBansos}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  currentUser={currentUser}
                />
              )}

              {currentTab === 'kas' && (
                <KasIuranView
                  profile={profile}
                  kasList={kasList}
                  iuranList={iuranList}
                  kkList={kkList}
                  onSaveKas={saveKas}
                  onDeleteKas={deleteKas}
                  onSaveIuran={saveIuran}
                  onOpenKuitansi={(iuran) => setSelectedIuranForPrint(iuran)}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                />
              )}

              {currentTab === 'pbb' && (
                <PbbView
                  profile={profile}
                  pbbList={pbbList}
                  wargaList={wargaList}
                  kkList={kkList}
                  onSavePbb={savePbb}
                  onDeletePbb={deletePbb}
                  onBayarPbb={bayarPbbTahunBerjalan}
                  onBayarTunggakan={bayarTunggakanPbb}
                  currentUser={currentUser}
                />
              )}

              {currentTab === 'surat' && (
                <SuratView
                  profile={profile}
                  suratList={suratList}
                  wargaList={wargaList}
                  onSaveSurat={saveSurat}
                  onDeleteSurat={deleteSurat}
                  onOpenPrintModal={(surat) => setSelectedSuratForPrint(surat)}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  initialSelectedWarga={initialWargaForSurat}
                  currentUser={currentUser}
                  onSavePengaduan={savePengaduan}
                />
              )}

              {currentTab === 'rkm' && (
                <RkmView
                  profile={profile}
                  iuranRkmList={iuranRkmList}
                  wargaMeninggalList={wargaMeninggalList}
                  perlengkapanRkmList={perlengkapanRkmList}
                  wargaList={wargaList}
                  kkList={kkList}
                  onSaveIuranRkm={saveIuranRkm}
                  onDeleteIuranRkm={deleteIuranRkm}
                  onSaveWargaMeninggal={saveWargaMeninggal}
                  onDeleteWargaMeninggal={deleteWargaMeninggal}
                  onSavePerlengkapanRkm={savePerlengkapanRkm}
                  onDeletePerlengkapanRkm={deletePerlengkapanRkm}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onCreateSuratKematian={(w) => {
                    const found = wargaList.find((wg) => wg.nik === w.nik);
                    if (found) {
                      handleCreateSuratForWarga(found);
                    } else {
                      setCurrentTab('surat');
                    }
                  }}
                />
              )}

              {currentTab === 'keamanan' && (
                <KeamananView
                  profile={profile}
                  keamananList={keamananList}
                  onSaveKeamanan={saveKeamanan}
                  onDeleteKeamanan={deleteKeamanan}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  currentUser={currentUser}
                  wargaList={wargaList}
                  jadwalRondaList={jadwalRondaList}
                  absensiRondaList={absensiRondaList}
                  onSaveJadwalRonda={saveJadwalRonda}
                  onDeleteJadwalRonda={deleteJadwalRonda}
                  onSaveAbsensiRonda={saveAbsensiRonda}
                  onDeleteAbsensiRonda={deleteAbsensiRonda}
                  laporanKejadianList={laporanKejadianList}
                  onSaveLaporanKejadian={saveLaporanKejadian}
                  onDeleteLaporanKejadian={deleteLaporanKejadian}
                  onNavigateTab={handleNavigate}
                />
              )}

              {currentTab === 'laporan_kejadian' && (
                <LaporanKejadianView
                  profile={profile}
                  laporanList={laporanKejadianList}
                  onSaveLaporan={saveLaporanKejadian}
                  onDeleteLaporan={deleteLaporanKejadian}
                  currentUser={currentUser}
                  onBackToKeamanan={() => handleNavigate('keamanan')}
                />
              )}

              {currentTab === 'umkm' && (
                <UmkmView
                  profile={profile}
                  umkmList={umkmList}
                  wargaList={wargaList}
                  onSaveUMKM={saveUmkm}
                  onDeleteUMKM={deleteUmkm}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                />
              )}

              {currentTab === 'kegiatan' && (
                <KegiatanView
                  profile={profile}
                  kegiatanList={kegiatanList}
                  onSaveKegiatan={saveKegiatan}
                  onDeleteKegiatan={deleteKegiatan}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  currentUser={currentUser}
                />
              )}

              {currentTab === 'pengaduan' && (
                <PengaduanView
                  profile={profile}
                  pengaduanList={pengaduanList}
                  wargaList={wargaList}
                  onSavePengaduan={savePengaduan}
                  onDeletePengaduan={deletePengaduan}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  currentUser={currentUser}
                />
              )}

              {currentTab === 'peta' && (
                <PetaWilayahView
                  profile={profile}
                  currentUser={currentUser}
                  onNavigateToTab={handleNavigate}
                />
              )}

              {currentTab === 'menu' && (
                <MenuView
                  profile={profile}
                  currentTab={currentTab}
                  onNavigate={handleNavigate}
                  onOpenSettings={handleOpenSettings}
                  onOpenAndroidModal={() => setIsAndroidModalOpen(true)}
                  onOpenEmergencyModal={() => setIsEmergencyModalOpen(true)}
                  currentUser={currentUser}
                  onOpenLogin={() => setIsLoginModalOpen(true)}
                  onLogout={handleLogout}
                  onOpenUserManagement={handleOpenUserManagement}
                  onOpenHakAkses={handleOpenHakAkses}
                  counts={{
                    warga: wargaList.length,
                    kk: kkList.length,
                    bansos: bansosList.length,
                    rkm: iuranRkmList.length + wargaMeninggalList.length + perlengkapanRkmList.length,
                    keamanan: keamananList.length,
                    umkm: umkmList.length,
                    kas: kasList.length,
                    pbb: pbbList.length,
                    kegiatan: kegiatanList.length,
                    pengaduan: pengaduanList.length,
                    surat: suratList.length,
                    laporanKejadian: laporanKejadianList.length,
                  }}
                />
              )}
            </>
          )}
        </motion.div>
          </AnimatePresence>
        </main>

        {/* Sticky Android Bottom Navigation */}
        <BottomNav
          currentTab={currentTab}
          onTabChange={handleNavigate}
          unreadPengaduanCount={unreadPengaduanCount}
          currentUser={currentUser}
          onOpenLogin={() => setIsLoginModalOpen(true)}
        />

        {/* Modals */}
        <PetaWilayahModal
          isOpen={isPetaModalOpen}
          onClose={() => setIsPetaModalOpen(false)}
          profile={profile}
        />

        <EmergencyModal
          isOpen={isEmergencyModalOpen}
          onClose={() => setIsEmergencyModalOpen(false)}
          profile={profile}
          onNavigateToPengaduan={() => {
            setIsEmergencyModalOpen(false);
            handleNavigate('pengaduan');
          }}
        />

        <DatabaseSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          profile={profile}
          onUpdateProfile={setProfile}
          onRefreshData={refreshAllData}
          currentUser={currentUser}
        />

        {/* User Management Modal for Admin */}
        <UserManagementModal
          isOpen={isUserManagementOpen}
          onClose={() => setIsUserManagementOpen(false)}
          currentUser={currentUser}
          onUserChanged={() => setCurrentUserState(getCurrentUser())}
          onOpenHakAkses={handleOpenHakAkses}
        />

        {/* Hak Akses User Modal (Khusus Super Admin / SA) */}
        <HakAksesUserModal
          isOpen={isHakAksesModalOpen}
          onClose={() => setIsHakAksesModalOpen(false)}
          currentUser={currentUser}
          onOpenUserManagement={() => {
            setIsHakAksesModalOpen(false);
            handleOpenUserManagement();
          }}
        />

        {/* Login / Switch Account Modal */}
        {isLoginModalOpen && (
          <LoginView
            profile={profile}
            onLoginSuccess={handleLoginSuccess}
            isModal={true}
            onClose={() => setIsLoginModalOpen(false)}
            currentUser={currentUser}
          />
        )}

        <LetterPrintModal
          surat={selectedSuratForPrint}
          profile={profile}
          onClose={() => setSelectedSuratForPrint(null)}
        />

        <KuitansiModal
          iuran={selectedIuranForPrint}
          profile={profile}
          onClose={() => setSelectedIuranForPrint(null)}
        />

        <AndroidApkModal
          isOpen={isAndroidModalOpen}
          onClose={() => setIsAndroidModalOpen(false)}
          profile={profile}
        />

        {/* Security Auto-Logout Idle Warning Modal (5 Menit) */}
        <IdleTimeoutModal
          isOpen={isIdleWarningOpen}
          secondsRemaining={idleSecondsRemaining}
          onStayLoggedIn={resetIdleTimer}
          onLogoutNow={() => handleLogout()}
          currentUser={currentUser}
        />
      </div>
    </div>
  );
}
