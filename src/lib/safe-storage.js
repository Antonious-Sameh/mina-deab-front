/**
 * safe-storage.js
 * Wrapper آمن حول localStorage و sessionStorage
 * على بعض الأجهزة (Private Mode / Storage Quota / Samsung Browser القديم)
 * localStorage بيثرو SecurityError أو QuotaExceededError — ده بيقع التطبيق كله.
 * الـ wrapper ده بيمسك الـ errors ويرجع null/false بدل ما يقع.
 */

const createSafeStorage = (storage) => ({
  getItem(key) {
    try { return storage.getItem(key); }
    catch { return null; }
  },
  setItem(key, value) {
    try { storage.setItem(key, value); return true; }
    catch { return false; }
  },
  removeItem(key) {
    try { storage.removeItem(key); return true; }
    catch { return false; }
  },
  isAvailable() {
    try {
      const test = '__khatwa_test__';
      storage.setItem(test, '1');
      storage.removeItem(test);
      return true;
    } catch { return false; }
  },
});

export const safeLocalStorage    = createSafeStorage(
  typeof localStorage    !== 'undefined' ? localStorage    : { getItem: () => null, setItem: () => {}, removeItem: () => {} }
);
export const safeSessionStorage  = createSafeStorage(
  typeof sessionStorage  !== 'undefined' ? sessionStorage  : { getItem: () => null, setItem: () => {}, removeItem: () => {} }
);