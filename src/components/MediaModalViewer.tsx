import React, { useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Film,
  Camera,
  Download,
  ExternalLink,
  Maximize2
} from 'lucide-react';
import { parseVideoUrl } from '../utils/mediaUtils';

interface VideoPlayerProps {
  videoUrl: string;
  posterUrl?: string;
  title?: string;
  autoPlay?: boolean;
  className?: string;
  onExpand?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  posterUrl,
  title,
  autoPlay = false,
  className = '',
  onExpand,
}) => {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const parsed = parseVideoUrl(videoUrl);

  if (!parsed) return null;

  if (parsed.type === 'youtube' || parsed.type === 'drive') {
    return (
      <div className={`relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-md border border-slate-800 ${className}`}>
        <iframe
          src={parsed.embedUrl}
          title={title || 'Video Liputan Kegiatan RW 018'}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
        {onExpand && (
          <button
            onClick={onExpand}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white transition-colors"
            title="Layar Penuh"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  // Direct video file (MP4 / WebM / Blob / Data URL)
  return (
    <div className={`relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-md border border-slate-800 group ${className}`}>
      <video
        controls
        playsInline
        autoPlay={autoPlay}
        poster={posterUrl || parsed.thumbnailUrl}
        src={parsed.directUrl}
        className="w-full h-full object-contain"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      >
        <source src={parsed.directUrl} type="video/mp4" />
        <source src={parsed.directUrl} type="video/webm" />
        Browser Anda tidak mendukung tag video HTML5.
      </video>

      {/* Floating Header Tag */}
      <div className="absolute top-2.5 left-2.5 pointer-events-none flex items-center gap-1.5 z-10">
        <span className="px-2 py-0.5 rounded-full bg-rose-600/90 text-white text-[10px] font-extrabold flex items-center gap-1 shadow-xs backdrop-blur-xs">
          <Film className="w-2.5 h-2.5" />
          <span>Liputan Kegiatan</span>
        </span>
        {title && (
          <span className="px-2 py-0.5 rounded-full bg-black/70 text-white text-[10px] font-medium max-w-[200px] truncate backdrop-blur-xs">
            {title}
          </span>
        )}
      </div>

      {onExpand && (
        <button
          onClick={onExpand}
          className="absolute top-2.5 right-2.5 p-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white transition-all z-10 opacity-80 hover:opacity-100 hover:scale-105"
          title="Buka Layar Penuh"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

interface PhotoLightboxProps {
  photos: Array<{ url: string; caption?: string }>;
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  activityTitle?: string;
}

export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({
  photos,
  currentIndex,
  onClose,
  onNavigate,
  activityTitle,
}) => {
  if (!photos || photos.length === 0) return null;
  const currentPhoto = photos[currentIndex] || photos[0];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextIdx = currentIndex > 0 ? currentIndex - 1 : photos.length - 1;
    onNavigate(nextIdx);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextIdx = currentIndex < photos.length - 1 ? currentIndex + 1 : 0;
    onNavigate(nextIdx);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-60 bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-3 sm:p-5 select-none animate-fade-in"
    >
      {/* Top Bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl flex items-center justify-between text-white z-20"
      >
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-white/10 text-white flex items-center gap-1 text-xs font-bold">
            <Camera className="w-3.5 h-3.5 text-indigo-300" />
            <span>Foto {currentIndex + 1} dari {photos.length}</span>
          </span>
          {activityTitle && (
            <span className="text-xs text-white/80 font-medium hidden sm:inline max-w-md truncate">
              {activityTitle}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <a
            href={currentPhoto.url}
            target="_blank"
            rel="noopener noreferrer"
            download={`dokumentasi_rw018_${currentIndex + 1}.jpg`}
            onClick={(e) => e.stopPropagation()}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors text-xs font-semibold flex items-center gap-1.5"
            title="Buka Gambar Asli / Download"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Simpan</span>
          </a>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
            title="Tutup Pratinjau (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl flex-1 flex items-center justify-center my-2 overflow-hidden"
      >
        {/* Prev Button */}
        {photos.length > 1 && (
          <button
            onClick={handlePrev}
            className="absolute left-2 sm:left-4 z-20 p-2.5 sm:p-3 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 shadow-lg hover:scale-110 active:scale-95 transition-all cursor-pointer"
            title="Foto Sebelumnya (Panah Kiri)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Image Display */}
        <div className="max-h-[78vh] max-w-full flex items-center justify-center">
          <img
            src={currentPhoto.url}
            alt={currentPhoto.caption || `Dokumentasi foto ${currentIndex + 1}`}
            referrerPolicy="no-referrer"
            className="max-h-[75vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/15 animate-fade-in"
          />
        </div>

        {/* Next Button */}
        {photos.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute right-2 sm:right-4 z-20 p-2.5 sm:p-3 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 shadow-lg hover:scale-110 active:scale-95 transition-all cursor-pointer"
            title="Foto Selanjutnya (Panah Kanan)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Bottom Caption & Thumbnail Strip */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl flex flex-col items-center gap-2 z-20"
      >
        {currentPhoto.caption && (
          <p className="text-white text-xs font-semibold bg-black/70 px-4 py-1.5 rounded-full border border-white/20 backdrop-blur-xs text-center max-w-xl">
            {currentPhoto.caption}
          </p>
        )}

        {/* Thumbnails row */}
        {photos.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-1 px-2 bg-black/40 rounded-2xl backdrop-blur-xs border border-white/10">
            {photos.map((p, idx) => (
              <button
                key={idx}
                onClick={() => onNavigate(idx)}
                className={`relative w-11 h-11 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                  idx === currentIndex
                    ? 'border-indigo-400 scale-105 shadow-md ring-2 ring-indigo-400/50'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={p.url}
                  alt={`Thumbnail ${idx + 1}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface VideoLightboxProps {
  videoUrl: string;
  title?: string;
  onClose: () => void;
}

export const VideoLightbox: React.FC<VideoLightboxProps> = ({
  videoUrl,
  title,
  onClose,
}) => {
  const parsed = parseVideoUrl(videoUrl);
  if (!parsed) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-60 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl flex flex-col items-center"
      >
        {/* Top bar */}
        <div className="w-full flex items-center justify-between text-white mb-2.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-xl bg-rose-600 text-white text-xs font-bold flex items-center gap-1 shadow-xs">
              <Film className="w-3.5 h-3.5" />
              <span>Video Liputan RW 018</span>
            </span>
            {title && (
              <span className="text-xs text-white/80 font-semibold truncate max-w-md">
                {title}
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
            title="Tutup Pemutar Video"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Frame */}
        <div className="w-full aspect-video rounded-3xl overflow-hidden bg-black shadow-2xl border border-white/20 relative">
          {parsed.type === 'youtube' || parsed.type === 'drive' ? (
            <iframe
              src={parsed.embedUrl}
              title={title || 'Video Liputan RW 018'}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              controls
              autoPlay
              playsInline
              src={parsed.directUrl}
              className="w-full h-full object-contain"
            >
              <source src={parsed.directUrl} type="video/mp4" />
              <source src={parsed.directUrl} type="video/webm" />
              Browser Anda tidak mendukung tag video HTML5.
            </video>
          )}
        </div>

        <p className="text-white/60 text-xs mt-3 text-center">
          Klik tombol tutup atau latar belakang hitam untuk kembali.
        </p>
      </div>
    </div>
  );
};
