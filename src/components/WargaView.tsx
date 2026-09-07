import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Phone,
  MessageCircle,
  Eye,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  UserCheck,
  HeartHandshake,
  Calendar,
  MapPin,
  Briefcase,
  GraduationCap,
  Droplet,
  Shield,
  Home,
  CreditCard,
  Camera,
  Sparkles,
  Lock,
  X,
  ChevronDown,
  ChevronUp,
  Check,
  Heart,
  Upload,
  Image as ImageIcon,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  User,
  RotateCw,
  Baby,
  FileText,
  Printer,
  Mic,
  MicOff,
  Volume2
} from 'lucide-react';
import { Warga, KartuKeluarga, Gender, Religion, MaritalStatus, FamilyRole, BloodType, RWProfile, AppUser } from '../types';
import { formatTanggalIndo, hitungUsia, getCleanWaNumber, generateId } from '../utils/formatters';
import { exportWarga } from '../utils/exportUtils';
import { ExportButton } from './ExportButton';
import { KtpScannerModal } from './KtpScannerModal';
import { WargaSpecialCategoryReportModal, SpecialCategoryTab } from './WargaSpecialCategoryReportModal';
import { isMatchingRt, getUserRestrictedRt } from '../services/auth';

interface WargaViewProps {
  profile: RWProfile;
  wargaList: Warga[];
  kkList?: KartuKeluarga[];
  onSaveWarga: (warga: Warga) => void;
  onDeleteWarga: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectKk?: (noKk: string) => void;
  onCreateSurat?: (warga: Warga) => void;
  onGenerateSuratForWarga?: (warga: Warga) => void;
  currentUser?: AppUser | null;
}

export const WargaView: React.FC<WargaViewProps> = ({
  profile,
  wargaList,
  kkList = [],
  onSaveWarga,
  onDeleteWarga,
  searchQuery,
  onSearchChange,
  onSelectKk,
  onCreateSurat,
  onGenerateSuratForWarga,
  currentUser,
}) => {
  const triggerCreateSurat = onCreateSurat || onGenerateSuratForWarga;
  const restrictedRt = getUserRestrictedRt(currentUser);

  // Scoped warga list for Ketua RT
  const scopedWargaList = useMemo(() => {
    if (!restrictedRt) return wargaList;
    return wargaList.filter((w) => isMatchingRt(w.rt, restrictedRt));
  }, [wargaList, restrictedRt]);

  const scopedKkList = useMemo(() => {
    if (!restrictedRt) return kkList;
    return kkList.filter((k) => isMatchingRt(k.rt, restrictedRt));
  }, [kkList, restrictedRt]);

  const [selectedRt, setSelectedRt] = useState<string>(restrictedRt || 'ALL');
  const [filterGender, setFilterGender] = useState<string>('ALL');
  const [filterLansia, setFilterLansia] = useState<boolean>(false);
  const [filterDisabilitas, setFilterDisabilitas] = useState<boolean>(false);
  const [filterDudaJanda, setFilterDudaJanda] = useState<boolean>(false);
  const [filterUsiaProduktif, setFilterUsiaProduktif] = useState<boolean>(false);
  const [filterAnakYatim, setFilterAnakYatim] = useState<boolean>(false);
  const [isSpecialDropdownOpen, setIsSpecialDropdownOpen] = useState<boolean>(false);
  const [isSpecialReportModalOpen, setIsSpecialReportModalOpen] = useState<boolean>(false);
  const [reportInitialCategory, setReportInitialCategory] = useState<SpecialCategoryTab>('ALL_SPECIAL');
  const specialDropdownRef = useRef<HTMLDivElement>(null);

  // Helper untuk menentukan apakah warga masuk kategori Usia Produktif (16 - 59 tahun)
  const isUsiaProduktif = (w: Warga): boolean => {
    const age = hitungUsia(w.tanggalLahir);
    return age >= 16 && age <= 59;
  };

  // Helper untuk menentukan apakah warga adalah Anak Yatim / Piatu (usia 0 - 15 tahun dengan Kepala KK / Orang Tua status Duda atau Janda)
  const isAnakYatimPiatu = (w: Warga): boolean => {
    const age = hitungUsia(w.tanggalLahir);
    if (age < 0 || age > 15) return false;

    // 1. Cek dari wargaList: anggota keluarga berstatus Kepala Keluarga di KK yang sama
    const kepala = wargaList.find(
      (item) => item.noKk === w.noKk && (item.statusKeluarga === 'Kepala Keluarga' || item.statusKeluarga?.toLowerCase().includes('kepala'))
    );
    if (kepala) {
      if (kepala.isDudaJanda || kepala.statusKawin === 'Cerai Mati' || kepala.statusKawin === 'Cerai Hidup') {
        return true;
      }
    }

    // 2. Cek apakah ada orang tua / pengasuh di 1 KK yang berstatus Duda / Janda (Cerai Mati / Cerai Hidup)
    const hasDudaJandaParent = wargaList.some(
      (item) =>
        item.noKk === w.noKk &&
        item.id !== w.id &&
        (item.statusKeluarga === 'Kepala Keluarga' || item.statusKeluarga === 'Istri' || item.statusKeluarga === 'Suami' || item.statusKeluarga === 'Orang Tua' || item.statusKeluarga === 'Mertua') &&
        (item.isDudaJanda || item.statusKawin === 'Cerai Mati' || item.statusKawin === 'Cerai Hidup')
    );
    if (hasDudaJandaParent) return true;

    // 3. Cek dari kkList jika kepala keluarga tercatat berstatus Duda / Janda
    const matchedKk = kkList.find((k) => k.noKk === w.noKk);
    if (matchedKk && matchedKk.nikKepala) {
      const kepalaWarga = wargaList.find((item) => item.nik === matchedKk.nikKepala);
      if (kepalaWarga && (kepalaWarga.isDudaJanda || kepalaWarga.statusKawin === 'Cerai Mati' || kepalaWarga.statusKawin === 'Cerai Hidup')) {
        return true;
      }
    }

    return false;
  };

  // Close Special Category Dropdown on Outside Click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        specialDropdownRef.current &&
        !specialDropdownRef.current.contains(event.target as Node)
      ) {
        setIsSpecialDropdownOpen(false);
      }
    };
    if (isSpecialDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSpecialDropdownOpen]);

  // Sync selected RT when login role changes
  useEffect(() => {
    if (restrictedRt) {
      setSelectedRt(restrictedRt);
    } else {
      setSelectedRt('ALL');
    }
  }, [restrictedRt]);
  
  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isKtpScannerOpen, setIsKtpScannerOpen] = useState(false);
  const [scannedNotification, setScannedNotification] = useState<string | null>(null);
  const [editingWarga, setEditingWarga] = useState<Warga | null>(null);
  const [detailWarga, setDetailWarga] = useState<Warga | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Web Speech API State for Voice Search
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const isSpeechSupported = useMemo(() => {
    return typeof window !== 'undefined' && (
      'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
    );
  }, []);

  const handleToggleVoiceInput = () => {
    if (!isSpeechSupported) {
      alert('Browser ini belum mendukung Web Speech API (Input Suara). Silakan gunakan Google Chrome di Android atau Desktop.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          console.warn('Error stopping recognition:', err);
        }
      }
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognitionClass =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognitionClass();
      recognitionRef.current = recognition;

      recognition.lang = 'id-ID'; // Bahasa Indonesia untuk pengenalan nama warga yang akurat
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTranscript += item[0].transcript;
          } else {
            interimTranscript += item[0].transcript;
          }
        }

        const recognizedText = (finalTranscript || interimTranscript).trim();
        if (recognizedText) {
          onSearchChange(recognizedText);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Web Speech API Error:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError('Izin mikrofon tidak diberikan. Silakan izinkan akses mikrofon pada peramban Anda.');
        } else if (event.error === 'no-speech') {
          setSpeechError('Suara tidak terdeteksi. Silakan coba sebutkan kembali nama warga.');
        } else if (event.error === 'audio-capture') {
          setSpeechError('Mikrofon tidak terdeteksi pada perangkat.');
        } else {
          setSpeechError(`Pencarian suara: ${event.error}`);
        }
        setIsListening(false);
        setTimeout(() => setSpeechError(null), 5000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
      setSpeechError('Gagal mengaktifkan mikrofon pencarian suara.');
      setTimeout(() => setSpeechError(null), 5000);
    }
  };

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  // Helper untuk menentukan Nama Kepala Keluarga berdasarkan No KK
  const getKepalaKeluarga = (w: Warga): { nama: string; noKk: string; isSelf: boolean } => {
    // 1. Cek dari daftar kkList
    if (kkList && kkList.length > 0) {
      const matchedKk = kkList.find((k) => k.noKk === w.noKk);
      if (matchedKk && matchedKk.kepalaKeluarga) {
        return {
          nama: matchedKk.kepalaKeluarga,
          noKk: w.noKk,
          isSelf:
            matchedKk.kepalaKeluarga.toLowerCase().trim() === w.nama.toLowerCase().trim() ||
            w.statusKeluarga === 'Kepala Keluarga'
        };
      }
    }

    // 2. Jika status keluarga ybs adalah Kepala Keluarga
    if (w.statusKeluarga === 'Kepala Keluarga') {
      return {
        nama: w.nama,
        noKk: w.noKk,
        isSelf: true
      };
    }

    // 3. Cari di wargaList untuk anggota 1 KK yang berstatus Kepala Keluarga
    const kepalaInWarga = wargaList.find(
      (item) => item.noKk === w.noKk && (item.statusKeluarga === 'Kepala Keluarga' || item.statusKeluarga.toLowerCase().includes('kepala'))
    );
    if (kepalaInWarga) {
      return {
        nama: kepalaInWarga.nama,
        noKk: w.noKk,
        isSelf: false
      };
    }

    return {
      nama: w.nama,
      noKk: w.noKk,
      isSelf: true
    };
  };

  // Form State
  const initialFormState: Partial<Warga> = {
    nik: '',
    noKk: '',
    nama: '',
    tempatLahir: '',
    tanggalLahir: '',
    jenisKelamin: 'L',
    agama: 'Islam',
    pekerjaan: '',
    statusKawin: 'Kawin',
    statusKeluarga: 'Kepala Keluarga',
    rt: '039',
    alamat: '',
    noHp: '',
    golDarah: 'Tidak Tahu',
    pendidikan: 'SMA / Sedrajat',
    isDisabilitas: false,
    isLansia: false,
    isDudaJanda: false,
    statusDomisili: 'Tetap',
    foto: '',
  };
  const [formData, setFormData] = useState<Partial<Warga>>(initialFormState);

  // Validasi Real-time Duplikasi NIK terhadap Database Firestore / wargaList
  const duplicateNikWarga = useMemo(() => {
    const currentNik = (formData.nik || '').trim();
    if (!currentNik || currentNik.length < 4) return null;
    return (
      wargaList.find(
        (w) => w.nik.trim() === currentNik && w.id !== editingWarga?.id
      ) || null
    );
  }, [formData.nik, wargaList, editingWarga]);

  // Photo Input Refs & Camera State
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);

  // Helper Kompresi & Resize Foto (Portrait Pas Foto KTP 3:4)
  const compressImage = (file: File | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxW = 480;
          const maxH = 640;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxW) {
              height = Math.round((height * maxW) / width);
              width = maxW;
            }
          } else {
            if (height > maxH) {
              width = Math.round((width * maxH) / height);
              height = maxH;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            resolve(dataUrl);
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Kamera Langsung (Webcam Stream) Controls - High Resolution & Portrait Quality
  const startLiveCamera = async (mode: 'user' | 'environment' = 'user') => {
    try {
      setCameraError(null);
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1920, min: 1080 },
          height: { ideal: 1080, min: 720 },
        },
        audio: false
      });
      setCameraStream(stream);
      setFacingMode(mode);
      setIsLiveCameraOpen(true);
    } catch (err: any) {
      console.warn('Live stream camera not available, falling back to native file capture:', err);
      // Fallback ke input kamera native smartphone
      if (cameraInputRef.current) {
        cameraInputRef.current.click();
      } else {
        setCameraError('Kamera tidak dapat diakses langsung. Silakan pilih foto dari galeri.');
      }
    }
  };

  const stopLiveCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsLiveCameraOpen(false);
    setCameraError(null);
  };

  const toggleFacingMode = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    startLiveCamera(nextMode);
  };

  const captureLivePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const vWidth = video.videoWidth || 1080;
      const vHeight = video.videoHeight || 1440;

      // Crop center to standard portrait 3:4 aspect ratio
      const targetRatio = 3 / 4;
      let cropWidth = vWidth;
      let cropHeight = vWidth / targetRatio;
      if (cropHeight > vHeight) {
        cropHeight = vHeight;
        cropWidth = vHeight * targetRatio;
      }

      const cropX = (vWidth - cropWidth) / 2;
      const cropY = (vHeight - cropHeight) / 2;

      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 800;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, cropX, cropY, cropWidth, cropHeight, 0, 0, 600, 800);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        setFormData((prev) => ({ ...prev, foto: dataUrl }));
        stopLiveCamera();
      }
    }
  };

  useEffect(() => {
    if (isLiveCameraOpen && videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch((e) => console.error('Error playing video stream', e));
    }
  }, [isLiveCameraOpen, cameraStream]);

  useEffect(() => {
    if (!isFormModalOpen && cameraStream) {
      stopLiveCamera();
    }
  }, [isFormModalOpen]);

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsProcessingPhoto(true);
      const compressed = await compressImage(file);
      setFormData((prev) => ({ ...prev, foto: compressed }));
    } catch (err) {
      console.error('Error loading photo file', err);
      alert('Gagal memproses foto. Silakan coba pilih format JPG/PNG lainnya.');
    } finally {
      setIsProcessingPhoto(false);
      e.target.value = '';
    }
  };

  // Filtered Warga List (strictly uses scopedWargaList)
  const filteredWarga = useMemo(() => {
    return scopedWargaList.filter((w) => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        w.nama.toLowerCase().includes(q) ||
        w.nik.includes(q) ||
        w.noKk.includes(q) ||
        w.pekerjaan.toLowerCase().includes(q) ||
        w.alamat.toLowerCase().includes(q) ||
        w.rt.includes(q);

      // RT filter
      const matchRt =
        restrictedRt
          ? isMatchingRt(w.rt, restrictedRt)
          : selectedRt === 'ALL' ||
            w.rt === selectedRt ||
            w.rt === selectedRt.replace(/^0+/, '');

      // Gender filter
      const matchGender = filterGender === 'ALL' || w.jenisKelamin === filterGender;

      // Special filters
      const matchLansia = !filterLansia || w.isLansia || hitungUsia(w.tanggalLahir) >= 60;
      const matchDisabilitas = !filterDisabilitas || w.isDisabilitas;
      const matchDudaJanda =
        !filterDudaJanda ||
        w.isDudaJanda ||
        w.statusKawin === 'Cerai Mati' ||
        w.statusKawin === 'Cerai Hidup';
      const matchUsiaProduktif = !filterUsiaProduktif || isUsiaProduktif(w);
      const matchAnakYatim = !filterAnakYatim || isAnakYatimPiatu(w);

      return matchSearch && matchRt && matchGender && matchLansia && matchDisabilitas && matchDudaJanda && matchUsiaProduktif && matchAnakYatim;
    });
  }, [scopedWargaList, searchQuery, selectedRt, restrictedRt, filterGender, filterLansia, filterDisabilitas, filterDudaJanda, filterUsiaProduktif, filterAnakYatim, wargaList, kkList]);

  const handleOpenAdd = () => {
    setEditingWarga(null);
    setScannedNotification(null);
    setFormData({
      ...initialFormState,
      foto: '',
      rt: restrictedRt || (selectedRt !== 'ALL' ? selectedRt : (profile.daftarRt[0] || '039')),
    });
    setIsFormModalOpen(true);
  };

  const handleApplyScannedKtp = (scanned: Partial<Warga>) => {
    setEditingWarga(null);

    const cleanScannedNik = (scanned.nik || '').trim();
    const duplicate = cleanScannedNik
      ? wargaList.find((w) => w.nik.trim() === cleanScannedNik)
      : null;

    // Cari No KK yang cocok berdasarkan RT
    let matchedKk = '';
    const targetRt = restrictedRt || scanned.rt;
    if (scopedKkList && scopedKkList.length > 0) {
      const byRt = scopedKkList.find((k) => k.rt === targetRt);
      if (byRt) matchedKk = byRt.noKk;
    }
    if (!matchedKk && scanned.nik) {
      matchedKk = `187102${scanned.nik.slice(6, 12)}0001`;
    }

    setFormData((prev) => ({
      ...initialFormState,
      ...prev,
      ...scanned,
      foto: scanned.foto || prev.foto || '',
      rt: restrictedRt || scanned.rt || prev.rt || '039',
      noKk: prev.noKk || matchedKk || '',
    }));
    setIsFormModalOpen(true);

    if (duplicate) {
      setScannedNotification(
        `⚠️ Perhatian: NIK "${cleanScannedNik}" hasil scan e-KTP sudah terdaftar di database atas nama "${duplicate.nama}" (RT ${duplicate.rt})!`
      );
      setTimeout(() => setScannedNotification(null), 8000);
    } else {
      setScannedNotification(`Data e-KTP an. "${scanned.nama}" berhasil dipindai & otomatis diisikan ke formulir!`);
      setTimeout(() => setScannedNotification(null), 6000);
    }
  };

  const handleOpenEdit = (warga: Warga) => {
    setEditingWarga(warga);
    setFormData({
      ...warga,
      foto: warga.foto || warga.fotoUrl || '',
      rt: restrictedRt || warga.rt,
    });
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNik = (formData.nik || '').trim();
    const cleanNama = (formData.nama || '').trim();
    const cleanNoKk = (formData.noKk || '').trim();

    if (!cleanNik || !cleanNama || !cleanNoKk) {
      alert('Mohon isi NIK, No KK, dan Nama Lengkap!');
      return;
    }

    // Validasi 16 Digit NIK
    if (cleanNik.length !== 16 || !/^\d{16}$/.test(cleanNik)) {
      alert('⚠️ Validasi NIK Gagal!\n\nNomor Induk Kependudukan (NIK) harus terdiri dari tepat 16 digit angka kependudukan yang sah.');
      return;
    }

    // Validasi 16 Digit No KK
    if (cleanNoKk.length !== 16 || !/^\d{16}$/.test(cleanNoKk)) {
      alert('⚠️ Validasi No KK Gagal!\n\nNomor Kartu Keluarga (No KK) harus terdiri dari tepat 16 digit angka.');
      return;
    }

    // Validasi NIK Ganda di Database Firestore / wargaList
    const duplicate = wargaList.find(
      (w) => w.nik.trim() === cleanNik && w.id !== editingWarga?.id
    );

    if (duplicate) {
      alert(
        `⚠️ PERINGATAN NIK GANDA / SUDAH TERDAFTAR!\n\n` +
        `NIK "${cleanNik}" sudah terdaftar di database Firestore kependudukan atas nama:\n` +
        `• Nama Warga: ${duplicate.nama}\n` +
        `• Wilayah: RT ${duplicate.rt} ${profile.namaRw}\n` +
        `• No KK: ${duplicate.noKk}\n` +
        `• Hubungan Keluarga: ${duplicate.statusKeluarga}\n` +
        `• Status Domisili: ${duplicate.statusDomisili}\n\n` +
        `Satu NIK hanya boleh terdaftar untuk 1 jiwa warga negara. Data tidak dapat disimpan untuk mencegah terjadinya data ganda.\n\n` +
        `Jika Anda bermaksud memperbarui data warga tersebut, silakan tutup formulir ini lalu gunakan fitur tombol Edit pada data warga yang bersangkutan.`
      );
      return;
    }

    const currentSelectedRt = restrictedRt || formData.rt || (selectedRt !== 'ALL' ? selectedRt : profile.daftarRt[0]) || '039';

    const calculatedLansia = formData.tanggalLahir
      ? hitungUsia(formData.tanggalLahir) >= 60
      : formData.isLansia || false;

    const savedItem: Warga = {
      id: editingWarga ? editingWarga.id : generateId('w'),
      nik: cleanNik,
      noKk: cleanNoKk,
      nama: cleanNama,
      tempatLahir: formData.tempatLahir?.trim() || '-',
      tanggalLahir: formData.tanggalLahir || '1990-01-01',
      jenisKelamin: (formData.jenisKelamin as Gender) || 'L',
      agama: (formData.agama as Religion) || 'Islam',
      pekerjaan: formData.pekerjaan?.trim() || 'Wiraswasta',
      statusKawin: (formData.statusKawin as MaritalStatus) || 'Belum Kawin',
      statusKeluarga: (formData.statusKeluarga as FamilyRole) || 'Kepala Keluarga',
      rt: currentSelectedRt,
      alamat: formData.alamat?.trim() || `RT ${currentSelectedRt} ${profile.namaRw}`,
      noHp: formData.noHp?.trim() || '',
      golDarah: (formData.golDarah as BloodType) || 'Tidak Tahu',
      pendidikan: formData.pendidikan || 'SMA / Sedrajat',
      isDisabilitas: !!formData.isDisabilitas,
      isLansia: calculatedLansia,
      isDudaJanda: !!formData.isDudaJanda,
      statusDomisili: formData.statusDomisili || 'Tetap',
      foto: formData.foto || '',
      fotoUrl: formData.foto || '',
      createdAt: editingWarga?.createdAt || new Date().toISOString(),
    };

    onSaveWarga(savedItem);
    setIsFormModalOpen(false);
  };

  const handleExportExcel = () => {
    const scopeLabel = selectedRt === 'ALL' ? 'Semua_RT' : `RT_${selectedRt}`;
    exportWarga(filteredWarga, 'xlsx', scopeLabel, profile);
  };

  const handleExportCSV = () => {
    const scopeLabel = selectedRt === 'ALL' ? 'Semua_RT' : `RT_${selectedRt}`;
    exportWarga(filteredWarga, 'csv', scopeLabel, profile);
  };

  return (
    <div className="space-y-4 p-3 sm:p-4 pb-16 max-w-5xl mx-auto">
      {/* Top Header & Stats */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {restrictedRt ? `Data Induk Warga RT ${restrictedRt}` : `Data Induk Warga ${profile.namaRw}`}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                {scopedWargaList.length} Jiwa {restrictedRt ? `RT ${restrictedRt}` : 'Terdaftar'}
              </span>
              {restrictedRt && (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <Lock className="w-3 h-3 text-amber-700" />
                  RT {restrictedRt}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {restrictedRt
                ? `Pengelolaan kependudukan khusus wilayah RT ${restrictedRt}. Anda berwenang mengelola data warga di lingkungan RT ${restrictedRt}.`
                : 'Data kependudukan terpadu 4 RT untuk keperluan sensus, bansos & administrasi persuratan.'}
            </p>
          </div>

          {/* Action Buttons: Neatly aligned in 4 equal columns on mobile / inline on desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-4 sm:flex items-center gap-2 w-full sm:w-auto shrink-0">
            <ExportButton
              label="Ekspor"
              onExportExcel={handleExportExcel}
              onExportCsv={handleExportCSV}
              variant="secondary"
            />
            <button
              onClick={() => setIsKtpScannerOpen(true)}
              className="flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white text-xs font-black rounded-xl shadow-xs transition-all active:scale-95 border border-blue-400/30 text-center"
              title="Scan e-KTP dengan Kamera atau Foto"
            >
              <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-200 shrink-0" />
              <span className="truncate">Scan KTP</span>
            </button>
            <button
              onClick={() => {
                if (filterUsiaProduktif) setReportInitialCategory('PRODUKTIF');
                else if (filterAnakYatim) setReportInitialCategory('YATIM_PIATU');
                else if (filterLansia) setReportInitialCategory('LANSIA');
                else if (filterDisabilitas) setReportInitialCategory('DISABILITAS');
                else if (filterDudaJanda) setReportInitialCategory('DUDA_JANDA');
                else setReportInitialCategory('ALL_SPECIAL');
                setIsSpecialReportModalOpen(true);
              }}
              className="flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-2 bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 text-white text-xs font-black rounded-xl shadow-xs transition-all active:scale-95 border border-purple-400/30 text-center cursor-pointer"
              title="Buka Laporan Rekapitulasi Kategori Khusus & Cetak PDF"
            >
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-200 shrink-0" />
              <span className="truncate">Laporan</span>
            </button>
            <button
              onClick={handleOpenAdd}
              className="flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black rounded-xl shadow-xs transition-all active:scale-95 text-center cursor-pointer"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="truncate">Tambah</span>
            </button>
          </div>
        </div>

        {/* Filter Chips Bar - Aligned & Compact in Single Screen Layout */}
        <div className="pt-2.5 border-t border-slate-100 space-y-2">
          {/* Baris 1: Filter RT */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-xs">
            {restrictedRt ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 font-bold text-xs shadow-2xs">
                <Lock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>Wilayah Tugas: RT {restrictedRt}</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-700 text-white text-[10px] font-black">{scopedWargaList.length} Jiwa</span>
              </div>
            ) : (
              <>
                <span className="text-slate-400 font-bold flex items-center gap-1 shrink-0 mr-0.5 text-[11px]">
                  <Filter className="w-3 h-3 text-emerald-600" /> RT:
                </span>
                <button
                  onClick={() => setSelectedRt('ALL')}
                  className={`px-2.5 py-1.5 rounded-xl font-bold transition-all text-xs shrink-0 ${
                    selectedRt === 'ALL'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Semua ({scopedWargaList.length})
                </button>
                {profile.daftarRt.map((rt) => {
                  const count = scopedWargaList.filter(
                    (w) => w.rt === rt || w.rt === rt.replace(/^0+/, '')
                  ).length;
                  return (
                    <button
                      key={rt}
                      onClick={() => setSelectedRt(rt)}
                      className={`px-2.5 py-1.5 rounded-xl font-bold transition-all text-xs shrink-0 ${
                        selectedRt === rt
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      RT {rt} ({count})
                    </button>
                  );
                })}
              </>
            )}
          </div>

          {/* Baris 2: Sub-Filter Kategori Khusus (Dropdown) & Gender Sejajar */}
          <div className="flex items-center gap-2 overflow-visible pb-0.5 text-xs flex-wrap">
            {/* Gender Segmented Switch */}
            <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-xl shrink-0 border border-slate-200/60">
              <button
                type="button"
                onClick={() => setFilterGender('ALL')}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  filterGender === 'ALL' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Semua Gender"
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setFilterGender('L')}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  filterGender === 'L' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-blue-700'
                }`}
                title="Laki-laki (L)"
              >
                L
              </button>
              <button
                type="button"
                onClick={() => setFilterGender('P')}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  filterGender === 'P' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-rose-700'
                }`}
                title="Perempuan (P)"
              >
                P
              </button>
            </div>

            {/* Dropdown Menu Kategori Khusus: Usia Produktif, Anak Yatim/Piatu, Lansia, Disabilitas, Duda/Janda */}
            <div className="relative" ref={specialDropdownRef}>
              <button
                type="button"
                onClick={() => setIsSpecialDropdownOpen(!isSpecialDropdownOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-2xs cursor-pointer ${
                  filterLansia || filterDisabilitas || filterDudaJanda || filterUsiaProduktif || filterAnakYatim
                    ? 'bg-purple-50 border-purple-300 text-purple-900 ring-2 ring-purple-500/20'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-1">
                  {filterUsiaProduktif && <span className="text-blue-700 font-bold flex items-center gap-1"><Briefcase className="w-3 h-3" /> Usia Produktif (16-59 th)</span>}
                  {filterAnakYatim && <span className="text-teal-800 font-bold flex items-center gap-1"><Baby className="w-3.5 h-3.5 text-teal-600" /> Yatim/Piatu (0-15 th)</span>}
                  {filterLansia && <span className="text-amber-700">🧓 Lansia (&gt;60 th)</span>}
                  {filterDisabilitas && <span className="text-purple-700">♿ Disabilitas</span>}
                  {filterDudaJanda && <span className="text-rose-700">🥀 Duda/Janda</span>}
                  {!filterLansia && !filterDisabilitas && !filterDudaJanda && !filterUsiaProduktif && !filterAnakYatim && (
                    <span className="text-slate-600 flex items-center gap-1">
                      <HeartHandshake className="w-3.5 h-3.5 text-purple-600" />
                      Kategori Khusus
                    </span>
                  )}
                </span>
                {isSpecialDropdownOpen ? (
                  <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                )}
              </button>

              {/* Dropdown Panel */}
              {isSpecialDropdownOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
                      <HeartHandshake className="w-3.5 h-3.5 text-purple-600" />
                      Pilih Kategori Khusus
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsSpecialDropdownOpen(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="p-1.5 space-y-1 max-h-[380px] overflow-y-auto">
                    {/* Option: Semua Kategori (Reset) */}
                    <button
                      type="button"
                      onClick={() => {
                        setFilterLansia(false);
                        setFilterDisabilitas(false);
                        setFilterDudaJanda(false);
                        setFilterUsiaProduktif(false);
                        setFilterAnakYatim(false);
                        setIsSpecialDropdownOpen(false);
                      }}
                      className={`w-full p-2 rounded-xl text-left text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                        !filterLansia && !filterDisabilitas && !filterDudaJanda && !filterUsiaProduktif && !filterAnakYatim
                          ? 'bg-purple-600 text-white'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5" />
                        <span>Semua Kategori (Tanpa Filter)</span>
                      </div>
                      {!filterLansia && !filterDisabilitas && !filterDudaJanda && !filterUsiaProduktif && !filterAnakYatim && (
                        <Check className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Option: 💼 Usia Produktif (16 - 59 th) */}
                    <button
                      type="button"
                      onClick={() => {
                        setFilterUsiaProduktif(!filterUsiaProduktif);
                        setFilterLansia(false);
                        setFilterDisabilitas(false);
                        setFilterDudaJanda(false);
                        setFilterAnakYatim(false);
                        setIsSpecialDropdownOpen(false);
                      }}
                      className={`w-full p-2 rounded-xl text-left text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                        filterUsiaProduktif
                          ? 'bg-blue-600 text-white'
                          : 'hover:bg-blue-50 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${filterUsiaProduktif ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'}`}>
                          <Briefcase className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="leading-tight">Usia Produktif (16 - 59 th)</div>
                          <div className={`text-[10px] font-normal ${filterUsiaProduktif ? 'text-blue-100' : 'text-slate-400'}`}>
                            Warga usia kerja 16 s/d 59 tahun
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            filterUsiaProduktif ? 'bg-white text-blue-900' : 'bg-blue-100 text-blue-900'
                          }`}
                        >
                          {scopedWargaList.filter(isUsiaProduktif).length}
                        </span>
                        {filterUsiaProduktif && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </button>

                    {/* Option: 👶 Anak Yatim / Piatu (0 - 15 th) */}
                    <button
                      type="button"
                      onClick={() => {
                        setFilterAnakYatim(!filterAnakYatim);
                        setFilterLansia(false);
                        setFilterDisabilitas(false);
                        setFilterDudaJanda(false);
                        setFilterUsiaProduktif(false);
                        setIsSpecialDropdownOpen(false);
                      }}
                      className={`w-full p-2 rounded-xl text-left text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                        filterAnakYatim
                          ? 'bg-teal-700 text-white'
                          : 'hover:bg-teal-50 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${filterAnakYatim ? 'bg-white/20 text-white' : 'bg-teal-100 text-teal-800'}`}>
                          <Baby className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="leading-tight">Anak Yatim / Piatu (0 - 15 th)</div>
                          <div className={`text-[10px] font-normal ${filterAnakYatim ? 'text-teal-100' : 'text-slate-400'}`}>
                            Anak usia 0-15 th (Kepala KK Duda / Janda)
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            filterAnakYatim ? 'bg-white text-teal-950' : 'bg-teal-100 text-teal-900'
                          }`}
                        >
                          {scopedWargaList.filter(isAnakYatimPiatu).length}
                        </span>
                        {filterAnakYatim && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </button>

                    {/* Option: 🧓 Lansia (>60 th) */}
                    <button
                      type="button"
                      onClick={() => {
                        setFilterLansia(!filterLansia);
                        setFilterDisabilitas(false);
                        setFilterDudaJanda(false);
                        setFilterUsiaProduktif(false);
                        setFilterAnakYatim(false);
                        setIsSpecialDropdownOpen(false);
                      }}
                      className={`w-full p-2 rounded-xl text-left text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                        filterLansia
                          ? 'bg-amber-500 text-white'
                          : 'hover:bg-amber-50 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">🧓</span>
                        <div>
                          <div className="leading-tight">Lansia (&gt;60 th)</div>
                          <div className={`text-[10px] font-normal ${filterLansia ? 'text-amber-100' : 'text-slate-400'}`}>
                            Warga usia di atas 60 tahun
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            filterLansia ? 'bg-white text-amber-900' : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {scopedWargaList.filter((w) => w.isLansia || hitungUsia(w.tanggalLahir) >= 60).length}
                        </span>
                        {filterLansia && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </button>

                    {/* Option: ♿ Disabilitas */}
                    <button
                      type="button"
                      onClick={() => {
                        setFilterDisabilitas(!filterDisabilitas);
                        setFilterLansia(false);
                        setFilterDudaJanda(false);
                        setFilterUsiaProduktif(false);
                        setFilterAnakYatim(false);
                        setIsSpecialDropdownOpen(false);
                      }}
                      className={`w-full p-2 rounded-xl text-left text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                        filterDisabilitas
                          ? 'bg-purple-600 text-white'
                          : 'hover:bg-purple-50 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">♿</span>
                        <div>
                          <div className="leading-tight">Disabilitas</div>
                          <div className={`text-[10px] font-normal ${filterDisabilitas ? 'text-purple-100' : 'text-slate-400'}`}>
                            Berkebutuhan khusus
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            filterDisabilitas ? 'bg-white text-purple-900' : 'bg-purple-100 text-purple-900'
                          }`}
                        >
                          {scopedWargaList.filter((w) => w.isDisabilitas).length}
                        </span>
                        {filterDisabilitas && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </button>

                    {/* Option: 🥀 Duda / Janda */}
                    <button
                      type="button"
                      onClick={() => {
                        setFilterDudaJanda(!filterDudaJanda);
                        setFilterLansia(false);
                        setFilterDisabilitas(false);
                        setFilterUsiaProduktif(false);
                        setFilterAnakYatim(false);
                        setIsSpecialDropdownOpen(false);
                      }}
                      className={`w-full p-2 rounded-xl text-left text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                        filterDudaJanda
                          ? 'bg-rose-600 text-white'
                          : 'hover:bg-rose-50 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">🥀</span>
                        <div>
                          <div className="leading-tight">Duda / Janda</div>
                          <div className={`text-[10px] font-normal ${filterDudaJanda ? 'text-rose-100' : 'text-slate-400'}`}>
                            Cerai Mati / Cerai Hidup
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            filterDudaJanda ? 'bg-white text-rose-900' : 'bg-rose-100 text-rose-900'
                          }`}
                        >
                          {scopedWargaList.filter((w) => w.isDudaJanda || w.statusKawin === 'Cerai Mati' || w.statusKawin === 'Cerai Hidup').length}
                        </span>
                        {filterDudaJanda && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </button>

                    {/* Bottom Quick Action: Buka Laporan Lengkap Kategori Khusus */}
                    <div className="pt-1.5 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setIsSpecialDropdownOpen(false);
                          if (filterUsiaProduktif) setReportInitialCategory('PRODUKTIF');
                          else if (filterAnakYatim) setReportInitialCategory('YATIM_PIATU');
                          else if (filterLansia) setReportInitialCategory('LANSIA');
                          else if (filterDisabilitas) setReportInitialCategory('DISABILITAS');
                          else if (filterDudaJanda) setReportInitialCategory('DUDA_JANDA');
                          else setReportInitialCategory('ALL_SPECIAL');
                          setIsSpecialReportModalOpen(true);
                        }}
                        className="w-full p-2 bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 text-white text-xs font-black rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-purple-200" />
                        <span>Buka Laporan Detail & Cetak PDF</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {(filterGender !== 'ALL' || filterLansia || filterDisabilitas || filterDudaJanda || filterUsiaProduktif || filterAnakYatim) && (
              <button
                type="button"
                onClick={() => {
                  setFilterGender('ALL');
                  setFilterLansia(false);
                  setFilterDisabilitas(false);
                  setFilterDudaJanda(false);
                  setFilterUsiaProduktif(false);
                  setFilterAnakYatim(false);
                }}
                className="px-2 py-1 text-[10px] font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg shrink-0 transition-colors cursor-pointer"
                title="Reset Semua Sub-Filter"
              >
                ✕ Reset Filter
              </button>
            )}
          </div>
        </div>

        {/* Dedicated Search Input with Web Speech API Voice Search */}
        <div className="pt-2 border-t border-slate-100">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-700 pointer-events-none" />
            <input
              type="text"
              placeholder="Pencarian Nama Warga, NIK (16 digit), atau No KK..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className={`w-full pl-10 ${searchQuery ? 'pr-20' : 'pr-12'} py-2.5 bg-slate-50 border ${
                isListening
                  ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20'
                  : 'border-emerald-300/80 focus:ring-2 focus:ring-emerald-600 focus:border-transparent'
              } rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none transition-all`}
            />

            {/* Right Action Icons: Clear & Voice Input */}
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/70 rounded-full transition-colors cursor-pointer text-xs"
                  title="Hapus pencarian"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Web Speech API Microphone Button */}
              <button
                type="button"
                onClick={handleToggleVoiceInput}
                className={`p-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                  isListening
                    ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-300 animate-pulse scale-105'
                    : 'text-emerald-700 hover:text-emerald-900 bg-emerald-100/70 hover:bg-emerald-200/90 border border-emerald-300/60'
                }`}
                title={
                  isListening
                    ? 'Sedang mendengarkan suara... Klik untuk berhenti'
                    : 'Pencarian dengan Suara (Web Speech API) - Sebutkan nama warga'
                }
              >
                {isListening ? (
                  <Mic className="w-3.5 h-3.5 text-white animate-bounce" />
                ) : (
                  <Mic className="w-3.5 h-3.5 text-emerald-800" />
                )}
              </button>
            </div>
          </div>

          {/* Live Voice Search Listening Notification */}
          {isListening && (
            <div className="mt-2 p-2.5 bg-gradient-to-r from-rose-50 via-pink-50 to-amber-50 rounded-2xl border border-rose-200 flex items-center justify-between gap-2 text-xs text-rose-950 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
                </span>
                <div>
                  <span className="font-bold text-rose-800">Mendengarkan Suara (Bahasa Indonesia)...</span>
                  <span className="text-slate-600 ml-1 block sm:inline text-[11px]">
                    Sebutkan nama warga yang ingin dicari (contoh: &quot;Bambang&quot;, &quot;Siti&quot;, dsb).
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleVoiceInput}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-black text-[11px] rounded-lg shadow-xs transition-colors shrink-0 cursor-pointer"
              >
                Selesai
              </button>
            </div>
          )}

          {/* Speech Error Banner */}
          {speechError && (
            <div className="mt-2 p-2 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between gap-2 text-xs text-amber-900">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{speechError}</span>
              </div>
              <button
                type="button"
                onClick={() => setSpeechError(null)}
                className="text-amber-700 hover:text-amber-900 text-xs font-bold px-1"
              >
                ✕
              </button>
            </div>
          )}

          {/* Search Result Feedback Indicator */}
          {searchQuery.trim() && !isListening && (
            <div className="mt-2 p-2 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-950">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Hasil Pencarian: &quot;{searchQuery}&quot;</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-700 text-white text-[10px]">
                  {filteredWarga.length} Data Ditemukan
                </span>
              </div>
              <span className="text-[11px] text-emerald-800 font-medium">
                💡 Menampilkan <strong>No KK</strong> dan <strong>Nama Kepala Keluarga</strong> pada setiap data
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Citizens List */}
      <div className="space-y-2.5">
        {filteredWarga.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl text-center border border-slate-200">
            <Users className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <h4 className="text-sm font-bold text-slate-700">Tidak ada data warga yang cocok</h4>
            <p className="text-xs text-slate-500 mt-1">
              Coba sesuaikan kata kunci pencarian Nama, NIK, No KK, atau pilihan filter RT di atas.
            </p>
            <button
              onClick={handleOpenAdd}
              className="mt-3 px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold"
            >
              + Daftarkan Warga Baru
            </button>
          </div>
        ) : (
          filteredWarga.map((warga) => {
            const age = hitungUsia(warga.tanggalLahir);
            const isDudaOrJanda = warga.isDudaJanda || warga.statusKawin === 'Cerai Mati' || warga.statusKawin === 'Cerai Hidup';
            const kepalaInfo = getKepalaKeluarga(warga);
            const birthYear = warga.tanggalLahir ? parseInt(warga.tanggalLahir.split('-')[0], 10) : 0;
            const isOddYear = birthYear ? birthYear % 2 !== 0 : true;

            return (
              <div
                key={warga.id}
                className="group relative rounded-3xl border-2 border-cyan-400/80 hover:border-cyan-500 shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden bg-gradient-to-br from-[#c8eaf7] via-[#e2f4fb] to-[#bce5f5] text-slate-900"
              >
                {/* Authentic e-KTP Security Guilloche Wave & Rosette Pattern Overlay */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-[0.22] select-none mix-blend-multiply"
                  style={{
                    backgroundImage: `
                      radial-gradient(ellipse at 50% 50%, rgba(2, 132, 199, 0.35) 0%, transparent 65%),
                      radial-gradient(circle at 10% 20%, rgba(6, 182, 212, 0.4) 0%, transparent 35%),
                      radial-gradient(circle at 90% 80%, rgba(14, 165, 233, 0.4) 0%, transparent 35%),
                      repeating-radial-gradient(circle at 50% 40%, rgba(3, 105, 161, 0.18) 0px, rgba(3, 105, 161, 0.18) 1.5px, transparent 2px, transparent 10px),
                      repeating-linear-gradient(45deg, rgba(2, 132, 199, 0.16) 0, rgba(2, 132, 199, 0.16) 1px, transparent 0, transparent 7px),
                      repeating-linear-gradient(-45deg, rgba(2, 132, 199, 0.16) 0, rgba(2, 132, 199, 0.16) 1px, transparent 0, transparent 7px)
                    `
                  }}
                />

                {/* Center Indonesian Garuda Pancasila Watermark Emblem */}
                <div className="absolute right-1/4 top-1/2 -translate-y-1/2 opacity-[0.08] pointer-events-none select-none">
                  <svg className="w-64 h-64 text-cyan-950 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2L9.5 5.5H4v4.5L1.5 12 4 14v4.5h5.5L12 22l2.5-3.5H20v-4.5l2.5-2L20 10V5.5h-5.5L12 2zm0 3.8l1.7 2.4h3.8v3.8l2 1.6-2 1.6v3.8h-3.8L12 21.4l-1.7-2.4H6.5v-3.8l-2-1.6 2-1.6V8.2h3.8L12 5.8zM12 8c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm0 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z"/>
                  </svg>
                </div>

                {/* --- KTP Header Section --- */}
                <div className="relative pt-3 pb-2.5 px-3 sm:px-5 border-b-2 border-cyan-300/80 bg-gradient-to-r from-cyan-600/15 via-sky-500/20 to-blue-600/15">
                  <div className="flex items-center justify-between gap-2">
                    {/* Left: Smart Card Chip & e-KTP Security Emblem */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* e-KTP Gold Contact Chip Representation */}
                      <div className="w-8 h-6 sm:w-9 sm:h-7 rounded-md bg-gradient-to-br from-amber-200 via-amber-300 to-amber-500 border border-amber-600/70 shadow-xs flex flex-col justify-between p-0.5 overflow-hidden">
                        <div className="flex justify-between border-b border-amber-600/40 pb-0.5">
                          <div className="w-2 h-1 border-r border-amber-600/50" />
                          <div className="w-2 h-1 border-l border-amber-600/50" />
                        </div>
                        <div className="flex justify-between border-t border-amber-600/40 pt-0.5">
                          <div className="w-2 h-1 border-r border-amber-600/50" />
                          <div className="w-2 h-1 border-l border-amber-600/50" />
                        </div>
                      </div>
                      <div className="hidden xs:flex flex-col">
                        <span className="text-[8px] font-black tracking-widest text-cyan-950 uppercase leading-none">
                          e-KTP
                        </span>
                        <span className="text-[7px] font-bold text-cyan-800 leading-tight">
                          ELEKTRONIK
                        </span>
                      </div>
                    </div>

                    {/* Center: Official KTP Province & City Title */}
                    <div className="text-center flex-1 px-1">
                      <h4 className="text-[11px] sm:text-xs font-black tracking-widest uppercase text-cyan-950 leading-tight drop-shadow-2xs">
                        PROVINSI {(profile.provinsi || 'LAMPUNG').toUpperCase()}
                      </h4>
                      <h3 className="text-xs sm:text-sm font-black tracking-wider uppercase text-cyan-900 leading-tight drop-shadow-2xs">
                        {(profile.kotaKab || 'KOTA METRO').toUpperCase()}
                      </h3>
                      <p className="text-[8px] sm:text-[10px] font-bold text-cyan-800 tracking-wide mt-0.5">
                        RW {profile.nomorRw} &bull; KELURAHAN {(profile.kelurahan || 'IRINGMULYO').toUpperCase()}
                      </p>
                    </div>

                    {/* Right: RT & Blood Group Badges */}
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="px-2.5 py-0.5 rounded-lg bg-emerald-700 text-white font-black text-[10px] sm:text-[11px] shadow-2xs border border-emerald-800">
                        RT {warga.rt}
                      </span>
                      {warga.golDarah && warga.golDarah !== '-' && (
                        <span className="px-2 py-0.5 rounded-lg bg-cyan-800 text-white font-black text-[9px] sm:text-[10px] shadow-2xs">
                          {warga.golDarah}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* --- KTP Content Body (2 Columns Layout) --- */}
                <div className="relative p-3 sm:p-4 space-y-3">
                  {/* NIK Bar (Prominent OCR Typeface) */}
                  <div className="flex items-center justify-between gap-2 bg-cyan-900/10 px-3 py-1.5 rounded-xl border border-cyan-400/40">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-black tracking-wider font-mono text-cyan-950">
                        NIK :
                      </span>
                      <span className="text-xs sm:text-base font-black tracking-widest font-mono text-slate-950 select-all">
                        {warga.nik}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-white/70 border border-cyan-300 text-cyan-950 font-bold text-[9px] sm:text-[10px] uppercase shrink-0">
                      {warga.statusDomisili || 'Warga Tetap'}
                    </span>
                  </div>

                  {/* Main Grid: Data Columns + Pas Foto & Hologram */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                    {/* Left: Authentic KTP Field Rows (md:col-span-8 lg:col-span-9) */}
                    <div className="md:col-span-8 lg:col-span-9 space-y-1 text-xs text-slate-800 leading-relaxed font-sans">
                      {/* Nama */}
                      <div className="grid grid-cols-12 gap-1 items-baseline">
                        <span className="col-span-4 sm:col-span-3 text-slate-600 font-semibold text-[11px] sm:text-xs">
                          Nama
                        </span>
                        <div className="col-span-8 sm:col-span-9 flex items-baseline gap-1">
                          <span className="font-bold text-slate-500">:</span>
                          <span className="font-black text-slate-950 text-xs sm:text-sm uppercase tracking-wide">
                            {warga.nama}
                          </span>
                        </div>
                      </div>

                      {/* Tempat/Tgl Lahir */}
                      <div className="grid grid-cols-12 gap-1 items-baseline">
                        <span className="col-span-4 sm:col-span-3 text-slate-600 font-semibold text-[11px] sm:text-xs">
                          Tempat/Tgl Lahir
                        </span>
                        <div className="col-span-8 sm:col-span-9 flex items-baseline gap-1">
                          <span className="font-bold text-slate-500">:</span>
                          <span className="font-semibold text-slate-900">
                            {warga.tempatLahir}, {formatTanggalIndo(warga.tanggalLahir)}
                          </span>
                          <span className="text-[10px] font-black text-cyan-900 bg-cyan-100/90 px-1.5 py-0.2 rounded ml-1">
                            {age} Thn
                          </span>
                        </div>
                      </div>

                      {/* Jenis Kelamin & Gol Darah */}
                      <div className="grid grid-cols-12 gap-1 items-baseline">
                        <span className="col-span-4 sm:col-span-3 text-slate-600 font-semibold text-[11px] sm:text-xs">
                          Jenis Kelamin
                        </span>
                        <div className="col-span-8 sm:col-span-9 flex items-center gap-3 flex-wrap">
                          <div className="flex items-baseline gap-1">
                            <span className="font-bold text-slate-500">:</span>
                            <span className="font-bold text-slate-900">
                              {warga.jenisKelamin === 'L' ? 'LAKI-LAKI' : 'PEREMPUAN'}
                            </span>
                          </div>
                          <div className="flex items-baseline gap-1 text-[11px]">
                            <span className="text-slate-500 font-medium">Gol. Darah :</span>
                            <strong className="text-slate-900 font-black">{warga.golDarah || '-'}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Alamat */}
                      <div className="grid grid-cols-12 gap-1 items-start">
                        <span className="col-span-4 sm:col-span-3 text-slate-600 font-semibold text-[11px] sm:text-xs">
                          Alamat
                        </span>
                        <div className="col-span-8 sm:col-span-9 space-y-0.5">
                          <div className="flex items-baseline gap-1">
                            <span className="font-bold text-slate-500">:</span>
                            <span className="font-semibold text-slate-900">{warga.alamat}</span>
                          </div>
                          {/* RT/RW, Kel/Desa, Kec sub-rows */}
                          <div className="pl-2 space-y-0.5 text-[11px] text-slate-700">
                            <div className="flex items-baseline gap-1">
                              <span className="text-slate-500 w-16">RT/RW</span>
                              <span>:</span>
                              <strong className="text-cyan-950 font-bold">
                                RT {warga.rt} / RW {profile.nomorRw}
                              </strong>
                            </div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-slate-500 w-16">Kel/Desa</span>
                              <span>:</span>
                              <span className="font-medium uppercase">{profile.kelurahan}</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-slate-500 w-16">Kecamatan</span>
                              <span>:</span>
                              <span className="font-medium uppercase">{profile.kecamatan}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Agama */}
                      <div className="grid grid-cols-12 gap-1 items-baseline">
                        <span className="col-span-4 sm:col-span-3 text-slate-600 font-semibold text-[11px] sm:text-xs">
                          Agama
                        </span>
                        <div className="col-span-8 sm:col-span-9 flex items-baseline gap-1">
                          <span className="font-bold text-slate-500">:</span>
                          <span className="font-semibold text-slate-900 uppercase">{warga.agama}</span>
                        </div>
                      </div>

                      {/* Status Perkawinan & Status Keluarga */}
                      <div className="grid grid-cols-12 gap-1 items-baseline">
                        <span className="col-span-4 sm:col-span-3 text-slate-600 font-semibold text-[11px] sm:text-xs">
                          Status Perkawinan
                        </span>
                        <div className="col-span-8 sm:col-span-9 flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-500">:</span>
                          <span className="font-semibold text-slate-900 uppercase">
                            {warga.statusKawin}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200/80 text-slate-800">
                            {warga.statusKeluarga}
                          </span>
                        </div>
                      </div>

                      {/* Pekerjaan */}
                      <div className="grid grid-cols-12 gap-1 items-baseline">
                        <span className="col-span-4 sm:col-span-3 text-slate-600 font-semibold text-[11px] sm:text-xs">
                          Pekerjaan
                        </span>
                        <div className="col-span-8 sm:col-span-9 flex items-baseline gap-1">
                          <span className="font-bold text-slate-500">:</span>
                          <span className="font-semibold text-slate-900 uppercase">{warga.pekerjaan}</span>
                        </div>
                      </div>

                      {/* Kewarganegaraan & Berlaku Hingga */}
                      <div className="grid grid-cols-12 gap-1 items-baseline pt-0.5">
                        <span className="col-span-4 sm:col-span-3 text-slate-600 font-semibold text-[11px] sm:text-xs">
                          Berlaku Hingga
                        </span>
                        <div className="col-span-8 sm:col-span-9 flex items-center gap-2">
                          <div className="flex items-baseline gap-1">
                            <span className="font-bold text-slate-500">:</span>
                            <span className="font-black text-cyan-950 uppercase tracking-wider text-[11px]">
                              SEUMUR HIDUP
                            </span>
                          </div>
                          <span className="text-[9px] font-black text-slate-700 bg-white/70 px-1.5 py-0.2 rounded border border-cyan-200">
                            WNI
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Pas Foto Box with Authentic Dukcapil Background & Stamps (md:col-span-4 lg:col-span-3) */}
                    <div className="md:col-span-4 lg:col-span-3 flex flex-col items-center justify-between self-stretch bg-white/60 p-2.5 rounded-2xl border border-cyan-300/80 space-y-2">
                      {/* Authentic Pas Foto Frame (Merah untuk Tahun Lahir Ganjil / Biru untuk Tahun Lahir Genap) */}
                      <div className="relative w-24 h-32 sm:w-28 sm:h-36 rounded-xl overflow-hidden shadow-md border-2 border-white flex items-center justify-center bg-slate-100">
                        {/* Background Color by Birth Year */}
                        <div
                          className={`absolute inset-0 ${
                            isOddYear
                              ? 'bg-gradient-to-b from-rose-700 to-rose-900'
                              : 'bg-gradient-to-b from-blue-700 to-blue-900'
                          }`}
                        />

                        {warga.foto || warga.fotoUrl ? (
                          /* Real Photo Uploaded */
                          <img
                            src={warga.foto || warga.fotoUrl}
                            alt={`Foto ${warga.nama}`}
                            className="relative z-10 w-full h-full object-cover object-center"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          /* Default Pas Foto Character */
                          <div className="relative z-10 flex flex-col items-center justify-center">
                            <span className="text-4xl sm:text-5xl filter drop-shadow-md">
                              {warga.jenisKelamin === 'L' ? '👨' : '👩'}
                            </span>
                          </div>
                        )}

                        {/* Birth Year Background Indicator Label */}
                        <div className="absolute top-1 right-1 z-20 px-1 py-0.2 rounded bg-black/60 text-white font-mono text-[8px] font-bold backdrop-blur-2xs">
                          {isOddYear ? 'Ganjil (Merah)' : 'Genap (Biru)'}
                        </div>

                        {/* Dukcapil Circular Watermark Seal */}
                        <div className="absolute bottom-1 left-1 z-20 w-8 h-8 rounded-full border border-amber-300/80 bg-amber-400/30 flex items-center justify-center text-[7px] font-black text-amber-200 uppercase tracking-tighter text-center leading-none p-0.5 backdrop-blur-2xs shadow-xs">
                          RW 018
                        </div>
                      </div>

                      {/* Official Signature Simulation & Barcode */}
                      <div className="w-full text-center space-y-1">
                        <div className="text-[8px] text-slate-500 font-semibold">
                          KOTA METRO, {formatTanggalIndo(warga.tanggalLahir).split(' ').slice(1).join(' ')}
                        </div>
                        {/* Tanda Tangan Simulasi */}
                        <div className="h-6 border-b border-slate-400/50 flex items-center justify-center">
                          <span className="font-serif italic text-cyan-900 font-black text-xs tracking-widest opacity-80">
                            {warga.nama.split(' ')[0]}
                          </span>
                        </div>
                        <div className="text-[8px] font-black uppercase text-slate-700 truncate">
                          TANDA TANGAN PEMEGANG
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* --- KK, Kepala Keluarga, & Special Category Ribbon --- */}
                  <div className="pt-2 border-t border-cyan-300/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-blue-950 bg-blue-100/90 px-2 py-0.5 rounded-lg border border-blue-300 text-[11px] flex items-center gap-1 font-semibold">
                        <Home className="w-3 h-3 text-blue-700 shrink-0" />
                        No KK: <strong className="font-bold">{warga.noKk}</strong>
                      </span>

                      <span className="text-emerald-950 bg-emerald-100/90 px-2 py-0.5 rounded-lg border border-emerald-300 text-[11px] flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
                        Kepala KK: <strong className="font-bold text-emerald-900">{kepalaInfo.nama}</strong>
                        {kepalaInfo.isSelf ? (
                          <span className="text-[9px] text-emerald-800 font-bold bg-emerald-200 px-1 py-0.2 rounded">
                            (Ybs Kepala KK)
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-800 font-medium">
                            ({warga.statusKeluarga})
                          </span>
                        )}
                      </span>

                      {/* Special tags */}
                      {isAnakYatimPiatu(warga) && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-teal-100 text-teal-900 font-bold border border-teal-300 flex items-center gap-1">
                          👶 Yatim/Piatu
                        </span>
                      )}
                      {filterUsiaProduktif && isUsiaProduktif(warga) && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 font-bold border border-blue-200 flex items-center gap-1">
                          💼 Usia Produktif
                        </span>
                      )}
                      {warga.isLansia && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-200 text-amber-900 font-bold border border-amber-300">
                          🧓 Lansia
                        </span>
                      )}
                      {warga.isDisabilitas && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-200 text-purple-900 font-bold border border-purple-300">
                          ♿ Disabilitas
                        </span>
                      )}
                      {isDudaOrJanda && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-200 text-rose-900 font-bold border border-rose-300">
                          🥀 {warga.jenisKelamin === 'L' ? 'Duda' : 'Janda'}
                        </span>
                      )}
                    </div>

                    {/* Quick Action Toolbar (Right/Bottom) */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0 pt-1 sm:pt-0">
                      {/* Quick WhatsApp */}
                      {warga.noHp && (
                        <a
                          href={`https://wa.me/${getCleanWaNumber(warga.noHp)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-colors"
                          title={`Hubungi via WA: ${warga.noHp}`}
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">WA</span>
                        </a>
                      )}

                      {/* Quick Buat Surat */}
                      {triggerCreateSurat && (
                        <button
                          onClick={() => triggerCreateSurat(warga)}
                          className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                          title="Buat Surat Pengantar untuk warga ini"
                        >
                          <span>Surat</span>
                        </button>
                      )}

                      {/* Detail Modal */}
                      <button
                        onClick={() => setDetailWarga(warga)}
                        className="p-1.5 rounded-xl bg-cyan-800 hover:bg-cyan-900 text-white transition-colors cursor-pointer"
                        title="Lihat KTP Digital & Detail KK"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => handleOpenEdit(warga)}
                        className="p-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white transition-colors cursor-pointer"
                        title="Edit Data Warga"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => setDeleteConfirmId(warga.id)}
                        className="p-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
                        title="Hapus Warga"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Form Add / Edit Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-xl overflow-hidden my-6">
            <div className="bg-emerald-800 p-4 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">
                  {editingWarga ? 'Perbarui Data Warga' : 'Pendaftaran Warga Baru RW 018'}
                </h3>
                <p className="text-xs text-emerald-200">
                  Pastikan data sesuai dengan KTP & Kartu Keluarga yang berlaku
                </p>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-emerald-700 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              {/* Shortcut Scanner KTP Button Inside Form */}
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 p-3 rounded-2xl border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-black text-blue-950 flex items-center gap-1.5">
                      <span>Scanner e-KTP Otomatis</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 bg-blue-200 text-blue-800 rounded">
                        Auto-Fill
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-600 truncate">
                      Pindai KTP dengan kamera atau unggah foto untuk mengisi data secara cepat
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsKtpScannerOpen(true)}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Buka Scanner KTP</span>
                </button>
              </div>

              {/* Notifikasi Hasil Scan */}
              {scannedNotification && (
                <div className="p-3 bg-emerald-700 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
                  <span>{scannedNotification}</span>
                </div>
              )}

              {/* --- Input Pas Foto Warga (Kamera HP / Galeri / Default) --- */}
              {(() => {
                const birthYear = formData.tanggalLahir ? parseInt(formData.tanggalLahir.split('-')[0], 10) : 1990;
                const isOddBirthYear = !isNaN(birthYear) && birthYear % 2 !== 0;

                return (
                  <div className="bg-gradient-to-br from-cyan-50 via-sky-50 to-blue-50 p-3.5 sm:p-4 rounded-2xl border-2 border-cyan-200/90 shadow-2xs">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                      {/* Pas Foto Preview Frame (3:4 Ratio) */}
                      <div className="relative w-24 h-32 sm:w-28 sm:h-36 rounded-xl overflow-hidden shadow-md border-2 border-white shrink-0 bg-slate-100 flex items-center justify-center">
                        {/* Background Color Odd (Red) / Even (Blue) */}
                        <div
                          className={`absolute inset-0 ${
                            isOddBirthYear
                              ? 'bg-gradient-to-b from-rose-700 to-rose-900'
                              : 'bg-gradient-to-b from-blue-700 to-blue-900'
                          }`}
                        />

                        {formData.foto ? (
                          <img
                            src={formData.foto}
                            alt="Foto Warga"
                            className="relative z-10 w-full h-full object-cover object-center"
                          />
                        ) : (
                          <div className="relative z-10 flex flex-col items-center justify-center text-center p-1">
                            <span className="text-4xl filter drop-shadow-md">
                              {formData.jenisKelamin === 'L' ? '👨' : '👩'}
                            </span>
                            <span className="text-[9px] font-bold text-white/90 mt-1 uppercase tracking-tighter">
                              Foto Default
                            </span>
                          </div>
                        )}

                        {/* Birth Year Background Label */}
                        <div className="absolute top-1 right-1 z-20 px-1 py-0.2 rounded bg-black/60 text-white font-mono text-[8px] font-bold backdrop-blur-2xs">
                          {isOddBirthYear ? 'Ganjil (Merah)' : 'Genap (Biru)'}
                        </div>

                        {/* Dukcapil Watermark Seal */}
                        <div className="absolute bottom-1 left-1 z-20 w-7 h-7 rounded-full border border-amber-300/80 bg-amber-400/30 flex items-center justify-center text-[6.5px] font-black text-amber-200 uppercase tracking-tighter text-center leading-none p-0.5 backdrop-blur-2xs shadow-xs">
                          RW 018
                        </div>
                      </div>

                      {/* Photo Actions & Instructions */}
                      <div className="flex-1 space-y-2 text-left w-full">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <Camera className="w-4 h-4 text-cyan-800" />
                            <h4 className="text-xs font-black text-cyan-950 uppercase tracking-wide">
                              Pas Foto Warga (e-KTP)
                            </h4>
                          </div>
                          {formData.foto ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-600" /> Foto Terpasang
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                              Foto Default Aktif
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          Anda dapat mengambil foto langsung menggunakan <strong>Kamera HP / Web</strong> atau memilih file dari <strong>Galeri</strong>. Jika foto tidak diunggah, otomatis menggunakan <strong>pas foto default</strong> (latar merah/biru sesuai tahun lahir).
                        </p>

                        {/* Button controls */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {/* Ambil Kamera HP / Webcam */}
                          <button
                            type="button"
                            onClick={() => startLiveCamera(facingMode)}
                            className="px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-700 to-sky-700 hover:from-cyan-800 hover:to-sky-800 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>Ambil Kamera HP</span>
                          </button>

                          {/* Pilih Galeri */}
                          <button
                            type="button"
                            onClick={() => galleryInputRef.current?.click()}
                            className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 active:scale-95 text-slate-800 font-bold text-xs border border-slate-300 flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5 text-cyan-700" />
                            <span>Pilih dari Galeri</span>
                          </button>

                          {/* Reset / Gunakan Default */}
                          {formData.foto && (
                            <button
                              type="button"
                              onClick={() => setFormData((prev) => ({ ...prev, foto: '' }))}
                              className="px-2.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 font-bold text-xs border border-rose-200 flex items-center gap-1 transition-all cursor-pointer"
                              title="Hapus foto dan gunakan pas foto default"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Gunakan Default</span>
                            </button>
                          )}
                        </div>

                        {/* Hidden Native File & Camera Inputs */}
                        <input
                          type="file"
                          ref={galleryInputRef}
                          accept="image/*"
                          className="hidden"
                          onChange={handlePhotoFileChange}
                        />
                        <input
                          type="file"
                          ref={cameraInputRef}
                          accept="image/*"
                          capture="user"
                          className="hidden"
                          onChange={handlePhotoFileChange}
                        />

                        {isProcessingPhoto && (
                          <div className="text-[11px] text-cyan-800 font-semibold flex items-center gap-1.5 pt-1">
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>Mengompres & memproses foto...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <label className="block font-bold text-slate-700 text-xs sm:text-sm">
                      NIK (Nomor Induk Kependudukan) *
                    </label>
                    {duplicateNikWarga ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                        <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                        NIK SUDAH TERDAFTAR
                      </span>
                    ) : formData.nik && formData.nik.trim().length === 16 ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        16 Digit Valid
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-mono font-medium">
                        {formData.nik?.trim().length || 0}/16 Digit
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      maxLength={16}
                      inputMode="numeric"
                      placeholder="187102xxxxxxxxxx"
                      value={formData.nik || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 16);
                        setFormData({ ...formData, nik: val });
                      }}
                      className={`w-full p-2 border rounded-xl focus:outline-none font-mono transition-all ${
                        duplicateNikWarga
                          ? 'border-rose-500 bg-rose-50/70 text-rose-950 ring-2 ring-rose-400/50 focus:ring-rose-500 font-bold'
                          : formData.nik && formData.nik.trim().length === 16
                          ? 'border-emerald-400 bg-emerald-50/20 text-emerald-950 focus:ring-2 focus:ring-emerald-600'
                          : 'border-slate-300 focus:ring-2 focus:ring-emerald-600'
                      }`}
                    />
                  </div>

                  {/* Peringatan Interaktif NIK Ganda Terdaftar di Firestore */}
                  {duplicateNikWarga && (
                    <div className="mt-2 p-3 bg-rose-50/95 border-2 border-rose-300 rounded-2xl text-rose-900 shadow-xs space-y-1.5 animate-fadeIn">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div className="text-xs space-y-1 w-full">
                          <div className="flex items-center justify-between gap-1 flex-wrap">
                            <p className="font-black text-rose-900">
                              ⚠️ NIK Sudah Terdaftar di Database!
                            </p>
                            <span className="px-1.5 py-0.2 rounded bg-rose-200 text-rose-900 text-[10px] font-bold">
                              Data Ganda
                            </span>
                          </div>
                          <p className="text-[11px] text-rose-800 leading-relaxed">
                            NIK <strong className="font-mono bg-rose-200/80 px-1 py-0.5 rounded text-rose-950 font-bold">{duplicateNikWarga.nik}</strong> telah tercatat pada database warga:
                          </p>
                          <div className="bg-white/95 border border-rose-200 rounded-xl p-2.5 text-[11px] space-y-1 shadow-2xs">
                            <p className="font-bold text-slate-900 flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              <span>{duplicateNikWarga.nama}</span>
                            </p>
                            <p className="text-slate-600 flex items-center gap-1.5">
                              <Home className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>Wilayah: <strong>RT {duplicateNikWarga.rt}</strong> • KK: <span className="font-mono">{duplicateNikWarga.noKk}</span></span>
                            </p>
                            <p className="text-slate-600 flex items-center gap-1.5">
                              <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>Status: <strong>{duplicateNikWarga.statusKeluarga}</strong> • Domisili: <strong>{duplicateNikWarga.statusDomisili}</strong></span>
                            </p>
                          </div>
                          <p className="text-[10px] text-rose-700 italic font-medium pt-0.5">
                            * NIK bersifat unik per jiwa. Mohon periksa kembali input Anda atau edit warga terkait untuk menghindari data duplikat.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <label className="block font-bold text-slate-700 text-xs sm:text-sm">
                      Nomor Kartu Keluarga (No KK) *
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono font-medium">
                      {formData.noKk?.trim().length || 0}/16 Digit
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={16}
                    inputMode="numeric"
                    placeholder="187102xxxxxxxxxx"
                    value={formData.noKk || ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 16);
                      setFormData({ ...formData, noKk: val });
                    }}
                    className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Nama Lengkap (Sesuai KTP) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nama Lengkap Warga"
                    value={formData.nama || ''}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tempat Lahir</label>
                  <input
                    type="text"
                    placeholder="Kota / Kabupaten"
                    value={formData.tempatLahir || ''}
                    onChange={(e) => setFormData({ ...formData, tempatLahir: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Lahir</label>
                  <input
                    type="date"
                    value={formData.tanggalLahir || ''}
                    onChange={(e) => setFormData({ ...formData, tanggalLahir: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={formData.jenisKelamin || 'L'}
                    onChange={(e) => setFormData({ ...formData, jenisKelamin: e.target.value as Gender })}
                    className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Agama</label>
                  <select
                    value={formData.agama || 'Islam'}
                    onChange={(e) => setFormData({ ...formData, agama: e.target.value as Religion })}
                    className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  >
                    <option value="Islam">Islam</option>
                    <option value="Kristen">Kristen</option>
                    <option value="Katolik">Katolik</option>
                    <option value="Hindu">Hindu</option>
                    <option value="Buddha">Buddha</option>
                    <option value="Konghucu">Konghucu</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Perkawinan</label>
                  <select
                    value={formData.statusKawin || 'Kawin'}
                    onChange={(e) => setFormData({ ...formData, statusKawin: e.target.value as MaritalStatus })}
                    className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  >
                    <option value="Belum Kawin">Belum Kawin</option>
                    <option value="Kawin">Kawin</option>
                    <option value="Cerai Hidup">Cerai Hidup</option>
                    <option value="Cerai Mati">Cerai Mati</option>
                  </select>
                </div>

                <div className={formData.statusKeluarga === 'Kepala Keluarga' ? 'sm:col-span-2' : ''}>
                  <label className="block font-bold text-slate-700 mb-1">Kedudukan Keluarga *</label>
                  <select
                    value={formData.statusKeluarga || 'Kepala Keluarga'}
                    onChange={(e) => setFormData({ ...formData, statusKeluarga: e.target.value as FamilyRole })}
                    className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none font-semibold"
                  >
                    <option value="Kepala Keluarga">Kepala Keluarga</option>
                    <option value="Istri">Istri</option>
                    <option value="Anak">Anak</option>
                    <option value="Orang Tua">Orang Tua</option>
                    <option value="Famili Lain">Famili Lain</option>
                  </select>

                  {formData.statusKeluarga === 'Kepala Keluarga' && (
                    <div className="mt-2 p-2.5 bg-blue-50/90 border border-blue-200 rounded-xl text-blue-900 text-xs flex items-start gap-2">
                      <UserCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-blue-950">
                          ⚡ Integrasi Otomatis Data Kartu Keluarga (KK):
                        </p>
                        <p className="text-[11px] text-blue-800 mt-0.5 leading-relaxed">
                          Karena kedudukan keluarga adalah <strong>Kepala Keluarga</strong>, seluruh data detail warga ini (Nama, NIK, Tempat & Tgl Lahir, Jenis Kelamin, Agama, Pekerjaan, Golongan Darah, Status Kawin, Alamat, No Telp/WA, dan Pas Foto) akan <strong>otomatis terintegrasi dan tersinkronkan langsung menjadi Data Kartu Keluarga (No KK: {formData.noKk || 'Sesuai No KK'})</strong>.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Wilayah RT * {restrictedRt && <span className="text-emerald-700 font-bold">(Terkunci RT {restrictedRt})</span>}
                  </label>
                  {restrictedRt ? (
                    <div className="relative">
                      <select
                        disabled
                        value={restrictedRt}
                        className="w-full p-2 border border-emerald-300 bg-emerald-50 text-emerald-950 font-bold rounded-xl cursor-not-allowed"
                      >
                        <option value={restrictedRt}>RT {restrictedRt}</option>
                      </select>
                      <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 mt-1">
                        <Lock className="w-3 h-3" />
                        <span>Sesuai hak akses Anda sebagai Ketua RT {restrictedRt}</span>
                      </div>
                    </div>
                  ) : (
                    <select
                      value={formData.rt || profile.daftarRt[0] || '039'}
                      onChange={(e) => setFormData({ ...formData, rt: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none font-bold"
                    >
                      {profile.daftarRt.map((rt) => (
                        <option key={rt} value={rt}>
                          RT {rt}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">No Handphone / WA</label>
                  <input
                    type="tel"
                    placeholder="0812xxxxxxxx"
                    value={formData.noHp || ''}
                    onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pekerjaan</label>
                  <input
                    type="text"
                    placeholder="Wiraswasta / PNS / Karyawan"
                    value={formData.pekerjaan || ''}
                    onChange={(e) => setFormData({ ...formData, pekerjaan: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pendidikan Terakhir</label>
                  <input
                    type="text"
                    placeholder="SMA / S1 / SMP"
                    value={formData.pendidikan || ''}
                    onChange={(e) => setFormData({ ...formData, pendidikan: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Alamat Lengkap / No Rumah</label>
                  <input
                    type="text"
                    placeholder="Jl. Cendrawasih No. 18, RT 003"
                    value={formData.alamat || ''}
                    onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Golongan Darah</label>
                  <select
                    value={formData.golDarah || 'Tidak Tahu'}
                    onChange={(e) => setFormData({ ...formData, golDarah: e.target.value as BloodType })}
                    className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="AB">AB</option>
                    <option value="O">O</option>
                    <option value="Tidak Tahu">Tidak Tahu</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Domisili</label>
                  <select
                    value={formData.statusDomisili || 'Tetap'}
                    onChange={(e) => setFormData({ ...formData, statusDomisili: e.target.value as any })}
                    className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  >
                    <option value="Tetap">Warga Tetap (KTP Setempat)</option>
                    <option value="Kontrak / Kost">Kontrak / Kost</option>
                    <option value="Pindah">Pindah Sementara</option>
                  </select>
                </div>
              </div>

              {/* Checkboxes for Lansia, Disabilitas & Duda/Janda */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.isLansia || false}
                    onChange={(e) => setFormData({ ...formData, isLansia: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span>Tandai sebagai Lansia (&gt;60 th)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.isDisabilitas || false}
                    onChange={(e) => setFormData({ ...formData, isDisabilitas: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span>Warga Berkebutuhan Khusus / Disabilitas</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-semibold text-rose-700">
                  <input
                    type="checkbox"
                    checked={formData.isDudaJanda || false}
                    onChange={(e) => setFormData({ ...formData, isDudaJanda: e.target.checked })}
                    className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
                  />
                  <span>Status Duda / Janda (Prioritas Bansos & Santunan)</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-xs"
                >
                  Simpan Data Warga
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KTP Digital Mockup & Detail Modal */}
      {detailWarga && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-6 border-2 border-cyan-400/80 bg-gradient-to-br from-[#c8eaf7] via-[#e2f4fb] to-[#bce5f5] relative text-slate-900">
            {/* Authentic e-KTP Security Guilloche Wave & Rosette Pattern Overlay */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.22] select-none mix-blend-multiply"
              style={{
                backgroundImage: `
                  radial-gradient(ellipse at 50% 50%, rgba(2, 132, 199, 0.35) 0%, transparent 65%),
                  radial-gradient(circle at 10% 20%, rgba(6, 182, 212, 0.4) 0%, transparent 35%),
                  radial-gradient(circle at 90% 80%, rgba(14, 165, 233, 0.4) 0%, transparent 35%),
                  repeating-radial-gradient(circle at 50% 40%, rgba(3, 105, 161, 0.18) 0px, rgba(3, 105, 161, 0.18) 1.5px, transparent 2px, transparent 10px),
                  repeating-linear-gradient(45deg, rgba(2, 132, 199, 0.16) 0, rgba(2, 132, 199, 0.16) 1px, transparent 0, transparent 7px),
                  repeating-linear-gradient(-45deg, rgba(2, 132, 199, 0.16) 0, rgba(2, 132, 199, 0.16) 1px, transparent 0, transparent 7px)
                `
              }}
            />

            {/* Center Indonesian Garuda Pancasila Watermark Emblem */}
            <div className="absolute right-1/4 top-1/2 -translate-y-1/2 opacity-[0.08] pointer-events-none select-none">
              <svg className="w-72 h-72 text-cyan-950 fill-current" viewBox="0 0 24 24">
                <path d="M12 2L9.5 5.5H4v4.5L1.5 12 4 14v4.5h5.5L12 22l2.5-3.5H20v-4.5l2.5-2L20 10V5.5h-5.5L12 2zm0 3.8l1.7 2.4h3.8v3.8l2 1.6-2 1.6v3.8h-3.8L12 21.4l-1.7-2.4H6.5v-3.8l-2-1.6 2-1.6V8.2h3.8L12 5.8zM12 8c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm0 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z"/>
              </svg>
            </div>

            {/* Indonesian e-KTP Official Card Header */}
            <div className="relative pt-3.5 pb-2.5 px-4 sm:px-6 border-b border-cyan-300/80 bg-gradient-to-r from-cyan-600/15 via-sky-500/20 to-blue-600/15">
              <div className="flex items-center justify-between gap-2">
                {/* Left: Gold Smart Card Chip */}
                <div className="flex items-center gap-2">
                  <div className="w-9 h-7 rounded-md bg-gradient-to-br from-amber-200 via-amber-300 to-amber-500 border border-amber-600/60 shadow-xs flex flex-col justify-between p-0.5 overflow-hidden">
                    <div className="flex justify-between border-b border-amber-600/40 pb-0.5">
                      <div className="w-2.5 h-1 border-r border-amber-600/40" />
                      <div className="w-2.5 h-1 border-l border-amber-600/40" />
                    </div>
                    <div className="flex justify-between border-t border-amber-600/40 pt-0.5">
                      <div className="w-2.5 h-1 border-r border-amber-600/40" />
                      <div className="w-2.5 h-1 border-l border-amber-600/40" />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black tracking-widest text-cyan-950 uppercase leading-none">
                      REPUBLIK INDONESIA
                    </span>
                    <span className="text-[8px] font-bold text-cyan-800 leading-tight">
                      KARTU TANDA PENDUDUK ELEKTRONIK
                    </span>
                  </div>
                </div>

                {/* Center Title */}
                <div className="text-center flex-1 hidden sm:block px-2">
                  <h4 className="text-xs font-black tracking-widest uppercase text-cyan-950">
                    PROVINSI {(profile.provinsi || 'LAMPUNG').toUpperCase()}
                  </h4>
                  <h3 className="text-sm font-black tracking-wider uppercase text-cyan-900">
                    {(profile.kotaKab || 'KOTA METRO').toUpperCase()}
                  </h3>
                </div>

                {/* Right: Close & RT */}
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-emerald-700 text-white font-black text-xs shadow-2xs">
                    RT {detailWarga.rt}
                  </span>
                  <button
                    onClick={() => setDetailWarga(null)}
                    className="p-1.5 rounded-full hover:bg-cyan-900/20 text-cyan-900 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Mobile Title */}
              <div className="text-center sm:hidden mt-1">
                <h4 className="text-[11px] font-black tracking-widest uppercase text-cyan-950">
                  PROVINSI {(profile.provinsi || 'LAMPUNG').toUpperCase()}
                </h4>
                <h3 className="text-xs font-black tracking-wider uppercase text-cyan-900">
                  {(profile.kotaKab || 'KOTA METRO').toUpperCase()}
                </h3>
              </div>
            </div>

            <div className="relative p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* NIK Bar (Prominent OCR Typeface) */}
              <div className="flex items-center justify-between gap-2 bg-cyan-900/10 px-4 py-2 rounded-2xl border border-cyan-400/40">
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-black tracking-wider font-mono text-cyan-950">
                    NIK :
                  </span>
                  <span className="text-sm sm:text-lg font-black tracking-widest font-mono text-slate-950 select-all">
                    {detailWarga.nik}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-md bg-white/80 border border-cyan-300 text-cyan-950 font-bold text-[10px] uppercase">
                    {detailWarga.statusDomisili || 'Warga Tetap'}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-cyan-700 text-white font-bold text-[10px]">
                    WNI
                  </span>
                </div>
              </div>

              {/* Grid Data KTP + Pas Foto */}
              {(() => {
                const detailBirthYear = detailWarga.tanggalLahir ? parseInt(detailWarga.tanggalLahir.split('-')[0], 10) : 0;
                const isDetailOddYear = detailBirthYear ? detailBirthYear % 2 !== 0 : true;
                const detailAge = hitungUsia(detailWarga.tanggalLahir);

                return (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                    {/* Left: Authentic Data Fields (8 Cols) */}
                    <div className="md:col-span-8 space-y-1.5 text-xs sm:text-sm text-slate-800 font-sans">
                      {/* Nama */}
                      <div className="grid grid-cols-12 gap-1 items-baseline">
                        <span className="col-span-4 sm:col-span-3 text-slate-600 font-semibold">Nama</span>
                        <div className="col-span-8 sm:col-span-9 flex items-baseline gap-1.5">
                          <span className="font-bold text-slate-500">:</span>
                          <span className="font-black text-slate-950 text-sm sm:text-base uppercase tracking-wide">
                            {detailWarga.nama}
                          </span>
                        </div>
                      </div>

                      {/* Tempat/Tgl Lahir */}
                      <div className="grid grid-cols-12 gap-1 items-baseline">
                        <span className="col-span-4 sm:col-span-3 text-slate-600 font-semibold">Tempat/Tgl Lahir</span>
                        <div className="col-span-8 sm:col-span-9 flex items-baseline gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-500">:</span>
                          <span className="font-semibold text-slate-900">
                            {detailWarga.tempatLahir}, {formatTanggalIndo(detailWarga.tanggalLahir)}
                          </span>
                          <span className="text-[11px] font-black text-cyan-900 bg-cyan-100 px-2 py-0.5 rounded">
                            {detailAge} Tahun
                          </span>
                        </div>
                      </div>

                      {/* Jenis Kelamin & Gol Darah */}
                      <div className="grid grid-cols-12 gap-1 items-baseline">
                        <span className="col-span-4 sm:col-span-3 text-slate-600 font-semibold">Jenis Kelamin</span>
                        <div className="col-span-8 sm:col-span-9 flex items-center gap-4 flex-wrap">
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-bold text-slate-500">:</span>
                            <span className="font-bold text-slate-900">
                              {detailWarga.jenisKelamin === 'L' ? 'LAKI-LAKI' : 'PEREMPUAN'}
                            </span>
                          </div>
                          <div className="flex items-baseline gap-1 text-xs">
                            <span className="text-slate-500 font-medium">Gol. Darah :</span>
                            <strong className="text-slate-900 font-black px-1.5 py-0.2 bg-white/70 rounded border border-cyan-200">
                              {detailWarga.golDarah || '-'}
                            </strong>
                          </div>
                        </div>
                      </div>

                      {/* Alamat */}
                      <div className="grid grid-cols-12 gap-1 items-start">
                        <span className="col-span-4 sm:col-span-3 text-slate-600 font-semibold">Alamat</span>
                        <div className="col-span-8 sm:col-span-9 space-y-0.5">
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-bold text-slate-500">:</span>
                            <span className="font-semibold text-slate-900">{detailWarga.alamat}</span>
                          </div>
                          <div className="pl-3 space-y-0.5 text-xs text-slate-700">
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-slate-500 w-20">RT/RW</span>
                              <span>:</span>
                              <strong className="text-cyan-950 font-black">
                                RT {detailWarga.rt} / RW {profile.nomorRw}
                              </strong>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-slate-500 w-20">Kel/Desa</span>
                              <span>:</span>
                              <span className="font-medium uppercase">{profile.kelurahan}</span>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-slate-500 w-20">Kecamatan</span>
                              <span>:</span>
                              <span className="font-medium uppercase">{profile.kecamatan}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Agama */}
                      <div className="grid grid-cols-12 gap-1 items-baseline">
                        <span className="col-span-4 sm:col-span-3 text-slate-600 font-semibold">Agama</span>
                        <div className="col-span-8 sm:col-span-9 flex items-baseline gap-1.5">
                          <span className="font-bold text-slate-500">:</span>
                          <span className="font-semibold text-slate-900 uppercase">{detailWarga.agama}</span>
                        </div>
                      </div>

                      {/* Status Perkawinan */}
                      <div className="grid grid-cols-12 gap-1 items-baseline">
                        <span className="col-span-4 sm:col-span-3 text-slate-600 font-semibold">Status Kawin</span>
                        <div className="col-span-8 sm:col-span-9 flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-500">:</span>
                          <span className="font-semibold text-slate-900 uppercase">{detailWarga.statusKawin}</span>
                          {(detailWarga.isDudaJanda || detailWarga.statusKawin === 'Cerai Mati' || detailWarga.statusKawin === 'Cerai Hidup') && (
                            <span className="px-2 py-0.2 rounded-md bg-rose-200 text-rose-950 border border-rose-300 font-black text-[10px]">
                              🥀 {detailWarga.jenisKelamin === 'L' ? 'Duda' : 'Janda'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Pekerjaan */}
                      <div className="grid grid-cols-12 gap-1 items-baseline">
                        <span className="col-span-4 sm:col-span-3 text-slate-600 font-semibold">Pekerjaan</span>
                        <div className="col-span-8 sm:col-span-9 flex items-baseline gap-1.5">
                          <span className="font-bold text-slate-500">:</span>
                          <span className="font-semibold text-slate-900 uppercase">{detailWarga.pekerjaan}</span>
                        </div>
                      </div>

                      {/* Kontak HP / WA */}
                      <div className="grid grid-cols-12 gap-1 items-baseline">
                        <span className="col-span-4 sm:col-span-3 text-slate-600 font-semibold">Kontak HP/WA</span>
                        <div className="col-span-8 sm:col-span-9 flex items-center gap-2">
                          <span className="font-bold text-slate-500">:</span>
                          <span className="font-mono font-bold text-emerald-800 text-xs sm:text-sm">
                            {detailWarga.noHp || 'Belum diisi'}
                          </span>
                        </div>
                      </div>

                      {/* Berlaku Hingga */}
                      <div className="grid grid-cols-12 gap-1 items-baseline pt-1">
                        <span className="col-span-4 sm:col-span-3 text-slate-600 font-semibold">Berlaku Hingga</span>
                        <div className="col-span-8 sm:col-span-9 flex items-baseline gap-1.5">
                          <span className="font-bold text-slate-500">:</span>
                          <span className="font-black text-cyan-950 uppercase tracking-widest text-xs sm:text-sm">
                            SEUMUR HIDUP
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Pas Foto Box with Authentic Dukcapil Background & Stamps (4 Cols) */}
                    <div className="md:col-span-4 flex flex-col items-center justify-between self-stretch bg-white/70 p-3 rounded-2xl border border-cyan-300/80 space-y-2.5 shadow-xs">
                      {/* Authentic Pas Foto Frame (Merah untuk Tahun Ganjil / Biru untuk Genap) */}
                      <div className="relative w-28 h-36 sm:w-32 sm:h-40 rounded-xl overflow-hidden shadow-md border-2 border-white flex items-center justify-center bg-slate-100">
                        <div
                          className={`absolute inset-0 ${
                            isDetailOddYear
                              ? 'bg-gradient-to-b from-rose-700 to-rose-900'
                              : 'bg-gradient-to-b from-blue-700 to-blue-900'
                          }`}
                        />

                        {detailWarga.foto || detailWarga.fotoUrl ? (
                          /* Real Photo */
                          <img
                            src={detailWarga.foto || detailWarga.fotoUrl}
                            alt={`Foto ${detailWarga.nama}`}
                            className="relative z-10 w-full h-full object-cover object-center"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          /* Avatar Default */
                          <div className="relative z-10 flex flex-col items-center justify-center">
                            <span className="text-5xl sm:text-6xl filter drop-shadow-md">
                              {detailWarga.jenisKelamin === 'L' ? '👨' : '👩'}
                            </span>
                          </div>
                        )}

                        {/* Birth Year Background Indicator */}
                        <div className="absolute top-1 right-1 z-20 px-1.5 py-0.5 rounded bg-black/60 text-white font-mono text-[8px] font-bold backdrop-blur-2xs">
                          {isDetailOddYear ? 'Ganjil (Merah)' : 'Genap (Biru)'}
                        </div>

                        {/* Dukcapil Circular Watermark Seal */}
                        <div className="absolute bottom-1.5 left-1.5 z-20 w-9 h-9 rounded-full border border-amber-300/80 bg-amber-400/30 flex items-center justify-center text-[7.5px] font-black text-amber-200 uppercase tracking-tighter text-center leading-none p-0.5 backdrop-blur-2xs shadow-xs">
                          RW 018
                        </div>
                      </div>

                      {/* Official Signature Simulation & Date */}
                      <div className="w-full text-center space-y-1">
                        <div className="text-[9px] text-slate-500 font-semibold">
                          KOTA METRO, {formatTanggalIndo(detailWarga.tanggalLahir).split(' ').slice(1).join(' ')}
                        </div>
                        <div className="h-7 border-b border-slate-400/60 flex items-center justify-center">
                          <span className="font-serif italic text-cyan-950 font-black text-sm tracking-widest opacity-85">
                            {detailWarga.nama.split(' ')[0]}
                          </span>
                        </div>
                        <div className="text-[8px] font-black uppercase text-slate-700 tracking-wider">
                          TANDA TANGAN PEMEGANG
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Data KK & Kepala Keluarga */}
              {(() => {
                const detailKepala = getKepalaKeluarga(detailWarga);
                const anggotaKk = wargaList.filter((w) => w.noKk === detailWarga.noKk);
                return (
                  <div className="bg-white/80 p-3.5 rounded-2xl border border-cyan-300/80 space-y-2.5 shadow-xs">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <div className="flex items-center gap-1.5 text-cyan-950">
                        <Home className="w-4 h-4 text-cyan-700" />
                        <span>Data Kartu Keluarga (KK) Terkait</span>
                      </div>
                      <span className="text-[11px] font-mono bg-blue-100 text-blue-900 px-2.5 py-0.5 rounded-full font-black border border-blue-200">
                        {anggotaKk.length} Anggota Keluarga
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 p-3 rounded-xl border border-blue-200">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase">
                          Nomor Kartu Keluarga (No KK)
                        </span>
                        <div className="font-mono font-black text-blue-950 text-xs sm:text-sm mt-0.5 flex items-center gap-1">
                          <span>{detailWarga.noKk}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase">
                          Nama Kepala Keluarga
                        </span>
                        <div className="font-bold text-emerald-950 text-xs sm:text-sm mt-0.5 flex items-center gap-1">
                          <UserCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span>{detailKepala.nama}</span>
                          {detailKepala.isSelf && (
                            <span className="text-[9px] text-emerald-700 font-black bg-emerald-200 px-1.5 py-0.2 rounded">
                              (Ybs)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {detailWarga.statusKeluarga === 'Kepala Keluarga' && (
                      <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-300 text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-semibold text-[11px]">
                            ⚡ Warga ini berstatus <strong>Kepala Keluarga</strong>, seluruh rincian detailnya terintegrasi otomatis ke Data Kartu Keluarga (KK).
                          </span>
                        </div>
                        {onSelectKk && (
                          <button
                            type="button"
                            onClick={() => {
                              const targetNoKk = detailWarga.noKk;
                              setDetailWarga(null);
                              onSelectKk(targetNoKk);
                            }}
                            className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-lg font-bold text-[10px] shrink-0 transition-all cursor-pointer text-center"
                          >
                            Lihat Kartu Keluarga (KK) →
                          </button>
                        )}
                      </div>
                    )}

                    {/* List of family members in same KK */}
                    {anggotaKk.length > 1 && (
                      <div className="mt-1">
                        <div className="text-[10px] font-black text-slate-600 uppercase mb-1.5">
                          Daftar Anggota Keluarga 1 KK:
                        </div>
                        <div className="divide-y divide-slate-100 bg-white rounded-xl border border-slate-200 overflow-hidden text-xs">
                          {anggotaKk.map((ang) => (
                            <div key={ang.id} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                              <div>
                                <span className="font-bold text-slate-900">{ang.nama}</span>
                                <span className="text-slate-500 text-[11px] ml-1.5">({ang.statusKeluarga})</span>
                                <div className="text-[11px] font-mono text-slate-500">NIK: {ang.nik}</div>
                              </div>
                              <span className="text-xs text-slate-600 font-semibold">
                                {hitungUsia(ang.tanggalLahir)} th
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Action Buttons in Modal Footer */}
              <div className="flex justify-between items-center gap-2 pt-3 border-t border-cyan-300/80">
                {onGenerateSuratForWarga && (
                  <button
                    onClick={() => {
                      const w = detailWarga;
                      setDetailWarga(null);
                      onGenerateSuratForWarga(w);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                    <span>Buat Surat Pengantar</span>
                  </button>
                )}
                <button
                  onClick={() => setDetailWarga(null)}
                  className="px-5 py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs ml-auto shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-xl space-y-3 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-800">Hapus Data Warga?</h4>
            <p className="text-xs text-slate-500">
              Tindakan ini akan menghapus data warga dari database lokal aplikasi RW 018.
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onDeleteWarga(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Live Camera Snapshot Modal */}
      {isLiveCameraOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col text-white">
            {/* Header */}
            <div className="p-4 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-600 text-white flex items-center justify-center shadow-xs">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Ambil Pas Foto Warga</h3>
                  <p className="text-[10px] text-slate-400">Posisikan wajah & bahu di dalam garis panduan</p>
                </div>
              </div>
              <button
                onClick={stopLiveCamera}
                className="p-1.5 rounded-full hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Viewfinder Video Frame */}
            <div className="p-4 flex flex-col items-center justify-center bg-black/60 relative">
              <div className="relative w-64 h-80 sm:w-72 sm:h-96 rounded-2xl overflow-hidden bg-black border-2 border-cyan-500/70 shadow-inner flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Pas Foto Guide Overlay (Head & Shoulders Guide) */}
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
                  {/* Oval for face */}
                  <div className="w-36 h-48 sm:w-40 sm:h-52 rounded-[50%] border-2 border-dashed border-cyan-400/70 shadow-xs flex items-center justify-center">
                    <span className="text-[10px] font-bold text-cyan-200 bg-black/40 px-2 py-0.5 rounded-full">
                      Posisikan Wajah
                    </span>
                  </div>
                  {/* Guide text */}
                  <div className="absolute bottom-3 text-center px-2 py-1 bg-black/60 rounded-full text-[10px] text-slate-200">
                    Format Pas Foto Resmi e-KTP
                  </div>
                </div>
              </div>

              {cameraError && (
                <div className="mt-3 p-2.5 bg-rose-900/80 border border-rose-600 text-rose-200 rounded-xl text-xs text-center w-full">
                  {cameraError}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="p-4 bg-slate-800/80 border-t border-slate-700/60 flex items-center justify-between gap-3">
              {/* Switch Camera */}
              <button
                type="button"
                onClick={toggleFacingMode}
                className="p-3 rounded-2xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                title="Ganti Kamera Depan / Belakang"
              >
                <RotateCw className="w-4 h-4" />
                <span className="hidden sm:inline">Ganti Kamera</span>
              </button>

              {/* Shutter Button (Capture) */}
              <button
                type="button"
                onClick={captureLivePhoto}
                className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-95 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
              >
                <div className="w-4 h-4 rounded-full border-2 border-white flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
                <span>Ambil Foto</span>
              </button>

              {/* Cancel Button */}
              <button
                type="button"
                onClick={stopLiveCamera}
                className="px-3.5 py-3 rounded-2xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs transition-all cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KTP Scanner Modal */}
      <KtpScannerModal
        isOpen={isKtpScannerOpen}
        onClose={() => setIsKtpScannerOpen(false)}
        onApplyScannedData={handleApplyScannedKtp}
        profile={profile}
      />

      {/* Laporan Kategori Khusus & Cetak PDF Modal */}
      <WargaSpecialCategoryReportModal
        isOpen={isSpecialReportModalOpen}
        onClose={() => setIsSpecialReportModalOpen(false)}
        wargaList={scopedWargaList}
        kkList={kkList}
        profile={profile}
        initialCategory={reportInitialCategory}
        restrictedRt={restrictedRt}
      />
    </div>
  );
};
