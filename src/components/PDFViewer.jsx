/**
 * PDFViewer.jsx
 * Renders a PDF file page-by-page on HTML canvas using PDF.js.
 *
 * No browser PDF toolbar → no download button, no print button.
 * PDF.js fetches the URL directly (no credentials — Cloudinary files are public reads).
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/api/axios';

// ── Lazy singleton: load PDF.js once ─────────────────────────────────────────
// BUGFIX ("PDF لا يفتح على بعض الموبايلات"): كنا بنحمّل الـ "build" العادي من
// pdfjs-dist (v6). النسخة دي بتستخدم صيغ JS حديثة جدًا (optional chaining,
// private class fields, Promise.withResolvers...) جوه ملف الـ Worker نفسه،
// ومطلوب منها كمان أساسًا إن المتصفح يدعم "Module Web Workers"
// (`new Worker(url, { type: 'module' })`) — ودعم ده مش موجود لسه في نسبة
// مش قليلة من الموبايلات: iOS Safari قبل 15 (ومستقر فعليًا من 16.4)،
// وبعض متصفحات Android القديمة (WebView قديم على أجهزة اقتصادية/مش
// محدثة). في المتصفحات دي، تحميل الـ PDF كان بيفشل أو (الأسوأ) بيفضل
// "عالق" على شاشة التحميل من غير أي رسالة خطأ واضحة، لأن الـ Worker
// بيفشل يشتغل من غير ما يرجّع Error صريح نقدر نمسكه.
//
// الحل: نستخدم الـ "legacy" build اللي بيوفرها pdfjs-dist نفسها (مفيش
// dependency جديدة — هي جزء من نفس الباكدج المتثبتة أصلاً)، وهي مبنية
// عشان توسّع التوافق لمتصفحات أقدم (موصى بيها رسميًا من فريق pdf.js نفسه:
// https://github.com/mozilla/pdf.js/wiki/Frequently-Asked-Questions).
// الطريقة والـ API زي ما هي 100%، فمفيش أي تغيير على شكل أو سلوك الفتح
// عند المستخدمين اللي كان شغال عندهم أصلاً.
let _pdfjsLib = null;
async function getPdfjsLib() {
  if (_pdfjsLib) return _pdfjsLib;
  const mod = await import('pdfjs-dist/legacy/build/pdf.mjs');
  _pdfjsLib = mod;
  // Worker must be set before any getDocument() call
  _pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();
  return _pdfjsLib;
}

// ── Load timeout ──────────────────────────────────────────────────────────
// حتى مع الـ legacy build، فيه أجهزة/متصفحات قديمة جدًا (زي iOS قبل 16.4)
// أصلاً مش بتدعم Module Workers خالص أيًا كانت النسخة — مفيش طريقة برمجية
// تخليها تشتغل. المشكلة إن الفشل ده كان بيظهر كـ"تحميل عالق للأبد" مش
// كخطأ واضح. الـ timeout ده بيحوّل أي تعليق زيادة عن اللازم لحالة "error"
// واضحة، فيظهر للمستخدم زر "افتح الملف مباشرة" (fallback) بدل ما يفضل
// شايف الـ spinner للأبد.
const LOAD_TIMEOUT_MS = 15000;
function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('TIMEOUT')), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

/**
 * Normalise Cloudinary PDF URLs so they:
 *  1. Use /image/upload/ (not /raw/upload/) — raw blocks CORS reads
 *  2. Include fl_attachment:false — prevents browser from triggering a download
 *
 * Safe for non-Cloudinary URLs (returns unchanged).
 */
function normalizeUrl(url) {
  if (!url || !url.includes('cloudinary.com')) return url;
  return url
    .replace('/raw/upload/', '/image/upload/')                  // raw → image (CORS fix)
    .replace(/\/fl_attachment(?::[^/]+)?/g, '')                 // remove any existing flag
    .replace('/image/upload/', '/image/upload/fl_attachment:false/'); // force no-attachment
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function PDFViewer({ url }) {
  const [pdf,         setPdf]         = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages,  setTotalPages]  = useState(0);
  const [scale,       setScale]       = useState(0.6);
  const [status,      setStatus]      = useState('loading'); // loading | ready | error
  const [errorMsg,    setErrorMsg]    = useState('');
  const [pageLoading, setPageLoading] = useState(false);
  const [retryKey,    setRetryKey]    = useState(0); // BUGFIX: retry button used to do nothing — see effect below
  const canvasRef       = useRef(null);
  const renderTaskRef   = useRef(null);

  // ── Load the PDF document ────────────────────────────────────────────────
  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    let loadedDoc = null;

    (async () => {
      setStatus('loading');
      setErrorMsg('');
      setPdf(null);
      setCurrentPage(1);
      setTotalPages(0);

      let proxyFailureMsg = '';

      try {
        const pdfjs = await getPdfjsLib();
        const normalized = normalizeUrl(url);

        // ── الحل الحقيقي لمشكلة "تعذّر تحميل الملف" ──────────────────────
        // كان pdf.js بيجيب الملف من Cloudinary مباشرة من المتصفح (Cross-Origin)،
        // وده بيعتمد بالكامل على إعدادات CORS عند Cloudinary لنفس الطلب ده —
        // وده اللي بيفشل غالبًا من غير أي رسالة واضحة. دلوقتي بنجيب البايتات
        // عن طريق السيرفر بتاعنا (نفس الدومين، ومعاه توكن الدخول) بدل ما
        // نسيب المتصفح يتعامل مباشرة مع Cloudinary، فمشكلة الـ CORS بتتحل
        // من جذورها.
        let bytes = null;
        try {
          const proxied = `/files/proxy?url=${encodeURIComponent(normalized)}`;
          const resp = await api.get(proxied, { responseType: 'arraybuffer', timeout: 30000 });
          bytes = new Uint8Array(resp.data);
        } catch (proxyErr) {
          console.error('[PDFViewer] proxy fetch failed, falling back to direct URL:', proxyErr);
          bytes = null; // fall through to direct-URL attempt below

          // لو رجّع السيرفر سبب واضح للمشكلة (زي حظر PDF على مستوى حساب
          // Cloudinary)، بنحتفظ بيه عشان نعرضه للمستخدم لو فشلت كل المحاولات،
          // بدل رسالة عامة ملهاش معنى.
          try {
            const raw = proxyErr?.response?.data;
            if (raw) {
              // responseType كان arraybuffer، فرسالة الخطأ من السيرفر بتيجي كـ
              // ArrayBuffer برضو — لازم نفكّها كنص عشان نقرا رسالة JSON منها.
              const text = raw instanceof ArrayBuffer
                ? new TextDecoder('utf-8').decode(new Uint8Array(raw))
                : (typeof raw === 'string' ? raw : '');
              const parsed = text ? JSON.parse(text) : null;
              if (parsed?.message) proxyFailureMsg = parsed.message;
            }
          } catch { /* تجاهل — هنستخدم الرسالة العامة بدلها */ }
        }

        const loadingTask = bytes
          ? pdfjs.getDocument({ data: bytes })
          : pdfjs.getDocument({ url: normalized, withCredentials: false });

        // ── حماية من "التعليق للأبد" ──────────────────────────────────────
        // لو الـ Worker مش مدعوم أصلاً في المتصفح ده (أجهزة/إصدارات قديمة
        // جدًا)، ممكن الـ Promise ده مايترفضش أبدًا ولا يتحلّش أبدًا —
        // فبنحط سقف زمني معقول (15 ثانية) بدل ما نسيب المستخدم شايف
        // "جاري تحميل الملف..." للأبد من غير أي طريقة يتصرف بيها.
        const doc = await withTimeout(loadingTask.promise, LOAD_TIMEOUT_MS);
        if (cancelled) {
          // Loaded right after the URL changed / component unmounted —
          // nothing will ever reference it, so release it immediately.
          try { doc.destroy(); } catch {}
          return;
        }

        loadedDoc = doc;
        setPdf(doc);
        setTotalPages(doc.numPages);
        setStatus('ready');
      } catch (err) {
        if (!cancelled) {
          console.error('[PDFViewer] load error:', err);
          if (err?.message === 'TIMEOUT') {
            setErrorMsg('يبدو أن هذا المتصفح لا يدعم عرض الملف داخل التطبيق. جرّب فتح الملف مباشرة بالزر بالأسفل.');
          } else if (proxyFailureMsg) {
            setErrorMsg(proxyFailureMsg);
          }
          setStatus('error');
        }
      }
    })();

    return () => {
      cancelled = true;
      // pdf.js documents hold significant worker-side memory that isn't freed
      // just by dropping the React reference — destroy() must be called
      // explicitly, otherwise every PDF viewed in a session stays in memory.
      if (loadedDoc) { try { loadedDoc.destroy(); } catch {} }
    };
  }, [url, retryKey]); // BUGFIX: retryKey forces this effect to re-run on retry (was [url] only, so "إعادة المحاولة" never actually re-fetched anything)

  // ── Render one page to <canvas> ──────────────────────────────────────────
  const renderPage = useCallback(async (doc, pageNum, pageScale) => {
    if (!canvasRef.current || !doc) return;

    // Cancel any in-progress render to avoid "rendering cancelled" spam
    if (renderTaskRef.current) {
      try { renderTaskRef.current.cancel(); } catch {}
      renderTaskRef.current = null;
    }

    setPageLoading(true);
    try {
      const page     = await doc.getPage(pageNum);
      const viewport = page.getViewport({ scale: pageScale });
      const canvas   = canvasRef.current;
      const ctx      = canvas.getContext('2d');

      // HiDPI / Retina sharpness
      const dpr = window.devicePixelRatio || 1;
      canvas.width        = viewport.width  * dpr;
      canvas.height       = viewport.height * dpr;
      canvas.style.width  = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      ctx.scale(dpr, dpr);

      const task = page.render({ canvasContext: ctx, viewport });
      renderTaskRef.current = task;
      await task.promise;
    } catch (e) {
      if (e?.name !== 'RenderingCancelledException') {
        console.error('[PDFViewer] render error:', e);
      }
    } finally {
      setPageLoading(false);
      renderTaskRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (pdf && status === 'ready') renderPage(pdf, currentPage, scale);
  }, [pdf, currentPage, scale, status, renderPage]);

  const prev    = () => setCurrentPage(p => Math.max(1, p - 1));
  const next    = () => setCurrentPage(p => Math.min(totalPages, p + 1));
  const zoomIn  = () => setScale(s => Math.min(3,   +(s + 0.25).toFixed(2)));
  const zoomOut = () => setScale(s => Math.max(0.5, +(s - 0.25).toFixed(2)));

  // ── States ────────────────────────────────────────────────────────────────
  if (status === 'loading') return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm">جاري تحميل الملف…</p>
    </div>
  );

  if (status === 'error') return (
    <div className="flex flex-col items-center justify-center h-full gap-2 text-destructive p-6 text-center">
      <p className="font-medium">تعذّر تحميل الملف</p>
      <p className="text-xs text-muted-foreground max-w-sm">
        {errorMsg || 'تأكد من اتصال الإنترنت وحاول مرة أخرى'}
      </p>
      <div className="flex items-center gap-2 mt-2">
        <Button size="sm" variant="outline"
          onClick={() => { setStatus('loading'); setErrorMsg(''); setPdf(null); setRetryKey(k => k + 1); }}>
          إعادة المحاولة
        </Button>
        {/* Fallback ما بيكسرش الطريقة الأساسية — بيديله بديل بس لو فشلت.
            بيفتح رابط Cloudinary العام مباشرة (الملفات public أصلاً) في تاب
            جديد، فمتصفح الموبايل يفتحه بعارض الـ PDF المدمج فيه، من غير أي
            حاجة تعتمد على دعم Module Workers في الموبايل. */}
        <Button size="sm" variant="default"
          onClick={() => window.open(normalizeUrl(url), '_blank', 'noopener,noreferrer')}>
          فتح الملف مباشرة
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">

      {/* ── Toolbar ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 px-4 py-2 border-b bg-muted/30 shrink-0">
        {/* Page navigation */}
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={prev}
            disabled={currentPage <= 1 || pageLoading}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-sm min-w-[80px] text-center select-none">
            {currentPage} / {totalPages}
          </span>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={next}
            disabled={currentPage >= totalPages || pageLoading}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={zoomOut}
            disabled={scale <= 0.5}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs min-w-[44px] text-center select-none text-muted-foreground">
            {Math.round(scale * 100)}%
          </span>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={zoomIn}
            disabled={scale >= 3}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ── Canvas ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto flex justify-center items-start
                      bg-neutral-200 dark:bg-neutral-800 p-4">
        <div className="relative shadow-lg">
          {pageLoading && (
            <div className="absolute inset-0 flex items-center justify-center
                            bg-white/60 dark:bg-black/40 rounded z-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          {/* onContextMenu blocked → prevents right-click "Save image as…" */}
          <canvas
            ref={canvasRef}
            className="block rounded"
            onContextMenu={e => e.preventDefault()}
          />
        </div>
      </div>
    </div>
  );
}