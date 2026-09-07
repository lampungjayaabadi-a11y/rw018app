import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, Trash2, AlertCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type ToastType = 'success' | 'delete' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  timestamp: number;
}

export interface ToastContextType {
  toasts: ToastItem[];
  showToast: (message: string, type?: ToastType, title?: string, duration?: number) => string;
  success: (message: string, title?: string, duration?: number) => string;
  showSuccess: (message: string, title?: string, duration?: number) => string;
  deleteNotice: (message: string, title?: string, duration?: number) => string;
  showDelete: (message: string, title?: string, duration?: number) => string;
  error: (message: string, title?: string, duration?: number) => string;
  showError: (message: string, title?: string, duration?: number) => string;
  info: (message: string, title?: string, duration?: number) => string;
  showInfo: (message: string, title?: string, duration?: number) => string;
  dismissToast: (id: string) => void;
  clearAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Global dispatcher bridge so non-React services (like storage.ts) can trigger toasts immediately
type GlobalToastPayload = {
  message: string;
  type?: ToastType;
  title?: string;
  duration?: number;
};

let globalToastDispatcher: ((payload: GlobalToastPayload) => void) | null = null;

export function registerGlobalToastDispatcher(fn: (payload: GlobalToastPayload) => void) {
  globalToastDispatcher = fn;
  return () => {
    if (globalToastDispatcher === fn) {
      globalToastDispatcher = null;
    }
  };
}

export function triggerGlobalToast(
  message: string,
  type: ToastType = 'success',
  title?: string,
  duration?: number
) {
  if (globalToastDispatcher) {
    globalToastDispatcher({ message, type, title, duration });
  }
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'success', title?: string, duration: number = 3800): string => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const defaultTitle =
        title ||
        (type === 'success'
          ? 'Data Berhasil Disimpan'
          : type === 'delete'
          ? 'Data Berhasil Dihapus'
          : type === 'error'
          ? 'Terjadi Kesalahan'
          : 'Pemberitahuan Sistem');

      const newToast: ToastItem = {
        id,
        type,
        title: defaultTitle,
        message,
        duration,
        timestamp: Date.now(),
      };

      setToasts((prev) => {
        // Keep max 4 toasts visible at the same time to prevent screen clutter
        const next = [newToast, ...prev];
        return next.slice(0, 4);
      });

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }

      return id;
    },
    [dismissToast]
  );

  const success = useCallback(
    (message: string, title?: string, duration?: number) => showToast(message, 'success', title, duration),
    [showToast]
  );

  const deleteNotice = useCallback(
    (message: string, title?: string, duration?: number) => showToast(message, 'delete', title, duration),
    [showToast]
  );

  const error = useCallback(
    (message: string, title?: string, duration?: number) => showToast(message, 'error', title, duration),
    [showToast]
  );

  const info = useCallback(
    (message: string, title?: string, duration?: number) => showToast(message, 'info', title, duration),
    [showToast]
  );

  // Connect global dispatcher bridge
  useEffect(() => {
    const unregister = registerGlobalToastDispatcher(({ message, type, title, duration }) => {
      showToast(message, type, title, duration);
    });
    return () => {
      unregister();
    };
  }, [showToast]);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        success,
        showSuccess: success,
        deleteNotice,
        showDelete: deleteNotice,
        error,
        showError: error,
        info,
        showInfo: info,
        dismissToast,
        clearAllToasts,
      }}
    >
      {children}

      {/* Floating Toast & Banner Container */}
      <aside
        id="toast-notification-banner-container"
        aria-label="Notifikasi Sistem RW 018"
        className="fixed top-4 right-4 sm:top-5 sm:right-6 z-[9999] flex flex-col gap-2.5 max-w-[92vw] sm:max-w-md w-full pointer-events-none"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <ToastItemComponent key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} />
          ))}
        </AnimatePresence>
      </aside>
    </ToastContext.Provider>
  );
};

interface ToastItemComponentProps {
  toast: ToastItem;
  onDismiss: () => void;
}

const ToastItemComponent: React.FC<ToastItemComponentProps> = ({ toast, onDismiss }) => {
  const getTheme = () => {
    switch (toast.type) {
      case 'success':
        return {
          cardBg: 'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-300 dark:border-emerald-700',
          iconBg: 'bg-emerald-600 text-white',
          badgeBg: 'bg-emerald-200/80 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200',
          titleColor: 'text-emerald-950 dark:text-emerald-100',
          textColor: 'text-emerald-800 dark:text-emerald-300',
          progressBar: 'bg-emerald-500',
          icon: <CheckCircle2 className="w-5 h-5 text-white" />,
          label: 'Disimpan',
        };
      case 'delete':
        return {
          cardBg: 'bg-rose-50 dark:bg-rose-950/90 border-rose-300 dark:border-rose-700',
          iconBg: 'bg-rose-600 text-white',
          badgeBg: 'bg-rose-200/80 text-rose-900 dark:bg-rose-900 dark:text-rose-200',
          titleColor: 'text-rose-950 dark:text-rose-100',
          textColor: 'text-rose-800 dark:text-rose-300',
          progressBar: 'bg-rose-500',
          icon: <Trash2 className="w-5 h-5 text-white" />,
          label: 'Dihapus',
        };
      case 'error':
        return {
          cardBg: 'bg-amber-50 dark:bg-amber-950/90 border-amber-300 dark:border-amber-700',
          iconBg: 'bg-amber-600 text-white',
          badgeBg: 'bg-amber-200/80 text-amber-900 dark:bg-amber-900 dark:text-amber-200',
          titleColor: 'text-amber-950 dark:text-amber-100',
          textColor: 'text-amber-800 dark:text-amber-300',
          progressBar: 'bg-amber-500',
          icon: <AlertCircle className="w-5 h-5 text-white" />,
          label: 'Perhatian',
        };
      case 'info':
      default:
        return {
          cardBg: 'bg-teal-50 dark:bg-teal-950/90 border-teal-300 dark:border-teal-700',
          iconBg: 'bg-teal-600 text-white',
          badgeBg: 'bg-teal-200/80 text-teal-900 dark:bg-teal-900 dark:text-teal-200',
          titleColor: 'text-teal-950 dark:text-teal-100',
          textColor: 'text-teal-800 dark:text-teal-300',
          progressBar: 'bg-teal-500',
          icon: <Info className="w-5 h-5 text-white" />,
          label: 'Info',
        };
    }
  };

  const theme = getTheme();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 450, damping: 30 }}
      role="alert"
      aria-live="assertive"
      className={`pointer-events-auto w-full relative overflow-hidden rounded-2xl border shadow-xl backdrop-blur-md transition-all ${theme.cardBg}`}
    >
      <div className="p-3.5 sm:p-4 flex items-start gap-3">
        {/* Status Icon */}
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${theme.iconBg}`}>
          {theme.icon}
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <h4 className={`text-xs sm:text-sm font-black tracking-tight ${theme.titleColor}`}>
              {toast.title}
            </h4>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${theme.badgeBg}`}>
              {theme.label}
            </span>
          </div>
          <p className={`text-xs font-medium leading-relaxed break-words ${theme.textColor}`}>
            {toast.message}
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={onDismiss}
          type="button"
          aria-label="Tutup notifikasi"
          className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Subtle Auto-Dismiss Progress Line */}
      {toast.duration && toast.duration > 0 && (
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: toast.duration / 1000, ease: 'linear' }}
          className={`h-1 ${theme.progressBar}`}
        />
      )}
    </motion.div>
  );
};

const fallbackToastContext: ToastContextType = {
  toasts: [],
  showToast: (message: string, type: ToastType = 'success', title?: string, duration?: number) => {
    triggerGlobalToast(message, type, title, duration);
    return 'fallback';
  },
  success: (message: string, title?: string, duration?: number) => {
    triggerGlobalToast(message, 'success', title, duration);
    return 'fallback';
  },
  showSuccess: (message: string, title?: string, duration?: number) => {
    triggerGlobalToast(message, 'success', title, duration);
    return 'fallback';
  },
  deleteNotice: (message: string, title?: string, duration?: number) => {
    triggerGlobalToast(message, 'delete', title, duration);
    return 'fallback';
  },
  showDelete: (message: string, title?: string, duration?: number) => {
    triggerGlobalToast(message, 'delete', title, duration);
    return 'fallback';
  },
  error: (message: string, title?: string, duration?: number) => {
    triggerGlobalToast(message, 'error', title, duration);
    return 'fallback';
  },
  showError: (message: string, title?: string, duration?: number) => {
    triggerGlobalToast(message, 'error', title, duration);
    return 'fallback';
  },
  info: (message: string, title?: string, duration?: number) => {
    triggerGlobalToast(message, 'info', title, duration);
    return 'fallback';
  },
  showInfo: (message: string, title?: string, duration?: number) => {
    triggerGlobalToast(message, 'info', title, duration);
    return 'fallback';
  },
  dismissToast: () => {},
  clearAllToasts: () => {},
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return fallbackToastContext;
  }
  return context;
};
