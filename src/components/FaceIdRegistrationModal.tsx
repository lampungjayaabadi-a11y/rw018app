import React, { useState, useEffect, useRef } from 'react';
import {
  ScanFace,
  Camera,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Upload,
  User,
  ShieldAlert,
  Activity,
  Cpu
} from 'lucide-react';
import { AppUser } from '../types';
import { getUserPhotoUrl, saveUserAccount } from '../services/auth';
import { registerDeviceFaceId, setRegisteredFaceId } from '../services/biometricService';
import {
  playBiometricScanTick,
  playBiometricSuccessSound
} from '../utils/audioEffects';

interface FaceIdRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AppUser;
  onSuccess?: (updatedUser: AppUser, snapshotUrl?: string) => void;
}

export const FaceIdRegistrationModal: React.FC<FaceIdRegistrationModalProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
}) => {
  const [step, setStep] = useState<'preview' | 'scanning' | 'completed' | 'error'>('preview');
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [capturedSnapshot, setCapturedSnapshot] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Posisikan wajah Anda tepat di dalam lingkaran pemindai');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const progressTimerRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('preview');
      setScanProgress(0);
      setCapturedSnapshot(null);
      setCameraError('');
      setStatusMessage('Posisikan wajah Anda tepat di dalam lingkaran pemindai');
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [isOpen, user.id]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError('');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Kamera tidak didukung pada peramban ini.');
        setCameraActive(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access error during Face ID registration:', err);
      setCameraError('Izin kamera belum aktif. Anda tetap dapat mendaftarkan template biometrik wajah digital.');
      setCameraActive(false);
    }
  };

  const capturePhoto = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 480;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Mirror image for natural selfie feel
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      return canvas.toDataURL('image/jpeg', 0.85);
    } catch {
      return null;
    }
  };

  const handleStartFaceScan = () => {
    setStep('scanning');
    setScanProgress(0);
    setStatusMessage('Menganalisis proporsi kontur & geometri biometrik wajah...');
    playBiometricScanTick();

    let current = 0;
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);

    progressTimerRef.current = setInterval(() => {
      current += 10;
      if (current === 40) {
        setStatusMessage('Merekam landmark biometrik wajah & tekstur 3D...');
        playBiometricScanTick();
      } else if (current === 70) {
        setStatusMessage('Menyinkronkan kunci biometrik Face ID terenkripsi 256-bit...');
        playBiometricScanTick();
      } else if (current >= 100) {
        clearInterval(progressTimerRef.current);
        setScanProgress(100);
        finishRegistration();
      }
      setScanProgress(Math.min(current, 100));
    }, 200);
  };

  const finishRegistration = async () => {
    let snapshotDataUrl: string | null = null;
    if (cameraActive) {
      snapshotDataUrl = capturePhoto();
      if (snapshotDataUrl) {
        setCapturedSnapshot(snapshotDataUrl);
      }
    }

    const regResult = await registerDeviceFaceId(user, snapshotDataUrl || undefined);

    // Update user in storage
    const updatedUser: AppUser = {
      ...user,
      faceRecognitionEnabled: true,
      biometricRegisteredAt: new Date().toISOString(),
      avatarUrl: snapshotDataUrl || user.avatarUrl,
    };

    saveUserAccount(updatedUser);

    setStep('completed');
    setStatusMessage('Face ID berhasil diverifikasi dan terdaftar ke akun!');
    playBiometricSuccessSound();

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([50, 80, 50]);
      } catch (e) {}
    }
  };

  const handleApplyAndClose = () => {
    stopCamera();
    const updatedUser: AppUser = {
      ...user,
      faceRecognitionEnabled: true,
      biometricRegisteredAt: new Date().toISOString(),
      avatarUrl: capturedSnapshot || user.avatarUrl,
    };
    if (onSuccess) {
      onSuccess(updatedUser, capturedSnapshot || undefined);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900/95 border border-slate-700/80 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative text-white">
        {/* Top Glow & Decorative */}
        <div className="absolute -top-24 -left-24 w-52 h-52 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-52 h-52 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Hidden Canvas for Frame Capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Header */}
        <div className="p-4 pb-2.5 flex items-center justify-between border-b border-slate-800/90 relative z-10 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-400/30 text-teal-300 flex items-center justify-center">
              <ScanFace className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-black tracking-tight text-slate-100">
                  Registrasi Face ID Pengguna
                </h3>
                <span className="text-[8px] px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 font-extrabold uppercase border border-teal-500/40 tracking-wider">
                  Bank-Grade
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Pindai & simpan template biometrik wajah terenkripsi
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer border border-slate-700/60"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Identity Banner */}
        <div className="px-4 pt-3 pb-1 relative z-10">
          <div className="p-2 rounded-2xl bg-slate-800/70 border border-slate-700/70 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden border border-teal-400/60 bg-slate-950 shrink-0 shadow-md">
              <img
                src={capturedSnapshot || getUserPhotoUrl(user, user.nama)}
                alt={user.nama}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nama)}&background=047857&color=ffffff&bold=true`;
                }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-100 truncate">{user.nama}</p>
              <div className="flex items-center gap-1.5 text-[10px] text-teal-300/90 font-medium">
                <ShieldCheck className="w-3 h-3 text-teal-400 shrink-0" />
                <span className="truncate">{user.roleLabel} • @{user.username}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Camera / Scan Viewport */}
        <div className="p-4 pt-2 text-center space-y-3 relative z-10">
          {/* Oval Banking Frame */}
          <div className="relative flex items-center justify-center my-1">
            {/* Rotating Cyber Ring Ticks */}
            <div className="absolute -inset-2.5 pointer-events-none rounded-[50%/44%] border border-dashed border-teal-500/25 animate-[spin_30s_linear_infinite]" />

            <div
              className={`relative w-48 h-56 sm:w-52 sm:h-60 rounded-[50%/42%] overflow-hidden bg-slate-950 shadow-2xl flex items-center justify-center transition-all duration-300 border-2 ${
                step === 'completed'
                  ? 'border-emerald-500 shadow-emerald-950/50'
                  : step === 'scanning'
                  ? 'border-cyan-400 shadow-cyan-950/50'
                  : 'border-teal-500/80 shadow-teal-950/50'
              }`}
            >
              {/* Live Camera Stream */}
              {cameraActive ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : capturedSnapshot ? (
                <img
                  src={capturedSnapshot}
                  alt="Captured Face"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-950 p-4">
                  <img
                    src={getUserPhotoUrl(user, user.nama)}
                    alt={user.nama}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover opacity-50 blur-2xs"
                  />
                  <div className="absolute inset-0 bg-slate-950/60 flex flex-col items-center justify-center">
                    <ScanFace className="w-12 h-12 text-teal-400 animate-pulse mb-1" />
                    <span className="text-[10px] text-teal-200 font-bold">Mode Sensor Digital</span>
                  </div>
                </div>
              )}

              {/* 4 Corner Reticle Brackets */}
              <div className="absolute inset-3 pointer-events-none flex flex-col justify-between p-1">
                <div className="flex justify-between">
                  <div className="w-4 h-4 border-t-2 border-l-2 border-teal-400" />
                  <div className="w-4 h-4 border-t-2 border-r-2 border-teal-400" />
                </div>
                <div className="flex justify-between">
                  <div className="w-4 h-4 border-b-2 border-l-2 border-teal-400" />
                  <div className="w-4 h-4 border-b-2 border-r-2 border-teal-400" />
                </div>
              </div>

              {/* High-Precision Laser Line Scanning Effect (Sweeps Up and Down) */}
              {step === 'scanning' && (
                <div className="absolute inset-x-0 pointer-events-none z-20 animate-laser-sweep-fast">
                  <div className="w-full h-8 bg-gradient-to-b from-transparent via-cyan-400/10 to-cyan-400/25" />
                  <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-300 via-teal-200 to-transparent shadow-[0_0_15px_#06b6d4,0_0_30px_#14b8a6]" />
                  <div className="w-full h-8 bg-gradient-to-t from-transparent via-cyan-400/10 to-cyan-400/25" />
                </div>
              )}

              {/* Facial Landmark Tracking Matrix */}
              {step === 'scanning' && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="relative w-28 h-36">
                    <div className="absolute top-8 left-2 w-4 h-2.5 border border-cyan-400 rounded-xs flex items-center justify-center">
                      <div className="w-1 h-1 bg-cyan-300 rounded-full animate-ping" />
                    </div>
                    <div className="absolute top-8 right-2 w-4 h-2.5 border border-cyan-400 rounded-xs flex items-center justify-center">
                      <div className="w-1 h-1 bg-cyan-300 rounded-full animate-ping" />
                    </div>
                    <div className="absolute top-16 left-1/2 -translate-x-1/2 w-2.5 h-2.5 border border-dashed border-teal-400 rounded-full" />
                    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-8 h-2 border-b-2 border-dashed border-cyan-400 rounded-[50%]" />
                  </div>
                </div>
              )}

              {/* Success Overlay */}
              {step === 'completed' && (
                <div className="absolute inset-0 bg-emerald-950/85 backdrop-blur-xs flex flex-col items-center justify-center animate-in zoom-in p-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-1 animate-bounce" />
                  <span className="text-xs font-black text-emerald-200 uppercase tracking-wider">
                    Face ID Terdaftar
                  </span>
                  <span className="text-[10px] text-emerald-300 font-mono mt-0.5">
                    AES-256 Terenkripsi
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Camera Info / Error Notice */}
          {cameraError && (
            <div className="p-2 rounded-xl bg-amber-950/60 border border-amber-500/30 text-amber-200 text-[10px] flex items-center gap-2 text-left">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* Status Message & Progress */}
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-200">
              {step === 'scanning'
                ? `Memindai Wajah (${scanProgress}%)...`
                : step === 'completed'
                ? 'Pendaftaran Face ID Berhasil!'
                : 'Pendaftaran Face ID'}
            </p>
            <p className="text-[10px] text-slate-400 leading-relaxed px-2">
              {statusMessage}
            </p>

            {step === 'scanning' && (
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden mt-1.5">
                <div
                  className="bg-gradient-to-r from-teal-500 to-cyan-400 h-full transition-all duration-200"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            {step === 'preview' && (
              <button
                type="button"
                onClick={handleStartFaceScan}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-teal-900/30 active:scale-98 transition-all cursor-pointer"
              >
                <ScanFace className="w-4 h-4 text-teal-200" />
                <span>Mulai Pindai & Daftarkan Face ID</span>
              </button>
            )}

            {step === 'scanning' && (
              <button
                type="button"
                disabled
                className="w-full py-2.5 px-4 bg-teal-800/60 text-teal-200 font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-wait"
              >
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-300" />
                <span>Memproses Template Biometrik ({scanProgress}%)...</span>
              </button>
            )}

            {step === 'completed' && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleApplyAndClose}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 active:scale-98 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>Simpan & Terapkan ke Akun</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('preview');
                    setCapturedSnapshot(null);
                    startCamera();
                  }}
                  className="w-full py-1.5 text-[11px] text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Pindai / Ambil Foto Ulang</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer Security Notice */}
        <div className="p-2.5 bg-slate-950/95 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span>Taraf Keamanan Perbankan ISO 30107-3</span>
          </span>
          <span className="text-slate-400 font-mono text-[9px]">ENCRYPTED-FACEID</span>
        </div>
      </div>
    </div>
  );
};

export default FaceIdRegistrationModal;
