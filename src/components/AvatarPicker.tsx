import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Image as ImageIcon,
  Link as LinkIcon,
  Trash2,
  RefreshCw,
  Check,
  X,
  Sparkles,
  FlipHorizontal,
  UploadCloud,
  AlertCircle
} from 'lucide-react';
import { compressImageFile } from '../utils/imageCompressor';
import {
  LOGO_RT_039,
  LOGO_RT_040,
  LOGO_RT_041,
  LOGO_RT_042,
  LOGO_RW_018
} from '../constants/logo';

interface AvatarPickerProps {
  value: string;
  onChange: (avatarUrl: string) => void;
  userName?: string;
  userRole?: string;
}

const LOGO_PRESETS = [
  {
    label: 'Logo RT 039',
    sub: 'RT 039',
    url: LOGO_RT_039,
  },
  {
    label: 'Logo RT 040',
    sub: 'RT 040',
    url: LOGO_RT_040,
  },
  {
    label: 'Logo RT 041',
    sub: 'RT 041',
    url: LOGO_RT_041,
  },
  {
    label: 'Logo RT 042',
    sub: 'RT 042',
    url: LOGO_RT_042,
  },
  {
    label: 'Logo RW 018',
    sub: 'RW 018',
    url: LOGO_RW_018,
  },
];

const PRESET_AVATARS = [
  {
    label: 'Pengurus Pria 1',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  },
  {
    label: 'Pengurus Pria 2',
    url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
  },
  {
    label: 'Pengurus Wanita 1',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
  },
  {
    label: 'Pengurus Pria 3',
    url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
  },
  {
    label: 'Pengurus Wanita 2',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  },
  {
    label: 'Pengurus Pria 4',
    url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80',
  },
];

export const AvatarPicker: React.FC<AvatarPickerProps> = ({
  value,
  onChange,
  userName = 'User',
  userRole,
}) => {
  const [activeTab, setActiveTab] = useState<'options' | 'camera' | 'url' | 'presets'>('options');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [tempUrl, setTempUrl] = useState(value || '');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Camera States
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [capturedTempData, setCapturedTempData] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const mobileCameraInputRef = useRef<HTMLInputElement | null>(null);

  // Default Avatar Fallback
  const defaultFallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=047857&color=ffffff&bold=true&size=256`;
  const currentDisplayUrl = value || defaultFallbackUrl;

  const isBase64 = value.startsWith('data:image/');
  const isCustomUrl = value && !isBase64;

  // Cleanup camera stream
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  // Start Camera Stream
  const startCamera = async (facing: 'user' | 'environment' = cameraFacing) => {
    setCameraError('');
    setCapturedTempData(null);
    setIsLoading(true);
    stopCameraStream();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Kamera browser tidak didukung atau diblokir.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 720 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
      setIsLoading(false);
    } catch (err: any) {
      console.warn('Live Camera Error:', err);
      setIsLoading(false);
      setCameraError(
        'Tidak dapat mengakses kamera langsung. Silakan izinkan akses kamera atau gunakan opsi "Buka Kamera HP Langsung".'
      );
    }
  };

  // Switch between front and back camera
  const handleToggleFacing = () => {
    const nextFacing = cameraFacing === 'user' ? 'environment' : 'user';
    setCameraFacing(nextFacing);
    if (isCameraActive) {
      startCamera(nextFacing);
    }
  };

  // Snap photo from live video
  const handleSnapPhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const canvas = document.createElement('canvas');
    const minDim = Math.min(video.videoWidth || 640, video.videoHeight || 640);
    const sx = ((video.videoWidth || 640) - minDim) / 2;
    const sy = ((video.videoHeight || 640) - minDim) / 2;

    const targetSize = 512;
    canvas.width = targetSize;
    canvas.height = targetSize;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flip horizontal if front camera
    if (cameraFacing === 'user') {
      ctx.translate(targetSize, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, sx, sy, minDim, minDim, 0, 0, targetSize, targetSize);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);

    setCapturedTempData(dataUrl);
    stopCameraStream();
  };

  // Confirm using captured photo
  const handleConfirmCapturedPhoto = () => {
    if (capturedTempData) {
      onChange(capturedTempData);
      setSuccessMessage('Foto kamera berhasil diterapkan sebagai foto profil!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setCapturedTempData(null);
      setActiveTab('options');
    }
  };

  // Handle File Upload from Gallery or Native Camera
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      setErrorMessage('');
      const compressedData = await compressImageFile(file, {
        maxDimension: 512,
        quality: 0.85,
        aspectRatio: 'square',
      });

      onChange(compressedData);
      setSuccessMessage('Foto dari galeri berhasil diunggah dan disimpan!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setActiveTab('options');
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memproses file foto.');
    } finally {
      setIsLoading(false);
      // Reset input value so same file can be selected again if needed
      e.target.value = '';
    }
  };

  // Handle URL Apply
  const handleApplyUrl = () => {
    if (tempUrl.trim()) {
      onChange(tempUrl.trim());
      setSuccessMessage('URL foto profil berhasil disimpan.');
      setTimeout(() => setSuccessMessage(''), 3000);
      setActiveTab('options');
      setShowUrlInput(false);
    }
  };

  // Handle Clear / Reset Photo
  const handleClearPhoto = () => {
    if (confirm('Kembalikan foto profil ke avatar default?')) {
      onChange('');
      setTempUrl('');
      setSuccessMessage('Foto profil dikembalikan ke inisial nama.');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  return (
    <div className="bg-slate-50 border border-emerald-200/80 rounded-2xl p-3.5 sm:p-4 space-y-3">
      {/* Hidden File Inputs */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={mobileCameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header Info */}
      <div className="flex items-center justify-between">
        <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Foto Profil Pengguna (Kamera HP / Galeri / URL)</span>
        </label>
        {value ? (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
            {isBase64 ? '📷 Foto Tersimpan (Lokal/Kamera)' : '🌐 Foto URL Eksternal'}
          </span>
        ) : (
          <span className="text-[10px] text-slate-500 font-semibold">Avatar Standar</span>
        )}
      </div>

      {/* Main Avatar Preview & Quick Buttons Row */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3.5 rounded-xl border border-slate-200">
        {/* Avatar Display Frame */}
        <div className="relative group shrink-0">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-3 border-emerald-600 bg-slate-900 shadow-md flex items-center justify-center">
            <img
              src={currentDisplayUrl}
              alt={userName}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.currentTarget;
                target.src = defaultFallbackUrl;
              }}
            />
          </div>
          {value && (
            <button
              type="button"
              onClick={handleClearPhoto}
              title="Hapus foto / Gunakan Avatar Standar"
              className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-md text-xs cursor-pointer transition-transform hover:scale-110"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex-1 w-full space-y-2 text-center sm:text-left">
          <div>
            <div className="font-bold text-slate-900 text-sm">{userName}</div>
            <div className="text-[11px] text-slate-500">
              Pilih foto profil resmi dari kamera HP atau galeri foto perangkat Anda.
            </div>
          </div>

          {/* 3 Main Action Buttons */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
            {/* Button 1: Live WebCam / Phone Camera */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('camera');
                startCamera('user');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Ambil dari Kamera HP</span>
            </button>

            {/* Button 2: Galeri HP / File Picker */}
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-bold shadow-2xs active:scale-95 transition-all cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
              <span>Pilih dari Galeri Foto</span>
            </button>

            {/* Button 3: Preset / URL Toggle */}
            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              title="Input Link URL Gambar"
            >
              <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>Link URL</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'presets' ? 'options' : 'presets')}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Preset Pilihan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Expandable URL Input */}
      {showUrlInput && (
        <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2 animate-in fade-in">
          <label className="text-[11px] font-bold text-slate-700 block">
            Masukkan Tautan URL Gambar Online:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={tempUrl}
              onChange={(e) => setTempUrl(e.target.value)}
              placeholder="https://images.unsplash.com/... atau tautan gambar"
              className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleApplyUrl}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              Terapkan
            </button>
          </div>
        </div>
      )}

      {/* Preset Avatars Selector */}
      {activeTab === 'presets' && (
        <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">Pilih Logo Wilayah & Foto Model:</span>
            <button
              type="button"
              onClick={() => setActiveTab('options')}
              className="text-slate-400 hover:text-slate-600 text-xs"
            >
              Tutup
            </button>
          </div>

          {/* Section 1: Official RT & RW Logos */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
              Logo Wilayah Tugas RT 039 - RT 042 & RW 018:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {LOGO_PRESETS.map((p, idx) => (
                <button
                  key={`logo-${idx}`}
                  type="button"
                  onClick={() => {
                    onChange(p.url);
                    setTempUrl(p.url);
                    setSuccessMessage(`${p.label} dipilih!`);
                    setTimeout(() => setSuccessMessage(''), 2500);
                    setActiveTab('options');
                  }}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl border-2 border-amber-200 hover:border-emerald-600 bg-amber-50/50 hover:bg-emerald-50 transition-all text-center group cursor-pointer shadow-2xs"
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-amber-400 bg-slate-950 group-hover:scale-105 transition-transform">
                    <img
                      src={p.url}
                      alt={p.label}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-800 truncate w-full">
                    {p.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Model Photos */}
          <div className="space-y-1.5 pt-1 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
              Foto Model Pengurus:
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {PRESET_AVATARS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    onChange(p.url);
                    setTempUrl(p.url);
                    setSuccessMessage(`Preset ${p.label} dipilih.`);
                    setTimeout(() => setSuccessMessage(''), 2500);
                    setActiveTab('options');
                  }}
                  className="flex flex-col items-center gap-1 p-1.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all text-center group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 group-hover:border-emerald-600">
                    <img
                      src={p.url}
                      alt={p.label}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-700 truncate w-full">
                    {p.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Live Camera View Modal / Panel */}
      {activeTab === 'camera' && (
        <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-700 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-xs text-slate-100">Kamera Pengguna (Live Camera)</span>
            </div>
            <button
              type="button"
              onClick={() => {
                stopCameraStream();
                setCapturedTempData(null);
                setActiveTab('options');
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Camera Viewport or Captured Snapshot */}
          <div className="relative w-full max-w-xs mx-auto aspect-square rounded-2xl overflow-hidden bg-black border-2 border-emerald-500/80 shadow-2xl flex items-center justify-center">
            {capturedTempData ? (
              <img
                src={capturedTempData}
                alt="Hasil Foto"
                className="w-full h-full object-cover"
              />
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${cameraFacing === 'user' ? '-scale-x-100' : ''}`}
                />
                {/* Circular Face Guide Overlay */}
                <div className="absolute inset-0 border-2 border-dashed border-emerald-400/60 rounded-full m-4 pointer-events-none flex items-center justify-center">
                  <div className="text-[11px] text-emerald-300 font-semibold bg-slate-950/70 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                    Posisikan Wajah di Lingkaran
                  </div>
                </div>
              </>
            )}

            {isLoading && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-xs text-emerald-300 gap-2">
                <RefreshCw className="w-6 h-6 animate-spin" />
                <span>Membuka Kamera...</span>
              </div>
            )}
          </div>

          {cameraError && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-200 text-xs rounded-xl space-y-2">
              <p>{cameraError}</p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => mobileCameraInputRef.current?.click()}
                  className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-bold text-xs flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Buka Kamera Bawaan HP</span>
                </button>
              </div>
            </div>
          )}

          {/* Camera Bottom Controls */}
          <div className="flex items-center justify-center gap-3 pt-1">
            {capturedTempData ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setCapturedTempData(null);
                    startCamera(cameraFacing);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Foto Ulang</span>
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCapturedPhoto}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-lg"
                >
                  <Check className="w-4 h-4" />
                  <span>Gunakan Foto Ini</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleToggleFacing}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-full text-xs font-bold border border-slate-700"
                  title="Putar Kamera Depan / Belakang"
                >
                  <FlipHorizontal className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleSnapPhoto}
                  disabled={!isCameraActive}
                  className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 rounded-2xl text-xs font-black shadow-lg flex items-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95 transition-all"
                >
                  <Camera className="w-4 h-4 text-emerald-950" />
                  <span>Ambil Foto (Snap)</span>
                </button>

                <button
                  type="button"
                  onClick={() => mobileCameraInputRef.current?.click()}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-full text-xs font-bold border border-slate-700"
                  title="Gunakan Aplikasi Kamera HP Langsung"
                >
                  <UploadCloud className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
