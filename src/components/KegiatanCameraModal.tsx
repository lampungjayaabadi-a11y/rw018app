import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  X,
  RotateCcw,
  Check,
  SwitchCamera,
  Grid,
  Sparkles,
  Upload,
  Eye,
  Trash2,
  Calendar,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  Layers,
  Zap
} from 'lucide-react';
import { KegiatanItem, RWProfile } from '../types';
import { formatTanggalIndo } from '../utils/formatters';

interface KegiatanCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  kegiatan: KegiatanItem | null;
  onSavePhotos: (newPhotos: Array<{ url: string; caption?: string }>) => void;
  profile: RWProfile;
}

export const KegiatanCameraModal: React.FC<KegiatanCameraModalProps> = ({
  isOpen,
  onClose,
  kegiatan,
  onSavePhotos,
  profile,
}) => {
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [addWatermark, setAddWatermark] = useState<boolean>(true);
  const [isShutterFlashing, setIsShutterFlashing] = useState<boolean>(false);

  // Reviewing single snapshot
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [photoCaption, setPhotoCaption] = useState<string>('');

  // Queue of photos captured during this camera session
  const [sessionPhotos, setSessionPhotos] = useState<Array<{ url: string; caption?: string }>>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileFallbackInputRef = useRef<HTMLInputElement>(null);

  // Start/Stop camera when modal opens/closes
  useEffect(() => {
    if (isOpen && kegiatan) {
      setCapturedPhoto(null);
      setPhotoCaption('');
      setSessionPhotos([]);
      setCameraError('');
      startCamera(facingMode);
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, kegiatan?.id]);

  // Restart camera if facingMode changes
  const handleToggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const startCamera = async (targetFacing: 'environment' | 'user') => {
    stopCamera();
    setCameraError('');

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Akses kamera peramban tidak didukung');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: targetFacing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Gagal membuka kamera:', err);
      setCameraActive(false);
      setCameraError(
        'Izin kamera belum diaktifkan atau perangkat tidak memiliki akses kamera langsung. Silakan gunakan tombol ambil foto bawaan atau galeri di bawah.'
      );
    }
  };

  // Gentle shutter audio feedback using Web Audio API
  const playShutterSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } catch {
      // Audio not supported or blocked, ignore gracefully
    }
  };

  // Capture photo from video stream
  const handleShutter = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Trigger visual flash & sound
    setIsShutterFlashing(true);
    playShutterSound();
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate?.(50);
      } catch {}
    }
    setTimeout(() => setIsShutterFlashing(false), 200);

    const targetWidth = Math.min(video.videoWidth || 1280, 1280);
    const scale = targetWidth / (video.videoWidth || 1280);
    const targetHeight = (video.videoHeight || 720) * scale;

    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // If user selfie mode, mirror horizontally for natural feel
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Reset transform for watermark
    if (facingMode === 'user') {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    // Draw official RW 018 watermark if enabled
    if (addWatermark && kegiatan) {
      const barHeight = Math.max(36, Math.floor(canvas.height * 0.08));
      const y = canvas.height - barHeight;

      // Dark gradient overlay
      const gradient = ctx.createLinearGradient(0, y - 15, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(0.3, 'rgba(0, 0, 0, 0.65)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, y - 15, canvas.width, barHeight + 15);

      // Text information
      ctx.fillStyle = '#10b981'; // emerald
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(`DOKUMENTASI ${profile.namaRw || 'RW 018 IRINGMULYO'}`, 16, y + 14);

      ctx.fillStyle = '#ffffff';
      ctx.font = '11px sans-serif';
      const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      const infoText = `${kegiatan.judul} • ${formatTanggalIndo(kegiatan.tanggal)} (${nowTime} WIB)`;
      ctx.fillText(infoText, 16, y + 28);
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.84);
    setCapturedPhoto(dataUrl);
    setPhotoCaption('');
  };

  // Fallback upload (via mobile camera file picker or device gallery)
  const handleFallbackFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setSessionPhotos((prev) => [
            ...prev,
            { url: result, caption: `Foto ${file.name.replace(/\.[^/.]+$/, '')}` },
          ]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (e.target) e.target.value = '';
  };

  // Accept current single photo into session queue
  const handleKeepPhotoAndContinue = () => {
    if (!capturedPhoto) return;
    setSessionPhotos((prev) => [
      ...prev,
      { url: capturedPhoto, caption: photoCaption.trim() || undefined },
    ]);
    setCapturedPhoto(null);
    setPhotoCaption('');
  };

  // Discard single photo and retake
  const handleRetake = () => {
    setCapturedPhoto(null);
    setPhotoCaption('');
  };

  // Save all accumulated session photos to Kegiatan
  const handleFinishAndSaveAll = () => {
    const photosToSave = [...sessionPhotos];
    if (capturedPhoto) {
      photosToSave.push({ url: capturedPhoto, caption: photoCaption.trim() || undefined });
    }

    if (photosToSave.length === 0) {
      onClose();
      return;
    }

    onSavePhotos(photosToSave);
    stopCamera();
    onClose();
  };

  const handleRemoveSessionPhoto = (idx: number) => {
    setSessionPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  if (!isOpen || !kegiatan) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Hidden canvas for snapshot rendering */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Hidden file input for native camera / gallery fallback */}
      <input
        type="file"
        ref={fileFallbackInputRef}
        accept="image/*"
        capture="environment"
        multiple
        onChange={handleFallbackFileChange}
        className="hidden"
      />

      <div className="bg-slate-900 text-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-700/80 overflow-hidden flex flex-col my-auto max-h-[96vh]">
        {/* Header HUD */}
        <div className="p-3 sm:p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 px-2 py-0.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <Camera className="w-3 h-3 text-emerald-400" />
                <span>Kamera Dokumentasi</span>
              </span>
              <span className="text-[10px] font-bold text-amber-400 bg-amber-950/50 border border-amber-800/60 px-2 py-0.5 rounded-full">
                {kegiatan.kategori}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-100 truncate mt-1">
              {kegiatan.judul}
            </h3>
            <p className="text-[11px] text-slate-400 truncate">
              📍 {kegiatan.lokasi} • 🗓️ {formatTanggalIndo(kegiatan.tanggal)}
            </p>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            title="Tutup Kamera"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder / Preview Body */}
        <div className="relative flex-1 bg-black min-h-[300px] sm:min-h-[380px] max-h-[60vh] flex items-center justify-center overflow-hidden select-none">
          {/* Shutter flash effect */}
          {isShutterFlashing && (
            <div className="absolute inset-0 bg-white z-30 pointer-events-none transition-opacity duration-150" />
          )}

          {capturedPhoto ? (
            /* Review Captured Photo Screen */
            <div className="relative w-full h-full flex flex-col items-center justify-center p-2">
              <img
                src={capturedPhoto}
                alt="Foto Terambil"
                className="max-h-[50vh] max-w-full rounded-2xl object-contain border border-slate-700 shadow-xl"
              />
              <div className="absolute top-4 right-4 bg-emerald-600 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Foto Berhasil Diambil</span>
              </div>
            </div>
          ) : cameraActive ? (
            /* Live Camera Stream Viewfinder */
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />

              {/* Viewfinder Rule of Thirds Grid Overlay */}
              {showGrid && (
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none z-10 border border-white/10">
                  <div className="border-r border-b border-white/15" />
                  <div className="border-r border-b border-white/15" />
                  <div className="border-b border-white/15" />
                  <div className="border-r border-b border-white/15" />
                  <div className="border-r border-b border-white/15" />
                  <div className="border-b border-white/15" />
                  <div className="border-r border-white/15" />
                  <div className="border-r border-white/15" />
                  <div />
                </div>
              )}

              {/* Viewfinder Branding Pill */}
              <div className="absolute top-3 left-3 z-10 pointer-events-none">
                <div className="bg-slate-950/75 backdrop-blur-xs border border-white/10 rounded-xl px-2.5 py-1 text-[10px] text-white flex items-center gap-1.5 shadow-md">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="font-bold">LIVE DOKUMENTASI RW 018</span>
                </div>
              </div>

              {/* Floating Camera Controls Top Right */}
              <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleToggleFacingMode}
                  title="Balik Kamera (Depan / Belakang)"
                  className="w-9 h-9 rounded-full bg-slate-950/75 hover:bg-slate-800 text-white flex items-center justify-center backdrop-blur-xs border border-white/10 transition-colors shadow-md cursor-pointer"
                >
                  <SwitchCamera className="w-4 h-4 text-emerald-400" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowGrid(!showGrid)}
                  title={showGrid ? 'Sembunyikan Garis Kisi Grid' : 'Tampilkan Garis Kisi Grid'}
                  className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-xs border transition-colors shadow-md cursor-pointer ${
                    showGrid
                      ? 'bg-emerald-600 text-white border-emerald-400'
                      : 'bg-slate-950/75 hover:bg-slate-800 text-slate-300 border-white/10'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setAddWatermark(!addWatermark)}
                  title={addWatermark ? 'Watermark Stempel RW Aktif' : 'Watermark Stempel Nonaktif'}
                  className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-xs border transition-colors shadow-md cursor-pointer ${
                    addWatermark
                      ? 'bg-amber-500 text-slate-950 border-amber-300 font-bold'
                      : 'bg-slate-950/75 hover:bg-slate-800 text-slate-400 border-white/10'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Camera Permission Error / Fallback Area */
            <div className="p-6 text-center max-w-md space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
                <Camera className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-white">Akses Kamera Langsung Belum Terhubung</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {cameraError || 'Peramban memerlukan izin untuk membuka kamera video.'}
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => startCamera(facingMode)}
                  className="w-full sm:w-auto px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Coba Buka Kamera Lagi</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileFallbackInputRef.current?.click()}
                  className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ambil via Kamera HP / File</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Caption & Review Controls when Photo is captured */}
        {capturedPhoto ? (
          <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Keterangan / Deskripsi Momen Foto (Opsional):
              </label>
              <input
                type="text"
                value={photoCaption}
                onChange={(e) => setPhotoCaption(e.target.value)}
                placeholder="Contoh: Warga RT 039 sedang bergotong royong di saluran air..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={handleRetake}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Foto Ulang</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleKeepPhotoAndContinue}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-700/60 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Simpan & Jepret Lagi</span>
                </button>

                <button
                  type="button"
                  onClick={handleFinishAndSaveAll}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Selesai & Simpan Foto</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Normal Live Camera Action Bar */
          <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 space-y-3 shrink-0">
            <div className="flex items-center justify-between gap-3">
              {/* Left: Thumbnail & Session Photos Count */}
              <div className="flex items-center gap-2 min-w-[100px]">
                {sessionPhotos.length > 0 ? (
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-emerald-500 relative bg-slate-800 shrink-0 shadow-md">
                      <img
                        src={sessionPhotos[sessionPhotos.length - 1].url}
                        alt="Preview Terakhir"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute -top-1 -right-1 bg-emerald-500 text-slate-950 font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                        {sessionPhotos.length}
                      </span>
                    </div>
                    <div className="hidden sm:block">
                      <div className="text-[11px] font-bold text-emerald-300">
                        {sessionPhotos.length} Foto Siap
                      </div>
                      <div className="text-[9px] text-slate-400">Sesi Kamera Ini</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500">
                    Tekan tombol untuk mengambil foto
                  </div>
                )}
              </div>

              {/* Center: Interactive Shutter Button */}
              <div className="flex items-center justify-center">
                {cameraActive ? (
                  <button
                    type="button"
                    onClick={handleShutter}
                    className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-full border-4 border-white/80 p-1 flex items-center justify-center shadow-2xl active:scale-90 transition-transform cursor-pointer group"
                    title="Jepret Foto Sekarang"
                  >
                    <div className="w-full h-full rounded-full bg-emerald-500 group-hover:bg-emerald-400 transition-colors flex items-center justify-center shadow-inner">
                      <Camera className="w-6 h-6 sm:w-7 sm:h-7 text-slate-950" />
                    </div>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileFallbackInputRef.current?.click()}
                    className="px-5 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Ambil Foto</span>
                  </button>
                )}
              </div>

              {/* Right: Gallery Upload & Finish Button */}
              <div className="flex items-center justify-end gap-1.5 min-w-[100px]">
                <button
                  type="button"
                  onClick={() => fileFallbackInputRef.current?.click()}
                  title="Pilih dari Galeri / File Perangkat"
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700"
                >
                  <Upload className="w-4 h-4 text-indigo-400" />
                </button>

                {sessionPhotos.length > 0 && (
                  <button
                    type="button"
                    onClick={handleFinishAndSaveAll}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Simpan ({sessionPhotos.length})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Session Photos Thumbnail Reel */}
            {sessionPhotos.length > 0 && (
              <div className="pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                  <span className="font-semibold text-emerald-400">
                    Foto yang diambil pada sesi ini ({sessionPhotos.length}):
                  </span>
                  <button
                    type="button"
                    onClick={handleFinishAndSaveAll}
                    className="font-bold text-emerald-300 hover:underline cursor-pointer"
                  >
                    Simpan Semua Sekarang →
                  </button>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {sessionPhotos.map((item, idx) => (
                    <div
                      key={idx}
                      className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-700 bg-slate-800 shrink-0 group"
                    >
                      <img
                        src={item.url}
                        alt={`Foto ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSessionPhoto(idx)}
                        title="Hapus foto ini"
                        className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                      <span className="absolute bottom-0.5 left-0.5 text-[8px] bg-black/60 text-white px-1 rounded font-mono">
                        #{idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
