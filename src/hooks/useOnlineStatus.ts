import { useState, useEffect, useCallback } from 'react';

export interface OnlineStatusInfo {
  isOnline: boolean;
  wasOffline: boolean;
  dismissBackOnlineNotice: () => void;
  lastOnlineAt: Date | null;
}

export function useOnlineStatus(): OnlineStatusInfo {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    return true;
  });

  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const [lastOnlineAt, setLastOnlineAt] = useState<Date | null>(new Date());

  const dismissBackOnlineNotice = useCallback(() => {
    setWasOffline(false);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      setLastOnlineAt(new Date());
      // Tampilkan notifikasi "Kembali Online" selama 4 detik
      setWasOffline(true);
      const timer = setTimeout(() => {
        setWasOffline(false);
      }, 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    wasOffline,
    dismissBackOnlineNotice,
    lastOnlineAt,
  };
}
