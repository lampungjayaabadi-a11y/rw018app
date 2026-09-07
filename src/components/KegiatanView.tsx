import React, { useState, useMemo, useRef } from 'react';
import {
  CalendarDays,
  Search,
  Plus,
  Filter,
  Clock,
  MapPin,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Download,
  Trash2,
  Edit2,
  X,
  Users,
  Wallet,
  Check,
  Camera,
  Video,
  Film,
  Upload,
  Image as ImageIcon,
  Play,
  Eye,
  Link2,
  Sparkles,
  Share2,
  FileText,
  Calendar,
  Maximize2,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { KegiatanItem, KegiatanCategory, KegiatanStatus, RWProfile, AppUser } from '../types';
import { generateId, formatTanggalIndo, formatRupiah } from '../utils/formatters';
import { extractKegiatanMedia } from '../utils/mediaUtils';
import { VideoPlayer, PhotoLightbox, VideoLightbox } from './MediaModalViewer';
import { KegiatanCameraModal } from './KegiatanCameraModal';

interface KegiatanViewProps {
  profile: RWProfile;
  kegiatanList: KegiatanItem[];
  onSaveKegiatan: (item: KegiatanItem) => void;
  onDeleteKegiatan: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  currentUser?: AppUser | null;
}

export const KegiatanView: React.FC<KegiatanViewProps> = ({
  profile,
  kegiatanList,
  onSaveKegiatan,
  onDeleteKegiatan,
  searchQuery,
  onSearchChange,
  currentUser,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingKegiatan, setEditingKegiatan] = useState<KegiatanItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Upload Foto & Video Modal
  const [uploadModalKegiatan, setUploadModalKegiatan] = useState<KegiatanItem | null>(null);
  const [tempFotoUrls, setTempFotoUrls] = useState<string[]>([]);
  const [tempVideoUrl, setTempVideoUrl] = useState<string>('');
  const [tempWargaHadir, setTempWargaHadir] = useState<number | undefined>(undefined);
  const [tempCatatanHasil, setTempCatatanHasil] = useState<string>('');
  const [manualImageUrl, setManualImageUrl] = useState<string>('');
  const [manualVideoUrl, setManualVideoUrl] = useState<string>('');
  const [saveMediaSuccess, setSaveMediaSuccess] = useState(false);
  const [copiedShareText, setCopiedShareText] = useState(false);

  // Lightbox Viewers
  const [photoLightbox, setPhotoLightbox] = useState<{
    isOpen: boolean;
    photos: Array<{ url: string; caption?: string }>;
    currentIndex: number;
    activityTitle?: string;
  }>({
    isOpen: false,
    photos: [],
    currentIndex: 0,
    activityTitle: '',
  });

  const [activeVideoModal, setActiveVideoModal] = useState<{
    url: string;
    title?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const directUploadInputRef = useRef<HTMLInputElement>(null);

  // Dedicated Interactive Camera Modal for activities
  const [cameraModalKegiatan, setCameraModalKegiatan] = useState<KegiatanItem | null>(null);
  const [directUploadTargetKegiatan, setDirectUploadTargetKegiatan] = useState<KegiatanItem | null>(null);

  const initialForm: Partial<KegiatanItem> = {
    judul: '',
    kategori: 'Gotong Royong & Kerja Bakti',
    tanggal: new Date().toISOString().slice(0, 10),
    waktu: '07:30 - Selesai WIB',
    lokasi: `Balai Pertemuan ${profile.namaRw}`,
    penanggungJawab: profile.namaKetuaRw,
    anggaran: 250000,
    status: 'Akan Datang',
    deskripsi: '',
    hasilNotulen: '',
    catatanHasil: '',
    pesertaPerkiraan: 50,
  };
  const [formData, setFormData] = useState<Partial<KegiatanItem>>(initialForm);

  // Filtered List
  const filteredKegiatan = useMemo(() => {
    return kegiatanList.filter((k) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        k.judul.toLowerCase().includes(q) ||
        k.lokasi.toLowerCase().includes(q) ||
        k.penanggungJawab.toLowerCase().includes(q) ||
        k.kategori.toLowerCase().includes(q);

      const matchStatus = selectedStatus === 'ALL' || k.status === selectedStatus;
      const matchCategory = selectedCategory === 'ALL' || k.kategori === selectedCategory;

      return matchSearch && matchStatus && matchCategory;
    });
  }, [kegiatanList, searchQuery, selectedStatus, selectedCategory]);

  const handleOpenAdd = () => {
    setEditingKegiatan(null);
    setFormData({
      ...initialForm,
      tanggal: new Date().toISOString().slice(0, 10),
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (item: KegiatanItem) => {
    setEditingKegiatan(item);
    setFormData({ ...item });
    setIsFormModalOpen(true);
  };

  const handleOpenUploadMedia = (item: KegiatanItem) => {
    setUploadModalKegiatan(item);
    const media = extractKegiatanMedia(item);
    setTempFotoUrls(media.photos.map((p) => p.url));
    setTempVideoUrl(media.videos[0]?.url || item.videoUrl || '');
    setTempWargaHadir(item.wargaHadir || item.pesertaPerkiraan || 30);
    setTempCatatanHasil(item.catatanHasil || item.hasilNotulen || '');
    setManualImageUrl('');
    setManualVideoUrl('');
    setSaveMediaSuccess(false);
    setCopiedShareText(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setTempFotoUrls((prev) => [...prev, result]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (e.target) e.target.value = '';
  };

  const handleVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setTempVideoUrl(result);
      }
    };
    reader.readAsDataURL(file);

    if (e.target) e.target.value = '';
  };

  const handleAddManualImage = () => {
    if (!manualImageUrl.trim()) return;
    setTempFotoUrls((prev) => [...prev, manualImageUrl.trim()]);
    setManualImageUrl('');
  };

  const handleAddManualVideo = () => {
    if (!manualVideoUrl.trim()) return;
    setTempVideoUrl(manualVideoUrl.trim());
    setManualVideoUrl('');
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    setTempFotoUrls((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSaveMediaDocumentation = () => {
    if (!uploadModalKegiatan) return;

    const updated: KegiatanItem = {
      ...uploadModalKegiatan,
      fotoUrls: tempFotoUrls,
      videoUrl: tempVideoUrl,
      videoThumbnail: tempFotoUrls[0] || uploadModalKegiatan.videoThumbnail || '',
      wargaHadir: tempWargaHadir,
      catatanHasil: tempCatatanHasil,
      hasilNotulen: tempCatatanHasil || uploadModalKegiatan.hasilNotulen,
    };

    onSaveKegiatan(updated);
    setSaveMediaSuccess(true);
    setTimeout(() => {
      setSaveMediaSuccess(false);
      setUploadModalKegiatan(null);
    }, 1200);
  };

  // Open Live Interactive Camera for specific Kegiatan item
  const handleOpenInteractiveCamera = (item: KegiatanItem) => {
    setCameraModalKegiatan(item);
  };

  // Save photos captured through the interactive camera
  const handleSaveCameraPhotos = (newPhotos: Array<{ url: string; caption?: string }>) => {
    if (!cameraModalKegiatan || newPhotos.length === 0) return;

    const currentMedia = extractKegiatanMedia(cameraModalKegiatan);
    const existingUrls = currentMedia.photos.map((p) => p.url);
    const newUrls = newPhotos.map((p) => p.url);
    const updatedFotoUrls = [...existingUrls, ...newUrls];

    // Preserve structured dokumentasi array with captions and timestamp
    const existingDocs = Array.isArray(cameraModalKegiatan.dokumentasi)
      ? [...cameraModalKegiatan.dokumentasi]
      : [];

    newPhotos.forEach((p, idx) => {
      existingDocs.push({
        id: generateId('cam'),
        url: p.url,
        tipe: 'foto',
        judul: p.caption || `Dokumentasi Kamera ${cameraModalKegiatan.judul} #${existingDocs.length + 1}`,
        keterangan: p.caption,
        createdAt: new Date().toISOString(),
      });
    });

    const updated: KegiatanItem = {
      ...cameraModalKegiatan,
      fotoUrls: updatedFotoUrls,
      dokumentasi: existingDocs,
      videoThumbnail: cameraModalKegiatan.videoThumbnail || updatedFotoUrls[0] || '',
    };

    onSaveKegiatan(updated);

    // If upload media modal is also open for this activity, keep it in sync
    if (uploadModalKegiatan && uploadModalKegiatan.id === cameraModalKegiatan.id) {
      setTempFotoUrls(updatedFotoUrls);
    }
  };

  // Trigger quick direct gallery upload for specific item card
  const handleTriggerDirectUpload = (item: KegiatanItem) => {
    setDirectUploadTargetKegiatan(item);
    directUploadInputRef.current?.click();
  };

  // Handle files selected via direct card upload
  const handleDirectFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !directUploadTargetKegiatan) return;

    const fileList = Array.from(files);
    let processed = 0;
    const addedUrls: string[] = [];

    fileList.forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const res = ev.target?.result as string;
        if (res) addedUrls.push(res);
        processed++;

        if (processed === fileList.length && directUploadTargetKegiatan) {
          const currentMedia = extractKegiatanMedia(directUploadTargetKegiatan);
          const existingUrls = currentMedia.photos.map((p) => p.url);
          const updatedFotoUrls = [...existingUrls, ...addedUrls];

          const existingDocs = Array.isArray(directUploadTargetKegiatan.dokumentasi)
            ? [...directUploadTargetKegiatan.dokumentasi]
            : [];

          addedUrls.forEach((u) => {
            existingDocs.push({
              id: generateId('doc'),
              url: u,
              tipe: 'foto',
              judul: `Foto Dokumentasi ${directUploadTargetKegiatan.judul}`,
              createdAt: new Date().toISOString(),
            });
          });

          const updated: KegiatanItem = {
            ...directUploadTargetKegiatan,
            fotoUrls: updatedFotoUrls,
            dokumentasi: existingDocs,
            videoThumbnail: directUploadTargetKegiatan.videoThumbnail || updatedFotoUrls[0] || '',
          };

          onSaveKegiatan(updated);
          setDirectUploadTargetKegiatan(null);
        }
      };
      reader.readAsDataURL(file);
    });

    if (e.target) e.target.value = '';
  };

  const handleQuickMarkSelesai = (item: KegiatanItem) => {
    const updated: KegiatanItem = {
      ...item,
      status: 'Selesai',
    };
    onSaveKegiatan(updated);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.judul || !formData.tanggal || !formData.lokasi) {
      alert('Mohon lengkapi Judul Kegiatan, Tanggal, dan Lokasi!');
      return;
    }

    const saved: KegiatanItem = {
      id: editingKegiatan ? editingKegiatan.id : generateId('kgt'),
      judul: formData.judul || '',
      kategori: (formData.kategori as KegiatanCategory) || 'Gotong Royong & Kerja Bakti',
      tanggal: formData.tanggal || new Date().toISOString().slice(0, 10),
      waktu: formData.waktu || '08:00 WIB',
      lokasi: formData.lokasi || `Wilayah ${profile.namaRw}`,
      penanggungJawab: formData.penanggungJawab || 'Pengurus RW 018',
      anggaran: Number(formData.anggaran) || 0,
      status: (formData.status as KegiatanStatus) || 'Akan Datang',
      deskripsi: formData.deskripsi || '',
      hasilNotulen: formData.hasilNotulen || '',
      catatanHasil: formData.catatanHasil || formData.hasilNotulen || '',
      pesertaPerkiraan: Number(formData.pesertaPerkiraan) || 30,
      wargaHadir: Number(formData.wargaHadir) || (formData.pesertaPerkiraan ? Number(formData.pesertaPerkiraan) : undefined),
      fotoUrls: formData.fotoUrls || editingKegiatan?.fotoUrls || [],
      videoUrl: formData.videoUrl || editingKegiatan?.videoUrl || '',
      videoThumbnail: formData.videoThumbnail || editingKegiatan?.videoThumbnail || '',
      dokumentasi: formData.dokumentasi || editingKegiatan?.dokumentasi || [],
    };

    onSaveKegiatan(saved);
    setIsFormModalOpen(false);
  };

  const allCategories: KegiatanCategory[] = [
    'Gotong Royong & Kerja Bakti',
    'Rapat Pengurus & Warga',
    'Posyandu Balita & Lansia',
    'Pengajian & Keagamaan',
    'Siskamling & Ronda',
    'Peringatan Hari Besar Nasional (PHBN)',
    'Olahraga & Seni',
  ];

  return (
    <div className="space-y-5 p-4 pb-16 max-w-5xl mx-auto">
      {/* Top Banner Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                <CalendarDays className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-extrabold text-slate-900">
                    Laporan & Agenda Kegiatan {profile.namaRw}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    {kegiatanList.length} Kegiatan
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dokumentasi foto lengkap & video liputan kegiatan warga yang dapat dilihat dan diputar oleh seluruh pengguna.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-2xl shadow-xs transition-all active:scale-95 self-start sm:self-center cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Agenda Kegiatan</span>
          </button>
        </div>

        {/* Filters */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {['ALL', 'Akan Datang', 'Sedang Berlangsung', 'Selesai'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedStatus === st
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {st === 'ALL' ? 'Semua Status' : st}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold text-slate-700 border-none text-xs cursor-pointer"
            >
              <option value="ALL">Semua Kategori</option>
              {allCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* List Kegiatan Cards */}
      {filteredKegiatan.length === 0 ? (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center text-slate-400 space-y-2">
          <CalendarDays className="w-10 h-10 mx-auto text-slate-300" />
          <p className="text-sm font-semibold">Tidak ada kegiatan yang sesuai filter pencarian.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredKegiatan.map((item) => {
            const { photos, videos } = extractKegiatanMedia(item);
            const hasPhotos = photos.length > 0;
            const hasVideo = videos.length > 0;
            const primaryVideo = videos[0];

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all overflow-hidden"
              >
                {/* Card Top Info */}
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    {/* Left: Date Badge + Title Info */}
                    <div className="flex items-start gap-3.5 min-w-0">
                      {/* Date Badge */}
                      <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 flex flex-col items-center justify-center font-bold shrink-0 text-center shadow-xs">
                        <span className="text-[10px] uppercase font-bold text-emerald-600">
                          {new Date(item.tanggal).toLocaleString('id-ID', { month: 'short' })}
                        </span>
                        <span className="text-xl font-black leading-none text-emerald-950">
                          {new Date(item.tanggal).getDate()}
                        </span>
                      </div>

                      {/* Title & Metadata */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                            {item.kategori}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              item.status === 'Selesai'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : item.status === 'Sedang Berlangsung'
                                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                          >
                            {item.status}
                          </span>
                          {item.wargaHadir ? (
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              <span>{item.wargaHadir} Warga Hadir</span>
                            </span>
                          ) : null}
                        </div>

                        <h3 className="text-base font-bold text-slate-900 leading-snug">
                          {item.judul}
                        </h3>

                        {/* Location, Time, PIC */}
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{item.waktu}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{item.lokasi}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>PJ: {item.penanggungJawab}</span>
                          </div>
                          {item.anggaran && item.anggaran > 0 ? (
                            <div className="flex items-center gap-1 font-bold text-emerald-700">
                              <Wallet className="w-3.5 h-3.5" />
                              <span>{formatRupiah(item.anggaran)}</span>
                            </div>
                          ) : null}
                        </div>

                        {item.deskripsi && (
                          <p className="mt-2 text-xs text-slate-600 leading-relaxed font-medium">
                            {item.deskripsi}
                          </p>
                        )}

                        {item.catatanHasil && (
                          <div className="mt-2 text-xs bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200 text-emerald-950 leading-relaxed">
                            <strong className="text-emerald-900 font-bold block mb-0.5 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Notulen / Realisasi Hasil Kegiatan:</span>
                            </strong>
                            <span>{item.catatanHasil}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1.5 self-end sm:self-start shrink-0 flex-wrap justify-end">
                      {/* Tombol Ambil Foto Kamera Langsung */}
                      <button
                        onClick={() => handleOpenInteractiveCamera(item)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                        title="Ambil Foto Dokumentasi Langsung via Kamera"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Kamera</span>
                      </button>

                      {/* Tombol Unggah Foto dari Galeri */}
                      <button
                        onClick={() => handleTriggerDirectUpload(item)}
                        className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                        title="Unggah Foto dari Galeri / File"
                      >
                        <Upload className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Galeri</span>
                      </button>

                      {/* Kelola Semua Media (Foto, Video & Notulen) */}
                      <button
                        onClick={() => handleOpenUploadMedia(item)}
                        className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Kelola Semua Foto & Video"
                      >
                        <Film className="w-3.5 h-3.5" />
                        <span className="hidden md:inline">Kelola Media</span>
                      </button>

                      {item.status !== 'Selesai' && (
                        <button
                          onClick={() => handleQuickMarkSelesai(item)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Selesai</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
                        title="Edit Informasi Kegiatan"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setDeleteConfirmId(item.id)}
                        className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl transition-colors cursor-pointer"
                        title="Hapus Kegiatan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* DOKUMENTASI MEDIA SECTION (ALL PHOTOS & VIDEO PLAYER) */}
                {(hasPhotos || hasVideo) && (
                  <div className="bg-slate-50/80 p-4 sm:p-5 border-t border-slate-200 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                          <Film className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Dokumentasi Foto & Video Liputan Warga</span>
                        </span>
                        <div className="flex items-center gap-1 text-[11px] font-bold">
                          {hasPhotos && (
                            <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full border border-indigo-200">
                              {photos.length} Foto
                            </span>
                          )}
                          {hasVideo && (
                            <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full border border-rose-200 flex items-center gap-1">
                              <Film className="w-2.5 h-2.5" />
                              <span>1 Video Liputan HD</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => handleOpenInteractiveCamera(item)}
                          className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-xl transition-colors cursor-pointer"
                          title="Buka Kamera untuk Tambah Foto Kegiatan Ini"
                        >
                          <Camera className="w-3 h-3 text-emerald-600" />
                          <span>+ Kamera</span>
                        </button>
                        <button
                          onClick={() => handleTriggerDirectUpload(item)}
                          className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 bg-white hover:bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-xl transition-colors cursor-pointer"
                          title="Unggah Foto Tambahan dari Galeri"
                        >
                          <Upload className="w-3 h-3 text-indigo-600" />
                          <span>+ Galeri</span>
                        </button>
                        {hasVideo && (
                          <button
                            onClick={() =>
                              setActiveVideoModal({
                                url: primaryVideo.url,
                                title: item.judul,
                              })
                            }
                            className="text-xs font-bold text-rose-700 hover:text-rose-900 flex items-center gap-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-xl transition-colors cursor-pointer"
                          >
                            <Maximize2 className="w-3 h-3" />
                            <span>Layar Penuh Video</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 1. VIDEO PLAYER EMBED (Directly playable by all users on the card) */}
                    {hasVideo && (
                      <div className="space-y-1.5">
                        <div className="max-w-2xl mx-auto">
                          <VideoPlayer
                            videoUrl={primaryVideo.url}
                            posterUrl={primaryVideo.thumbnail || photos[0]?.url}
                            title={primaryVideo.title || item.judul}
                            onExpand={() =>
                              setActiveVideoModal({
                                url: primaryVideo.url,
                                title: item.judul,
                              })
                            }
                          />
                        </div>
                      </div>
                    )}

                    {/* 2. ALL PHOTOS GALLERY (Displayed in full responsive grid) */}
                    {hasPhotos && (
                      <div className="space-y-2">
                        {hasVideo && (
                          <h5 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1 pt-1">
                            <Camera className="w-3 h-3 text-indigo-600" />
                            <span>Semua Foto Kegiatan ({photos.length})</span>
                          </h5>
                        )}

                        <div
                          className={`grid gap-2.5 ${
                            photos.length === 1
                              ? 'grid-cols-1 sm:max-w-xl'
                              : photos.length === 2
                              ? 'grid-cols-2'
                              : photos.length === 3
                              ? 'grid-cols-2 sm:grid-cols-3'
                              : 'grid-cols-2 sm:grid-cols-4'
                          }`}
                        >
                          {photos.map((photo, pIdx) => (
                            <div
                              key={pIdx}
                              onClick={() =>
                                setPhotoLightbox({
                                  isOpen: true,
                                  photos: photos,
                                  currentIndex: pIdx,
                                  activityTitle: item.judul,
                                })
                              }
                              className="relative aspect-4/3 rounded-2xl overflow-hidden bg-slate-200 border border-slate-200 group cursor-pointer shadow-2xs hover:shadow-md transition-all"
                            >
                              <img
                                src={photo.url}
                                alt={photo.caption || `${item.judul} - foto ${pIdx + 1}`}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/30 transition-colors flex items-center justify-center">
                                <span className="w-8 h-8 rounded-full bg-white/90 text-slate-900 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                                  <Eye className="w-4 h-4" />
                                </span>
                              </div>
                              <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none">
                                <span className="text-[9px] bg-black/60 text-white px-1.5 py-0.5 rounded backdrop-blur-xs font-semibold">
                                  Foto #{pIdx + 1}
                                </span>
                                {photo.caption && (
                                  <span className="text-[9px] bg-black/60 text-white px-1.5 py-0.5 rounded backdrop-blur-xs truncate max-w-[120px]">
                                    {photo.caption}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick WhatsApp Share Button */}
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => {
                          const text =
                            `*LAPORAN DOKUMENTASI KEGIATAN RW 018*\n\n` +
                            `📌 *Kegiatan:* ${item.judul}\n` +
                            `🏷️ *Kategori:* ${item.kategori}\n` +
                            `🗓️ *Waktu:* ${formatTanggalIndo(item.tanggal)} (${item.waktu})\n` +
                            `📍 *Lokasi:* ${item.lokasi}\n` +
                            `👤 *PIC:* ${item.penanggungJawab || profile.namaKetuaRw}\n` +
                            (item.wargaHadir ? `👥 *Kehadiran:* ${item.wargaHadir} Warga Hadir\n` : '') +
                            `📸 *Dokumentasi:* ${photos.length} Foto${hasVideo ? ' & 1 Video Liputan HD' : ''}\n` +
                            (item.catatanHasil ? `\n📝 *Hasil:* ${item.catatanHasil}\n\n` : '\n') +
                            `_Dokumentasi tersimpan di Aplikasi RW 018 Iringmulyo_`;

                          navigator.clipboard.writeText(text);
                          alert('Laporan kegiatan berhasil disalin ke clipboard! Siap dibagikan ke WhatsApp.');
                        }}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-white hover:bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Salin Laporan untuk WhatsApp</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* If no photos or videos yet, show interactive camera & gallery prompt */}
                {!hasPhotos && !hasVideo && (
                  <div className="bg-slate-50/70 p-3 sm:p-3.5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                        <Camera className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] sm:text-xs">
                        Belum ada foto dokumentasi. Abadikan momen kegiatan ini secara interaktif!
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                      <button
                        onClick={() => handleOpenInteractiveCamera(item)}
                        className="font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 flex items-center gap-1.5 px-3 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer"
                        title="Buka Kamera Dokumentasi Langsung"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Buka Kamera</span>
                      </button>

                      <button
                        onClick={() => handleTriggerDirectUpload(item)}
                        className="font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 flex items-center gap-1 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer"
                        title="Unggah Foto dari Galeri"
                      >
                        <Upload className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Galeri</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Form Tambah/Edit Agenda Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl overflow-hidden my-6">
            <div className="bg-emerald-800 p-4 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">
                  {editingKegiatan ? 'Edit Agenda Kegiatan' : 'Tambah Agenda Kegiatan RW 018'}
                </h3>
                <p className="text-xs text-emerald-200">Jadwal & Notulen Lingkungan</p>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-emerald-700 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-3 text-xs max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama / Judul Kegiatan *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kerja Bakti Massal Bersih Saluran Air"
                  value={formData.judul || ''}
                  onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori Kegiatan</label>
                  <select
                    value={formData.kategori || 'Gotong Royong & Kerja Bakti'}
                    onChange={(e) =>
                      setFormData({ ...formData, kategori: e.target.value as KegiatanCategory })
                    }
                    className="w-full p-2 border border-slate-300 rounded-xl font-semibold"
                  >
                    {allCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Kegiatan</label>
                  <select
                    value={formData.status || 'Akan Datang'}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as KegiatanStatus })
                    }
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="Akan Datang">Akan Datang</option>
                    <option value="Sedang Berlangsung">Sedang Berlangsung</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Dibatalkan">Dibatalkan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Pelaksanaan *</label>
                  <input
                    type="date"
                    required
                    value={formData.tanggal || ''}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Waktu / Jam</label>
                  <input
                    type="text"
                    placeholder="Contoh: 07:30 - 11:00 WIB"
                    value={formData.waktu || ''}
                    onChange={(e) => setFormData({ ...formData, waktu: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lokasi Kegiatan *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Lapangan Voli RW 018"
                    value={formData.lokasi || ''}
                    onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Penanggung Jawab (PJ)</label>
                  <input
                    type="text"
                    placeholder="Nama Pengurus / Ketua RT"
                    value={formData.penanggungJawab || ''}
                    onChange={(e) => setFormData({ ...formData, penanggungJawab: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Alokasi Anggaran (Rp)</label>
                  <input
                    type="number"
                    step={50000}
                    value={formData.anggaran || 0}
                    onChange={(e) => setFormData({ ...formData, anggaran: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Perkiraan Warga Hadir</label>
                  <input
                    type="number"
                    value={formData.pesertaPerkiraan || 30}
                    onChange={(e) =>
                      setFormData({ ...formData, pesertaPerkiraan: Number(e.target.value) })
                    }
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Uraian / Agenda Acara</label>
                <textarea
                  rows={2}
                  placeholder="Rundown acara, perlengkapan yang perlu dibawa warga..."
                  value={formData.deskripsi || ''}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notulen / Hasil Keputusan</label>
                <textarea
                  rows={2}
                  placeholder="Catatan hasil rapat / evaluasi kegiatan yang telah selesai..."
                  value={formData.hasilNotulen || ''}
                  onChange={(e) => setFormData({ ...formData, hasilNotulen: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold cursor-pointer"
                >
                  Simpan Kegiatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-xl space-y-3 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-800">Hapus Agenda Kegiatan?</h4>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onDeleteKegiatan(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL UPLOAD FOTO & VIDEO DOKUMENTASI KEGIATAN */}
      {uploadModalKegiatan && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          {/* Hidden File Inputs */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
          <input
            type="file"
            ref={videoInputRef}
            accept="video/*"
            onChange={handleVideoFileUpload}
            className="hidden"
          />

          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-fade-in">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white flex items-start justify-between gap-3 shrink-0">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 flex items-center gap-1">
                    <Camera className="w-3 h-3" />
                    <span>Upload Dokumentasi</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                    Status: {uploadModalKegiatan.status}
                  </span>
                  <span className="text-[10px] font-medium text-slate-300">
                    {uploadModalKegiatan.kategori}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white leading-snug">
                  {uploadModalKegiatan.judul}
                </h3>
                <p className="text-xs text-indigo-200/80 mt-0.5">
                  🗓️ {formatTanggalIndo(uploadModalKegiatan.tanggal)} • 📍 {uploadModalKegiatan.lokasi}
                </p>
              </div>

              <button
                onClick={() => setUploadModalKegiatan(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Success Banner */}
            {saveMediaSuccess && (
              <div className="bg-emerald-600 text-white px-4 py-2.5 text-xs font-bold flex items-center gap-2 animate-bounce">
                <Check className="w-4 h-4" />
                <span>Dokumentasi Foto & Video Berhasil Disimpan ke Sistem RW 018!</span>
              </div>
            )}

            {/* Scrollable Content */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-5 text-xs">
              {/* BAGIAN 1: UPLOAD FOTO KEGIATAN */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-sm">
                    <Camera className="w-4 h-4 text-indigo-600" />
                    <span>Foto-Foto Dokumentasi Kegiatan</span>
                  </h4>
                  <span className="text-[11px] font-bold bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full">
                    {tempFotoUrls.length} Foto Terlampir
                  </span>
                </div>

                {/* Upload Button Area */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Pilihan 1: Buka Kamera Interaktif */}
                  <button
                    type="button"
                    onClick={() => {
                      if (uploadModalKegiatan) {
                        handleOpenInteractiveCamera(uploadModalKegiatan);
                      }
                    }}
                    className="p-3 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center gap-2 transition-all shadow-xs active:scale-95 cursor-pointer text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-emerald-900">Buka Kamera</div>
                      <div className="text-[10px] text-emerald-700 font-normal">Ambil foto live langsung</div>
                    </div>
                  </button>

                  {/* Pilihan 2: File Galeri */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 rounded-xl border-2 border-dashed border-indigo-300 hover:border-indigo-500 bg-white hover:bg-indigo-50/50 text-indigo-700 font-bold flex items-center justify-center gap-2 transition-all group cursor-pointer text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-indigo-900">Galeri Perangkat</div>
                      <div className="text-[10px] text-indigo-600 font-normal">Pilih file foto/gambar</div>
                    </div>
                  </button>

                  {/* Pilihan 3: Link URL */}
                  <div className="flex flex-col justify-center gap-1 bg-white p-2 rounded-xl border border-slate-200">
                    <div className="text-[10px] font-bold text-slate-500">Atau Tempel URL Foto:</div>
                    <div className="flex gap-1">
                      <input
                        type="url"
                        placeholder="https://..."
                        value={manualImageUrl}
                        onChange={(e) => setManualImageUrl(e.target.value)}
                        className="flex-1 p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-[11px]"
                      />
                      <button
                        type="button"
                        onClick={handleAddManualImage}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shrink-0 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick Presets for Demo */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
                  <span className="text-slate-500 font-medium">Contoh Cepat:</span>
                  {[
                    { name: '+ Gotong Royong', url: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=800&q=80' },
                    { name: '+ Posyandu', url: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=800&q=80' },
                    { name: '+ HUT RI', url: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80' },
                    { name: '+ Rapat Warga', url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80' }
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTempFotoUrls((prev) => [...prev, preset.url])}
                      className="px-2 py-0.5 bg-white hover:bg-slate-200 text-slate-700 rounded-md border border-slate-200 font-semibold cursor-pointer"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>

                {/* Grid Foto yang diunggah */}
                {tempFotoUrls.length === 0 ? (
                  <div className="text-center py-5 border border-dashed border-slate-300 rounded-xl bg-white text-slate-400">
                    Belum ada foto yang diunggah. Silakan klik tombol di atas untuk menambahkan foto dokumentasi.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 pt-2">
                    {tempFotoUrls.map((url, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-square rounded-xl overflow-hidden bg-slate-200 border border-slate-300 group shadow-xs"
                      >
                        <img
                          src={url}
                          alt={`Dokumentasi ${idx + 1}`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setPhotoLightbox({
                                isOpen: true,
                                photos: tempFotoUrls.map((u) => ({ url: u })),
                                currentIndex: idx,
                                activityTitle: uploadModalKegiatan.judul,
                              })
                            }
                            className="p-1.5 rounded-full bg-white/90 text-slate-900 hover:bg-white transition-colors cursor-pointer"
                            title="Lihat Foto Besar"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(idx)}
                            className="p-1.5 rounded-full bg-rose-600 text-white hover:bg-rose-700 transition-colors cursor-pointer"
                            title="Hapus Foto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="absolute bottom-1 right-1 text-[9px] bg-black/60 text-white px-1.5 py-0.5 rounded font-medium">
                          #{idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* BAGIAN 2: UPLOAD VIDEO KEGIATAN */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-sm">
                    <Film className="w-4 h-4 text-rose-600" />
                    <span>Video Liputan Kegiatan (MP4 / WebM / YouTube / Drive)</span>
                  </h4>
                  {tempVideoUrl && (
                    <span className="text-[11px] font-bold bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Film className="w-3 h-3" />
                      <span>Video Terpasang</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    className="p-3.5 rounded-xl border-2 border-dashed border-rose-300 hover:border-rose-500 bg-white hover:bg-rose-50/50 text-rose-700 font-bold flex items-center justify-center gap-2 transition-all group cursor-pointer"
                  >
                    <Video className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>Pilih Video dari Perangkat</span>
                  </button>

                  <div className="flex gap-1.5">
                    <input
                      type="url"
                      placeholder="Tempel URL Video (YouTube / MP4 / Drive)..."
                      value={manualVideoUrl}
                      onChange={(e) => setManualVideoUrl(e.target.value)}
                      className="flex-1 p-2 bg-white border border-slate-300 rounded-xl text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddManualVideo}
                      className="px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shrink-0 cursor-pointer"
                    >
                      Pasang
                    </button>
                  </div>
                </div>

                {/* Preset Video Demo */}
                {!tempVideoUrl && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
                    <span className="text-slate-500 font-medium">Contoh Video:</span>
                    <button
                      type="button"
                      onClick={() => setTempVideoUrl('https://assets.mixkit.co/videos/preview/mixkit-group-of-volunteers-planting-trees-in-a-park-42408-large.mp4')}
                      className="px-2 py-0.5 bg-white hover:bg-slate-200 text-slate-700 rounded-md border border-slate-200 font-semibold cursor-pointer"
                    >
                      + Video Gotong Royong Relawan
                    </button>
                    <button
                      type="button"
                      onClick={() => setTempVideoUrl('https://assets.mixkit.co/videos/preview/mixkit-crowd-applauding-at-a-concert-40292-large.mp4')}
                      className="px-2 py-0.5 bg-white hover:bg-slate-200 text-slate-700 rounded-md border border-slate-200 font-semibold cursor-pointer"
                    >
                      + Video Panggung Semarak Warga
                    </button>
                  </div>
                )}

                {/* Video Player Preview inside Modal */}
                {tempVideoUrl && (
                  <div className="space-y-2 pt-1">
                    <div className="max-w-md mx-auto">
                      <VideoPlayer
                        videoUrl={tempVideoUrl}
                        title="Pratinjau Video Dokumentasi"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setTempVideoUrl('')}
                        className="text-xs text-rose-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Video Dokumentasi</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* BAGIAN 3: CATATAN HASIL & WARGA HADIR */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-sm">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>Realisasi Partisipasi & Catatan Hasil</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Jumlah Warga Hadir (Jiwa)
                    </label>
                    <input
                      type="number"
                      value={tempWargaHadir || ''}
                      onChange={(e) => setTempWargaHadir(Number(e.target.value))}
                      placeholder="Contoh: 75"
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      Ringkasan Notulen / Catatan Hasil Kegiatan
                    </label>
                    <textarea
                      rows={2}
                      value={tempCatatanHasil}
                      onChange={(e) => setTempCatatanHasil(e.target.value)}
                      placeholder="Contoh: Seluruh drainase RT 039 s.d 042 telah dibersihkan lancar tanpa hambatan..."
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const text = `*LAPORAN DOKUMENTASI KEGIATAN RW 018*\n\n` +
                    `📌 *Kegiatan:* ${uploadModalKegiatan.judul}\n` +
                    `🏷️ *Kategori:* ${uploadModalKegiatan.kategori}\n` +
                    `🗓️ *Waktu:* ${formatTanggalIndo(uploadModalKegiatan.tanggal)} (${uploadModalKegiatan.waktu})\n` +
                    `📍 *Lokasi:* ${uploadModalKegiatan.lokasi}\n` +
                    `👤 *PIC:* ${uploadModalKegiatan.penanggungJawab || profile.namaKetuaRw}\n` +
                    (tempWargaHadir ? `👥 *Kehadiran:* ${tempWargaHadir} Warga Hadir\n` : '') +
                    `📸 *Foto Terlampir:* ${tempFotoUrls.length} Foto\n` +
                    (tempVideoUrl ? `🎥 *Video:* Tersedia Liputan Video HD\n` : '') +
                    `\n📝 *Hasil:* ${tempCatatanHasil || uploadModalKegiatan.deskripsi}\n\n` +
                    `_Dokumentasi tersimpan di Aplikasi RW 018 Iringmulyo_`;

                  navigator.clipboard.writeText(text);
                  setCopiedShareText(true);
                  setTimeout(() => setCopiedShareText(false), 2500);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  copiedShareText
                    ? 'bg-emerald-800 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {copiedShareText ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-amber-300" />
                    <span>Laporan Disalin!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Salin Format Laporan WA</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUploadModalKegiatan(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={handleSaveMediaDocumentation}
                  className="px-5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Foto & Video</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Fullscreen Foto Carousel Viewer */}
      {photoLightbox.isOpen && (
        <PhotoLightbox
          photos={photoLightbox.photos}
          currentIndex={photoLightbox.currentIndex}
          activityTitle={photoLightbox.activityTitle}
          onClose={() => setPhotoLightbox((prev) => ({ ...prev, isOpen: false }))}
          onNavigate={(index) => setPhotoLightbox((prev) => ({ ...prev, currentIndex: index }))}
        />
      )}

      {/* Lightbox Fullscreen Pemutar Video Viewer */}
      {activeVideoModal && (
        <VideoLightbox
          videoUrl={activeVideoModal.url}
          title={activeVideoModal.title}
          onClose={() => setActiveVideoModal(null)}
        />
      )}

      {/* Hidden File Input for Direct Card Upload */}
      <input
        type="file"
        ref={directUploadInputRef}
        accept="image/*"
        multiple
        onChange={handleDirectFileUpload}
        className="hidden"
      />

      {/* Live Interactive Camera Modal */}
      <KegiatanCameraModal
        isOpen={!!cameraModalKegiatan}
        kegiatan={cameraModalKegiatan}
        onClose={() => setCameraModalKegiatan(null)}
        onSavePhotos={handleSaveCameraPhotos}
        profile={profile}
      />
    </div>
  );
};
