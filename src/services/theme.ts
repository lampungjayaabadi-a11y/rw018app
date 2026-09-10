export type ThemeMode = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'rw018_theme_mode';

type ThemeListener = (isDark: boolean, mode: ThemeMode) => void;
const listeners: Set<ThemeListener> = new Set();

export const getStoredThemeMode = (): ThemeMode => {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved;
    }
  } catch (e) {
    console.error('Error reading theme mode:', e);
  }
  return 'light';
};

export const getSystemPrefersDark = (): boolean => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false;
};

export const isDarkModeActive = (): boolean => {
  const mode = getStoredThemeMode();
  if (mode === 'dark') return true;
  if (mode === 'light') return false;
  return getSystemPrefersDark();
};

export const applyThemeToDocument = (mode?: ThemeMode) => {
  const currentMode = mode || getStoredThemeMode();
  const isDark = currentMode === 'dark' || (currentMode === 'system' && getSystemPrefersDark());
  
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    const body = document.body;
    
    if (isDark) {
      root.classList.add('dark');
      body.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }

  // Notify all active listeners
  listeners.forEach((listener) => {
    try {
      listener(isDark, currentMode);
    } catch (e) {
      console.error('Theme listener error:', e);
    }
  });

  return isDark;
};

export const setThemeMode = (mode: ThemeMode) => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch (e) {
    console.error('Error saving theme mode:', e);
  }
  applyThemeToDocument(mode);
};

export const toggleDarkMode = (): boolean => {
  const currentIsDark = isDarkModeActive();
  const nextMode: ThemeMode = currentIsDark ? 'light' : 'dark';
  setThemeMode(nextMode);
  return !currentIsDark;
};

export const subscribeToTheme = (listener: ThemeListener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

// Listen for OS system theme preference changes
if (typeof window !== 'undefined' && window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const mode = getStoredThemeMode();
    if (mode === 'system') {
      applyThemeToDocument('system');
    }
  });
}

// Initial theme application
if (typeof window !== 'undefined') {
  applyThemeToDocument();
}
