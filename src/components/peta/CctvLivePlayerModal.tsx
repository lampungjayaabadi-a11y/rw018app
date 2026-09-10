import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Camera,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RefreshCw,
  Eye,
  EyeOff,
  Move,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Radio,
  Download,
  Sliders,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  MapPin,
  Film,
  Calendar,
  Clock,
  Tag,
  Gauge,
  FastForward
} from 'lucide-react';
import { PetaPointOfInterest, CctvRecordingClip, getStoredCuplikan } from '../../data/petaData';

interface CctvLivePlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  cctvList?: PetaPointOfInterest[];
  allCctvList?: PetaPointOfInterest[];
  selectedCctv: PetaPointOfInterest | null;
  onSelectCctv: (cctv: PetaPointOfInterest) => void;
  initialMode?: 'live' | 'cuplikan';
  initialClipCategory?: 'ALL' | 'jalan_kampung' | 'perempatan' | 'gang' | 'pos_kamling' | 'depan_sd_fasum';
}

export const CctvLivePlayerModal: React.FC<CctvLivePlayerModalProps> = ({
  isOpen,
  onClose,
  cctvList,
  allCctvList,
  selectedCctv,
  onSelectCctv,
  initialMode = 'live',
  initialClipCategory = 'ALL'
}) => {
  const activeList = allCctvList || cctvList || [];
  const [modalMode, setModalMode] = useState<'live' | 'cuplikan'>(initialMode);
  const [clipCategory, setClipCategory] = useState<string>(initialClipCategory);
  const [clips, setClips] = useState<CctvRecordingClip[]>([]);
  const [selectedClip, setSelectedClip] = useState<CctvRecordingClip | null>(null);
  const [playbackRate, setPlaybackRate] = useState<number>(1);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [nightVision, setNightVision] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [snapshotAlert, setSnapshotAlert] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Load clips on mount/open
  useEffect(() => {
    if (isOpen) {
      const loaded = getStoredCuplikan();
      setClips(loaded);
      if (!selectedClip && loaded.length > 0) {
        setSelectedClip(loaded[0]);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    setModalMode(initialMode);
    if (initialClipCategory) {
      setClipCategory(initialClipCategory);
    }
  }, [initialMode, initialClipCategory]);

  // Live real-time clock updating every 200ms
  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 200);
    return () => clearInterval(timer);
  }, [isOpen]);

  // Reset zoom & pan when camera or clip changes
  useEffect(() => {
    setZoomLevel(1);
    setPanX(0);
    setPanY(0);
    setIsPlaying(true);
  }, [selectedCctv?.id, selectedClip?.id, modalMode]);

  // Sync playback rate to video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate, selectedClip, selectedCctv, modalMode]);

  if (!isOpen) return null;

  // Filtered clips
  const filteredClips = clips.filter(
    (c) => clipCategory === 'ALL' || c.kategori === clipCategory
  );

  const currentIndex = selectedCctv ? activeList.findIndex((c) => c.id === selectedCctv.id) : 0;

  const handlePrevCamera = () => {
    if (modalMode === 'live') {
      if (activeList.length === 0) return;
      const prevIdx = (currentIndex - 1 + activeList.length) % activeList.length;
      onSelectCctv(activeList[prevIdx]);
    } else {
      if (filteredClips.length === 0 || !selectedClip) return;
      const currentClipIdx = filteredClips.findIndex((c) => c.id === selectedClip.id);
      const prevClipIdx = (currentClipIdx - 1 + filteredClips.length) % filteredClips.length;
      setSelectedClip(filteredClips[prevClipIdx]);
    }
  };

  const handleNextCamera = () => {
    if (modalMode === 'live') {
      if (activeList.length === 0) return;
      const nextIdx = (currentIndex + 1) % activeList.length;
      onSelectCctv(activeList[nextIdx]);
    } else {
      if (filteredClips.length === 0 || !selectedClip) return;
      const currentClipIdx = filteredClips.findIndex((c) => c.id === selectedClip.id);
      const nextClipIdx = (currentClipIdx + 1) % filteredClips.length;
      setSelectedClip(filteredClips[nextClipIdx]);
    }
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.3, 2.5));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.3, 1));
  };

  const handlePan = (dx: number, dy: number) => {
    setPanX((prev) => Math.max(-100, Math.min(100, prev + dx)));
    setPanY((prev) => Math.max(-100, Math.min(100, prev + dy)));
  };

  const handleResetPtz = () => {
    setZoomLevel(1);
    setPanX(0);
    setPanY(0);
  };

  const handleTakeSnapshot = () => {
    const title = modalMode === 'live' ? (selectedCctv?.cctvIpOrId || 'CAM') : (selectedClip?.judul || 'Cuplikan');
    setSnapshotAlert(`Foto Rekaman "${title}" berhasil disimpan!`);
    setTimeout(() => setSnapshotAlert(null), 3000);
  };

  const handleCycleSpeed = () => {
    const speeds = [0.5, 1, 1.5, 2, 4];
    const nextSpeed = speeds[(speeds.indexOf(playbackRate) + 1) % speeds.length];
    setPlaybackRate(nextSpeed);
  };

  const formattedDate = currentTime.toLocaleDateString('id-ID', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const formattedTime = currentTime.toTimeString().split(' ')[0] + '.' + String(currentTime.getMilliseconds()).padStart(3, '0').slice(0, 2);

  // Active current video URL & metadata
  const currentVideoSrc = modalMode === 'live'
    ? (selectedCctv?.videoUrl || 'https://assets.mixkit.co/videos/preview/mixkit-quiet-street-in-a-residential-neighborhood-43187-large.mp4')
    : (selectedClip?.videoUrl || 'https://assets.mixkit.co/videos/preview/mixkit-quiet-street-in-a-residential-neighborhood-43187-large.mp4');

  const currentPoster = modalMode === 'live'
    ? selectedCctv?.videoThumbnail
    : selectedClip?.thumbnail;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-950 text-white rounded-3xl w-full max-w-5xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col max-h-[96vh]">
        {/* Top Header Bar with Mode Toggle */}
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
              modalMode === 'live' ? 'bg-cyan-950 text-cyan-400 border-cyan-700/60' : 'bg-amber-950 text-amber-400 border-amber-700/60'
            }`}>
              {modalMode === 'live' ? (
                <Radio className="w-4 h-4 animate-pulse" />
              ) : (
                <Film className="w-4 h-4" />
              )}
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2 flex-wrap">
                {modalMode === 'live' ? (
                  <>
                    <span className="font-mono text-xs font-black text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/80">
                      {selectedCctv?.cctvIpOrId || 'CAM-00'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {selectedCctv?.rt === 'UMUM' ? 'Wilayah RW 018' : `Wilayah RT ${selectedCctv?.rt}`}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      LIVE STREAM 24/7
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-mono text-xs font-black text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/80">
                      ARSIP REKAMAN
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-amber-300">
                      {selectedClip?.kategoriLabel || 'Cuplikan'}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      {selectedClip?.durasi} ({selectedClip?.ukuranFile})
                    </span>
                  </>
                )}
              </div>
              <h3 className="text-sm sm:text-base font-black text-white truncate mt-0.5">
                {modalMode === 'live' ? selectedCctv?.nama : selectedClip?.judul}
              </h3>
            </div>
          </div>

          {/* Mode Switch Tabs & Close Button */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
              <button
                onClick={() => setModalMode('live')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  modalMode === 'live'
                    ? 'bg-cyan-700 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                <span>Live Stream</span>
              </button>
              <button
                onClick={() => setModalMode('cuplikan')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  modalMode === 'cuplikan'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Film className="w-3 h-3 text-amber-300" />
                <span>Cuplikan Rekaman</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Tutup Monitor"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Canvas & Live/Playback Player */}
        <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center min-h-[300px] sm:min-h-[420px] select-none">
          {/* Main HTML5 Video Element */}
          <div
            className="w-full h-full flex items-center justify-center transition-all duration-200 overflow-hidden"
            style={{
              transform: `scale(${zoomLevel}) translate(${panX}px, ${panY}px)`,
              filter: nightVision ? 'grayscale(100%) contrast(140%) brightness(120%)' : 'none'
            }}
          >
            <video
              ref={videoRef}
              key={modalMode === 'live' ? selectedCctv?.id : selectedClip?.id}
              src={currentVideoSrc}
              poster={currentPoster}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              className="w-full h-full object-cover max-h-[70vh]"
            />
          </div>

          {/* OSD (On-Screen Display) Overlay - CCTV Professional Look */}
          <div className="absolute inset-0 pointer-events-none p-3 sm:p-5 flex flex-col justify-between text-shadow">
            {/* Top OSD info */}
            <div className="flex items-start justify-between">
              <div className="bg-black/70 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-white/20 font-mono text-[11px] sm:text-xs text-white space-y-0.5">
                <div className="flex items-center gap-2 font-bold">
                  {modalMode === 'live' ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                      <span className="text-rose-400 font-black">● REC [LIVE FEED]</span>
                      <span className="text-slate-400">|</span>
                      <span className="text-cyan-300">{selectedCctv?.cctvIpOrId || 'CAM-01'}</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span className="text-amber-400 font-black">▶ PLAYBACK REKAMAN</span>
                      <span className="text-slate-400">|</span>
                      <span className="text-cyan-300">{selectedClip?.tagKejadian}</span>
                    </>
                  )}
                </div>
                <div className="text-slate-200">
                  {modalMode === 'live' ? selectedCctv?.nama : selectedClip?.cctvName}
                </div>
                <div className="text-[10px] text-cyan-300 flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                  <span>{modalMode === 'live' ? selectedCctv?.alamat : selectedClip?.lokasi}</span>
                </div>
              </div>

              <div className="bg-black/70 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-white/20 font-mono text-right text-[11px] sm:text-xs text-amber-300">
                <div className="font-bold">
                  {modalMode === 'live' ? formattedDate : selectedClip?.waktuRekam}
                </div>
                <div className="text-white font-extrabold text-sm tracking-wider">
                  {modalMode === 'live' ? `${formattedTime} WIB` : `Speed: ${playbackRate}x`}
                </div>
                <div className="text-[10px] text-slate-300">
                  {modalMode === 'live'
                    ? `${selectedCctv?.resolution || '1080p'} • ${selectedCctv?.fps || 25} FPS`
                    : `${selectedClip?.resolusi || '1080p FHD'} • ${selectedClip?.durasi}`}
                </div>
              </div>
            </div>

            {/* Middle Crosshair / Grid Overlay */}
            <div className="w-full flex items-center justify-center opacity-30">
              <div className="w-16 h-16 border border-dashed border-cyan-400/80 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-cyan-400/80 rounded-full" />
              </div>
            </div>

            {/* Bottom OSD metadata & Alert */}
            <div className="flex items-end justify-between">
              <div className="bg-black/70 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-white/20 font-mono text-[10px] sm:text-[11px] text-slate-300">
                <span>BITRATE: {selectedCctv?.bitrate || '2048 Kbps'}</span>
                <span className="mx-2">|</span>
                <span>NIGHTVISION: {nightVision ? 'ON (B&W)' : 'OFF (COLOR)'}</span>
                <span className="mx-2">|</span>
                <span>ZOOM: {zoomLevel.toFixed(1)}x</span>
                {modalMode === 'cuplikan' && (
                  <>
                    <span className="mx-2">|</span>
                    <span className="text-amber-400">STATUS: REKAMAN BERSIH</span>
                  </>
                )}
              </div>

              {snapshotAlert && (
                <div className="bg-emerald-600 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-lg border border-emerald-400 animate-bounce">
                  📸 {snapshotAlert}
                </div>
              )}
            </div>
          </div>

          {/* Quick Prev / Next Overlay Buttons */}
          <button
            onClick={handlePrevCamera}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95"
            title={modalMode === 'live' ? 'Kamera Sebelumnya' : 'Cuplikan Sebelumnya'}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={handleNextCamera}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95"
            title={modalMode === 'live' ? 'Kamera Selanjutnya' : 'Cuplikan Selanjutnya'}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Live / Playback Controls Toolbar & PTZ */}
        <div className="bg-slate-900 border-t border-slate-800 p-3 sm:p-4 space-y-3 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Playback Controls */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => {
                  if (videoRef.current) {
                    if (isPlaying) {
                      videoRef.current.pause();
                      setIsPlaying(false);
                    } else {
                      videoRef.current.play();
                      setIsPlaying(true);
                    }
                  }
                }}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isPlaying
                    ? 'bg-amber-600/80 hover:bg-amber-600 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'Pause' : modalMode === 'live' ? 'Play Live' : 'Play Rekaman'}</span>
              </button>

              {modalMode === 'cuplikan' && (
                <button
                  onClick={handleCycleSpeed}
                  className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer border border-amber-500/30"
                  title="Ubah Kecepatan Playback (0.5x - 4x)"
                >
                  <Gauge className="w-3.5 h-3.5 text-amber-400" />
                  <span>{playbackRate}x Speed</span>
                </button>
              )}

              <button
                onClick={() => setIsMuted(!isMuted)}
                className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
                <span>{isMuted ? 'Muted' : 'Audio On'}</span>
              </button>

              <button
                onClick={() => setNightVision(!nightVision)}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  nightVision ? 'bg-cyan-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Night Vision</span>
              </button>
            </div>

            {/* Virtual PTZ & Zoom Controls */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center bg-slate-800 p-1 rounded-xl gap-1">
                <button
                  onClick={handleZoomIn}
                  className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg cursor-pointer transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={handleZoomOut}
                  className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg cursor-pointer transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={handleResetPtz}
                  className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg cursor-pointer transition-colors"
                  title="Reset PTZ"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* PTZ Directional Pad */}
              <div className="hidden sm:flex items-center bg-slate-800 px-2 py-1 rounded-xl gap-1 text-[10px] font-bold text-slate-300">
                <button onClick={() => handlePan(-20, 0)} className="px-1.5 py-0.5 hover:bg-slate-700 rounded cursor-pointer">◀</button>
                <button onClick={() => handlePan(0, -20)} className="px-1.5 py-0.5 hover:bg-slate-700 rounded cursor-pointer">▲</button>
                <button onClick={() => handlePan(0, 20)} className="px-1.5 py-0.5 hover:bg-slate-700 rounded cursor-pointer">▼</button>
                <button onClick={() => handlePan(20, 0)} className="px-1.5 py-0.5 hover:bg-slate-700 rounded cursor-pointer">▶</button>
                <span className="text-[9px] text-slate-400 ml-1">PTZ</span>
              </div>

              <button
                onClick={handleTakeSnapshot}
                className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Ambil Rekaman Foto Live / Klip"
              >
                <Camera className="w-3.5 h-3.5 text-cyan-400" />
                <span>Foto Rekaman</span>
              </button>
            </div>
          </div>

          {/* Sub-Selection: Live Cameras (Mode Live) OR Cuplikan Rekaman Clips (Mode Cuplikan) */}
          {modalMode === 'live' ? (
            <div>
              <div className="text-[11px] font-bold text-slate-400 mb-1.5 flex items-center justify-between">
                <span>Pilih Cepat Kamera (16 Titik RW 018):</span>
                <span className="text-cyan-400 font-mono text-[10px]">
                  Kamera {currentIndex + 1} dari {activeList.length}
                </span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {activeList.map((cctv, idx) => {
                  const isSelected = selectedCctv && cctv.id === selectedCctv.id;
                  return (
                    <button
                      key={cctv.id}
                      onClick={() => onSelectCctv(cctv)}
                      className={`flex-shrink-0 p-1.5 rounded-xl border text-left transition-all cursor-pointer min-w-[130px] ${
                        isSelected
                          ? 'bg-cyan-950 border-cyan-500 shadow-md ring-1 ring-cyan-500'
                          : 'bg-slate-800/80 border-slate-700 hover:bg-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[9px] font-bold text-cyan-400 truncate">
                          {cctv.cctvIpOrId || `CAM-${idx + 1}`}
                        </span>
                        <span className="text-[8px] bg-slate-900 px-1 rounded text-slate-300">
                          RT {cctv.rt}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-200 truncate">
                        {cctv.nama.split('-')[1] || cctv.nama}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              {/* Category Filter Pills for Cuplikan Rekaman */}
              <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-amber-400" />
                  <span>Kategori Cuplikan Rekaman Pendek:</span>
                </div>
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                  {[
                    { id: 'ALL', label: 'Semua Arsip' },
                    { id: 'jalan_kampung', label: '🏡 Jalan Kampung' },
                    { id: 'perempatan', label: '🚦 Perempatan Jalan' },
                    { id: 'gang', label: '🚶 Gang Pemukiman' },
                    { id: 'pos_kamling', label: '👮 Gardu Pos Kamling' },
                    { id: 'depan_sd_fasum', label: '🏫 Depan SD & Fasum' }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setClipCategory(cat.id)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                        clipCategory === cat.id
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cuplikan Clips Grid / Playlist */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {filteredClips.map((clip) => {
                  const isSelected = selectedClip && clip.id === selectedClip.id;
                  return (
                    <button
                      key={clip.id}
                      onClick={() => setSelectedClip(clip)}
                      className={`flex-shrink-0 p-2 rounded-xl border text-left transition-all cursor-pointer min-w-[200px] max-w-[220px] ${
                        isSelected
                          ? 'bg-amber-950/80 border-amber-500 shadow-md ring-1 ring-amber-500'
                          : 'bg-slate-800/80 border-slate-700 hover:bg-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-black/50 text-amber-300">
                          {clip.kategoriLabel.split('/')[0]}
                        </span>
                        <span className="text-[9px] font-mono text-slate-300">
                          {clip.durasi}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-100 line-clamp-1">
                        {clip.judul}
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        📍 {clip.lokasi}
                      </p>
                      <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-700/60 text-[9px] text-slate-400">
                        <span>{clip.waktuRekam}</span>
                        <span className="text-cyan-300 font-mono font-bold">{clip.tagKejadian}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
