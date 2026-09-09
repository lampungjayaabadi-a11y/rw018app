import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from './firebase';
import firebaseConfig from '../../firebase-applet-config.json';
import { DokumentasiKejadian } from '../types';
import { generateId } from '../utils/formatters';

let storageInstance: any = null;

function getSafeStorage() {
  if (!storageInstance) {
    try {
      if (firebaseConfig.storageBucket) {
        storageInstance = getStorage(app, `gs://${firebaseConfig.storageBucket}`);
      } else {
        storageInstance = getStorage(app);
      }
    } catch (err) {
      console.warn('Firebase Storage initialization fallback:', err);
    }
  }
  return storageInstance;
}

/**
 * Konversi File menjadi Data URL Base64 untuk preview instan dan penyimpanan aman offline
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Upload dokumentasi ke Firebase Storage dengan graceful fallback ke Data URL
 */
export async function uploadDokumentasiKejadian(
  file: File,
  laporanId: string
): Promise<DokumentasiKejadian> {
  const fileExt = file.name.split('.').pop() || 'dat';
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `laporan_kejadian/${laporanId}/${Date.now()}_${cleanName}`;
  const uploadTime = new Date().toISOString();

  let jenis: 'foto' | 'video' | 'dokumen' = 'dokumen';
  if (file.type.startsWith('image/')) {
    jenis = 'foto';
  } else if (file.type.startsWith('video/')) {
    jenis = 'video';
  }

  let finalUrl = '';

  try {
    const storage = getSafeStorage();
    if (storage) {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file, {
        contentType: file.type,
      });
      finalUrl = await getDownloadURL(snapshot.ref);
    }
  } catch (storageErr) {
    console.warn('Upload to Firebase Storage failed, falling back to local/dataURL:', storageErr);
  }

  // If cloud storage was not reachable or threw error (e.g. storage rules/preview), fallback to Data URL
  if (!finalUrl) {
    finalUrl = await fileToDataUrl(file);
  }

  return {
    id: generateId('dok'),
    namaFile: file.name,
    jenisFile: jenis,
    waktuUpload: uploadTime,
    url: finalUrl,
    size: file.size,
  };
}
