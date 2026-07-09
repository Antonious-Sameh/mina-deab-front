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
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

// ── Response interceptor: 401 → refresh → retry ───────────────────────────────
let isRefreshing = false;
let queue        = [];

const processQueue = (err, token = null) => {
  queue.forEach(p => err ? p.reject(err) : p.resolve(token));
  queue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (err) => {
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

    // ── Queue concurrent requests during refresh ──────────────────────────────
    if (isRefreshing) {
      return new Promise((res, rej) => queue.push({ resolve: res, reject: rej }))
        .then(token => {
          orig.headers.Authorization = `Bearer ${token}`;
          return api(orig);
        });
    }

    orig._retry  = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post(
        `${BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true, timeout: 8000 }
      );

      const t = data.data?.accessToken;
      if (!t) throw new Error('No token in refresh response');

      setAccessToken(t);
      processQueue(null, t);
      orig.headers.Authorization = `Bearer ${t}`;
      return api(orig);
    } catch (refreshErr) {
      clearAccessToken();
      processQueue(refreshErr);
      
      // Only fire auth:expired if the refresh actually failed with a real response
      // (not a network error — network errors shouldn't log the user out)
      if (refreshErr.response) {
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  });

export default api;