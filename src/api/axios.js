// src/api/axios.js
// Axios instance with:
//   - Base URL from env
//   - Access token injection on every request
//   - Automatic token refresh on 401
//   - Short timeout so demo mode kicks in fast when backend is down

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ── Main instance ─────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL:         BASE_URL,
  withCredentials: true,
  timeout:         15000,  // 15 seconds — enough for most requests; uploads get longer timeout per-call
  headers: { 'Content-Type': 'application/json' },
});

// ── Token store (in-memory) ───────────────────────────────────────────────────
let accessToken = null;

export const setAccessToken   = (t) => { accessToken = t; };
export const getAccessToken   = ()  => accessToken;
export const clearAccessToken = ()  => { accessToken = null; };

// ── Request interceptor ───────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  // ═══ TEMP DEBUG — Horion smart board login investigation — remove after diagnosis ═══
  console.warn('[HORION_DEBUG][axios][request-interceptor]', JSON.stringify({
    time:        new Date().toISOString(),
    url:         config.url,
    baseURL:     config.baseURL,
    method:      config.method,
    withCredentials: config.withCredentials,
    hasAccessToken:  !!accessToken,
  }));
  // ═══════════════════════════════════════════════════════════════════════════════════
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
}, (error) => {
  // ═══ TEMP DEBUG ═══
  console.warn('[HORION_DEBUG][axios][request-interceptor] ERROR before send', error?.message);
  // ═══════════════════
  return Promise.reject(error);
});

// ── Shared refresh (single-flight) ──────────────────────────────────────────
// Both the reactive 401-triggered refresh (below) and the proactive refresh
// (AuthContext's timer/visibility-change triggers) call THIS SAME function,
// so only one /auth/refresh network call is ever in flight per tab at a time
// — whichever triggered it, everyone else just waits on the same promise
// instead of firing a second, redundant, racing refresh request.
let isRefreshing   = false;
let queue          = [];
let refreshPromise = null;

const processQueue = (err, token = null) => {
  queue.forEach(p => err ? p.reject(err) : p.resolve(token));
  queue = [];
};

export const refreshAccessToken = () => {
  if (isRefreshing) {
    return new Promise((resolve, reject) => queue.push({ resolve, reject }));
  }
  isRefreshing = true;
  refreshPromise = axios.post(
    `${BASE_URL}/auth/refresh`,
    {},
    { withCredentials: true, timeout: 15000 }
  )
    .then(({ data }) => {
      const t = data.data?.accessToken;
      if (!t) throw new Error('No token in refresh response');
      setAccessToken(t);
      processQueue(null, t);
      return t;
    })
    .catch((err) => {
      // Only drop the access token we already hold when the server actually
      // rejected the refresh (401/403 — the refresh token is genuinely
      // invalid/expired). A network error or timeout here means we simply
      // don't know yet whether the session is still good — the access token
      // we already have may well still be valid for the next few minutes,
      // so keep it and let the normal reactive-401 retry (or the next
      // scheduled attempt) sort it out once connectivity recovers, instead
      // of forcing an unnecessary, avoidable logout on a mere hiccup.
      const isAuthRejection = err.response?.status === 401 || err.response?.status === 403;
      if (isAuthRejection) clearAccessToken();
      processQueue(err);
      throw err;
    })
    .finally(() => {
      isRefreshing = false;
      refreshPromise = null;
    });
  return refreshPromise;
};

// ── Response interceptor: 401 → refresh → retry ───────────────────────────────
api.interceptors.response.use(
  (res) => {
    // ═══ TEMP DEBUG — Horion smart board login investigation — remove after diagnosis ═══
    console.warn('[HORION_DEBUG][axios][response-interceptor] SUCCESS', JSON.stringify({
      time: new Date().toISOString(), url: res.config?.url, status: res.status,
    }));
    // ═══════════════════════════════════════════════════════════════════════════════════
    return res;
  },
  async (err) => {
    // ═══ TEMP DEBUG ═══
    console.warn('[HORION_DEBUG][axios][response-interceptor] ERROR', JSON.stringify({
      time:    new Date().toISOString(),
      url:     err?.config?.url,
      message: err?.message,
      code:    err?.code,
      hasResponse: !!err?.response,
      status:  err?.response?.status,
    }));
    // ═══════════════════
    const orig = err.config;

    // ── Skip refresh logic for these cases ───────────────────────────────────
    // 1. Not a 401 error
    // 2. Already retried once
    // 3. The failing request IS the refresh endpoint (prevents infinite loop)
    // 4. The failing request IS the login endpoint (wrong code — don't refresh)
    const isRefreshCall = orig?.url?.includes('/auth/refresh');
    const isLoginCall   = orig?.url?.includes('/auth/login');

    if (
      err.response?.status !== 401 ||
      orig._retry ||
      isRefreshCall ||
      isLoginCall
    ) {
      return Promise.reject(err);
    }

    orig._retry = true;

    try {
      const t = await refreshAccessToken();
      orig.headers.Authorization = `Bearer ${t}`;
      return api(orig);
    } catch (refreshErr) {
      // Only fire auth:expired if the refresh actually failed with a real response
      // (not a network error — network errors shouldn't log the user out)
      if (refreshErr.response) {
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }
      return Promise.reject(refreshErr);
    }
  });

export default api;