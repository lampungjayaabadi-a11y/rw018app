import React from 'react';
import { useFullscreen } from '../utils/useFullscreen';

interface FullscreenToggleProps {
  className?: string;
}

export const FullscreenToggle: React.FC<FullscreenToggleProps> = ({ className = '' }) => {
  const { isFullscreen, isSupported, toggleFullscreen } = useFullscreen();

  if (!isSupported) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={toggleFullscreen}
      className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer ${
        isFullscreen
          ? 'bg-rose-700 hover:bg-rose-800 text-white border border-rose-500'
          : 'bg-emerald-800 hover:bg-emerald-700 text-emerald-100 border border-emerald-600'
      } ${className}`}
      title={isFullscreen ? 'Keluar Fullscreen' : 'Layar Penuh (Fullscreen)'}
      aria-label={isFullscreen ? 'Keluar Fullscreen' : 'Fullscreen'}
    >
      {isFullscreen ? 'Keluar Fullscreen' : '⛶ Fullscreen'}
    </button>
  );
};

export default FullscreenToggle;
