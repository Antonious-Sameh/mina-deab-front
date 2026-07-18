import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { authAPI } from '@/api/services';
import { setAccessToken, clearAccessToken } from '@/api/axios';
import { safeLocalStorage, safeSessionStorage } from '@/lib/safe-storage';

const AuthContext = createContext(null);

// Demo users for when backend is unreachable
const DEMO_USERS = {
  'TEACHER2026': { _id:'demo-teacher-001', name:'المعلم الرئيسي', role:'teacher', codePlain:'TEACHER2026', isActive:true },
  'ST2026001': { _id:'demo-st-001', name:'محمد أحمد علي', role:'student', academicYear:'first-prep', codePlain:'ST2026001', isActive:true },
};

const DEMO_KEY = 'khatwa_demo_user';
const USER_KEY = 'khatwa_user_cache'; // stores safe user info across sessions

// Network/timeout errors — NOT a server rejection, keep session alive
const isNetworkError = (err) =>
  !err.response ||
  err.code === 'ERR_NETWORK' ||
  err.code === 'ECONNREFUSED' ||
  err.code === 'ECONNABORTED' ||
  err.code === 'ETIMEDOUT' ||
  err.message === 'Network Error' ||
  err.message?.includes('timeout');

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode,    setMode]    = useState('auto');
  const refreshTimerRef = useRef(null);

  // ── Persist user to localStorage (safe fields only) ──────────────────────
  const persistUser = useCallback((u) => {
    if (!u) { safeLocalStorage.removeItem(USER_KEY); return; }
    safeLocalStorage.setItem(USER_KEY, JSON.stringify({
      _id: u._id, name: u.name, role: u.role,
      avatar: u.avatar || null,
      academicYear: u.academicYear || null,
      codePlain: u.codePlain || null,
    }));
  }, []);

  const getCachedUser = () => {
    try { return JSON.parse(safeLocalStorage.getItem(USER_KEY) || 'null'); } catch { return null; }
  };

  // ── Schedule proactive token refresh (every 12 min, access token lives 15m)
  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    refreshTimerRef.current = setInterval(async () => {
      try {
        const data = await authAPI.refresh();
        if (data?.accessToken) setAccessToken(data.accessToken);
      } catch (err) {
        // Only clear session on explicit 401/403 from server — not on network errors
        if (err.response?.status === 401 || err.response?.status === 403) {
          clearAccessToken();
          persistUser(null);
          setUser(null);
          if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
        }
        // Network error during proactive refresh → do nothing, keep session alive
      }
    }, 12 * 60 * 1000);
  }, [persistUser]);

  // ── Restore session on app load (handles page refresh) ───────────────────
  useEffect(() => {
    const restore = async () => {
      // Show cached user immediately to prevent flicker
      const cached = getCachedUser();
      if (cached) setUser(cached);

      try {
        // Try to get a new access token using the httpOnly refresh cookie
        const data = await authAPI.refresh();
        if (!data?.accessToken) throw new Error('no_token');

        setAccessToken(data.accessToken);

        // Fetch fresh user data in background (non-blocking for UX)
        try {
          const me = await authAPI.me();
          if (me?.user) {
            setUser(me.user);
            persistUser(me.user);
          }
        } catch (meErr) {
          // /me failed but we have a valid token — keep cached user, still authenticated
          if (cached) setUser(cached);
          if (!isNetworkError(meErr)) {
            // If server explicitly rejected /me, trust the cached user still
            // (access token is valid, /me might have transient issue)
          }
        }

        setMode('backend');
        scheduleRefresh();

      } catch (err) {
        if (isNetworkError(err)) {
          // Backend unreachable — stay authenticated with cached user, go demo mode
          if (!cached) setUser(null);
          setMode('demo');
        } else {
          // Server explicitly said the refresh token is invalid (401)
          // → genuine session expiry, require new login
          clearAccessToken();
          persistUser(null);
          setUser(null);
          setMode('backend');
        }
      } finally {
        setLoading(false);
      }
    };

    restore();
    return () => { if (refreshTimerRef.current) clearInterval(refreshTimerRef.current); };
  }, [scheduleRefresh, persistUser]);

  // ── auth:expired event (fired by axios interceptor on 401 after refresh fail)
  useEffect(() => {
    const handle = () => {
      clearAccessToken();
      persistUser(null);
      setUser(null);
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
    window.addEventListener('auth:expired', handle);
    return () => window.removeEventListener('auth:expired', handle);
  }, [persistUser]);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (code) => {
    const trimmed = code.trim().toUpperCase();
    if (mode !== 'demo') {
      try {
        const data = await authAPI.login(trimmed);
        setAccessToken(data.accessToken);
        setUser(data.user);
        persistUser(data.user);
        setMode('backend');
        scheduleRefresh();
        return data.user;
      } catch (err) {
        if (!isNetworkError(err)) throw err;
        // Backend unreachable → fall through to demo mode
        setMode('demo');
      }
    }
    const demoUser = DEMO_USERS[trimmed];
    if (!demoUser) {
      const e = new Error('الكود غير صحيح');
      e.response = { data: { message: 'الكود غير صحيح' } };
      throw e;
    }
    safeSessionStorage.setItem(DEMO_KEY, JSON.stringify(demoUser));
    setUser(demoUser);
    return demoUser;
  }, [mode, scheduleRefresh, persistUser]);

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    if (mode === 'backend') {
      try { await authAPI.logout(); } catch {}
      clearAccessToken();
    }
    safeSessionStorage.removeItem(DEMO_KEY);
    persistUser(null);
    setUser(null);
  }, [mode, persistUser]);

  // ── Update user (for avatar, profile changes) ─────────────────────────────
  const updateUser = useCallback((patch) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...patch };
      persistUser(updated);
      return updated;
    });
  }, [persistUser]);

  const contextValue = useMemo(
    () => ({ user, login, logout, loading, isAuthenticated: !!user, mode, updateUser }),
    [user, login, logout, loading, mode, updateUser]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}