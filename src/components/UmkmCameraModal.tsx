import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  X,
  RotateCcw,
  Check,
  SwitchCamera,
  Grid,
  Sparkles,
  AlertTriangle,
  Upload,
  Layers,
  MapPin,
  Calendar,
  Store
} from 'lucide-react';
import { UmkmFotoItem } from '../types';
import { cropAndCompressDataUrl } from '../utils/imageCompressor';
import { formatTanggalIndo } from '../utils/formatters';

interface UmkmCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  namaUsaha?: string;
  onPhotoCaptured: (foto: UmkmFotoItem) => void;
}

export const UmkmCameraModal: React.FC<UmkmCameraModalProps> = ({
  isOpen,
  onClose,
  namaUsaha,
  onPhotoCaptured,
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
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fallbackInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCapturedPhoto(null);
      setPhotoCaption('');
      setCameraError('');
      startCamera(facingMode);
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

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
        throw new Error('Akses kamera live tidak didukung pada browser ini. Silakan gunakan tombol kamera bawaan HP.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: targetFacing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: any) {
      console.warn('Gagal membuka kamera:', err);
      setCameraError(
        err?.message ||
          'Kamera tidak dapat diakses. Pastikan izin kamera telah diizinkan atau gunakan tombol Kamera Bawaan HP.'
      );
      setCameraActive(false);
    }
  };

  // Capture snapshot from live video feed
  const handleCaptureSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;

    // Trigger visual shutter flash
    setIsShutterFlashing(true);
    setTimeout(() => setIsShutterFlashing(false), 200);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;
    canvas.width = w;
    canvas.height = h;

    // If user facing, mirror image horizontally
    if (facingMode === 'user') {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, w, h);

    // Reset transform
    if (facingMode === 'user') {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    // Optional Watermark
    if (addWatermark) {
      const bannerHeight = Math.max(50, Math.round(h * 0.08));
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.fillRect(0, h - bannerHeight, w, bannerHeight);

      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.max(14, Math.round(bannerHeight * 0.32))}px sans-serif`;
      ctx.textBaseline = 'middle';
      const usahaTitle = namaUsaha ? `UMKM: ${namaUsaha}` : 'UMKM Warga RW 018';
      ctx.fillText(
        `🏪 ${usahaTitle} • RW 018 Kampung Banten, Iringmulyo`,
        20,
        h - bannerHeight * 0.65
      );

      ctx.fillStyle = '#f59e0b';
      ctx.font = `${Math.max(11, Math.round(bannerHeight * 0.26))}px sans-serif`;
      const dateText = `📅 ${formatTanggalIndo(new Date().toISOString().slice(0, 10))} • Dokumentasi Resmi Usaha`;
      ctx.fillText(dateText, 20, h - bannerHeight * 0.28);
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedPhoto(dataUrl);
    stopCamera();
  };

  // Fallback direct mobile camera capture
  const handleFallbackFileCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      if (src) {
        setCapturedPhoto(src);
        stopCamera();
      }
    };
    reader.readAsDataURL(file);
  };

  // Confirm and save photo
  const handleConfirmSave = async () => {
    if (!capturedPhoto) return;
    setIsProcessing(true);

    try {
      // Compress to lightweight proportioned JPEG
      const compressed = await cropAndCompressDataUrl(capturedPhoto, {
        maxDimension: 1000,
        quality: 0.85,
        aspectRatio: 'original',
      });

      const newFoto: UmkmFotoItem = {
        id: `foto-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        url: compressed,
        caption: photoCaption.trim() || 'Foto Dokumentasi Usaha',
        isUtama: false,
        uploadedAt: new Date().toISOString(),
      };

      onPhotoCaptured(newFoto);
      onClose();
    } catch (err) {
      console.error('Gagal memproses foto:', err);
      alert('Gagal memproses foto. Silakan coba lagi.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    setPhotoCaption('');
    startCamera(facingMode);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col text-white my-auto">
        {/* Modal Header */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Kamera Ponsel Usaha</span>
                {namaUsaha && (
                  <span className="text-xs text-amber-400 font-normal truncate max-w-[180px]">
                    ({namaUsaha})
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400">
                {capturedPhoto
                  ? 'Periksa hasil jepretan & masukkan keterangan foto'
                  : 'Arahkan kamera ke produk, menu, etalase, atau kios'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewfinder / Preview Area */}
        <div className="relative bg-black aspect-4/3 w-full flex items-center justify-center overflow-hidden">
          {/* Hidden Canvas for Processing */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Shutter Flash Animation */}
          {isShutterFlashing && (
            <div className="absolute inset-0 bg-white z-30 pointer-events-none transition-opacity duration-150" />
          )}

          {!capturedPhoto ? (
            /* Live Camera Feed */
            <>
              {cameraError ? (
                <div className="p-6 text-center space-y-3 max-w-xs mx-auto">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-rose-300 leading-relaxed">{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => fallbackInputRef.current?.click()}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 mx-auto"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Gunakan Kamera Bawaan HP</span>
                  </button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    playsInline
                    autoPlay
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Rule of Thirds Grid Overlay */}
                  {showGrid && (
                    <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 z-10 opacity-30">
                      <div className="border-r border-b border-white" />
                      <div className="border-r border-b border-white" />
                      <div className="border-b border-white" />
                      <div className="border-r border-b border-white" />
                      <div className="border-r border-b border-white" />
                      <div className="border-b border-white" />
                      <div className="border-r border-white" />
                      <div className="border-r border-white" />
                      <div />
                    </div>
                  )}

                  {/* Top Camera Controls Overlay */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20">
                    <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/10 text-[11px]">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="font-medium text-slate-200">Kamera Aktif</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setShowGrid(!showGrid)}
                        className={`p-2 rounded-xl backdrop-blur-md border transition cursor-pointer ${
                          showGrid
                            ? 'bg-amber-500/80 text-slate-950 border-amber-400'
                            : 'bg-black/40 text-white border-white/10 hover:bg-black/60'
                        }`}
                        title="Toggle Garis Grid Bantuan"
                      >
                        <Grid className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setAddWatermark(!addWatermark)}
                        className={`p-2 rounded-xl backdrop-blur-md border transition cursor-pointer ${
                          addWatermark
                            ? 'bg-amber-500/80 text-slate-950 border-amber-400'
                            : 'bg-black/40 text-white border-white/10 hover:bg-black/60'
                        }`}
                        title="Toggle Watermark Resmi RW 018"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={handleToggleFacingMode}
                        className="p-2 rounded-xl bg-black/40 hover:bg-black/60 text-white backdrop-blur-md border border-white/10 transition cursor-pointer"
                        title="Ganti Kamera Depan / Belakang"
                      >
                        <SwitchCamera className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            /* Review Captured Photo */
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <img
                src={capturedPhoto}
                alt="Hasil Foto Usaha"
                className="w-full h-full object-contain"
              />
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/20 text-[11px] font-bold text-amber-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Foto Siap Digunakan</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3">
          {!capturedPhoto ? (
            /* Controls during live camera */
            <div className="flex items-center justify-between gap-3">
              {/* Native Mobile Camera Fallback */}
              <button
                type="button"
                onClick={() => fallbackInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition cursor-pointer"
                title="Buka aplikasi kamera bawaan smartphone"
              >
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Kamera Bawaan HP</span>
                <span className="sm:hidden">Kamera HP</span>
              </button>

              {/* Native capture input */}
              <input
                ref={fallbackInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFallbackFileCapture}
              />

              {/* Shutter Button */}
              <button
                type="button"
                onClick={handleCaptureSnapshot}
                disabled={!cameraActive}
                className="w-14 h-14 rounded-full bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed border-4 border-slate-900 ring-4 ring-amber-400/50 flex items-center justify-center text-slate-950 shadow-lg transition active:scale-90 cursor-pointer mx-auto"
                title="Tekan untuk Mengambil Foto"
              >
                <div className="w-5 h-5 rounded-full bg-slate-950" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          ) : (
            /* Review & Caption Form */
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Keterangan Foto (Contoh: "Foto Tampak Depan", "Menu Unggulan", "Etalase Produk")
                </label>
                <input
                  type="text"
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                  placeholder="Ketik keterangan singkat foto..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleRetake}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Ambil Ulang</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirmSave}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-md transition active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isProcessing ? 'Menyimpan...' : 'Masukkan ke Album Usaha'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
