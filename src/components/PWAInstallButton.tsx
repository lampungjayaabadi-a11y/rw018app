import React, { useState } from 'react';
import { Smartphone, CheckCircle2, Download, Info, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'header' | 'menu' | 'floating' | 'card';
  onOpenDetailedModal?: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'header',
  onOpenDetailedModal,
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // Jika sudah terpasang dalam mode standalone
  if (isInstalled) {
    if (variant === 'menu') {
      return (
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Aplikasi RW 018 Terpasang (PWA)</span>
        </div>
      );
    }
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (ok) {
        setInstallSuccess(true);
        setTimeout(() => setInstallSuccess(false), 4000);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else if (onOpenDetailedModal) {
      onOpenDetailedModal();
    } else {
      // Buka panduan fallback jika browser belum memicu prompt
      setShowIOSGuide(true);
    }
  };

  if (variant === 'header') {
    return (
      <>
        <button
          type="button"
          onClick={handleClick}
          id="btn-header-install-pwa"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer bg-amber-400 hover:bg-amber-300 text-emerald-950 border border-amber-300 shrink-0 ${className}`}
          title="Pasang Aplikasi di Layar Utama HP / Android"
          aria-label="Pasang Aplikasi RW 018"
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-950" />
          <span className="hidden sm:inline">Pasang Aplikasi</span>
          <span className="sm:hidden">Install</span>
        </button>

        {/* Modal petunjuk instalasi iOS / browser tanpa beforeinstallprompt */}
        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {isIOS ? 'Pasang di iPhone / iPad' : 'Pasang di Layar Utama HP'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-3 space-y-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                {isIOS ? (
                  <>
                    <p>1. Buka halaman ini di browser <strong>Safari</strong>.</p>
                    <p>2. Ketuk tombol <strong>Bagikan (Share)</strong> di bilah menu bawah.</p>
                    <p>3. Gulir ke bawah dan pilih <strong>"Tambahkan ke Layar Utama" (Add to Home Screen)</strong>.</p>
                  </>
                ) : (
                  <>
                    <p>1. Buka browser <strong>Google Chrome</strong> di HP Anda.</p>
                    <p>2. Ketuk tombol menu titik tiga <strong>(⋮)</strong> di pojok kanan atas.</p>
                    <p>3. Pilih <strong>"Instal Aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>.</p>
                  </>
                )}
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[11px] mt-2 font-medium">
                  Aplikasi RW 018 akan langsung dapat dibuka seperti aplikasi Android resmi, lengkap dengan icon dan mode offline.
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-xl bg-emerald-700 hover:bg-emerald-800 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                Mengerti & Tutup
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Variant Menu / Card
  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        id="btn-install-pwa-action"
        className={`w-full px-3.5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-emerald-950 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all cursor-pointer ${className}`}
      >
        <Smartphone className="w-4 h-4 text-emerald-950 shrink-0" />
        <span className="font-extrabold">
          {isInstallable ? 'Instal Aplikasi RW 018 di HP' : 'Panduan Pasang Aplikasi (PWA)'}
        </span>
      </button>

      {/* Modal petunjuk instalasi */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {isIOS ? 'Pasang di iPhone / iPad' : 'Pasang di Layar Utama HP'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 space-y-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {isIOS ? (
                <>
                  <p>1. Buka halaman ini di browser <strong>Safari</strong>.</p>
                  <p>2. Ketuk tombol <strong>Bagikan (Share)</strong> di bilah menu bawah.</p>
                  <p>3. Gulir ke bawah dan pilih <strong>"Tambahkan ke Layar Utama" (Add to Home Screen)</strong>.</p>
                </>
              ) : (
                <>
                  <p>1. Buka browser <strong>Google Chrome</strong> di smartphone Android Anda.</p>
                  <p>2. Ketuk menu titik tiga <strong>(⋮)</strong> di pojok kanan atas.</p>
                  <p>3. Pilih <strong>"Instal Aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>.</p>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="mt-4 w-full rounded-xl bg-emerald-700 hover:bg-emerald-800 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
};
