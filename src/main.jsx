import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App.jsx';
import '@/index.css';
import { ThemeProvider } from '@/contexts/ThemeContext.jsx';
import ErrorBoundary from '@/components/ErrorBoundary.jsx';

// ── Polyfills (Chrome 80 compat) ──────────────────────────────────────────────
if (!Promise.allSettled) {
  Promise.allSettled = function(ps) {
    return Promise.all(ps.map(function(p) {
      return Promise.resolve(p)
        .then(function(v)  { return { status: 'fulfilled', value: v  }; })
        .catch(function(r) { return { status: 'rejected',  reason: r }; });
    }));
  };
}
if (typeof structuredClone === 'undefined') {
  window.structuredClone = function(obj) {
    try { return JSON.parse(JSON.stringify(obj)); } catch(e) { return obj; }
  };
}

// ── Global error handlers ─────────────────────────────────────────────────────
window.addEventListener('error', function(e) {
  console.error('[App Error]', e.message, e.filename, e.lineno);
});
window.addEventListener('unhandledrejection', function(e) {
  var msg = String(e.reason && e.reason.message ? e.reason.message : e.reason);
  if (msg.indexOf('Network') !== -1 || msg.indexOf('timeout') !== -1) return;
  console.error('[Unhandled Promise]', e.reason);
});

// ── Mount ─────────────────────────────────────────────────────────────────────
var rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    React.createElement(ErrorBoundary, null,
      React.createElement(ThemeProvider, null,
        React.createElement(App)
      )
    )
  );
}