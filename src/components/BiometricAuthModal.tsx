import React, { useState, useEffect, useRef } from 'react';
import {
  Fingerprint,
  ScanFace,
  X,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Camera,
  RefreshCw,
  Sparkles,
  Lock,
  Smartphone,
  ShieldAlert,
  KeyRound,
  Lightbulb,
  Cpu,
  Eye,
  Radio,
  Sliders,
  Shield,
  Activity,
  Zap,
  Clock
} from 'lucide-react';
import { AppUser } from '../types';
import { loginWithBiometric, getUserPhotoUrl } from '../services/auth';
import {
  authenticateDeviceFingerprint,
  verifyFaceBiometric,
  analyzeLiveFaceFrame,
  resetLivenessState,
  LiveFrameAnalysisResult
} from '../services/biometricService';
import {
  playBiometricScanTick,
  playBiometricLockSound,
  playBiometricSuccessSound,
  playBiometricErrorSound
} from '../utils/audioEffects';

interface BiometricAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUser: AppUser;
  onLoginSuccess: (user: AppUser) => void;
  onSwitchToPassword?: () => void;
  initialMode?: 'fingerprint' | 'face';
}

export const BiometricAuthModal: React.FC<BiometricAuthModalProps> = ({
  isOpen,
  onClose,
  selectedUser,
  onLoginSuccess,
  onSwitchToPassword,
  initialMode = 'face',
}) => {
  const [activeTab, setActiveTab] = useState<'fingerprint' | 'face'>(initialMode);

  // Status matches exact user requirements:
  // "Mendeteksi wajah..." | "Memverifikasi wajah..." | "Verifikasi berhasil" | "Verifikasi gagal" | "idle"
  const [stageStatus, setStageStatus] = useState<
    'idle' | 'detecting' | 'verifying' | 'success' | 'failed'
  >('idle');

  // Banking 3-Phase Step Tracker
  // 1: Deteksi Geometri -> 2: Liveness & Kedipan -> 3: Enkripsi Biometrik 90%+
  const [bankStep, setBankStep] = useState<1 | 2 | 3>(1);

  const [statusTitle, setStatusTitle] = useState<string>('Posisikan wajah Anda di depan kamera');
  const [statusSubtitle, setStatusSubtitle] = useState<string>('');
  const [realtimeGuidance, setRealtimeGuidance] = useState<string>('');
  const [guidanceType, setGuidanceType] = useState<'ok' | 'warning' | 'error'>('ok');

  const [similarityScore, setSimilarityScore] = useState<number | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraPermissionState, setCameraPermissionState] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [cameraError, setCameraError] = useState<string>('');

  // Attempt Counter (Max 5 attempts)
  const [attemptCount, setAttemptCount] = useState<number>(0);
  const MAX_ATTEMPTS = 5;
  const [isLockedOut, setIsLockedOut] = useState<boolean>(false);

  // Live Banking Frame Telemetry
  const [faceCount, setFaceCount] = useState<number>(0);
  const [isLightingGood, setIsLightingGood] = useState<boolean>(true);
  const [luminanceVal, setLuminanceVal] = useState<number>(128);
  const [faceCoverageVal, setFaceCoverageVal] = useState<number>(0);
  const [isFaceInFrame, setIsFaceInFrame] = useState<boolean>(false);
  const [isLivenessConfirmed, setIsLivenessConfirmed] = useState<boolean>(false);

  // High-Tech Animation Gauge (0 - 100%)
  const [gaugeProgress, setGaugeProgress] = useState<number>(15);
  const [currentUserData, setCurrentUserData] = useState<AppUser>(selectedUser);

  // 3-Second Face Detection Timer & Auto-Fallback to Password/PIN
  const [scanSecondsRemaining, setScanSecondsRemaining] = useState<number>(3);
  const scanTimerRef = useRef<any>(null);
  const redirectTimeoutRef = useRef<any>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameAnalysisLoopRef = useRef<any>(null);
  const isVerifyingLockRef = useRef<boolean>(false);
  const hasPlayedLockSoundRef = useRef<boolean>(false);

  useEffect(() => {
    setCurrentUserData(selectedUser);
  }, [selectedUser]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialMode);
      setStageStatus('idle');
      setBankStep(1);
      setGaugeProgress(20);
      setStatusTitle(initialMode === 'face' ? 'Mendeteksi wajah...' : 'Tempelkan Sidik Jari');
      setStatusSubtitle(initialMode === 'face' ? 'Posisikan wajah Anda (Batas waktu: 3 detik)' : 'Gunakan sensor sidik jari HP');
      setRealtimeGuidance('');
      setSimilarityScore(null);
      setCameraError('');
      setAttemptCount(0);
      setIsLockedOut(false);
      resetLivenessState();
      isVerifyingLockRef.current = false;
      hasPlayedLockSoundRef.current = false;
      setScanSecondsRemaining(3);

      if (initialMode === 'face') {
        startCamera();
      } else {
        stopCamera();
        const t = setTimeout(() => handleStartFingerprint(), 400);
        return () => clearTimeout(t);
      }
    } else {
      stopCamera();
    }
  }, [isOpen, initialMode, selectedUser.id]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (scanTimerRef.current) {
      clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
      redirectTimeoutRef.current = null;
    }
    if (frameAnalysisLoopRef.current) {
      clearInterval(frameAnalysisLoopRef.current);
      frameAnalysisLoopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    resetLivenessState();
    isVerifyingLockRef.current = false;
    hasPlayedLockSoundRef.current = false;
  };

  const startCamera = async () => {
    setCameraError('');
    setCameraPermissionState('prompt');

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Kamera tidak didukung di peramban ini.');
        setCameraPermissionState('denied');
        return;
      }

      // Request camera with selfie orientation
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
        audio: false,
      });

      streamRef.current = stream;
      setCameraPermissionState('granted');
      setIsCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      // Begin real-time live detection loop
      startLiveAnalysisLoop();
    } catch (err: any) {
      console.warn('Camera access error during face auth:', err);
      setCameraPermissionState('denied');
      setIsCameraActive(false);
      setCameraError('Izin kamera belum aktif. Berikan izin kamera agar perangkat dapat mendeteksi wajah Anda.');
      setRealtimeGuidance('Izin kamera dibutuhkan untuk Face ID');
      setGuidanceType('error');
    }
  };

  // Real-time continuous analysis loop with strict 3-second limit
  const startLiveAnalysisLoop = () => {
    if (frameAnalysisLoopRef.current) clearInterval(frameAnalysisLoopRef.current);
    if (scanTimerRef.current) clearInterval(scanTimerRef.current);
    if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);

    setStageStatus('detecting');
    setStatusTitle('Mendeteksi wajah...');
    setStatusSubtitle('Posisikan wajah Anda (Batas waktu: 3 detik)');
    setBankStep(1);
    setScanSecondsRemaining(3);

    let secLeft = 3;
    scanTimerRef.current = setInterval(() => {
      secLeft -= 1;
      if (secLeft >= 0) {
        setScanSecondsRemaining(secLeft);
      }
      if (secLeft <= 0) {
        if (scanTimerRef.current) {
          clearInterval(scanTimerRef.current);
          scanTimerRef.current = null;
        }
        // If not already in verification lock or finished, timeout and redirect to PIN/Password
        if (!isVerifyingLockRef.current) {
          handleScanTimeout();
        }
      }
    }, 1000);

    frameAnalysisLoopRef.current = setInterval(() => {
      if (!videoRef.current || !canvasRef.current || isVerifyingLockRef.current) {
        return;
      }

      const video = videoRef.current;
      if (video.readyState < 2) return;

      const analysis: LiveFrameAnalysisResult = analyzeLiveFaceFrame(video, canvasRef.current);

      setFaceCount(analysis.faceCount);
      setIsLightingGood(analysis.isLightingAdequate);
      setLuminanceVal(analysis.avgLuminance);
      setFaceCoverageVal(analysis.faceCoverage);
      setIsFaceInFrame(analysis.valid);
      setIsLivenessConfirmed(analysis.isLivenessConfirmed);

      // Handle real-time error prevention states:
      if (analysis.statusType === 'low_light') {
        setBankStep(1);
        setGaugeProgress(25);
        setRealtimeGuidance(analysis.message); // "Pencahayaan kurang. Silakan cari tempat yang lebih terang."
        setGuidanceType('warning');
        return;
      }

      if (analysis.statusType === 'multiple_faces') {
        setBankStep(1);
        setGaugeProgress(20);
        setRealtimeGuidance(analysis.message); // "Terdeteksi lebih dari satu wajah. Pastikan hanya Anda yang berada di depan kamera."
        setGuidanceType('error');
        return;
      }

      if (analysis.statusType === 'no_face') {
        setBankStep(1);
        setGaugeProgress(15);
        setRealtimeGuidance(analysis.message); // "Wajah tidak terdeteksi. Silakan arahkan wajah ke kamera."
        setGuidanceType('warning');
        return;
      }

      if (analysis.statusType === 'too_far') {
        setBankStep(1);
        setGaugeProgress(35);
        setRealtimeGuidance(analysis.message); // "Dekatkan wajah ke kamera."
        setGuidanceType('warning');
        return;
      }

      if (analysis.statusType === 'liveness_warning') {
        setBankStep(2);
        setGaugeProgress(60);
        setRealtimeGuidance('Deteksi keaslian wajah... Berkedip secara natural');
        setGuidanceType('ok');
        return;
      }

      // If face is aligned, single face present, lighting is good
      if (analysis.valid && analysis.faceCount === 1 && analysis.isLightingAdequate) {
        setBankStep(2);
        setGaugeProgress(75);
        setRealtimeGuidance('Posisi wajah sesuai');
        setGuidanceType('ok');

        if (!hasPlayedLockSoundRef.current) {
          hasPlayedLockSoundRef.current = true;
          playBiometricLockSound();
        }

        // Automatically trigger verification once frame is stable and liveness confirmed
        if (analysis.isLivenessConfirmed && !isVerifyingLockRef.current) {
          triggerFaceVerification(analysis.croppedFaceSnapshot);
        }
      }
    }, 150);
  };

  const handleScanTimeout = () => {
    stopCamera();
    playBiometricErrorSound();
    setStageStatus('failed');
    setGaugeProgress(0);
    setStatusTitle('Waktu Deteksi Selesai');
    setStatusSubtitle('Batas waktu pemindaian 3 detik habis. Wajah tidak sesuai.');
    setRealtimeGuidance('Mengalihkan ke login Kata Sandi / PIN...');
    setGuidanceType('error');

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([150, 100, 150]);
      } catch (e) {}
    }

    if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
    redirectTimeoutRef.current = setTimeout(() => {
      handleManualFallback();
    }, 1200);
  };

  const triggerFaceVerification = async (snapshotDataUrl?: string) => {
    if (isVerifyingLockRef.current || isLockedOut) return;
    isVerifyingLockRef.current = true;

    // Clear 3-second countdown while processing verification
    if (scanTimerRef.current) {
      clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }

    setStageStatus('verifying');
    setBankStep(3);
    setGaugeProgress(92);
    setStatusTitle('Memverifikasi wajah...');
    setStatusSubtitle('Mencocokkan geometri wajah dengan data terdaftar...');
    playBiometricScanTick();

    // Small delay for authentic banking verification feel
    await new Promise((r) => setTimeout(r, 600));

    try {
      const faceResult = await verifyFaceBiometric(selectedUser, snapshotDataUrl);
      setSimilarityScore(faceResult.similarity);

      // Ambang Verifikasi Finansial: 90% atau lebih
      if (faceResult.success && faceResult.similarity >= 90) {
        // Success
        setStageStatus('success');
        setGaugeProgress(100);
        setStatusTitle('Verifikasi berhasil');
        setStatusSubtitle('Verifikasi wajah berhasil. Selamat datang.');
        setRealtimeGuidance('Verifikasi wajah berhasil. Selamat datang.');
        setGuidanceType('ok');

        playBiometricSuccessSound();

        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try {
            navigator.vibrate([40, 60, 40]);
          } catch (e) {}
        }

        const loginResult = loginWithBiometric(selectedUser.username, 'face');
        if (loginResult.success && loginResult.user) {
          setTimeout(() => {
            stopCamera();
            onLoginSuccess(loginResult.user!);
            onClose();
          }, 1100);
        }
      } else {
        // Verification Failed (< 90%)
        playBiometricErrorSound();
        handleVerificationFailure('Wajah belum sesuai. Silakan coba lagi.');
      }
    } catch (err: any) {
      playBiometricErrorSound();
      handleVerificationFailure(err?.message || 'Wajah belum sesuai. Silakan coba lagi.');
    }
  };

  const handleVerificationFailure = (msg: string) => {
    const nextAttempts = attemptCount + 1;
    setAttemptCount(nextAttempts);
    stopCamera();
    playBiometricErrorSound();

    setStageStatus('failed');
    setGaugeProgress(0);
    setStatusTitle('Verifikasi Wajah Gagal');
    setStatusSubtitle(msg || 'Wajah belum sesuai.');
    setRealtimeGuidance('Mengalihkan ke login Kata Sandi / PIN...');
    setGuidanceType('error');

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([150, 100, 150]);
      } catch (e) {}
    }

    // Auto-redirect to Password/PIN after 1.2 seconds
    if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
    redirectTimeoutRef.current = setTimeout(() => {
      handleManualFallback();
    }, 1200);
  };

  const handleStartFingerprint = async () => {
    if (selectedUser.fingerprintEnabled === false) {
      setStageStatus('failed');
      setStatusTitle('Verifikasi gagal');
      setStatusSubtitle('User Tidak Terdaftar / Sidik Jari Dinonaktifkan');
      return;
    }

    setStageStatus('verifying');
    setStatusTitle('Memverifikasi sidik jari...');
    setStatusSubtitle('Tempelkan sidik jari pada sensor HP...');

    try {
      const authResult = await authenticateDeviceFingerprint(selectedUser);
      if (authResult.success) {
        setStageStatus('success');
        setStatusTitle('Verifikasi berhasil');
        setStatusSubtitle('Sidik jari cocok. Selamat datang.');
        playBiometricSuccessSound();

        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try {
            navigator.vibrate([40, 60, 40]);
          } catch (e) {}
        }

        const loginResult = loginWithBiometric(selectedUser.username, 'fingerprint');
        if (loginResult.success && loginResult.user) {
          setTimeout(() => {
            onLoginSuccess(loginResult.user!);
            onClose();
          }, 900);
        }
      } else {
        const nextAttempts = attemptCount + 1;
        setAttemptCount(nextAttempts);
        setStageStatus('failed');
        setStatusTitle('Verifikasi gagal');
        setStatusSubtitle('Sidik jari tidak sesuai. Silakan coba lagi.');
        playBiometricErrorSound();

        if (nextAttempts >= MAX_ATTEMPTS) {
          setIsLockedOut(true);
          setStatusTitle('Batas Percobaan Tercapai');
          setStatusSubtitle('Batas 5 kali percobaan tercapai. Silakan gunakan kata sandi atau PIN cadangan.');
        }
      }
    } catch (err: any) {
      setStageStatus('failed');
      setStatusTitle('Verifikasi gagal');
      setStatusSubtitle(err?.message || 'Gagal memverifikasi sidik jari.');
      playBiometricErrorSound();
    }
  };

  const handleTabChange = (mode: 'fingerprint' | 'face') => {
    setActiveTab(mode);
    setStageStatus('idle');
    setSimilarityScore(null);
    setRealtimeGuidance('');
    if (mode === 'face') {
      startCamera();
    } else {
      stopCamera();
      handleStartFingerprint();
    }
  };

  const handleManualFallback = () => {
    stopCamera();
    onClose();
    if (onSwitchToPassword) {
      onSwitchToPassword();
    }
  };

  if (!isOpen) return null;

  // Calculate dynamic colors based on status
  const themeColor =
    stageStatus === 'success'
      ? '#10b981' // emerald-500
      : stageStatus === 'failed'
      ? '#f43f5e' // rose-500
      : stageStatus === 'verifying'
      ? '#06b6d4' // cyan-500
      : isFaceInFrame && isLightingGood && faceCount === 1
      ? '#14b8a6' // teal-500
      : '#64748b'; // slate-500

  // Lighting Lux Percentage for Banking Telemetry
  const luxPercentage = Math.min(100, Math.max(10, Math.round((luminanceVal / 200) * 100)));

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/92 backdrop-blur-lg flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900/95 border border-slate-700/80 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative text-white">
        {/* Hidden Canvas for Live Video Processing */}
        <canvas ref={canvasRef} className="hidden" />

        {/* High-Tech Banking Cyber Ambient Glows */}
        <div className="absolute -top-28 -left-28 w-60 h-60 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-28 -right-28 w-60 h-60 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Banking Grade Security Header */}
        <div className="p-4 pb-2.5 flex items-center justify-between border-b border-slate-800/90 relative z-10 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-400/30 text-teal-300 flex items-center justify-center shadow-inner">
              {activeTab === 'face' ? (
                <ScanFace className="w-4 h-4 animate-pulse" />
              ) : (
                <Fingerprint className="w-4 h-4 animate-pulse" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-black tracking-tight text-slate-100">
                  {activeTab === 'face' ? 'Otentikasi Wajah (Face ID)' : 'Otentikasi Sidik Jari'}
                </h3>
                <span className="text-[8px] px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 font-extrabold uppercase border border-teal-500/40 tracking-wider">
                  Bank-Grade
                </span>
              </div>
              <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Enkripsi 256-Bit • Ambang Min 90%</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer border border-slate-700/60"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Account Info Ribbon */}
        <div className="px-4 pt-3 pb-1 relative z-10">
          <div className="p-2 rounded-2xl bg-slate-800/70 border border-slate-700/70 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full overflow-hidden border border-teal-400/60 bg-slate-950 shrink-0 shadow-md">
                <img
                  src={getUserPhotoUrl(selectedUser, selectedUser.nama)}
                  alt={selectedUser.nama}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.nama)}&background=047857&color=ffffff&bold=true`;
                  }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-100 truncate">{selectedUser.nama}</p>
                <p className="text-[10px] text-teal-300/90 font-medium truncate">
                  {selectedUser.roleLabel} • @{selectedUser.username}
                </p>
              </div>
            </div>

            {/* Attempt Badge */}
            <div className="text-right shrink-0">
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                attemptCount >= 4
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-slate-700/60 text-slate-300 border-slate-600'
              }`}>
                {attemptCount > 0 ? `Coba: ${attemptCount}/${MAX_ATTEMPTS}` : 'Maks 5x'}
              </span>
            </div>
          </div>
        </div>

        {/* Banking 3-Step Verification Breadcrumb Tracker */}
        {activeTab === 'face' && !isLockedOut && (
          <div className="px-4 pt-2 relative z-10">
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800 text-[9px] font-bold">
              <div className={`flex items-center justify-center gap-1 py-1 rounded-lg transition-all ${
                bankStep >= 1 ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'text-slate-500'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${bankStep >= 1 ? 'bg-teal-400 animate-pulse' : 'bg-slate-600'}`} />
                <span>1. Geometri</span>
              </div>
              <div className={`flex items-center justify-center gap-1 py-1 rounded-lg transition-all ${
                bankStep >= 2 ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'text-slate-500'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${bankStep >= 2 ? 'bg-teal-400 animate-pulse' : 'bg-slate-600'}`} />
                <span>2. Liveness</span>
              </div>
              <div className={`flex items-center justify-center gap-1 py-1 rounded-lg transition-all ${
                bankStep >= 3 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-500'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${bankStep >= 3 ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'}`} />
                <span>3. Enkripsi 90%</span>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="p-4 pt-2 text-center space-y-3 relative z-10">
          {isLockedOut ? (
            /* Locked Out Fallback View (After 5 failures) */
            <div className="py-4 px-2 space-y-4 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-rose-500/20 border-2 border-rose-500 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-950/50">
                <ShieldAlert className="w-9 h-9" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm font-black text-rose-300">Batas Percobaan Tercapai</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Batas 5 kali percobaan verifikasi wajah tercapai. Akun tetap terlindungi dan aman.
                </p>
                <p className="text-[11px] text-amber-300/90 font-medium">
                  Silakan masuk menggunakan kata sandi atau PIN cadangan akun Anda.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleManualFallback}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 active:scale-98 transition-all cursor-pointer"
                >
                  <KeyRound className="w-4 h-4 text-amber-300" />
                  <span>Masuk dengan Kata Sandi / PIN</span>
                </button>
              </div>
            </div>
          ) : activeTab === 'face' ? (
            /* Banking-Grade Oval Face ID Camera Interface */
            <div className="flex flex-col items-center justify-center space-y-2.5">
              {/* Outer High-Tech Banking HUD Container */}
              <div className="relative flex items-center justify-center my-1">
                {/* Rotating Cyber Ring Ticks around viewport */}
                <div
                  className="absolute -inset-2.5 pointer-events-none rounded-[50%/44%] border border-dashed border-teal-500/25 animate-[spin_30s_linear_infinite]"
                  style={{
                    boxShadow: `0 0 25px ${themeColor}20`
                  }}
                />

                {/* Oval Camera Viewport */}
                <div
                  className="relative w-48 h-60 sm:w-52 sm:h-64 rounded-[50%/42%] overflow-hidden bg-slate-950 shadow-2xl flex items-center justify-center transition-all duration-300 border-2"
                  style={{
                    borderColor: themeColor,
                    boxShadow: `0 0 20px ${themeColor}40, inset 0 0 15px rgba(0,0,0,0.8)`
                  }}
                >
                  {/* Live Video Feed */}
                  {isCameraActive ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 p-4 space-y-2">
                      <ScanFace className="w-12 h-12 text-teal-400/80 animate-pulse" />
                      {cameraPermissionState === 'denied' ? (
                        <p className="text-[10px] text-rose-300 font-bold px-2 text-center">
                          Izin kamera belum aktif. Berikan izin di browser Anda.
                        </p>
                      ) : (
                        <p className="text-[10px] text-slate-400 font-medium">
                          Meminta izin kamera...
                        </p>
                      )}
                    </div>
                  )}

                  {/* 4 Precision HUD Corner Reticle Brackets (Banking Style) */}
                  <div className="absolute inset-3 pointer-events-none flex flex-col justify-between p-1">
                    <div className="flex justify-between">
                      {/* Top Left Bracket */}
                      <div
                        className="w-4 h-4 border-t-2 border-l-2 transition-colors duration-300"
                        style={{ borderColor: themeColor }}
                      />
                      {/* Top Right Bracket */}
                      <div
                        className="w-4 h-4 border-t-2 border-r-2 transition-colors duration-300"
                        style={{ borderColor: themeColor }}
                      />
                    </div>
                    <div className="flex justify-between">
                      {/* Bottom Left Bracket */}
                      <div
                        className="w-4 h-4 border-b-2 border-l-2 transition-colors duration-300"
                        style={{ borderColor: themeColor }}
                      />
                      {/* Bottom Right Bracket */}
                      <div
                        className="w-4 h-4 border-b-2 border-r-2 transition-colors duration-300"
                        style={{ borderColor: themeColor }}
                      />
                    </div>
                  </div>

                  {/* 3D Facial Landmark Matrix & Wireframe Overlay */}
                  {isCameraActive && stageStatus !== 'failed' && stageStatus !== 'success' && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="relative w-32 h-40">
                        {/* Eye Contour Tracking Boxes */}
                        <div className="absolute top-10 left-3 w-5 h-3 border border-teal-400/60 rounded-sm flex items-center justify-center">
                          <div className={`w-1.5 h-1.5 rounded-full ${isLivenessConfirmed ? 'bg-emerald-400 animate-ping' : 'bg-teal-300 animate-pulse'}`} />
                        </div>
                        <div className="absolute top-10 right-3 w-5 h-3 border border-teal-400/60 rounded-sm flex items-center justify-center">
                          <div className={`w-1.5 h-1.5 rounded-full ${isLivenessConfirmed ? 'bg-emerald-400 animate-ping' : 'bg-teal-300 animate-pulse'}`} />
                        </div>

                        {/* Nasal Bridge Reticle */}
                        <div className="absolute top-18 left-1/2 -translate-x-1/2 w-3 h-3 border border-dashed border-cyan-400/60 rounded-full flex items-center justify-center">
                          <div className="w-1 h-1 bg-cyan-300 rounded-full" />
                        </div>

                        {/* Cheeks Triangulation Dots */}
                        <div className="absolute top-22 left-2 w-1.5 h-1.5 rounded-full bg-teal-400/60 animate-ping" />
                        <div className="absolute top-22 right-2 w-1.5 h-1.5 rounded-full bg-teal-400/60 animate-ping" />

                        {/* Mouth / Smile Alignment Arc */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-10 h-3 border-b-2 border-dashed border-teal-400/60 rounded-[50%]" />

                        {/* Chin Anchor Marker */}
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-4 h-1 bg-teal-400/70 rounded-full" />
                      </div>
                    </div>
                  )}

                  {/* Dynamic Bank-Grade Scanning Laser (Sweeps Up & Down continuously across the entire face until face match) */}
                  {(stageStatus === 'detecting' || stageStatus === 'verifying' || (isCameraActive && stageStatus === 'idle')) && isCameraActive && (
                    <div className={`absolute inset-x-0 pointer-events-none z-20 ${stageStatus === 'verifying' ? 'animate-laser-sweep-fast' : 'animate-laser-sweep'}`}>
                      {/* Upper trailing laser glow */}
                      <div className="w-full h-8 bg-gradient-to-b from-transparent via-cyan-400/10 to-cyan-400/25" />
                      {/* High-intensity central laser beam */}
                      <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-300 via-teal-200 to-transparent shadow-[0_0_15px_#06b6d4,0_0_30px_#14b8a6]" />
                      {/* Lower trailing laser glow */}
                      <div className="w-full h-8 bg-gradient-to-t from-transparent via-cyan-400/10 to-cyan-400/25" />
                    </div>
                  )}

                  {/* Live Telemetry Heads-Up Data (Top & Bottom of Viewport) */}
                  {isCameraActive && (
                    <div className="absolute top-2 inset-x-0 flex justify-between px-4 text-[8px] font-mono text-teal-300/80 pointer-events-none drop-shadow">
                      <span className="flex items-center gap-0.5">
                        <Activity className="w-2.5 h-2.5 text-teal-400" />
                        <span>LUX: {luxPercentage}%</span>
                      </span>
                      {stageStatus === 'detecting' ? (
                        <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full font-bold border ${
                          scanSecondsRemaining <= 1
                            ? 'bg-rose-950/80 border-rose-500/70 text-rose-300 animate-pulse'
                            : 'bg-slate-950/80 border-cyan-400/50 text-cyan-300'
                        }`}>
                          <Clock className="w-2.5 h-2.5 text-cyan-300" />
                          <span>{scanSecondsRemaining}s</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5">
                          <Cpu className="w-2.5 h-2.5 text-cyan-400" />
                          <span>FACE: {faceCount}/1</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Verifying Banking State Overlay */}
                  {stageStatus === 'verifying' && (
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex flex-col items-center justify-center p-3 animate-in fade-in z-10">
                      <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mb-2" />
                      <span className="text-[11px] font-black text-cyan-200 uppercase tracking-wider">
                        Memverifikasi Wajah
                      </span>
                      <span className="text-[9px] text-cyan-300/90 mt-0.5 font-mono">
                        Mencocokkan ambang minimal 90%...
                      </span>
                    </div>
                  )}

                  {/* Success State Overlay */}
                  {stageStatus === 'success' && (
                    <div className="absolute inset-0 bg-emerald-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-3 animate-in zoom-in-95 z-30">
                      <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-1 animate-bounce" />
                      <span className="text-xs font-black text-emerald-200 uppercase tracking-wider">
                        Verifikasi Berhasil
                      </span>
                      {similarityScore !== null && (
                        <span className="text-[10px] text-emerald-300 font-bold mt-0.5 font-mono">
                          Kecocokan {similarityScore}% (Terkonfirmasi)
                        </span>
                      )}
                    </div>
                  )}

                  {/* Failed State Overlay */}
                  {stageStatus === 'failed' && (
                    <div className="absolute inset-0 bg-rose-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-3 animate-in zoom-in-95 z-30 text-center">
                      <ShieldAlert className="w-11 h-11 text-rose-400 mb-1 animate-pulse" />
                      <span className="text-xs font-black text-rose-200 uppercase tracking-wider">
                        Verifikasi Gagal
                      </span>
                      {similarityScore !== null && similarityScore > 0 ? (
                        <span className="text-[10px] text-rose-300 font-bold mt-0.5 font-mono">
                          Kecocokan: {similarityScore}% (&lt; 90%)
                        </span>
                      ) : (
                        <span className="text-[10px] text-rose-300 font-medium mt-0.5 text-center px-2">
                          {statusSubtitle || 'Batas 3 detik habis atau wajah tidak cocok'}
                        </span>
                      )}
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 border border-teal-500/40 text-[9px] text-teal-300 font-bold">
                        <Lock className="w-3 h-3 text-teal-300" />
                        <span>Mengalihkan ke PIN / Kata Sandi...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Real-time Status and Required Bank Messages */}
              <div className="space-y-1 w-full px-2">
                <div className="flex items-center justify-center gap-1.5">
                  {stageStatus === 'verifying' ? (
                    <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                  ) : stageStatus === 'success' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : stageStatus === 'failed' ? (
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  ) : (
                    <ScanFace className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
                  )}
                  <p className={`text-xs font-bold ${
                    stageStatus === 'success'
                      ? 'text-emerald-400'
                      : stageStatus === 'failed'
                      ? 'text-rose-400'
                      : 'text-slate-100'
                  }`}>
                    {statusTitle}
                  </p>
                </div>

                {statusSubtitle && (
                  <p className={`text-[11px] leading-tight ${
                    stageStatus === 'success'
                      ? 'text-emerald-300 font-medium'
                      : stageStatus === 'failed'
                      ? 'text-rose-300 font-medium'
                      : 'text-slate-400'
                  }`}>
                    {statusSubtitle}
                  </p>
                )}
              </div>

              {/* Dynamic Guidance Warning / Hint Pill */}
              {realtimeGuidance && stageStatus !== 'success' && (
                <div className={`p-2 rounded-xl text-[10px] font-semibold flex items-center justify-center gap-1.5 w-full transition-all ${
                  guidanceType === 'error'
                    ? 'bg-rose-950/80 border border-rose-500/50 text-rose-200 shadow-md shadow-rose-950/40'
                    : guidanceType === 'warning'
                    ? 'bg-amber-950/80 border border-amber-500/50 text-amber-200 shadow-md shadow-amber-950/40'
                    : 'bg-teal-950/80 border border-teal-500/40 text-teal-200'
                }`}>
                  {guidanceType === 'error' ? (
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  ) : guidanceType === 'warning' ? (
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  )}
                  <span className="text-center">{realtimeGuidance}</span>
                </div>
              )}

              {/* If Face verification failed: Remove repair button and show direct switch button to password/PIN */}
              {stageStatus === 'failed' && (
                <button
                  type="button"
                  onClick={handleManualFallback}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-98 border border-emerald-400/30"
                >
                  <Lock className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Masuk dengan Kata Sandi / PIN Sekarang</span>
                </button>
              )}

              {/* Camera Permission Button if Denied */}
              {cameraPermissionState === 'denied' && (
                <button
                  type="button"
                  onClick={startCamera}
                  className="w-full py-2 px-3 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Izinkan Akses Kamera</span>
                </button>
              )}
            </div>
          ) : (
            /* Fingerprint View */
            <div className="flex flex-col items-center justify-center py-3 space-y-3">
              <button
                type="button"
                onClick={handleStartFingerprint}
                disabled={stageStatus === 'verifying' || stageStatus === 'success'}
                className="w-24 h-24 rounded-full border-2 border-emerald-500/60 bg-slate-950 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl cursor-pointer"
              >
                <Fingerprint className={`w-12 h-12 ${
                  stageStatus === 'verifying'
                    ? 'text-emerald-300 animate-pulse'
                    : stageStatus === 'success'
                    ? 'text-emerald-400'
                    : 'text-emerald-500'
                }`} />
              </button>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-100">{statusTitle}</p>
                <p className="text-[10px] text-slate-400">{statusSubtitle}</p>
              </div>
            </div>
          )}

          {/* Toggle between Face ID & Fingerprint */}
          {!isLockedOut && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleTabChange('face')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                  activeTab === 'face'
                    ? 'bg-teal-600/30 border-teal-500/60 text-teal-200'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <ScanFace className="w-3 h-3" />
                <span>Mode Wajah (Face ID)</span>
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('fingerprint')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                  activeTab === 'fingerprint'
                    ? 'bg-emerald-600/30 border-emerald-500/60 text-emerald-200'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Fingerprint className="w-3 h-3" />
                <span>Sidik Jari HP</span>
              </button>
            </div>
          )}

          {/* Fallback to Password Button */}
          {!isLockedOut && (
            <div className="pt-0.5">
              <button
                type="button"
                onClick={handleManualFallback}
                className="w-full py-2 text-[11px] text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer border-t border-slate-800/80"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Gunakan Kata Sandi / PIN Cadangan</span>
              </button>
            </div>
          )}
        </div>

        {/* Banking Security Footer Notice */}
        <div className="p-2.5 bg-slate-950/95 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span>Taraf Keamanan Perbankan ISO 30107-3</span>
          </span>
          <span className="text-slate-500 font-mono text-[9px]">RW018-SECURE-90%</span>
        </div>
      </div>
    </div>
  );
};

export default BiometricAuthModal;
