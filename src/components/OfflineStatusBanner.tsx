import React, { useState } from 'react';
import { WifiOff, Wifi, Database, CheckCircle2, X, ChevronRight, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OfflineStatusBannerProps {
  isOnline: boolean;
  wasOffline: boolean;
  onDismissOnlineNotice?: () => void;
  cachedCounts?: {
    warga: number;
    kk: number;
    kas: number;
    bansos: number;
  };
  onRefreshData?: () => void;
}

export const OfflineStatusBanner: React.FC<OfflineStatusBannerProps> = ({
  isOnline,
  wasOffline,
  onDismissOnlineNotice,
  cachedCounts,
  onRefreshData,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Jika kembali online, tampilkan banner hijau sebentar
  if (wasOffline && isOnline) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-emerald-600 text-white px-3.5 py-2 text-xs font-medium shadow-md flex items-center justify-between z-40 sticky top-[72px]"
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
            <Wifi className="w-3 h-3 text-white" />
          </div>
          <span>
            <strong>Koneksi Terhubung Kembali:</strong> Sinkronisasi data real-time dengan database cloud telah aktif.
          </span>
        </div>
        {onDismissOnlineNotice && (
          <button
            onClick={onDismissOnlineNotice}
            className="p-1 rounded-md hover:bg-emerald-700 active:scale-95 transition-transform"
            aria-label="Tutup notifikasi"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        )}
      </motion.div>
    );
  }

  // Jika sedang offline
  if (!isOnline && !isDismissed) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900 text-amber-50 px-3.5 py-2.5 text-xs shadow-md border-b border-amber-700/60 z-40 sticky top-[72px]"
      >
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-start sm:items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-amber-700 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 shadow-xs border border-amber-600">
              <WifiOff className="w-3.5 h-3.5 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-white tracking-tight flex items-center gap-1">
                  Mode Offline Pengurus Aktif
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-600/80 text-amber-100 border border-amber-500/50">
                  Cache Siap
                </span>
              </div>
              <p className="text-amber-200 text-[11px] leading-tight mt-0.5">
                Aplikasi berjalan tanpa internet. Seluruh data warga, KK, kas & layanan administrasi tetap dapat diakses dan dicari.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            {cachedCounts && (
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="px-2.5 py-1 rounded-lg bg-amber-700/80 hover:bg-amber-700 text-white text-[11px] font-medium border border-amber-600 flex items-center gap-1 active:scale-95 transition-transform"
              >
                <Database className="w-3 h-3 text-amber-300" />
                <span>Data Tersimpan</span>
                <ChevronRight className={`w-3 h-3 transition-transform ${showDetails ? 'rotate-90' : ''}`} />
              </button>
            )}

            {onRefreshData && (
              <button
                onClick={onRefreshData}
                title="Muat ulang memori lokal"
                className="p-1 rounded-lg bg-amber-700/60 hover:bg-amber-700 text-amber-200 hover:text-white transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 rounded-lg hover:bg-amber-700/60 text-amber-300 hover:text-white transition-colors"
              aria-label="Tutup pesan offline"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Detail Ringkasan Data yang Dicache */}
        <AnimatePresence>
          {showDetails && cachedCounts && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-2 pt-2 border-t border-amber-700/50"
            >
              <div className="flex items-center gap-3 text-[11px] flex-wrap text-amber-100">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <strong>{cachedCounts.warga}</strong> Warga
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <strong>{cachedCounts.kk}</strong> KK
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <strong>{cachedCounts.kas}</strong> Catatan Kas
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <strong>{cachedCounts.bansos}</strong> Data Bansos
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  return null;
};
