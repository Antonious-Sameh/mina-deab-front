import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] React Error:', error?.message);
    console.error('[ErrorBoundary] Stack:', error?.stack);
    console.error('[ErrorBoundary] Component Stack:', errorInfo?.componentStack);
    this.setState({ errorInfo });
  }

  handleClearCache = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
    } catch {}
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const errMsg = this.state.error?.message || '';

    return (
      <div style={{
        minHeight: '100vh', background: '#080d1a',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '24px', fontFamily: 'sans-serif',
        direction: 'rtl', textAlign: 'center',
      }}>
        <div style={{ color: '#D4AF37', fontSize: '2.5rem', marginBottom: '12px' }}>⚠</div>
        <h2 style={{ color: '#D4AF37', fontSize: '1.2rem', marginBottom: '8px', fontWeight: 'bold' }}>
          حدث خطأ في التطبيق
        </h2>
        <p style={{ color: 'rgba(212,175,55,0.55)', fontSize: '0.85rem', marginBottom: '24px', maxWidth: '300px', lineHeight: 1.7 }}>
          جرّب مسح الكاش أولاً — غالباً بيحل المشكلة بعد التحديثات.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '280px' }}>
          <button
            onClick={this.handleClearCache}
            style={{
              background: 'linear-gradient(135deg,#b8861a,#e8c84a,#b8861a)',
              color: '#080d1a', border: 'none', borderRadius: '10px',
              padding: '13px', fontSize: '0.95rem', fontWeight: 'bold', cursor: 'pointer',
            }}>
            مسح الكاش وإعادة التحميل
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'transparent', color: '#D4AF37',
              border: '1px solid rgba(212,175,55,0.3)', borderRadius: '10px',
              padding: '12px', fontSize: '0.9rem', cursor: 'pointer',
            }}>
            إعادة تحميل بدون مسح
          </button>
          <button
            onClick={() => { window.location.href = '/login'; }}
            style={{
              background: 'transparent', color: 'rgba(212,175,55,0.45)',
              border: 'none', fontSize: '0.8rem', cursor: 'pointer', marginTop: '4px',
            }}>
            العودة لصفحة الدخول
          </button>
        </div>

        {errMsg && (
          <p style={{ marginTop: '20px', color: 'rgba(212,175,55,0.2)', fontSize: '0.7rem', maxWidth: '300px', wordBreak: 'break-word' }}>
            {errMsg}
          </p>
        )}
      </div>
    );
  }
}