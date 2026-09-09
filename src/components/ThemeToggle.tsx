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

  // 3. Segmented buttons (compact & streamlined)
  if (variant === 'segmented') {
    const options: { id: ThemeMode; label: string; icon: any }[] = [
      {
        id: 'light',
        label: 'Terang',
        icon: Sun
      },
      {
        id: 'dark',
        label: 'Gelap',
        icon: Moon
      },
      {
        id: 'system',
        label: 'Otomatis',
        icon: Monitor
      }
    ];

    return (
      <div className={`grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 ${className}`}>
        {options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = themeMode === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              id={`btn-theme-opt-${opt.id}`}
              onClick={() => handleSelectMode(opt.id)}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                isSelected
                  ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 shadow-xs border border-slate-200/60 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/40 dark:hover:bg-slate-700/40'
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 shrink-0 ${
                  opt.id === 'light'
                    ? 'text-amber-500'
                    : opt.id === 'dark'
                    ? 'text-amber-400'
                    : 'text-cyan-400'
                }`}
              />
              <span>{opt.label}</span>
              {isSelected && <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 stroke-[3] ml-0.5 hidden sm:inline" />}
            </button>
          );
        })}
      </div>
    );
  }

  // 4. Card variant - Ramping, Ringkas, dan Simple
  return (
    <div
      className={`p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-3 transition-colors ${className}`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-700/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
          {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
              Tema & Mode Tampilan
            </h4>
            <span className="px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800">
              {themeMode === 'light' ? '☀️ Terang' : themeMode === 'dark' ? '🌙 Gelap' : '⚙️ Auto'}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-400 truncate">
            Atur kenyamanan visual siang, malam & kondisi minim cahaya
          </p>
        </div>
      </div>

      <div className="sm:w-auto shrink-0">
        <ThemeToggle variant="segmented" />
      </div>
    </div>
  );
};
