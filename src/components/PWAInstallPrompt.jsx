import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { safeLocalStorage } from '@/lib/safe-storage';

export default function PWAInstallPrompt() {
  const [prompt,    setPrompt]    = useState(null);
  const [visible,   setVisible]   = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    // Don't show if user dismissed recently (7 days)
    const last = safeLocalStorage.getItem('pwa-dismissed');
    if (last && Date.now() - Number(last) < 7 * 24 * 60 * 60 * 1000) return;

    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
      setTimeout(() => setVisible(true), 3000); // show after 3s
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    setVisible(false);
    setPrompt(null);
    if (outcome === 'dismissed') {
      safeLocalStorage.setItem('pwa-dismissed', Date.now().toString());
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    safeLocalStorage.setItem('pwa-dismissed', Date.now().toString());
  };

  if (!visible || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[9999] sm:left-auto sm:right-4 sm:w-80 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-card border-2 border-primary/20 rounded-2xl shadow-2xl p-4 flex items-start gap-3">
        <div className="shrink-0 w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
          <Smartphone className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm">ثبّت تطبيق الإبداع</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            أضف منصة الإبداع إلى شاشتك الرئيسية للوصول السريع في أي وقت.
          </p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" className="gap-1.5 h-8 text-xs flex-1" onClick={handleInstall}>
              <Download className="h-3.5 w-3.5" /> تثبيت
            </Button>
            <Button size="sm" variant="ghost" className="h-8 text-xs text-muted-foreground" onClick={handleDismiss}>
              لاحقاً
            </Button>
          </div>
        </div>
        <button onClick={handleDismiss} className="shrink-0 text-muted-foreground hover:text-foreground p-0.5">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}