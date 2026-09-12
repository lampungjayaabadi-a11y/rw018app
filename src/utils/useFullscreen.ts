import { useState, useEffect, useCallback } from 'react';

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState<boolean>(false);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const supported = !!(
        document.fullscreenEnabled ||
        (document as any).webkitFullscreenEnabled ||
        (document as any).mozFullScreenEnabled ||
        (document as any).msFullscreenEnabled
      );
      setIsSupported(supported);

      const checkFullscreen = () => {
        const isFs = !!(
          document.fullscreenElement ||
          (document as any).webkitFullscreenElement ||
          (document as any).mozFullScreenElement ||
          (document as any).msFullscreenElement
        );
        setIsFullscreen(isFs);
      };

      checkFullscreen();

      document.addEventListener('fullscreenchange', checkFullscreen);
      document.addEventListener('webkitfullscreenchange', checkFullscreen);
      document.addEventListener('mozfullscreenchange', checkFullscreen);
      document.addEventListener('MSFullscreenChange', checkFullscreen);

      return () => {
        document.removeEventListener('fullscreenchange', checkFullscreen);
        document.removeEventListener('webkitfullscreenchange', checkFullscreen);
        document.removeEventListener('mozfullscreenchange', checkFullscreen);
        document.removeEventListener('MSFullscreenChange', checkFullscreen);
      };
    }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (typeof document === 'undefined') return;

    try {
      const isFs = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );

      if (!isFs) {
        const elem = document.documentElement as any;
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
          await elem.webkitRequestFullscreen();
        } else if (elem.mozRequestFullScreen) {
          await elem.mozRequestFullScreen();
        } else if (elem.msRequestFullscreen) {
          await elem.msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Fullscreen error:', err);
    }
  }, []);

  return {
    isFullscreen,
    isSupported,
    toggleFullscreen,
  };
}

export default useFullscreen;
