import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { ShieldCheck, X, Download } from 'lucide-react';

// رابط تحميل ملف الـ APK — قابل للتغيير من متغيّر بيئة وقت الـ build
// (VITE_APK_DOWNLOAD_URL) من غير ما يحتاج أي تعديل كود لاحقًا لو الرابط
// اتغيّر (مثلاً لو اترفع مكان تاني).
const APK_DOWNLOAD_URL = import.meta.env.VITE_APK_DOWNLOAD_URL || null;

const DISMISS_KEY = 'khatwa_hide_app_banner';

/**
 * DownloadAppBanner — بانر بسيط وغير مزعج، قابل للإغلاق، بيقترح تحميل
 * تطبيق أندرويد الرسمي (للحماية الإضافية أثناء المشاهدة).
 *
 * - لا يظهر إطلاقًا لو المستخدم أصلاً جوه تطبيق الأندرويد نفسه
 *   (Capacitor.isNativePlatform() — فحص رسمي من مكتبة Capacitor).
 * - لا يظهر لو مفيش رابط تحميل مضبوط أصلاً (VITE_APK_DOWNLOAD_URL).
 * - إغلاقه بيتذكّر (localStorage) عشان ميضايقش المستخدم في كل زيارة.
 * - لا يمنع أو يؤثر على أي جزء من الصفحة أو تشغيل الفيديو — مجرد اقتراح.
 */
export default function DownloadAppBanner() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) return; // جوه التطبيق أصلاً — مفيش داعي للبانر
    if (!APK_DOWNLOAD_URL) return;
    try {
      if (localStorage.getItem(DISMISS_KEY) === '1') return;
    } catch { /* localStorage غير متاح — نعرض البانر بأمان بدون تذكّر الإغلاق */ }
    setDismissed(false);
  }, []);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* تجاهل */ }
  };

  return (
    <div className="relative flex items-center gap-3 rounded-2xl border border-indigo-200/70 dark:border-indigo-500/20 bg-indigo-50/70 dark:bg-indigo-500/10 px-4 py-3 text-sm">
      <ShieldCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-300 shrink-0" />
      <p className="flex-1 min-w-0 text-slate-700 dark:text-slate-200">
        للحصول على حماية أفضل أثناء مشاهدة الدروس، يمكنك تحميل تطبيق المنصة الرسمي.
      </p>
      <a
        href={APK_DOWNLOAD_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-2 transition-colors"
      >
        <Download className="h-3.5 w-3.5" />
        تحميل تطبيق المنصة
      </a>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="إغلاق"
        className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
