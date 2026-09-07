/**
 * SafeStorage Utility
 * Memastikan aplikasi dapat berjalan 100% normal dan lancar di Google Chrome
 * (termasuk mode Incognito, tab browser biasa, PWA Android, maupun iframe)
 * tanpa terblokir oleh kebijakan 'Cookie Check' atau pemblokiran third-party cookies / local storage.
 */

const memoryStore: Record<string, string> = {};

let isLocalStorageUsable: boolean | null = null;
let isSessionStorageUsable: boolean | null = null;

function checkLocalStorage(): boolean {
  if (isLocalStorageUsable !== null) return isLocalStorageUsable;
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      isLocalStorageUsable = false;
      return false;
    }
    const testKey = '__chrome_storage_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    isLocalStorageUsable = true;
    return true;
  } catch (e) {
    console.warn('[SafeStorage] localStorage tidak tersedia atau diblokir cookie check oleh browser. Menggunakan Safe In-Memory Storage.', e);
    isLocalStorageUsable = false;
    return false;
  }
}

function checkSessionStorage(): boolean {
  if (isSessionStorageUsable !== null) return isSessionStorageUsable;
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      isSessionStorageUsable = false;
      return false;
    }
    const testKey = '__chrome_session_test__';
    window.sessionStorage.setItem(testKey, '1');
    window.sessionStorage.removeItem(testKey);
    isSessionStorageUsable = true;
    return true;
  } catch (e) {
    isSessionStorageUsable = false;
    return false;
  }
}

export const safeStorage = {
  isAvailable(): boolean {
    return checkLocalStorage();
  },

  getItem(key: string): string | null {
    if (checkLocalStorage()) {
      try {
        const val = window.localStorage.getItem(key);
        if (val !== null) return val;
      } catch (e) {
        // Fallback to memory
      }
    }

    if (checkSessionStorage()) {
      try {
        const sVal = window.sessionStorage.getItem(key);
        if (sVal !== null) return sVal;
      } catch (e) {
        // Fallback to memory
      }
    }

    return memoryStore[key] ?? null;
  },

  setItem(key: string, value: string): void {
    memoryStore[key] = value;

    if (checkLocalStorage()) {
      try {
        window.localStorage.setItem(key, value);
      } catch (e) {
        console.warn(`[SafeStorage] Gagal menyimpan ke localStorage (${key}):`, e);
      }
    }

    if (checkSessionStorage()) {
      try {
        window.sessionStorage.setItem(key, value);
      } catch (e) {
        // Ignore session storage failure
      }
    }
  },

  removeItem(key: string): void {
    delete memoryStore[key];

    if (checkLocalStorage()) {
      try {
        window.localStorage.removeItem(key);
      } catch (e) {
        // Ignore
      }
    }

    if (checkSessionStorage()) {
      try {
        window.sessionStorage.removeItem(key);
      } catch (e) {
        // Ignore
      }
    }
  },

  clear(): void {
    Object.keys(memoryStore).forEach((k) => delete memoryStore[k]);

    if (checkLocalStorage()) {
      try {
        window.localStorage.clear();
      } catch (e) {
        // Ignore
      }
    }

    if (checkSessionStorage()) {
      try {
        window.sessionStorage.clear();
      } catch (e) {
        // Ignore
      }
    }
  }
};
