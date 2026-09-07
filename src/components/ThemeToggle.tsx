import React, { useState, useEffect } from 'react';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import {
  ThemeMode,
  getStoredThemeMode,
  setThemeMode,
  isDarkModeActive,
  subscribeToTheme,
  toggleDarkMode
} from '../services/theme';

interface ThemeToggleProps {
  variant?: 'icon' | 'segmented' | 'card' | 'compact-pill';
  className?: string;
  showLabels?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'icon',
  className = '',
  showLabels = true
}) => {
  const [themeMode, setMode] = useState<ThemeMode>(getStoredThemeMode());
  const [isDark, setIsDark] = useState<boolean>(isDarkModeActive());

  useEffect(() => {
    const unsubscribe = subscribeToTheme((dark, mode) => {
      setIsDark(dark);
      setMode(mode);
    });
    return () => unsubscribe();
  }, []);

  const handleSelectMode = (newMode: ThemeMode) => {
    setThemeMode(newMode);
    setMode(newMode);
    setIsDark(isDarkModeActive());
  };

  const handleQuickToggle = () => {
    const nextDark = toggleDarkMode();
    setIsDark(nextDark);
    setMode(nextDark ? 'dark' : 'light');
  };

  // 1. Icon Button variant (e.g. for Header or quick bars)
  if (variant === 'icon') {
    return (
      <button
        id="btn-theme-toggle-icon"
        onClick={handleQuickToggle}
        title={isDark ? 'Beralih ke Mode Terang (Light Mode)' : 'Beralih ke Mode Gelap (Dark Mode)'}
        aria-label="Ubah Tema Tampilan"
        className={`p-2 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center ${
          isDark
            ? 'bg-amber-400/20 text-amber-300 hover:bg-amber-400/30 border border-amber-400/40 shadow-xs'
            : 'bg-emerald-800/80 hover:bg-emerald-700 active:bg-emerald-900 text-emerald-100 border border-emerald-600/50 shadow-xs'
        } ${className}`}
      >
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-300 transition-transform rotate-0 scale-100" />
        ) : (
          <Moon className="w-4 h-4 text-emerald-100 transition-transform rotate-0 scale-100" />
        )}
      </button>
    );
  }

  // 2. Compact Pill variant
  if (variant === 'compact-pill') {
    return (
      <div className={`inline-flex p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 ${className}`}>
        <button
          type="button"
          onClick={() => handleSelectMode('light')}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            themeMode === 'light'
              ? 'bg-white text-emerald-900 shadow-xs border border-slate-200/80'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
          title="Mode Terang"
        >
          <Sun className="w-3.5 h-3.5 text-amber-500" />
          {showLabels && <span>Terang</span>}
        </button>

        <button
          type="button"
          onClick={() => handleSelectMode('dark')}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            themeMode === 'dark'
              ? 'bg-slate-900 text-amber-300 shadow-xs border border-slate-700'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
          title="Mode Gelap"
        >
          <Moon className="w-3.5 h-3.5 text-amber-400" />
          {showLabels && <span>Gelap</span>}
        </button>

        <button
          type="button"
          onClick={() => handleSelectMode('system')}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            themeMode === 'system'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
          title="Ikuti Tema Sistem HP / Komputer"
        >
          <Monitor className="w-3.5 h-3.5 text-cyan-300" />
          {showLabels && <span>Auto</span>}
        </button>
      </div>
    );
  }

  // 3. Segmented buttons (e.g. for Settings view)
  if (variant === 'segmented') {
    const options: { id: ThemeMode; label: string; icon: any; desc: string }[] = [
      {
        id: 'light',
        label: 'Mode Terang (Light)',
        icon: Sun,
        desc: 'Tampilan bersih, cerah dan segar untuk penggunaan siang hari.'
      },
      {
        id: 'dark',
        label: 'Mode Gelap (Dark)',
        icon: Moon,
        desc: 'Tampilan gelap hemat baterai, nyaman di mata saat malam / minim cahaya.'
      },
      {
        id: 'system',
        label: 'Otomatis (Sistem)',
        icon: Monitor,
        desc: 'Menyesuaikan tema terang / gelap secara otomatis sesuai pengaturan perangkat.'
      }
    ];

    return (
      <div className={`grid grid-cols-1 sm:grid-cols-3 gap-2.5 ${className}`}>
        {options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = themeMode === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              id={`btn-theme-opt-${opt.id}`}
              onClick={() => handleSelectMode(opt.id)}
              className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-2.5 active:scale-[0.98] cursor-pointer ${
                isSelected
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/60 border-emerald-500 dark:border-emerald-400 ring-2 ring-emerald-500/20 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                    isSelected
                      ? 'bg-emerald-600 dark:bg-emerald-500 text-white border-emerald-600'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                {isSelected && (
                  <span className="w-5 h-5 rounded-full bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </div>

              <div>
                <h4 className={`text-xs font-bold ${isSelected ? 'text-emerald-950 dark:text-emerald-200' : 'text-slate-800 dark:text-slate-200'}`}>
                  {opt.label}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                  {opt.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  // 4. Card variant
  return (
    <div className={`p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-700/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
            {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
              Tema & Mode Tampilan
            </h4>
            <p className="text-[10px] text-slate-400 dark:text-slate-400">
              Pilihan kenyamanan visual siang, malam & kondisi minim cahaya
            </p>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/60">
          {themeMode === 'light' ? '☀️ Terang' : themeMode === 'dark' ? '🌙 Gelap' : '⚙️ Otomatis'}
        </span>
      </div>

      <ThemeToggle variant="segmented" />
    </div>
  );
};
