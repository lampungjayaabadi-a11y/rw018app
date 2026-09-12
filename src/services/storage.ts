import {
  Warga,
  KartuKeluarga,
  IuranRkmRecord,
  WargaMeninggalRecord,
  PerlengkapanRkmItem,
  KeamananProgramItem,
  BansosItem,
  CadanganBansosItem,
  UmkmItem,
  TransaksiKas,
  IuranWargaRecord,
  KegiatanRw,
  PengaduanWarga,
  SuratItem,
  RWProfile,
  PbbRecord,
  MetodeBayarPbb,
  JadwalRonda,
  AbsensiRondaRecord,
  LaporanKejadian
} from '../types';
import {
  initialRWProfile,
  initialWarga,
  initialKK,
  initialIuranRKM,
  initialWargaMeninggal,
  initialPerlengkapanRKM,
  initialKeamananProgram,
  initialBansos,
  initialCadanganBansos,
  initialUMKM,
  initialTransaksiKas,
  initialIuranWarga,
  initialKegiatan,
  initialPengaduan,
  initialSurat,
  initialPbb
} from '../data/initialData';
import { initialJadwalRonda, initialAbsensiRonda } from '../data/initialRondaData';
import { initialLaporanKejadian } from '../data/initialLaporanKejadian';
import { generateNextNomorLaporan } from '../utils/laporanKejadianUtils';
import { initialUsers } from '../data/initialUsers';
import { safeStorage } from '../utils/safeStorage';
import { generateId } from '../utils/formatters';
import {
  saveDocumentOnline,
  deleteDocumentOnline,
  subscribeToCollection,
  subscribeToDocument,
  db
} from './firebase';
import { triggerGlobalToast } from '../context/ToastContext';

// Helper feedback notifikasi Toast / Banner saat simpan & hapus data
export function notifySave(entityName: string, detail?: string) {
  triggerGlobalToast(
    detail || `Data ${entityName} berhasil disimpan ke database.`,
    'success',
    'Data Berhasil Disimpan'
  );
}

export function notifyDelete(entityName: string, detail?: string) {
  triggerGlobalToast(
    detail || `Data ${entityName} berhasil dihapus dari sistem.`,
    'delete',
    'Data Berhasil Dihapus'
  );
}

const STORAGE_KEYS = {
  PROFILE: 'rw018_metro_db_profile',
  WARGA: 'rw018_metro_db_warga',
  KK: 'rw018_metro_db_kk',
  IURAN_RKM: 'rw018_metro_db_iuran_rkm',
  WARGA_MENINGGAL: 'rw018_metro_db_warga_meninggal',
  PERLENGKAPAN_RKM: 'rw018_metro_db_perlengkapan_rkm',
  KEAMANAN: 'rw018_metro_db_keamanan_pembangunan',
  BANSOS: 'rw018_metro_db_bansos',
  CADANGAN_BANSOS: 'rw018_metro_db_cadangan_bansos',
  UMKM: 'rw018_metro_db_umkm',
  KAS: 'rw018_metro_db_kas',
  IURAN: 'rw018_metro_db_iuran',
  PBB: 'rw018_metro_db_pbb_v1',
  KEGIATAN: 'rw018_metro_db_kegiatan',
  PENGADUAN: 'rw018_metro_db_pengaduan',
  SURAT: 'rw018_metro_db_surat',
  JADWAL_RONDA: 'rw018_metro_db_jadwal_ronda',
  ABSENSI_RONDA: 'rw018_metro_db_absensi_ronda',
  LAPORAN_KEJADIAN: 'rw018_metro_db_laporan_kejadian',
  INITIALIZED: 'rw018_metro_db_init_v4_iringmulyo',
};

type Listener = () => void;
const listeners = new Set<Listener>();

function notifyChange() {
  listeners.forEach((l) => l());
}

export function subscribeToDB(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = safeStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Error reading ${key} from storage`, error);
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    safeStorage.setItem(key, JSON.stringify(value));
    notifyChange();
  } catch (error) {
    console.error(`Error saving ${key} to storage`, error);
  }
}

// Helper sanitasi RT dari data lama atau input yang tidak valid
function sanitizeRtValue(rtValue: string | undefined, defaultRt = '039'): string {
  if (!rtValue || rtValue === '001' || rtValue === '1' || rtValue === '01') {
    return defaultRt;
  }
  return rtValue;
}

// Track if online sync has initialized
let hasInitializedFirestoreListeners = false;

export function initFirestoreRealtimeSync() {
  if (hasInitializedFirestoreListeners) return;
  hasInitializedFirestoreListeners = true;

  try {
    // 1. Profile Doc Sync
    subscribeToDocument<RWProfile>('profile', 'rw018_main', (cloudProfile) => {
      if (cloudProfile && cloudProfile.namaRw) {
        setItem(STORAGE_KEYS.PROFILE, cloudProfile);
      }
    });

    // 2. Warga Sync
    subscribeToCollection<Warga>('warga', (cloudWarga) => {
      if (cloudWarga && cloudWarga.length > 0) {
        setItem(STORAGE_KEYS.WARGA, cloudWarga);
      }
    });

    // 3. KK Sync
    subscribeToCollection<KartuKeluarga>('kk', (cloudKk) => {
      if (cloudKk && cloudKk.length > 0) {
        setItem(STORAGE_KEYS.KK, cloudKk);
      }
    });

    // 4. Kas Sync
    subscribeToCollection<TransaksiKas>('kas', (cloudKas) => {
      if (cloudKas && cloudKas.length > 0) {
        setItem(STORAGE_KEYS.KAS, cloudKas);
      }
    });

    // 5. Iuran Sync
    subscribeToCollection<IuranWargaRecord>('iuran', (cloudIuran) => {
      if (cloudIuran && cloudIuran.length > 0) {
        setItem(STORAGE_KEYS.IURAN, cloudIuran);
      }
    });

    // 6. Iuran RKM Sync
    subscribeToCollection<IuranRkmRecord>('iuran_rkm', (cloudRkm) => {
      if (cloudRkm && cloudRkm.length > 0) {
        setItem(STORAGE_KEYS.IURAN_RKM, cloudRkm);
      }
    });

    // 7. Warga Meninggal Sync
    subscribeToCollection<WargaMeninggalRecord>('warga_meninggal', (cloudMeninggal) => {
      if (cloudMeninggal && cloudMeninggal.length > 0) {
        setItem(STORAGE_KEYS.WARGA_MENINGGAL, cloudMeninggal);
      }
    });

    // 8. Perlengkapan RKM Sync
    subscribeToCollection<PerlengkapanRkmItem>('perlengkapan_rkm', (cloudPerlengkapan) => {
      if (cloudPerlengkapan && cloudPerlengkapan.length > 0) {
        setItem(STORAGE_KEYS.PERLENGKAPAN_RKM, cloudPerlengkapan);
      }
    });

    // 9. Keamanan Sync
    subscribeToCollection<KeamananProgramItem>('keamanan', (cloudKeamanan) => {
      if (cloudKeamanan && cloudKeamanan.length > 0) {
        setItem(STORAGE_KEYS.KEAMANAN, cloudKeamanan);
      }
    });

    // 10. Bansos Sync
    subscribeToCollection<BansosItem>('bansos', (cloudBansos) => {
      if (cloudBansos && cloudBansos.length > 0) {
        setItem(STORAGE_KEYS.BANSOS, cloudBansos);
      }
    });

    // 10.b Cadangan Bansos Sync
    subscribeToCollection<CadanganBansosItem>('cadangan_bansos', (cloudCadangan) => {
      if (cloudCadangan && cloudCadangan.length > 0) {
        setItem(STORAGE_KEYS.CADANGAN_BANSOS, cloudCadangan);
      }
    });

    // 11. UMKM Sync
    subscribeToCollection<UmkmItem>('umkm', (cloudUmkm) => {
      if (cloudUmkm && cloudUmkm.length > 0) {
        setItem(STORAGE_KEYS.UMKM, cloudUmkm);
      }
    });

    // 12. Kegiatan Sync
    subscribeToCollection<KegiatanRw>('kegiatan', (cloudKegiatan) => {
      if (cloudKegiatan && cloudKegiatan.length > 0) {
        setItem(STORAGE_KEYS.KEGIATAN, cloudKegiatan);
      }
    });

    // 13. Pengaduan Sync
    subscribeToCollection<PengaduanWarga>('pengaduan', (cloudPengaduan) => {
      if (cloudPengaduan && cloudPengaduan.length > 0) {
        setItem(STORAGE_KEYS.PENGADUAN, cloudPengaduan);
      }
    });

    // 14. Surat Sync
    subscribeToCollection<SuratItem>('surat', (cloudSurat) => {
      if (cloudSurat && cloudSurat.length > 0) {
        setItem(STORAGE_KEYS.SURAT, cloudSurat);
      }
    });

    // 15. PBB Sync
    subscribeToCollection<PbbRecord>('pbb', (cloudPbb) => {
      if (cloudPbb && cloudPbb.length > 0) {
        setItem(STORAGE_KEYS.PBB, cloudPbb);
      }
    });

    // 16. Jadwal Ronda Sync
    subscribeToCollection<JadwalRonda>('jadwal_ronda', (cloudJadwal) => {
      if (cloudJadwal && cloudJadwal.length > 0) {
        setItem(STORAGE_KEYS.JADWAL_RONDA, cloudJadwal);
      }
    });

    // 17. Absensi Ronda Sync
    subscribeToCollection<AbsensiRondaRecord>('absensi_ronda', (cloudAbsensi) => {
      if (cloudAbsensi && cloudAbsensi.length > 0) {
        setItem(STORAGE_KEYS.ABSENSI_RONDA, cloudAbsensi);
      }
    });

    // 18. Laporan Kejadian Sync
    subscribeToCollection<LaporanKejadian>('laporan_kejadian', (cloudLaporan) => {
      if (cloudLaporan && cloudLaporan.length > 0) {
        setItem(STORAGE_KEYS.LAPORAN_KEJADIAN, cloudLaporan);
      }
    });

    console.log('[Firestore] Real-time listeners established across all 18 RW 018 collections.');
  } catch (err) {
    console.warn('[Firestore] Could not start realtime listeners:', err);
  }
}

// Auto-run realtime sync on load
if (typeof window !== 'undefined') {
  initFirestoreRealtimeSync();
}

export function initializeDatabaseIfNeeded() {
  const isInit = safeStorage.getItem(STORAGE_KEYS.INITIALIZED);
  if (!isInit) {
    safeStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(initialRWProfile));
    safeStorage.setItem(STORAGE_KEYS.WARGA, JSON.stringify(initialWarga));
    safeStorage.setItem(STORAGE_KEYS.KK, JSON.stringify(initialKK));
    safeStorage.setItem(STORAGE_KEYS.IURAN_RKM, JSON.stringify(initialIuranRKM));
    safeStorage.setItem(STORAGE_KEYS.WARGA_MENINGGAL, JSON.stringify(initialWargaMeninggal));
    safeStorage.setItem(STORAGE_KEYS.PERLENGKAPAN_RKM, JSON.stringify(initialPerlengkapanRKM));
    safeStorage.setItem(STORAGE_KEYS.KEAMANAN, JSON.stringify(initialKeamananProgram));
    safeStorage.setItem(STORAGE_KEYS.BANSOS, JSON.stringify(initialBansos));
    safeStorage.setItem(STORAGE_KEYS.UMKM, JSON.stringify(initialUMKM));
    safeStorage.setItem(STORAGE_KEYS.KAS, JSON.stringify(initialTransaksiKas));
    safeStorage.setItem(STORAGE_KEYS.IURAN, JSON.stringify(initialIuranWarga));
    safeStorage.setItem(STORAGE_KEYS.PBB, JSON.stringify(initialPbb));
    safeStorage.setItem(STORAGE_KEYS.KEGIATAN, JSON.stringify(initialKegiatan));
    safeStorage.setItem(STORAGE_KEYS.PENGADUAN, JSON.stringify(initialPengaduan));
    safeStorage.setItem(STORAGE_KEYS.SURAT, JSON.stringify(initialSurat));
    safeStorage.setItem(STORAGE_KEYS.JADWAL_RONDA, JSON.stringify(initialJadwalRonda));
    safeStorage.setItem(STORAGE_KEYS.ABSENSI_RONDA, JSON.stringify(initialAbsensiRonda));
    safeStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  }

  // Inisialisasi mandiri untuk Jadwal Ronda & Absensi Ronda jika belum ada di storage
  if (!safeStorage.getItem(STORAGE_KEYS.JADWAL_RONDA)) {
    safeStorage.setItem(STORAGE_KEYS.JADWAL_RONDA, JSON.stringify(initialJadwalRonda));
  }
  if (!safeStorage.getItem(STORAGE_KEYS.ABSENSI_RONDA)) {
    safeStorage.setItem(STORAGE_KEYS.ABSENSI_RONDA, JSON.stringify(initialAbsensiRonda));
  }

  // Migrasi perbaikan otomatis bila ada data lama yang tersimpan dengan RT 001
  try {
    const rawWarga = safeStorage.getItem(STORAGE_KEYS.WARGA);
    if (rawWarga && rawWarga.includes('"rt":"001"')) {
      const parsed: Warga[] = JSON.parse(rawWarga);
      const cleaned = parsed.map((w) => ({
        ...w,
        rt: sanitizeRtValue(w.rt, '039'),
        alamat: w.alamat ? w.alamat.replace(/RT 001/g, `RT ${sanitizeRtValue(w.rt, '039')}`) : w.alamat,
      }));
      safeStorage.setItem(STORAGE_KEYS.WARGA, JSON.stringify(cleaned));
    }

    const rawKK = safeStorage.getItem(STORAGE_KEYS.KK);
    if (rawKK && rawKK.includes('"rt":"001"')) {
      const parsed: KartuKeluarga[] = JSON.parse(rawKK);
      const cleaned = parsed.map((k) => ({
        ...k,
        rt: sanitizeRtValue(k.rt, '039'),
        alamat: k.alamat ? k.alamat.replace(/RT 001/g, `RT ${sanitizeRtValue(k.rt, '039')}`) : k.alamat,
      }));
      safeStorage.setItem(STORAGE_KEYS.KK, JSON.stringify(cleaned));
    }

    const rawSurat = safeStorage.getItem(STORAGE_KEYS.SURAT);
    if (rawSurat && rawSurat.includes('"rt":"001"')) {
      const parsed: SuratItem[] = JSON.parse(rawSurat);
      const cleaned = parsed.map((s) => ({
        ...s,
        rt: sanitizeRtValue(s.rt, '039'),
        alamat: s.alamat ? s.alamat.replace(/RT 001/g, `RT ${sanitizeRtValue(s.rt, '039')}`) : s.alamat,
      }));
      safeStorage.setItem(STORAGE_KEYS.SURAT, JSON.stringify(cleaned));
    }

    const rawUmkm = safeStorage.getItem(STORAGE_KEYS.UMKM);
    if (rawUmkm && rawUmkm.includes('"rt":"001"')) {
      const parsed: UmkmItem[] = JSON.parse(rawUmkm);
      const cleaned = parsed.map((u) => ({
        ...u,
        rt: sanitizeRtValue(u.rt, '039'),
        alamatUsaha: u.alamatUsaha ? u.alamatUsaha.replace(/RT 001/g, `RT ${sanitizeRtValue(u.rt, '039')}`) : u.alamatUsaha,
      }));
      safeStorage.setItem(STORAGE_KEYS.UMKM, JSON.stringify(cleaned));
    }

    const rawBansos = safeStorage.getItem(STORAGE_KEYS.BANSOS);
    if (rawBansos && rawBansos.includes('"rt":"001"')) {
      const parsed: BansosItem[] = JSON.parse(rawBansos);
      const cleaned = parsed.map((b) => ({
        ...b,
        rt: sanitizeRtValue(b.rt, '039'),
      }));
      safeStorage.setItem(STORAGE_KEYS.BANSOS, JSON.stringify(cleaned));
    }

    const rawPengaduan = safeStorage.getItem(STORAGE_KEYS.PENGADUAN);
    if (rawPengaduan && rawPengaduan.includes('"rt":"001"')) {
      const parsed: PengaduanWarga[] = JSON.parse(rawPengaduan);
      const cleaned = parsed.map((p) => ({
        ...p,
        rt: sanitizeRtValue(p.rt, '039'),
        lokasiSpesifik: p.lokasiSpesifik ? p.lokasiSpesifik.replace(/RT 001/g, `RT ${sanitizeRtValue(p.rt, '039')}`) : p.lokasiSpesifik,
      }));
      safeStorage.setItem(STORAGE_KEYS.PENGADUAN, JSON.stringify(cleaned));
    }

    // Sinkronisasi otomatis awal data Kepala Keluarga dari Data Induk Warga ke Data KK
    const isKkSynced = safeStorage.getItem('rw018_metro_kk_synced_v1');
    if (!isKkSynced) {
      syncAllKepalaKeluargaToKk()
        .then(() => {
          safeStorage.setItem('rw018_metro_kk_synced_v1', 'true');
        })
        .catch((e) => console.warn('Initial KK sync error', e));
    }
  } catch (e) {
    console.error('Data migration error', e);
  }
}

// Profile
export function getRWProfile(): RWProfile {
  const loaded = getItem<RWProfile>(STORAGE_KEYS.PROFILE, initialRWProfile);
  return {
    ...initialRWProfile,
    ...loaded,
    id: loaded.id || 'rw018_main',
    namaKetuaRw: loaded.namaKetuaRw || initialRWProfile.namaKetuaRw,
    namaSekretarisRw: loaded.namaSekretarisRw || initialRWProfile.namaSekretarisRw,
    namaBendaharaRw: loaded.namaBendaharaRw || initialRWProfile.namaBendaharaRw,
    namaSeksiKeagamaan: loaded.namaSeksiKeagamaan || initialRWProfile.namaSeksiKeagamaan,
    namaSeksiKebersihan: loaded.namaSeksiKebersihan || initialRWProfile.namaSeksiKebersihan,
    noHpSeksiKeagamaan: loaded.noHpSeksiKeagamaan || initialRWProfile.noHpSeksiKeagamaan,
    noHpSeksiKebersihan: loaded.noHpSeksiKebersihan || initialRWProfile.noHpSeksiKebersihan,
    nikKetuaRw: loaded.nikKetuaRw || initialRWProfile.nikKetuaRw,
    noHpKetuaRw: loaded.noHpKetuaRw || initialRWProfile.noHpKetuaRw,
    logoUrl: loaded.logoUrl || '/logo-rw-018.png',
    kontakDarurat: loaded.kontakDarurat || initialRWProfile.kontakDarurat,
    pengurusRkm: loaded.pengurusRkm || initialRWProfile.pengurusRkm,
    daftarRtInfo: loaded.daftarRtInfo || initialRWProfile.daftarRtInfo,
  };
}
export async function saveRWProfile(profile: RWProfile): Promise<boolean> {
  const profileWithId: RWProfile = {
    ...profile,
    id: 'rw018_main',
  };
  setItem(STORAGE_KEYS.PROFILE, profileWithId);
  notifySave('Profil RW 018', 'Profil kepengurusan RW 018 berhasil disimpan.');
  return await saveDocumentOnline('profile', 'rw018_main', profileWithId);
}

// Warga
export function getWargaList(): Warga[] {
  const list = getItem<Warga[]>(STORAGE_KEYS.WARGA, initialWarga);
  return list.map((w) => ({
    ...w,
    rt: sanitizeRtValue(w.rt, '039'),
    alamat: w.alamat ? w.alamat.replace(/RT 001/g, `RT ${sanitizeRtValue(w.rt, '039')}`) : w.alamat,
  }));
}
export async function saveWarga(warga: Warga): Promise<boolean> {
  const list = getWargaList();
  const sanitizedWarga: Warga = {
    ...warga,
    rt: sanitizeRtValue(warga.rt, '039'),
    alamat: warga.alamat ? warga.alamat.replace(/RT 001/g, `RT ${sanitizeRtValue(warga.rt, '039')}`) : warga.alamat,
  };
  const index = list.findIndex((w) => w.id === sanitizedWarga.id);
  const isNew = index < 0;
  if (index >= 0) {
    list[index] = sanitizedWarga;
  } else {
    list.unshift(sanitizedWarga);
  }
  setItem(STORAGE_KEYS.WARGA, list);

  // SINKRONISASI OTOMATIS: Bila Status Kedudukan Keluarga adalah "Kepala Keluarga",
  // Seluruh data detailnya diintegrasikan dan disinkronkan langsung ke Data Kartu Keluarga (KK).
  if (sanitizedWarga.statusKeluarga === 'Kepala Keluarga') {
    try {
      await syncKepalaKeluargaToKkDirect(sanitizedWarga, list);
    } catch (syncErr) {
      console.warn('Gagal sinkronisasi Kepala Keluarga ke KK:', syncErr);
    }
  } else if (sanitizedWarga.noKk) {
    // Jika bukan Kepala Keluarga, perbarui data anggota pada KK yang bersangkutan
    try {
      const kkList = getKKList();
      const kkIndex = kkList.findIndex((k) => k.noKk === sanitizedWarga.noKk);
      if (kkIndex >= 0) {
        const familyMembers = list.filter((w) => w.noKk === sanitizedWarga.noKk);
        const updatedKk: KartuKeluarga = {
          ...kkList[kkIndex],
          jumlahAnggota: Math.max(familyMembers.length, 1),
          anggotaIds: familyMembers.map((w) => w.nik),
        };
        kkList[kkIndex] = updatedKk;
        setItem(STORAGE_KEYS.KK, kkList);
        saveDocumentOnline('kk', updatedKk.id, updatedKk).catch(() => {});
      }
    } catch (e) {
      console.warn('Gagal memperbarui anggota KK:', e);
    }
  }

  notifySave(
    'Data Warga',
    sanitizedWarga.statusKeluarga === 'Kepala Keluarga'
      ? `Data warga "${sanitizedWarga.nama}" berhasil disimpan & seluruh detail terintegrasi otomatis ke Data KK (No. ${sanitizedWarga.noKk}).`
      : isNew
      ? `Data warga "${sanitizedWarga.nama}" berhasil ditambahkan.`
      : `Data warga "${sanitizedWarga.nama}" berhasil diperbarui.`
  );
  return await saveDocumentOnline('warga', sanitizedWarga.id, sanitizedWarga);
}

export async function deleteWarga(id: string): Promise<boolean> {
  const list = getWargaList();
  const target = list.find((w) => w.id === id);
  const filtered = list.filter((w) => w.id !== id);
  setItem(STORAGE_KEYS.WARGA, filtered);

  if (target && target.noKk) {
    // Perbarui jumlah anggota KK terkait
    try {
      const kkList = getKKList();
      const kkIndex = kkList.findIndex((k) => k.noKk === target.noKk);
      if (kkIndex >= 0) {
        const remainingMembers = filtered.filter((w) => w.noKk === target.noKk);
        const updatedKk: KartuKeluarga = {
          ...kkList[kkIndex],
          jumlahAnggota: remainingMembers.length,
          anggotaIds: remainingMembers.map((w) => w.nik),
        };
        kkList[kkIndex] = updatedKk;
        setItem(STORAGE_KEYS.KK, kkList);
        saveDocumentOnline('kk', updatedKk.id, updatedKk).catch(() => {});
      }
    } catch (e) {
      console.warn('Gagal memperbarui anggota KK setelah hapus:', e);
    }
  }

  notifyDelete('Data Warga', target ? `Data warga "${target.nama}" berhasil dihapus dari sistem.` : 'Data warga berhasil dihapus.');
  return await deleteDocumentOnline('warga', id);
}

// Kartu Keluarga
export function getKKList(): KartuKeluarga[] {
  const list = getItem<KartuKeluarga[]>(STORAGE_KEYS.KK, initialKK);
  return list.map((k) => ({
    ...k,
    rt: sanitizeRtValue(k.rt, '039'),
    alamat: k.alamat ? k.alamat.replace(/RT 001/g, `RT ${sanitizeRtValue(k.rt, '039')}`) : k.alamat,
  }));
}

/**
 * Sinkronisasi otomatis data warga dengan status "Kepala Keluarga" ke Data Kartu Keluarga (KK).
 * Mengintegrasikan seluruh data detail (Nama, NIK, TTL, Jenis Kelamin, Agama, Pekerjaan, Gol Darah, Status Kawin, HP, Alamat, Foto, dan Daftar Anggota).
 */
export async function syncKepalaKeluargaToKkDirect(
  kepala: Warga,
  allWarga?: Warga[]
): Promise<KartuKeluarga> {
  const kkList = getKKList();
  const wargaList = allWarga || getWargaList();

  // Anggota keluarga dengan No KK yang sama
  const matchingMembers = wargaList.filter((w) => w.noKk === kepala.noKk);
  const anggotaIds = matchingMembers.map((w) => w.nik);
  if (anggotaIds.length === 0 && kepala.nik) {
    anggotaIds.push(kepala.nik);
  }
  const jumlahAnggota = Math.max(matchingMembers.length, 1);

  // Cari KK berdasarkan noKk atau nikKepala
  const kkIndex = kkList.findIndex(
    (k) => k.noKk === kepala.noKk || k.nikKepala === kepala.nik
  );

  let targetKk: KartuKeluarga;

  if (kkIndex >= 0) {
    const existing = kkList[kkIndex];
    targetKk = {
      ...existing,
      noKk: kepala.noKk,
      kepalaKeluarga: kepala.nama,
      nikKepala: kepala.nik,
      rt: kepala.rt,
      alamat: kepala.alamat,
      telepon: kepala.noHp || existing.telepon || '',
      jumlahAnggota,
      anggotaIds,
      fotoKepala: kepala.foto || kepala.fotoUrl || existing.fotoKepala || '',
      pekerjaanKepala: kepala.pekerjaan || existing.pekerjaanKepala,
      agamaKepala: kepala.agama || existing.agamaKepala,
      pendidikanKepala: kepala.pendidikan || existing.pendidikanKepala,
      tempatLahirKepala: kepala.tempatLahir || existing.tempatLahirKepala,
      tanggalLahirKepala: kepala.tanggalLahir || existing.tanggalLahirKepala,
      golDarahKepala: kepala.golDarah || existing.golDarahKepala,
      jenisKelaminKepala: kepala.jenisKelamin || existing.jenisKelaminKepala,
      statusKawinKepala: kepala.statusKawin || existing.statusKawinKepala,
    };
    kkList[kkIndex] = targetKk;
  } else {
    targetKk = {
      id: generateId('kk'),
      noKk: kepala.noKk,
      kepalaKeluarga: kepala.nama,
      nikKepala: kepala.nik,
      rt: kepala.rt,
      alamat: kepala.alamat,
      telepon: kepala.noHp || '',
      statusEkonomi: 'Menengah',
      desil: 'Non-Desil',
      jumlahAnggota,
      anggotaIds,
      createdAt: new Date().toISOString(),
      fotoKepala: kepala.foto || kepala.fotoUrl || '',
      pekerjaanKepala: kepala.pekerjaan,
      agamaKepala: kepala.agama,
      pendidikanKepala: kepala.pendidikan,
      tempatLahirKepala: kepala.tempatLahir,
      tanggalLahirKepala: kepala.tanggalLahir,
      golDarahKepala: kepala.golDarah,
      jenisKelaminKepala: kepala.jenisKelamin,
      statusKawinKepala: kepala.statusKawin,
    };
    kkList.unshift(targetKk);
  }

  setItem(STORAGE_KEYS.KK, kkList);
  await saveDocumentOnline('kk', targetKk.id, targetKk).catch((err) =>
    console.warn('Online sync KK failed:', err)
  );

  return targetKk;
}

/**
 * Sinkronkan seluruh data warga berstatus Kepala Keluarga yang ada di Data Induk ke Data KK.
 */
export async function syncAllKepalaKeluargaToKk(): Promise<{ syncedCount: number; newCount: number }> {
  const wargaList = getWargaList();
  const kkList = getKKList();
  let syncedCount = 0;
  let newCount = 0;

  const kepalaList = wargaList.filter((w) => w.statusKeluarga === 'Kepala Keluarga');

  for (const kepala of kepalaList) {
    const matchingMembers = wargaList.filter((w) => w.noKk === kepala.noKk);
    const anggotaIds = matchingMembers.map((w) => w.nik);
    if (anggotaIds.length === 0 && kepala.nik) {
      anggotaIds.push(kepala.nik);
    }
    const jumlahAnggota = Math.max(matchingMembers.length, 1);

    const index = kkList.findIndex(
      (k) => k.noKk === kepala.noKk || k.nikKepala === kepala.nik
    );

    if (index >= 0) {
      const existing = kkList[index];
      kkList[index] = {
        ...existing,
        noKk: kepala.noKk,
        kepalaKeluarga: kepala.nama,
        nikKepala: kepala.nik,
        rt: kepala.rt,
        alamat: kepala.alamat,
        telepon: kepala.noHp || existing.telepon || '',
        jumlahAnggota,
        anggotaIds,
        fotoKepala: kepala.foto || kepala.fotoUrl || existing.fotoKepala || '',
        pekerjaanKepala: kepala.pekerjaan || existing.pekerjaanKepala,
        agamaKepala: kepala.agama || existing.agamaKepala,
        pendidikanKepala: kepala.pendidikan || existing.pendidikanKepala,
        tempatLahirKepala: kepala.tempatLahir || existing.tempatLahirKepala,
        tanggalLahirKepala: kepala.tanggalLahir || existing.tanggalLahirKepala,
        golDarahKepala: kepala.golDarah || existing.golDarahKepala,
        jenisKelaminKepala: kepala.jenisKelamin || existing.jenisKelaminKepala,
        statusKawinKepala: kepala.statusKawin || existing.statusKawinKepala,
      };
      syncedCount++;
    } else {
      const newKk: KartuKeluarga = {
        id: generateId('kk'),
        noKk: kepala.noKk,
        kepalaKeluarga: kepala.nama,
        nikKepala: kepala.nik,
        rt: kepala.rt,
        alamat: kepala.alamat,
        telepon: kepala.noHp || '',
        statusEkonomi: 'Menengah',
        desil: 'Non-Desil',
        jumlahAnggota,
        anggotaIds,
        createdAt: new Date().toISOString(),
        fotoKepala: kepala.foto || kepala.fotoUrl || '',
        pekerjaanKepala: kepala.pekerjaan,
        agamaKepala: kepala.agama,
        pendidikanKepala: kepala.pendidikan,
        tempatLahirKepala: kepala.tempatLahir,
        tanggalLahirKepala: kepala.tanggalLahir,
        golDarahKepala: kepala.golDarah,
        jenisKelaminKepala: kepala.jenisKelamin,
        statusKawinKepala: kepala.statusKawin,
      };
      kkList.unshift(newKk);
      newCount++;
    }
  }

  setItem(STORAGE_KEYS.KK, kkList);
  notifyChange();

  return { syncedCount, newCount };
}

export async function saveKK(kk: KartuKeluarga): Promise<boolean> {
  const list = getKKList();
  const sanitizedKk: KartuKeluarga = {
    ...kk,
    rt: sanitizeRtValue(kk.rt, '039'),
    alamat: kk.alamat ? kk.alamat.replace(/RT 001/g, `RT ${sanitizeRtValue(kk.rt, '039')}`) : kk.alamat,
  };
  const index = list.findIndex((k) => k.id === sanitizedKk.id);
  const isNew = index < 0;
  if (index >= 0) {
    list[index] = sanitizedKk;
  } else {
    list.unshift(sanitizedKk);
  }
  setItem(STORAGE_KEYS.KK, list);
  notifySave('Kartu Keluarga', isNew ? `Kartu Keluarga No. ${sanitizedKk.noKk} (${sanitizedKk.kepalaKeluarga}) berhasil ditambahkan.` : `Kartu Keluarga No. ${sanitizedKk.noKk} berhasil diperbarui.`);
  return await saveDocumentOnline('kk', sanitizedKk.id, sanitizedKk);
}
export async function deleteKK(id: string): Promise<boolean> {
  const list = getKKList();
  const target = list.find((k) => k.id === id);
  const filtered = list.filter((k) => k.id !== id);
  setItem(STORAGE_KEYS.KK, filtered);
  notifyDelete('Kartu Keluarga', target ? `Kartu Keluarga No. ${target.noKk} (${target.kepalaKeluarga}) berhasil dihapus.` : 'Data Kartu Keluarga berhasil dihapus.');
  return await deleteDocumentOnline('kk', id);
}

// Rukun Kematian Masyarakat (RKM): Iuran
export function getIuranRkmList(): IuranRkmRecord[] {
  return getItem<IuranRkmRecord[]>(STORAGE_KEYS.IURAN_RKM, initialIuranRKM);
}
export async function saveIuranRkm(item: IuranRkmRecord): Promise<boolean> {
  const list = getIuranRkmList();
  const index = list.findIndex((i) => i.id === item.id);
  const isNew = index < 0;
  if (index >= 0) {
    list[index] = item;
  } else {
    list.unshift(item);
  }
  setItem(STORAGE_KEYS.IURAN_RKM, list);
  notifySave('Iuran RKM', isNew ? `Iuran RKM baru dari ${item.namaKepala || 'Warga'} berhasil dicatat.` : `Data iuran RKM ${item.namaKepala || ''} berhasil diperbarui.`);
  return await saveDocumentOnline('iuran_rkm', item.id, item);
}
export async function deleteIuranRkm(id: string): Promise<boolean> {
  const list = getIuranRkmList();
  const target = list.find((i) => i.id === id);
  const filtered = list.filter((i) => i.id !== id);
  setItem(STORAGE_KEYS.IURAN_RKM, filtered);
  notifyDelete('Iuran RKM', target ? `Catatan iuran RKM (${target.namaKepala}) berhasil dihapus.` : 'Catatan iuran RKM berhasil dihapus.');
  return await deleteDocumentOnline('iuran_rkm', id);
}

// RKM: Warga Meninggal
export function getWargaMeninggalList(): WargaMeninggalRecord[] {
  return getItem<WargaMeninggalRecord[]>(STORAGE_KEYS.WARGA_MENINGGAL, initialWargaMeninggal);
}
export async function saveWargaMeninggal(item: WargaMeninggalRecord): Promise<boolean> {
  const list = getWargaMeninggalList();
  const index = list.findIndex((w) => w.id === item.id);
  const isNew = index < 0;
  if (index >= 0) {
    list[index] = item;
  } else {
    list.unshift(item);
  }
  setItem(STORAGE_KEYS.WARGA_MENINGGAL, list);
  notifySave('Data Kematian RKM', isNew ? `Data duka almarhum/ah ${item.nama} berhasil dicatat.` : `Data almarhum/ah ${item.nama} berhasil diperbarui.`);
  return await saveDocumentOnline('warga_meninggal', item.id, item);
}
export async function deleteWargaMeninggal(id: string): Promise<boolean> {
  const list = getWargaMeninggalList();
  const target = list.find((w) => w.id === id);
  const filtered = list.filter((w) => w.id !== id);
  setItem(STORAGE_KEYS.WARGA_MENINGGAL, filtered);
  notifyDelete('Data Kematian RKM', target ? `Data duka almarhum/ah ${target.nama} berhasil dihapus.` : 'Data kematian berhasil dihapus.');
  return await deleteDocumentOnline('warga_meninggal', id);
}

// RKM: Perlengkapan
export function getPerlengkapanRkmList(): PerlengkapanRkmItem[] {
  return getItem<PerlengkapanRkmItem[]>(STORAGE_KEYS.PERLENGKAPAN_RKM, initialPerlengkapanRKM);
}
export async function savePerlengkapanRkm(item: PerlengkapanRkmItem): Promise<boolean> {
  const list = getPerlengkapanRkmList();
  const index = list.findIndex((p) => p.id === item.id);
  const isNew = index < 0;
  if (index >= 0) {
    list[index] = item;
  } else {
    list.unshift(item);
  }
  setItem(STORAGE_KEYS.PERLENGKAPAN_RKM, list);
  notifySave('Inventaris RKM', isNew ? `Barang inventaris "${item.namaBarang}" berhasil ditambahkan.` : `Data barang "${item.namaBarang}" berhasil diperbarui.`);
  return await saveDocumentOnline('perlengkapan_rkm', item.id, item);
}
export async function deletePerlengkapanRkm(id: string): Promise<boolean> {
  const list = getPerlengkapanRkmList();
  const target = list.find((p) => p.id === id);
  const filtered = list.filter((p) => p.id !== id);
  setItem(STORAGE_KEYS.PERLENGKAPAN_RKM, filtered);
  notifyDelete('Inventaris RKM', target ? `Barang inventaris "${target.namaBarang}" berhasil dihapus.` : 'Barang inventaris berhasil dihapus.');
  return await deleteDocumentOnline('perlengkapan_rkm', id);
}

// Keamanan & Pembangunan Fisik
export function getKeamananList(): KeamananProgramItem[] {
  return getItem<KeamananProgramItem[]>(STORAGE_KEYS.KEAMANAN, initialKeamananProgram);
}
export async function saveKeamanan(item: KeamananProgramItem): Promise<boolean> {
  const list = getKeamananList();
  const index = list.findIndex((k) => k.id === item.id);
  const isNew = index < 0;
  if (index >= 0) {
    list[index] = item;
  } else {
    list.unshift(item);
  }
  setItem(STORAGE_KEYS.KEAMANAN, list);
  notifySave('Keamanan & Pembangunan', isNew ? `Program "${item.namaProgram}" berhasil ditambahkan.` : `Program "${item.namaProgram}" berhasil diperbarui.`);
  return await saveDocumentOnline('keamanan', item.id, item);
}
export async function deleteKeamanan(id: string): Promise<boolean> {
  const list = getKeamananList();
  const target = list.find((k) => k.id === id);
  const filtered = list.filter((k) => k.id !== id);
  setItem(STORAGE_KEYS.KEAMANAN, filtered);
  notifyDelete('Keamanan & Pembangunan', target ? `Program "${target.namaProgram}" berhasil dihapus.` : 'Item program berhasil dihapus.');
  return await deleteDocumentOnline('keamanan', id);
}

// Backward-compatible alias for RKM (Keamanan)
export const getRKMList = getKeamananList;
export const saveRKM = saveKeamanan;
export const deleteRKM = deleteKeamanan;
export const getRkmList = getKeamananList;
export const saveRkm = saveKeamanan;
export const deleteRkm = deleteKeamanan;

// Jadwal Ronda Malam (Senin - Minggu 23:00 - 04:00)
export function getJadwalRondaList(): JadwalRonda[] {
  return getItem<JadwalRonda[]>(STORAGE_KEYS.JADWAL_RONDA, initialJadwalRonda);
}

export async function saveJadwalRonda(item: JadwalRonda): Promise<boolean> {
  const list = getJadwalRondaList();
  const index = list.findIndex((r) => r.id === item.id);
  const isNew = index < 0;
  if (index >= 0) {
    list[index] = item;
  } else {
    list.unshift(item);
  }
  setItem(STORAGE_KEYS.JADWAL_RONDA, list);
  notifySave('Jadwal Ronda', isNew ? `Jadwal ronda hari ${item.hari || 'baru'} berhasil ditambahkan.` : `Jadwal ronda hari ${item.hari || ''} berhasil disimpan.`);
  return await saveDocumentOnline('jadwal_ronda', item.id, item);
}

export async function deleteJadwalRonda(id: string): Promise<boolean> {
  const list = getJadwalRondaList();
  const target = list.find((r) => r.id === id);
  const filtered = list.filter((r) => r.id !== id);
  setItem(STORAGE_KEYS.JADWAL_RONDA, filtered);
  notifyDelete('Jadwal Ronda', target ? `Jadwal ronda hari ${target.hari} berhasil dihapus.` : 'Jadwal ronda berhasil dihapus.');
  return await deleteDocumentOnline('jadwal_ronda', id);
}

// Absensi / Presensi Ronda Malam & Pengecekan RT / RW
export function getAbsensiRondaList(): AbsensiRondaRecord[] {
  return getItem<AbsensiRondaRecord[]>(STORAGE_KEYS.ABSENSI_RONDA, initialAbsensiRonda);
}

export async function saveAbsensiRonda(record: AbsensiRondaRecord): Promise<boolean> {
  const list = getAbsensiRondaList();
  const index = list.findIndex((a) => a.id === record.id);
  const isNew = index < 0;
  if (index >= 0) {
    list[index] = record;
  } else {
    list.unshift(record);
  }
  setItem(STORAGE_KEYS.ABSENSI_RONDA, list);
  notifySave('Presensi Ronda', isNew ? `Presensi ronda regu ${record.namaGrup || 'Petugas'} berhasil dicatat.` : `Data presensi regu ${record.namaGrup || ''} berhasil diperbarui.`);
  return await saveDocumentOnline('absensi_ronda', record.id, record);
}

export async function deleteAbsensiRonda(id: string): Promise<boolean> {
  const list = getAbsensiRondaList();
  const target = list.find((a) => a.id === id);
  const filtered = list.filter((a) => a.id !== id);
  setItem(STORAGE_KEYS.ABSENSI_RONDA, filtered);
  notifyDelete('Presensi Ronda', target ? `Catatan presensi regu ${target.namaGrup} berhasil dihapus.` : 'Catatan presensi ronda berhasil dihapus.');
  return await deleteDocumentOnline('absensi_ronda', id);
}

// Laporan Kejadian RW 018
export function getLaporanKejadianList(): LaporanKejadian[] {
  return getItem<LaporanKejadian[]>(STORAGE_KEYS.LAPORAN_KEJADIAN, initialLaporanKejadian);
}

export async function saveLaporanKejadian(item: LaporanKejadian): Promise<boolean> {
  const list = getLaporanKejadianList();
  const index = list.findIndex((l) => l.id === item.id);
  const isNew = index < 0;

  // Pastikan nomor laporan terisi dan tidak ada nomor ganda
  let finalNomor = (item.nomorLaporan || '').trim();
  const isDuplicateNumber = list.some((l) => l.nomorLaporan === finalNomor && l.id !== item.id);
  if (!finalNomor || isDuplicateNumber) {
    finalNomor = generateNextNomorLaporan(list, item.tanggalKejadian || item.tanggalLaporan);
  }

  const payload: LaporanKejadian = {
    ...item,
    nomorLaporan: finalNomor,
    updatedAt: new Date().toISOString(),
  };

  if (index >= 0) {
    list[index] = payload;
  } else {
    list.unshift(payload);
  }
  setItem(STORAGE_KEYS.LAPORAN_KEJADIAN, list);
  notifySave(
    'Laporan Kejadian',
    isNew
      ? `Laporan kejadian ${payload.nomorLaporan} ("${payload.jenisKejadian}") berhasil disimpan ke Firebase.`
      : `Laporan kejadian ${payload.nomorLaporan} berhasil diperbarui.`
  );
  return await saveDocumentOnline('laporan_kejadian', payload.id, payload);
}

export async function deleteLaporanKejadian(id: string): Promise<boolean> {
  const list = getLaporanKejadianList();
  const target = list.find((l) => l.id === id);
  const filtered = list.filter((l) => l.id !== id);
  setItem(STORAGE_KEYS.LAPORAN_KEJADIAN, filtered);
  notifyDelete(
    'Laporan Kejadian',
    target
      ? `Laporan kejadian ${target.nomorLaporan} berhasil dihapus.`
      : 'Laporan kejadian berhasil dihapus.'
  );
  return await deleteDocumentOnline('laporan_kejadian', id);
}

// Bansos
export function getBansosList(): BansosItem[] {
  const list = getItem<BansosItem[]>(STORAGE_KEYS.BANSOS, initialBansos);
  return list.map((b) => ({
    ...b,
    rt: sanitizeRtValue(b.rt, '039'),
  }));
}
export async function saveBansos(item: BansosItem): Promise<boolean> {
  const list = getBansosList();
  const sanitizedItem: BansosItem = {
    ...item,
    rt: sanitizeRtValue(item.rt, '039'),
  };
  const index = list.findIndex((b) => b.id === sanitizedItem.id);
  const isNew = index < 0;
  if (index >= 0) {
    list[index] = sanitizedItem;
  } else {
    list.unshift(sanitizedItem);
  }
  setItem(STORAGE_KEYS.BANSOS, list);
  notifySave('Data Bansos', isNew ? `Penerima bansos "${sanitizedItem.namaPenerima}" berhasil ditambahkan.` : `Data bansos "${sanitizedItem.namaPenerima}" berhasil diperbarui.`);
  const payload = {
    ...sanitizedItem,
    nama: (sanitizedItem as any).nama || sanitizedItem.namaPenerima || '',
    namaPenerima: sanitizedItem.namaPenerima || (sanitizedItem as any).nama || '',
    status: sanitizedItem.status || (sanitizedItem as any).statusPenyaluran || 'Disalurkan',
    statusPenyaluran: (sanitizedItem as any).statusPenyaluran || sanitizedItem.status || 'Disalurkan',
  };
  return await saveDocumentOnline('bansos', sanitizedItem.id, payload);
}
export async function deleteBansos(id: string): Promise<boolean> {
  const list = getBansosList();
  const target = list.find((b) => b.id === id);
  const filtered = list.filter((b) => b.id !== id);
  setItem(STORAGE_KEYS.BANSOS, filtered);
  notifyDelete('Data Bansos', target ? `Penerima bansos "${target.namaPenerima}" berhasil dihapus.` : 'Data bansos berhasil dihapus.');
  return await deleteDocumentOnline('bansos', id);
}

// Cadangan Bansos (Warga Terdaftar di Data Induk Layak Bansos)
export function getCadanganBansosList(): CadanganBansosItem[] {
  const list = getItem<CadanganBansosItem[]>(STORAGE_KEYS.CADANGAN_BANSOS, initialCadanganBansos);
  return list.map((c) => ({
    ...c,
    rt: sanitizeRtValue(c.rt, '039'),
  }));
}
export async function saveCadanganBansos(item: CadanganBansosItem): Promise<boolean> {
  const list = getCadanganBansosList();
  const sanitizedItem: CadanganBansosItem = {
    ...item,
    rt: sanitizeRtValue(item.rt, '039'),
  };
  const index = list.findIndex((c) => c.id === sanitizedItem.id);
  const isNew = index < 0;
  if (index >= 0) {
    list[index] = sanitizedItem;
  } else {
    list.unshift(sanitizedItem);
  }
  setItem(STORAGE_KEYS.CADANGAN_BANSOS, list);
  notifySave('Cadangan Bansos', isNew ? `Warga calon bansos "${sanitizedItem.nama}" berhasil dicatat.` : `Data cadangan bansos "${sanitizedItem.nama}" berhasil disimpan.`);
  return await saveDocumentOnline('cadangan_bansos', sanitizedItem.id, sanitizedItem);
}
export async function deleteCadanganBansos(id: string): Promise<boolean> {
  const list = getCadanganBansosList();
  const target = list.find((c) => c.id === id);
  const filtered = list.filter((c) => c.id !== id);
  setItem(STORAGE_KEYS.CADANGAN_BANSOS, filtered);
  notifyDelete('Cadangan Bansos', target ? `Calon penerima bansos "${target.nama}" berhasil dihapus.` : 'Data cadangan bansos berhasil dihapus.');
  return await deleteDocumentOnline('cadangan_bansos', id);
}

// UMKM
export function getUMKMList(): UmkmItem[] {
  const list = getItem<UmkmItem[]>(STORAGE_KEYS.UMKM, initialUMKM);
  return list.map((u) => ({
    ...u,
    rt: sanitizeRtValue(u.rt, '039'),
    alamatUsaha: u.alamatUsaha ? u.alamatUsaha.replace(/RT 001/g, `RT ${sanitizeRtValue(u.rt, '039')}`) : u.alamatUsaha,
  }));
}
export async function saveUMKM(item: UmkmItem): Promise<boolean> {
  const list = getUMKMList();
  const sanitizedItem: UmkmItem = {
    ...item,
    rt: sanitizeRtValue(item.rt, '039'),
    alamatUsaha: item.alamatUsaha ? item.alamatUsaha.replace(/RT 001/g, `RT ${sanitizeRtValue(item.rt, '039')}`) : item.alamatUsaha,
  };
  const index = list.findIndex((u) => u.id === sanitizedItem.id);
  const isNew = index < 0;
  if (index >= 0) {
    list[index] = sanitizedItem;
  } else {
    list.unshift(sanitizedItem);
  }
  setItem(STORAGE_KEYS.UMKM, list);
  notifySave('Data UMKM', isNew ? `Usaha UMKM "${sanitizedItem.namaUsaha}" berhasil ditambahkan.` : `Data usaha "${sanitizedItem.namaUsaha}" berhasil diperbarui.`);
  return await saveDocumentOnline('umkm', sanitizedItem.id, sanitizedItem);
}
export async function deleteUMKM(id: string): Promise<boolean> {
  const list = getUMKMList();
  const target = list.find((u) => u.id === id);
  const filtered = list.filter((u) => u.id !== id);
  setItem(STORAGE_KEYS.UMKM, filtered);
  notifyDelete('Data UMKM', target ? `Data usaha "${target.namaUsaha}" berhasil dihapus.` : 'Data UMKM berhasil dihapus.');
  return await deleteDocumentOnline('umkm', id);
}

// Kas & Iuran
export function getKasList(): TransaksiKas[] {
  return getItem<TransaksiKas[]>(STORAGE_KEYS.KAS, initialTransaksiKas);
}
export async function saveKas(item: TransaksiKas): Promise<boolean> {
  const list = getKasList();
  const index = list.findIndex((k) => k.id === item.id);
  const isNew = index < 0;
  if (index >= 0) {
    list[index] = item;
  } else {
    list.unshift(item);
  }
  setItem(STORAGE_KEYS.KAS, list);
  const formattedNominal = `Rp ${(item.jumlah || 0).toLocaleString('id-ID')}`;
  notifySave('Buku Kas RW', isNew ? `Transaksi kas "${item.keterangan || ''}" (${formattedNominal}) berhasil dicatat.` : `Transaksi kas "${item.keterangan || ''}" berhasil diperbarui.`);
  const payload = {
    ...item,
    id: item.id,
    tanggal: item.tanggal || new Date().toISOString().slice(0, 10),
    kategori: item.kategori || 'Lain-lain',
    jumlah: Number(item.jumlah) || 0,
    jenis: (item as any).jenis || item.tipe || 'Pemasukan',
    tipe: item.tipe || (item as any).jenis || 'Pemasukan',
    keterangan: item.keterangan || '',
  };
  return await saveDocumentOnline('kas', item.id, payload);
}
export async function deleteKas(id: string): Promise<boolean> {
  const list = getKasList();
  const target = list.find((k) => k.id === id);
  const filtered = list.filter((k) => k.id !== id);
  setItem(STORAGE_KEYS.KAS, filtered);
  notifyDelete('Buku Kas RW', target ? `Transaksi "${target.keterangan}" berhasil dihapus.` : 'Transaksi kas berhasil dihapus.');
  return await deleteDocumentOnline('kas', id);
}

export function getIuranList(): IuranWargaRecord[] {
  return getItem<IuranWargaRecord[]>(STORAGE_KEYS.IURAN, initialIuranWarga);
}
export async function saveIuran(item: IuranWargaRecord): Promise<boolean> {
  const list = getIuranList();
  const index = list.findIndex((i) => i.id === item.id);
  const isNew = index < 0;
  if (index >= 0) {
    list[index] = item;
  } else {
    list.unshift(item);
  }
  setItem(STORAGE_KEYS.IURAN, list);
  notifySave('Iuran Warga', isNew ? `Catatan iuran warga RT ${item.rt} berhasil ditambahkan.` : `Catatan iuran warga RT ${item.rt} berhasil diperbarui.`);
  return await saveDocumentOnline('iuran', item.id, item);
}
export async function deleteIuran(id: string): Promise<boolean> {
  const list = getIuranList();
  const target = list.find((i) => i.id === id);
  const filtered = list.filter((i) => i.id !== id);
  setItem(STORAGE_KEYS.IURAN, filtered);
  notifyDelete('Iuran Warga', target ? `Catatan iuran warga RT ${target.rt} (${target.bulanTahun}) berhasil dihapus.` : 'Catatan iuran warga berhasil dihapus.');
  return await deleteDocumentOnline('iuran', id);
}

// Kegiatan
export function getKegiatanList(): KegiatanRw[] {
  return getItem<KegiatanRw[]>(STORAGE_KEYS.KEGIATAN, initialKegiatan);
}
export async function saveKegiatan(item: KegiatanRw): Promise<boolean> {
  const list = getKegiatanList();
  const index = list.findIndex((k) => k.id === item.id);
  const isNew = index < 0;
  if (index >= 0) {
    list[index] = item;
  } else {
    list.unshift(item);
  }
  setItem(STORAGE_KEYS.KEGIATAN, list);
  notifySave('Agenda Kegiatan', isNew ? `Kegiatan "${item.judul}" berhasil ditambahkan ke agenda.` : `Kegiatan "${item.judul}" berhasil diperbarui.`);
  return await saveDocumentOnline('kegiatan', item.id, item);
}
export async function deleteKegiatan(id: string): Promise<boolean> {
  const list = getKegiatanList();
  const target = list.find((k) => k.id === id);
  const filtered = list.filter((k) => k.id !== id);
  setItem(STORAGE_KEYS.KEGIATAN, filtered);
  notifyDelete('Agenda Kegiatan', target ? `Kegiatan "${target.judul}" berhasil dihapus.` : 'Kegiatan berhasil dihapus.');
  return await deleteDocumentOnline('kegiatan', id);
}

// Pengaduan
export function getPengaduanList(): PengaduanWarga[] {
  const list = getItem<PengaduanWarga[]>(STORAGE_KEYS.PENGADUAN, initialPengaduan);
  return list.map((p) => ({
    ...p,
    rt: sanitizeRtValue(p.rt, '039'),
    lokasiSpesifik: p.lokasiSpesifik ? p.lokasiSpesifik.replace(/RT 001/g, `RT ${sanitizeRtValue(p.rt, '039')}`) : p.lokasiSpesifik,
  }));
}
export async function savePengaduan(item: PengaduanWarga): Promise<boolean> {
  const list = getPengaduanList();
  const namaPelapor = item.namaPelapor || (item as any).namaWarga || (item as any).nama || 'Warga RW 018';
  const namaWarga = (item as any).namaWarga || item.namaPelapor || (item as any).nama || 'Warga RW 018';
  const isiText = (item as any).isiPengaduan || item.deskripsi || (item as any).isi || '';
  const rtVal = sanitizeRtValue(item.rt, '039');
  const tgl = item.tanggalLapor || (item as any).tanggal || new Date().toISOString().slice(0, 10);

  const sanitizedItem: PengaduanWarga = {
    ...item,
    id: item.id || generateId('pgd'),
    namaPelapor,
    namaWarga,
    nikPelapor: item.nikPelapor || (item as any).nikWarga || '',
    nikWarga: (item as any).nikWarga || item.nikPelapor || '',
    rt: rtVal,
    kategori: item.kategori || 'Fasilitas Umum & Jalan',
    judul: item.judul || 'Laporan Pengaduan Warga',
    status: item.status || 'Masuk',
    tanggalLapor: tgl,
    tanggal: tgl,
    isiPengaduan: isiText,
    deskripsi: isiText,
    isi: isiText,
    lokasiSpesifik: item.lokasiSpesifik ? item.lokasiSpesifik.replace(/RT 001/g, `RT ${rtVal}`) : (item.lokasiSpesifik || `Wilayah RT ${rtVal}`),
  };
  const index = list.findIndex((p) => p.id === sanitizedItem.id);
  const isNew = index < 0;
  if (index >= 0) {
    list[index] = sanitizedItem;
  } else {
    list.unshift(sanitizedItem);
  }
  setItem(STORAGE_KEYS.PENGADUAN, list);
  notifySave('Laporan Pengaduan', isNew ? `Laporan warga "${sanitizedItem.judul}" berhasil dikirim.` : `Status pengaduan "${sanitizedItem.judul}" berhasil diperbarui.`);
  const payload = {
    ...sanitizedItem,
    id: sanitizedItem.id,
    namaPelapor,
    namaWarga,
    nikPelapor: sanitizedItem.nikPelapor,
    nikWarga: (sanitizedItem as any).nikWarga,
    rt: sanitizedItem.rt,
    kategori: sanitizedItem.kategori,
    judul: sanitizedItem.judul,
    status: sanitizedItem.status,
    tanggalLapor: sanitizedItem.tanggalLapor,
    tanggal: (sanitizedItem as any).tanggal,
    isi: isiText,
    deskripsi: isiText,
    isiPengaduan: isiText,
    lokasiSpesifik: sanitizedItem.lokasiSpesifik,
  };
  return await saveDocumentOnline('pengaduan', sanitizedItem.id, payload);
}
export async function deletePengaduan(id: string): Promise<boolean> {
  const list = getPengaduanList();
  const target = list.find((p) => p.id === id);
  const filtered = list.filter((p) => p.id !== id);
  setItem(STORAGE_KEYS.PENGADUAN, filtered);
  notifyDelete('Laporan Pengaduan', target ? `Laporan "${target.judul}" berhasil dihapus.` : 'Laporan pengaduan berhasil dihapus.');
  return await deleteDocumentOnline('pengaduan', id);
}

// Pajak Bumi dan Bangunan (PBB) & SHM
export function getPbbList(): PbbRecord[] {
  const list = getItem<PbbRecord[]>(STORAGE_KEYS.PBB, initialPbb);
  return list.map((p) => ({
    ...p,
    rt: sanitizeRtValue(p.rt, '039'),
    alamatObjek: p.alamatObjek ? p.alamatObjek.replace(/RT 001/g, `RT ${sanitizeRtValue(p.rt, '039')}`) : p.alamatObjek,
  }));
}

export async function savePbb(item: PbbRecord): Promise<boolean> {
  const list = getPbbList();
  const sanitizedItem: PbbRecord = {
    ...item,
    rt: sanitizeRtValue(item.rt, '039'),
    alamatObjek: item.alamatObjek ? item.alamatObjek.replace(/RT 001/g, `RT ${sanitizeRtValue(item.rt, '039')}`) : item.alamatObjek,
  };
  const index = list.findIndex((p) => p.id === sanitizedItem.id);
  const isNew = index < 0;
  if (index >= 0) {
    list[index] = sanitizedItem;
  } else {
    list.unshift(sanitizedItem);
  }
  setItem(STORAGE_KEYS.PBB, list);
  notifySave('Data PBB & SHM', isNew ? `Data PBB ${sanitizedItem.namaWajibPajak} (NOP: ${sanitizedItem.nop}) berhasil ditambahkan.` : `Data PBB ${sanitizedItem.namaWajibPajak} berhasil diperbarui.`);
  const payload = {
    ...sanitizedItem,
    namaWp: (sanitizedItem as any).namaWp || sanitizedItem.namaWajibPajak || '',
    namaWajibPajak: sanitizedItem.namaWajibPajak || (sanitizedItem as any).namaWp || '',
    tagihan: typeof (sanitizedItem as any).tagihan === 'number' ? (sanitizedItem as any).tagihan : (sanitizedItem.totalTagihan || sanitizedItem.tagihanPokok || 0),
    totalTagihan: typeof sanitizedItem.totalTagihan === 'number' ? sanitizedItem.totalTagihan : (sanitizedItem as any).tagihan || 0,
    statusBayar: (sanitizedItem as any).statusBayar || sanitizedItem.statusPembayaran || 'Belum Lunas',
    statusPembayaran: sanitizedItem.statusPembayaran || (sanitizedItem as any).statusBayar || 'Belum Lunas',
  };
  return await saveDocumentOnline('pbb', sanitizedItem.id, payload);
}

export async function deletePbb(id: string): Promise<boolean> {
  const list = getPbbList();
  const target = list.find((p) => p.id === id);
  const filtered = list.filter((p) => p.id !== id);
  setItem(STORAGE_KEYS.PBB, filtered);
  notifyDelete('Data PBB & SHM', target ? `Data PBB ${target.namaWajibPajak} berhasil dihapus.` : 'Data PBB berhasil dihapus.');
  return await deleteDocumentOnline('pbb', id);
}

export async function bayarPbbTahunBerjalan(
  id: string,
  paymentData: {
    tanggalBayar: string;
    metodeBayar: MetodeBayarPbb;
    buktiBayarNo?: string;
    namaPenyetor?: string;
    petugasKolektor?: string;
    catatan?: string;
  }
): Promise<boolean> {
  const list = getPbbList();
  const index = list.findIndex((p) => p.id === id);
  if (index >= 0) {
    list[index] = {
      ...list[index],
      statusPembayaran: 'Lunas',
      tanggalBayar: paymentData.tanggalBayar,
      metodeBayar: paymentData.metodeBayar,
      buktiBayarNo: paymentData.buktiBayarNo || `PBB-RW18-${Date.now().toString().slice(-6)}`,
      namaPenyetor: paymentData.namaPenyetor || list[index].namaWajibPajak,
      petugasKolektor: paymentData.petugasKolektor || 'Kolektor PBB RW 018',
      catatan: paymentData.catatan ? `${list[index].catatan || ''} | ${paymentData.catatan}` : list[index].catatan
    };
    setItem(STORAGE_KEYS.PBB, list);
    notifySave('Pembayaran PBB', `Pembayaran PBB ${list[index].namaWajibPajak} berhasil dicatat LUNAS.`);
    return await saveDocumentOnline('pbb', list[index].id, list[index]);
  }
  return false;
}

export async function bayarTunggakanPbb(
  id: string,
  tahunTunggakan: number,
  paymentData: {
    tanggalBayar: string;
    metodeBayar: MetodeBayarPbb;
    kuitansiNo?: string;
  }
): Promise<boolean> {
  const list = getPbbList();
  const index = list.findIndex((p) => p.id === id);
  if (index >= 0) {
    const updatedTunggakan = list[index].tunggakanTahunLalu.map((t) => {
      if (t.tahun === tahunTunggakan) {
        return {
          ...t,
          status: 'Lunas' as const,
          tanggalBayar: paymentData.tanggalBayar,
          metodeBayar: paymentData.metodeBayar,
          kuitansiNo: paymentData.kuitansiNo || `TGK-${tahunTunggakan}-${Date.now().toString().slice(-4)}`
        };
      }
      return t;
    });

    list[index] = {
      ...list[index],
      tunggakanTahunLalu: updatedTunggakan
    };
    setItem(STORAGE_KEYS.PBB, list);
    notifySave('Pelunasan Tunggakan PBB', `Tunggakan PBB tahun ${tahunTunggakan} untuk ${list[index].namaWajibPajak} berhasil dilunasi.`);
    return await saveDocumentOnline('pbb', list[index].id, list[index]);
  }
  return false;
}

// Surat
export function getSuratList(): SuratItem[] {
  const list = getItem<SuratItem[]>(STORAGE_KEYS.SURAT, initialSurat);
  return list.map((s) => ({
    ...s,
    rt: sanitizeRtValue(s.rt, '039'),
    alamat: s.alamat ? s.alamat.replace(/RT 001/g, `RT ${sanitizeRtValue(s.rt, '039')}`) : s.alamat,
  }));
}
export async function saveSurat(item: SuratItem): Promise<boolean> {
  const list = getSuratList();
  const sanitizedItem: SuratItem = {
    ...item,
    rt: sanitizeRtValue(item.rt, '039'),
    alamat: item.alamat ? item.alamat.replace(/RT 001/g, `RT ${sanitizeRtValue(item.rt, '039')}`) : item.alamat,
  };
  const index = list.findIndex((s) => s.id === sanitizedItem.id);
  const isNew = index < 0;
  if (index >= 0) {
    list[index] = sanitizedItem;
  } else {
    list.unshift(sanitizedItem);
  }
  setItem(STORAGE_KEYS.SURAT, list);
  notifySave('Data Surat', isNew ? `Surat "${sanitizedItem.keperluan || sanitizedItem.jenisSurat}" berhasil dibuat.` : `Data surat "${sanitizedItem.keperluan || sanitizedItem.jenisSurat}" berhasil diperbarui.`);
  const payload = {
    ...sanitizedItem,
    nomorSurat: (sanitizedItem as any).nomorSurat || sanitizedItem.noSurat || '',
    noSurat: sanitizedItem.noSurat || (sanitizedItem as any).nomorSurat || '',
  };
  return await saveDocumentOnline('surat', sanitizedItem.id, payload);
}
export async function deleteSurat(id: string): Promise<boolean> {
  const list = getSuratList();
  const target = list.find((s) => s.id === id);
  const filtered = list.filter((s) => s.id !== id);
  setItem(STORAGE_KEYS.SURAT, filtered);
  notifyDelete('Data Surat', target ? `Surat "${target.keperluan || target.jenisSurat}" berhasil dihapus.` : 'Data surat berhasil dihapus.');
  return await deleteDocumentOnline('surat', id);
}

// Helper aliases
export const getKkList = getKKList;
export const saveKk = saveKK;
export const deleteKk = deleteKK;
export const getUmkmList = getUMKMList;
export const saveUmkm = saveUMKM;
export const deleteUmkm = deleteUMKM;
export const subscribeToStorage = subscribeToDB;

/**
 * Upload all current local records to Firestore online database
 */
export async function uploadEntireDatabaseToFirestore(): Promise<{
  success: boolean;
  totalSynced: number;
  totalFailed?: number;
  error?: string;
}> {
  try {
    const dbState = getFullDatabaseState();
    let count = 0;
    let failedCount = 0;
    const errors: string[] = [];

    // Helper to safely upload a single document
    const safeUploadDoc = async (col: string, id: string, data: any) => {
      try {
        if (!id || typeof id !== 'string') {
          console.warn(`[Sync] Skipping document with invalid ID in ${col}:`, id);
          return;
        }
        const ok = await saveDocumentOnline(col, id, data);
        if (ok) {
          count++;
        } else {
          failedCount++;
        }
      } catch (err: any) {
        console.warn(`[Sync] Error syncing document ${col}/${id}:`, err?.message || err);
        failedCount++;
        if (errors.length < 3) {
          errors.push(`${col}/${id}: ${err?.message || 'Gagal menyimpan'}`);
        }
      }
    };

    // 1. Profile
    const profileToUpload: RWProfile = {
      ...dbState.profile,
      id: 'rw018_main',
    };
    await safeUploadDoc('profile', 'rw018_main', profileToUpload);

    // 2. Warga
    for (const item of dbState.warga || []) {
      await safeUploadDoc('warga', item.id, item);
    }

    // 3. KK
    for (const item of dbState.kk || []) {
      await safeUploadDoc('kk', item.id, item);
    }

    // 4. Kas
    for (const item of dbState.kas || []) {
      const payload = {
        ...item,
        id: item.id,
        tanggal: item.tanggal || new Date().toISOString().slice(0, 10),
        kategori: item.kategori || 'Lain-lain',
        jumlah: Number(item.jumlah) || 0,
        jenis: (item as any).jenis || item.tipe || 'Pemasukan',
        tipe: item.tipe || (item as any).jenis || 'Pemasukan',
        keterangan: item.keterangan || '',
      };
      await safeUploadDoc('kas', item.id, payload);
    }

    // 5. Iuran
    for (const item of dbState.iuran || []) {
      await safeUploadDoc('iuran', item.id, item);
    }

    // 6. Iuran RKM
    for (const item of dbState.iuranRkm || []) {
      await safeUploadDoc('iuran_rkm', item.id, item);
    }

    // 7. Warga Meninggal
    for (const item of dbState.wargaMeninggal || []) {
      await safeUploadDoc('warga_meninggal', item.id, item);
    }

    // 8. Perlengkapan RKM
    for (const item of dbState.perlengkapanRkm || []) {
      await safeUploadDoc('perlengkapan_rkm', item.id, item);
    }

    // 9. Keamanan
    for (const item of dbState.keamanan || []) {
      await safeUploadDoc('keamanan', item.id, item);
    }

    // 9.b Jadwal Ronda
    for (const item of dbState.jadwalRonda || []) {
      await safeUploadDoc('jadwal_ronda', item.id, item);
    }

    // 9.c Absensi Ronda
    for (const item of dbState.absensiRonda || []) {
      await safeUploadDoc('absensi_ronda', item.id, item);
    }

    // 10. Bansos
    for (const item of dbState.bansos || []) {
      const payload = {
        ...item,
        nama: (item as any).nama || item.namaPenerima || '',
        namaPenerima: item.namaPenerima || (item as any).nama || '',
        status: item.status || (item as any).statusPenyaluran || 'Disalurkan',
        statusPenyaluran: (item as any).statusPenyaluran || item.status || 'Disalurkan',
      };
      await safeUploadDoc('bansos', item.id, payload);
    }

    // 10.b Cadangan Bansos
    for (const item of dbState.cadanganBansos || []) {
      await safeUploadDoc('cadangan_bansos', item.id, item);
    }

    // 11. UMKM
    for (const item of dbState.umkm || []) {
      const payload = {
        ...item,
        namaPemilik: (item as any).namaPemilik || (item as any).pemilik || '',
        pemilik: (item as any).pemilik || (item as any).namaPemilik || '',
      };
      await safeUploadDoc('umkm', item.id, payload);
    }

    // 12. Kegiatan
    for (const item of dbState.kegiatan || []) {
      await safeUploadDoc('kegiatan', item.id, item);
    }

    // 13. Pengaduan
    for (const item of dbState.pengaduan || []) {
      const namaPelapor = item.namaPelapor || (item as any).namaWarga || (item as any).nama || 'Warga RW 018';
      const isiText = (item as any).isiPengaduan || item.deskripsi || (item as any).isi || '';
      const payload = {
        ...item,
        id: item.id,
        namaPelapor,
        namaWarga: (item as any).namaWarga || namaPelapor,
        rt: sanitizeRtValue(item.rt, '039'),
        kategori: item.kategori || 'Fasilitas Umum & Jalan',
        judul: item.judul || 'Laporan Pengaduan Warga',
        status: item.status || 'Masuk',
        isi: isiText,
        deskripsi: isiText,
        isiPengaduan: isiText,
      };
      await safeUploadDoc('pengaduan', item.id, payload);
    }

    // 14. Surat
    for (const item of dbState.surat || []) {
      const payload = {
        ...item,
        nomorSurat: (item as any).nomorSurat || item.noSurat || '',
        noSurat: item.noSurat || (item as any).nomorSurat || '',
      };
      await safeUploadDoc('surat', item.id, payload);
    }

    // 15. PBB
    for (const item of dbState.pbb || []) {
      const payload = {
        ...item,
        namaWp: (item as any).namaWp || item.namaWajibPajak || '',
        namaWajibPajak: item.namaWajibPajak || (item as any).namaWp || '',
        tagihan: typeof (item as any).tagihan === 'number' ? (item as any).tagihan : (item.totalTagihan || item.tagihanPokok || 0),
        totalTagihan: typeof item.totalTagihan === 'number' ? item.totalTagihan : (item as any).tagihan || 0,
        statusBayar: (item as any).statusBayar || item.statusPembayaran || 'Belum Lunas',
        statusPembayaran: item.statusPembayaran || (item as any).statusBayar || 'Belum Lunas',
      };
      await safeUploadDoc('pbb', item.id, payload);
    }

    // 16. Laporan Kejadian
    for (const item of dbState.laporanKejadian || []) {
      await safeUploadDoc('laporan_kejadian', item.id, item);
    }

    if (count === 0 && failedCount > 0) {
      return {
        success: false,
        totalSynced: 0,
        totalFailed: failedCount,
        error: errors.join('; ') || 'Gagal menyinkronkan dokumen ke Firestore.',
      };
    }

    return {
      success: true,
      totalSynced: count,
      totalFailed: failedCount,
    };
  } catch (error) {
    console.error('Failed to upload entire db to Firestore:', error);
    return { success: false, totalSynced: 0, error: (error as Error).message };
  }
}

export function resetDatabaseToDefault(): void {
  safeStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(initialRWProfile));
  safeStorage.setItem(STORAGE_KEYS.WARGA, JSON.stringify(initialWarga));
  safeStorage.setItem(STORAGE_KEYS.KK, JSON.stringify(initialKK));
  safeStorage.setItem(STORAGE_KEYS.IURAN_RKM, JSON.stringify(initialIuranRKM));
  safeStorage.setItem(STORAGE_KEYS.WARGA_MENINGGAL, JSON.stringify(initialWargaMeninggal));
  safeStorage.setItem(STORAGE_KEYS.PERLENGKAPAN_RKM, JSON.stringify(initialPerlengkapanRKM));
  safeStorage.setItem(STORAGE_KEYS.KEAMANAN, JSON.stringify(initialKeamananProgram));
  safeStorage.setItem(STORAGE_KEYS.BANSOS, JSON.stringify(initialBansos));
  safeStorage.setItem(STORAGE_KEYS.CADANGAN_BANSOS, JSON.stringify(initialCadanganBansos));
  safeStorage.setItem(STORAGE_KEYS.UMKM, JSON.stringify(initialUMKM));
  safeStorage.setItem(STORAGE_KEYS.KAS, JSON.stringify(initialTransaksiKas));
  safeStorage.setItem(STORAGE_KEYS.IURAN, JSON.stringify(initialIuranWarga));
  safeStorage.setItem(STORAGE_KEYS.PBB, JSON.stringify(initialPbb));
  safeStorage.setItem(STORAGE_KEYS.KEGIATAN, JSON.stringify(initialKegiatan));
  safeStorage.setItem(STORAGE_KEYS.PENGADUAN, JSON.stringify(initialPengaduan));
  safeStorage.setItem(STORAGE_KEYS.SURAT, JSON.stringify(initialSurat));
  safeStorage.setItem(STORAGE_KEYS.JADWAL_RONDA, JSON.stringify(initialJadwalRonda));
  safeStorage.setItem(STORAGE_KEYS.ABSENSI_RONDA, JSON.stringify(initialAbsensiRonda));
  
  // Also reset all user accounts and profile photos to default registered state
  safeStorage.setItem('rw018_auth_users_list_v2', JSON.stringify(initialUsers));
  initialUsers.forEach((user) => {
    saveDocumentOnline('users', user.id, user);
  });

  notifyChange();
}
export const resetToInitialData = resetDatabaseToDefault;

export function getFullDatabaseState() {
  return {
    profile: getRWProfile(),
    warga: getWargaList(),
    kk: getKKList(),
    iuranRkm: getIuranRkmList(),
    wargaMeninggal: getWargaMeninggalList(),
    perlengkapanRkm: getPerlengkapanRkmList(),
    keamanan: getKeamananList(),
    jadwalRonda: getJadwalRondaList(),
    absensiRonda: getAbsensiRondaList(),
    bansos: getBansosList(),
    cadanganBansos: getCadanganBansosList(),
    umkm: getUMKMList(),
    kas: getKasList(),
    iuran: getIuranList(),
    pbb: getPbbList(),
    kegiatan: getKegiatanList(),
    pengaduan: getPengaduanList(),
    surat: getSuratList(),
    laporanKejadian: getLaporanKejadianList(),
  };
}

export function exportDatabaseJSON(): string {
  const fullBackup = {
    appName: 'Aplikasi Ketua RW 018 Iringmulyo Metro Timur',
    exportedAt: new Date().toISOString(),
    version: '3.0',
    profile: getRWProfile(),
    warga: getWargaList(),
    kk: getKKList(),
    iuranRkm: getIuranRkmList(),
    wargaMeninggal: getWargaMeninggalList(),
    perlengkapanRkm: getPerlengkapanRkmList(),
    keamanan: getKeamananList(),
    jadwalRonda: getJadwalRondaList(),
    absensiRonda: getAbsensiRondaList(),
    bansos: getBansosList(),
    cadanganBansos: getCadanganBansosList(),
    umkm: getUMKMList(),
    kas: getKasList(),
    iuran: getIuranList(),
    pbb: getPbbList(),
    kegiatan: getKegiatanList(),
    pengaduan: getPengaduanList(),
    surat: getSuratList(),
    laporanKejadian: getLaporanKejadianList(),
  };
  return JSON.stringify(fullBackup, null, 2);
}

export function importDatabaseJSON(jsonStr: string): boolean {
  try {
    const data = JSON.parse(jsonStr);
    if (!data.warga || !data.kk) {
      throw new Error('Format file cadangan database tidak valid.');
    }
    if (data.profile) setItem(STORAGE_KEYS.PROFILE, data.profile);
    if (data.warga) setItem(STORAGE_KEYS.WARGA, data.warga);
    if (data.kk) setItem(STORAGE_KEYS.KK, data.kk);
    if (data.iuranRkm) setItem(STORAGE_KEYS.IURAN_RKM, data.iuranRkm);
    if (data.wargaMeninggal) setItem(STORAGE_KEYS.WARGA_MENINGGAL, data.wargaMeninggal);
    if (data.perlengkapanRkm) setItem(STORAGE_KEYS.PERLENGKAPAN_RKM, data.perlengkapanRkm);
    if (data.keamanan || data.rkm) setItem(STORAGE_KEYS.KEAMANAN, data.keamanan || data.rkm);
    if (data.jadwalRonda) setItem(STORAGE_KEYS.JADWAL_RONDA, data.jadwalRonda);
    if (data.absensiRonda) setItem(STORAGE_KEYS.ABSENSI_RONDA, data.absensiRonda);
    if (data.bansos) setItem(STORAGE_KEYS.BANSOS, data.bansos);
    if (data.cadanganBansos) setItem(STORAGE_KEYS.CADANGAN_BANSOS, data.cadanganBansos);
    if (data.umkm) setItem(STORAGE_KEYS.UMKM, data.umkm);
    if (data.kas) setItem(STORAGE_KEYS.KAS, data.kas);
    if (data.iuran) setItem(STORAGE_KEYS.IURAN, data.iuran);
    if (data.pbb) setItem(STORAGE_KEYS.PBB, data.pbb);
    if (data.kegiatan) setItem(STORAGE_KEYS.KEGIATAN, data.kegiatan);
    if (data.pengaduan) setItem(STORAGE_KEYS.PENGADUAN, data.pengaduan);
    if (data.surat) setItem(STORAGE_KEYS.SURAT, data.surat);
    if (data.laporanKejadian) setItem(STORAGE_KEYS.LAPORAN_KEJADIAN, data.laporanKejadian);
    return true;
  } catch (err) {
    console.error('Import database failed', err);
    return false;
  }
}

export interface CollectionStorageInfo {
  id: string;
  name: string;
  category: string;
  firestorePath: string;
  docCount: number;
  sizeBytes: number;
  sizeFormatted: string;
  avgDocSizeBytes: number;
  avgDocSizeFormatted: string;
  percentageOfTotal: number;
  cloudSyncStatus: 'Tersinkron' | 'Aktif' | 'Realtime';
  description: string;
  iconType: string;
}

export interface CloudStorageMetrics {
  totalDocs: number;
  totalSizeBytes: number;
  totalSizeKB: number;
  totalSizeMB: number;
  totalSizeFormatted: string;
  firestoreQuotaMB: number;
  firestoreQuotaFormatted: string;
  firestoreQuotaPercentUsed: number;
  remainingQuotaMB: number;
  remainingQuotaFormatted: string;
  maxDocSizeKB: number;
  maxDocSizeFormatted: string;
  databaseId: string;
  region: string;
  projectId: string;
  collections: CollectionStorageInfo[];
  dailyQuotaInfo: {
    readsDailyLimit: number;
    writesDailyLimit: number;
    deletesDailyLimit: number;
    sslEncryption: string;
    slaAvailability: string;
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function calculateDataBytes(data: unknown): number {
  try {
    const str = JSON.stringify(data);
    return new Blob([str]).size;
  } catch {
    return 0;
  }
}

export function getCloudStorageMetrics(): CloudStorageMetrics {
  const profile = getRWProfile();
  const warga = getWargaList();
  const kk = getKKList();
  const iuranRkm = getIuranRkmList();
  const wargaMeninggal = getWargaMeninggalList();
  const perlengkapanRkm = getPerlengkapanRkmList();
  const keamanan = getKeamananList();
  const bansos = getBansosList();
  const cadanganBansos = getCadanganBansosList();
  const umkm = getUMKMList();
  const kas = getKasList();
  const iuran = getIuranList();
  const pbb = getPbbList();
  const kegiatan = getKegiatanList();
  const pengaduan = getPengaduanList();
  const surat = getSuratList();

  // Retrieve users
  let usersList: unknown[] = [];
  try {
    const rawUsers = safeStorage.getItem('rw018_auth_users_list_v2');
    if (rawUsers) usersList = JSON.parse(rawUsers);
    else usersList = initialUsers;
  } catch {
    usersList = initialUsers;
  }

  const rawCollections = [
    {
      id: 'warga',
      name: 'Data Induk Kependudukan',
      category: 'Kependudukan',
      firestorePath: 'warga/{wargaId}',
      data: warga,
      count: warga.length,
      description: 'Data penduduk, NIK 16 digit, domisili RT 039-042 & riwayat biodata',
      iconType: 'users',
    },
    {
      id: 'kk',
      name: 'Kartu Keluarga (KK)',
      category: 'Kependudukan',
      firestorePath: 'kk/{kkId}',
      data: kk,
      count: kk.length,
      description: 'Nomor KK 16 digit, kepala keluarga, klasifikasi ekonomi & anggota keluarga',
      iconType: 'credit-card',
    },
    {
      id: 'kas',
      name: 'Buku Kas Keuangan RW',
      category: 'Keuangan',
      firestorePath: 'kas/{kasId}',
      data: kas,
      count: kas.length,
      description: 'Transaksi pemasukan, pengeluaran kas lingkungan & nomor kuitansi resmi',
      iconType: 'wallet',
    },
    {
      id: 'iuran',
      name: 'Iuran Bulanan Warga RT',
      category: 'Keuangan',
      firestorePath: 'iuran/{iuranId}',
      data: iuran,
      count: iuran.length,
      description: 'Status pembayaran iuran kebersihan/keamanan warga RT 039 s.d RT 042',
      iconType: 'receipt',
    },
    {
      id: 'iuran_rkm',
      name: 'Iuran Kas RKM',
      category: 'Sosial & RKM',
      firestorePath: 'iuran_rkm/{rkmId}',
      data: iuranRkm,
      count: iuranRkm.length,
      description: 'Pencatatan iuran rukun kematian warga & riwayat santunan duka',
      iconType: 'heart-handshake',
    },
    {
      id: 'warga_meninggal',
      name: 'Catatan Warga Meninggal',
      category: 'Sosial & RKM',
      firestorePath: 'warga_meninggal/{meninggalId}',
      data: wargaMeninggal,
      count: wargaMeninggal.length,
      description: 'Buku register data kematian warga, tanggal wafat & lokasi pemakaman',
      iconType: 'book-open',
    },
    {
      id: 'perlengkapan_rkm',
      name: 'Inventaris Perlengkapan RKM',
      category: 'Sosial & RKM',
      firestorePath: 'perlengkapan_rkm/{itemId}',
      data: perlengkapanRkm,
      count: perlengkapanRkm.length,
      description: 'Inventarisasi tenda, keranda, kain kafan & peralatan fardhu kifayah',
      iconType: 'layers',
    },
    {
      id: 'pbb',
      name: 'PBB & Pemilik SHM',
      category: 'Pajak & Aset',
      firestorePath: 'pbb/{pbbId}',
      data: pbb,
      count: pbb.length,
      description: 'Pajak Bumi & Bangunan, NOP, luas tanah/bangunan & arsip legalitas SHM',
      iconType: 'landmark',
    },
    {
      id: 'bansos',
      name: 'Penerima Bantuan Sosial',
      category: 'Sosial',
      firestorePath: 'bansos/{bansosId}',
      data: bansos,
      count: bansos.length,
      description: 'Daftar penerima bansos beras CBP, PKH, BPNT, BLT & tanggal salur',
      iconType: 'gift',
    },
    {
      id: 'cadangan_bansos',
      name: 'Cadangan Penerima Bansos',
      category: 'Sosial',
      firestorePath: 'cadangan_bansos/{cadanganId}',
      data: cadanganBansos,
      count: cadanganBansos.length,
      description: 'Daftar antrean warga layak terdaftar di data induk untuk bansos cadangan',
      iconType: 'users',
    },
    {
      id: 'umkm',
      name: 'Direktori UMKM Warga',
      category: 'Ekonomi',
      firestorePath: 'umkm/{umkmId}',
      data: umkm,
      count: umkm.length,
      description: 'Katalog usaha warga RW 018 (kuliner, toko, sembako, jasa & kerajinan)',
      iconType: 'shopping-bag',
    },
    {
      id: 'keamanan',
      name: 'Keamanan & CCTV',
      category: 'Keamanan & Fisik',
      firestorePath: 'keamanan/{progId}',
      data: keamanan,
      count: keamanan.length,
      description: '16 titik CCTV online, jadwal pos ronda & program pembangunan fisik',
      iconType: 'shield-check',
    },
    {
      id: 'kegiatan',
      name: 'Agenda Kegiatan RW',
      category: 'Agenda & Musyawarah',
      firestorePath: 'kegiatan/{kegiatanId}',
      data: kegiatan,
      count: kegiatan.length,
      description: 'Jadwal gotong royong, posyandu, rapat warga & notulen musyawarah',
      iconType: 'calendar',
    },
    {
      id: 'pengaduan',
      name: 'Pengaduan & Aspirasi',
      category: 'Layanan Warga',
      firestorePath: 'pengaduan/{pengaduanId}',
      data: pengaduan,
      count: pengaduan.length,
      description: 'Laporan keluhan warga (drainase, jalan, sampah) & status tindak lanjut',
      iconType: 'message-square-warning',
    },
    {
      id: 'surat',
      name: 'Arsip Surat Pengantar',
      category: 'Administrasi',
      firestorePath: 'surat/{suratId}',
      data: surat,
      count: surat.length,
      description: 'Nomor surat resmi, format kop RW, jenis keperluan & arsip tanda tangan',
      iconType: 'file-text',
    },
    {
      id: 'profile',
      name: 'Profil Wilayah & Pengurus',
      category: 'Lembaga',
      firestorePath: 'profile/rw018_main',
      data: profile,
      count: 1,
      description: 'Identitas RW 018, pengurus inti, seksi bidang, kontak darurat & logo',
      iconType: 'building',
    },
    {
      id: 'users',
      name: 'Akun Pengurus & Hak Akses',
      category: 'Keamanan & Akun',
      firestorePath: 'users/{userId}',
      data: usersList,
      count: usersList.length,
      description: 'Kredensial login pengurus RW/RT, PIN biometrik & wewenang modul',
      iconType: 'key',
    },
  ];

  let totalSizeBytes = 0;
  let totalDocs = 0;

  const collectionSizes = rawCollections.map((col) => {
    const bytes = calculateDataBytes(col.data);
    totalSizeBytes += bytes;
    totalDocs += col.count;
    return {
      col,
      bytes,
    };
  });

  const collections: CollectionStorageInfo[] = collectionSizes.map(({ col, bytes }) => {
    const percentageOfTotal = totalSizeBytes > 0 ? (bytes / totalSizeBytes) * 100 : 0;
    const avgDocSizeBytes = col.count > 0 ? Math.round(bytes / col.count) : bytes;
    return {
      id: col.id,
      name: col.name,
      category: col.category,
      firestorePath: col.firestorePath,
      docCount: col.count,
      sizeBytes: bytes,
      sizeFormatted: formatBytes(bytes),
      avgDocSizeBytes,
      avgDocSizeFormatted: formatBytes(avgDocSizeBytes),
      percentageOfTotal: Number(percentageOfTotal.toFixed(1)),
      cloudSyncStatus: 'Realtime',
      description: col.description,
      iconType: col.iconType,
    };
  });

  // Sort collections by size descending
  collections.sort((a, b) => b.sizeBytes - a.sizeBytes);

  const totalSizeKB = Number((totalSizeBytes / 1024).toFixed(2));
  const totalSizeMB = Number((totalSizeBytes / (1024 * 1024)).toFixed(4));
  const firestoreQuotaMB = 1024; // 1 GiB free tier storage
  const firestoreQuotaPercentUsed = Number(((totalSizeMB / firestoreQuotaMB) * 100).toFixed(4));
  const remainingQuotaMB = Number((firestoreQuotaMB - totalSizeMB).toFixed(2));

  return {
    totalDocs,
    totalSizeBytes,
    totalSizeKB,
    totalSizeMB,
    totalSizeFormatted: formatBytes(totalSizeBytes),
    firestoreQuotaMB,
    firestoreQuotaFormatted: '1.024 MB (1 GiB)',
    firestoreQuotaPercentUsed,
    remainingQuotaMB,
    remainingQuotaFormatted: `${remainingQuotaMB} MB`,
    maxDocSizeKB: 1024,
    maxDocSizeFormatted: '1.024 KB (1 MB)',
    databaseId: 'ai-studio-aplikasiketuarw0-e9d00609-bdb3-49d6-8032-bdfa33ef623a',
    region: 'asia-southeast1 (Jakarta / Singapore)',
    projectId: 'gen-lang-client-0125033911',
    collections,
    dailyQuotaInfo: {
      readsDailyLimit: 50000,
      writesDailyLimit: 20000,
      deletesDailyLimit: 20000,
      sslEncryption: 'TLS 1.3 / AES-256 Cloud Firestore',
      slaAvailability: '99.99% High Availability',
    },
  };
}

export function getDatabaseStats() {
  const profile = getRWProfile();
  const warga = getWargaList();
  const kk = getKKList();
  const iuranRkm = getIuranRkmList();
  const wargaMeninggal = getWargaMeninggalList();
  const perlengkapanRkm = getPerlengkapanRkmList();
  const keamanan = getKeamananList();
  const bansos = getBansosList();
  const cadanganBansos = getCadanganBansosList();
  const umkm = getUMKMList();
  const kas = getKasList();
  const iuran = getIuranList();
  const pbb = getPbbList();
  const kegiatan = getKegiatanList();
  const pengaduan = getPengaduanList();
  const surat = getSuratList();

  const totalRecords =
    warga.length +
    kk.length +
    iuranRkm.length +
    wargaMeninggal.length +
    perlengkapanRkm.length +
    keamanan.length +
    bansos.length +
    cadanganBansos.length +
    umkm.length +
    kas.length +
    iuran.length +
    pbb.length +
    kegiatan.length +
    pengaduan.length +
    surat.length;

  let totalBytes = 0;
  for (const key of Object.values(STORAGE_KEYS)) {
    const item = safeStorage.getItem(key);
    if (item) totalBytes += item.length * 2;
  }

  const saldoKas = kas.reduce((acc, curr) => {
    return curr.tipe === 'Pemasukan' ? acc + curr.jumlah : acc - curr.jumlah;
  }, 0);

  return {
    profile,
    counts: {
      warga: warga.length,
      kk: kk.length,
      iuranRkm: iuranRkm.length,
      wargaMeninggal: wargaMeninggal.length,
      perlengkapanRkm: perlengkapanRkm.length,
      keamanan: keamanan.length,
      bansos: bansos.length,
      cadanganBansos: cadanganBansos.length,
      umkm: umkm.length,
      kas: kas.length,
      iuran: iuran.length,
      pbb: pbb.length,
      kegiatan: kegiatan.length,
      pengaduan: pengaduan.length,
      surat: surat.length,
      totalRecords,
    },
    saldoKas,
    storageSizeKB: (totalBytes / 1024).toFixed(2),
  };
}
