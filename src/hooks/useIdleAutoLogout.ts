import { useState, useEffect, useRef, useCallback } from 'react';
import { safeStorage } from '../utils/safeStorage';
import { playSessionWarningSound, playSessionExpiredSound } from '../utils/audioEffects';

export const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 Menit (300.000 ms)
export const WARNING_DURATION_MS = 30 * 1000; // Peringatan 30 detik sebelum logout otomatis (270.000 ms)
export const LAST_ACTIVE_KEY = 'rw018_last_active_timestamp';
export const AUTO_LOGOUT_REASON_KEY = 'rw018_auto_logout_reason';

interface UseIdleAutoLogoutOptions {
  enabled: boolean;
  onAutoLogout: () => void;
}

export function useIdleAutoLogout({ enabled, onAutoLogout }: UseIdleAutoLogoutOptions) {
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(30);
  const warningPlayedRef = useRef(false);
  const lastActiveRef = useRef<number>(Date.now());
  const onAutoLogoutRef = useRef(onAutoLogout);

  // Always keep the latest callback ref to avoid stale closures
  useEffect(() => {
    onAutoLogoutRef.current = onAutoLogout;
  }, [onAutoLogout]);

  // Read saved timestamp from storage if available
  const getStoredLastActive = useCallback((): number => {
    try {
      const stored = safeStorage.getItem(LAST_ACTIVE_KEY);
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed) && parsed > 0) {
          return parsed;
        }
      }
    } catch {}
    return lastActiveRef.current;
  }, []);

  // Save active timestamp to storage and ref
  const setStoredLastActive = useCallback((time: number) => {
    lastActiveRef.current = time;
    try {
      safeStorage.setItem(LAST_ACTIVE_KEY, String(time));
    } catch {}
  }, []);

  // Reset activity timer
  const resetTimer = useCallback(() => {
    const now = Date.now();
    setStoredLastActive(now);
    setIsWarningOpen(false);
    warningPlayedRef.current = false;
    setSecondsRemaining(Math.ceil(WARNING_DURATION_MS / 1000));
  }, [setStoredLastActive]);

  // Immediate logout handler
  const performAutoLogout = useCallback(() => {
    try {
      safeStorage.setItem(AUTO_LOGOUT_REASON_KEY, 'idle_5_minutes');
    } catch {}
    playSessionExpiredSound();
    setIsWarningOpen(false);
    warningPlayedRef.current = false;
    onAutoLogoutRef.current();
  }, []);

  useEffect(() => {
    if (!enabled) {
      setIsWarningOpen(false);
      warningPlayedRef.current = false;
      return;
    }

    // Initialize timestamp on login / start
    const now = Date.now();
    setStoredLastActive(now);

    // Throttled activity listener
    let lastThrottledTime = 0;
    const handleUserActivity = () => {
      const currentTime = Date.now();
      // Throttle event handling to once per second for high performance
      if (currentTime - lastThrottledTime > 1000) {
        lastThrottledTime = currentTime;
        setStoredLastActive(currentTime);

        // If warning is currently open and user moves/types/clicks, automatically dismiss warning
        setIsWarningOpen((prev) => {
          if (prev) {
            warningPlayedRef.current = false;
            return false;
          }
          return false;
        });
      }
    };

    // User interaction events to monitor across the app
    const activityEvents: (keyof WindowEventMap)[] = [
      'mousedown',
      'mousemove',
      'keydown',
      'touchstart',
      'touchmove',
      'scroll',
      'wheel',
      'click',
    ];

    activityEvents.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    // Check on tab focus or visibility change (e.g., user returns from another tab or locked screen)
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        const lastActive = Math.max(lastActiveRef.current, getStoredLastActive());
        const elapsed = Date.now() - lastActive;

        if (elapsed >= IDLE_TIMEOUT_MS) {
          performAutoLogout();
        } else if (elapsed >= IDLE_TIMEOUT_MS - WARNING_DURATION_MS) {
          const remainingSec = Math.max(0, Math.ceil((IDLE_TIMEOUT_MS - elapsed) / 1000));
          setSecondsRemaining(remainingSec);
          setIsWarningOpen(true);
          if (!warningPlayedRef.current) {
            playSessionWarningSound();
            warningPlayedRef.current = true;
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    // Periodic check interval every 1 second
    const intervalId = setInterval(() => {
      const lastActive = Math.max(lastActiveRef.current, getStoredLastActive());
      const elapsed = Date.now() - lastActive;

      if (elapsed >= IDLE_TIMEOUT_MS) {
        performAutoLogout();
      } else if (elapsed >= IDLE_TIMEOUT_MS - WARNING_DURATION_MS) {
        const remainingSec = Math.max(0, Math.ceil((IDLE_TIMEOUT_MS - elapsed) / 1000));
        setSecondsRemaining(remainingSec);
        setIsWarningOpen(true);

        if (!warningPlayedRef.current) {
          playSessionWarningSound();
          warningPlayedRef.current = true;
        }
      } else {
        if (isWarningOpen) {
          setIsWarningOpen(false);
          warningPlayedRef.current = false;
        }
      }
    }, 1000);

    return () => {
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      clearInterval(intervalId);
    };
  }, [enabled, getStoredLastActive, setStoredLastActive, performAutoLogout, isWarningOpen]);

  return {
    isWarningOpen,
    secondsRemaining,
    resetTimer,
    performAutoLogout,
  };
}
